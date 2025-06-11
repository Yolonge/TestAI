FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Копируем файлы проекта и восстанавливаем зависимости
COPY ["CodeDuelPlatform/CodeDuelPlatform.csproj", "CodeDuelPlatform/"]
RUN dotnet restore "CodeDuelPlatform/CodeDuelPlatform.csproj"

# Копируем весь код
COPY . .

# Собираем и публикуем проект
WORKDIR "/src/CodeDuelPlatform"
RUN dotnet build "CodeDuelPlatform.csproj" -c Release -o /app/build
RUN dotnet publish "CodeDuelPlatform.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Финальный образ
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Копируем файлы из сборочного образа
COPY --from=build /app/publish .

# Устанавливаем переменные среды
ENV ASPNETCORE_URLS=http://+:80
ENV ASPNETCORE_ENVIRONMENT=Development

# Открываем порт
EXPOSE 80

# Точка входа в приложение
ENTRYPOINT ["dotnet", "CodeDuelPlatform.dll"] 