using CodeDuelPlatform.Data;
using CodeDuelPlatform.Hubs;
using CodeDuelPlatform.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using System.Text;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

// Добавляем сервисы в контейнер
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Настройка базы данных PostgreSQL
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Настройка Redis
builder.Services.AddSingleton<ConnectionMultiplexer>(sp =>
{
    var configuration = sp.GetRequiredService<IConfiguration>();
    var redisConnectionString = configuration.GetConnectionString("RedisConnection");
    return ConnectionMultiplexer.Connect(redisConnectionString);
});

// Регистрация сервисов
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<DuelService>();
builder.Services.AddScoped<QuestionService>();
builder.Services.AddScoped<QuestionCacheService>();

// Регистрируем RedisService как singleton и как реализацию интерфейса IRedisService
builder.Services.AddScoped<IRedisService, RedisService>();

// Добавляем фоновую службу матчмейкинга
builder.Services.AddHostedService<MatchmakingBackgroundService>();

// Добавление SignalR
builder.Services.AddSignalR();

// Настройка CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:8000", 
                          "http://localhost:8080",
                          "http://127.0.0.1:5500",
                          "http://localhost:3000") // Добавлен хост откуда отправляется запрос
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
        
        // Альтернативный вариант - разрешить запросы со всех источников
        // Раскомментируйте эту строку и закомментируйте WithOrigins выше для разрешения всех источников
        // policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
        // Примечание: нельзя использовать AllowAnyOrigin() вместе с AllowCredentials()
    });
});

// Настройка JWT аутентификации
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
    };

    // Для поддержки передачи токена через SignalR
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }
            
            return Task.CompletedTask;
        }
    };
});

var app = builder.Build();

// Настройка pipeline запросов
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("CorsPolicy");
app.UseAuthentication();
app.UseAuthorization();

// Конфигурация маршрутов SignalR
app.MapHub<DuelHub>("/hubs/duel");

app.MapControllers();

// Загружаем вопросы в Redis при старте приложения
using (var scope = app.Services.CreateScope())
{
    try
    {
        var questionCacheService = scope.ServiceProvider.GetRequiredService<QuestionCacheService>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        
        logger.LogInformation("Запуск приложения: инициализация кеша вопросов...");
        await questionCacheService.LoadQuestionsToCache();
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Ошибка при инициализации кеша вопросов");
    }
}

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
