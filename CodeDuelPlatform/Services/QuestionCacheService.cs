using CodeDuelPlatform.Data;
using CodeDuelPlatform.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CodeDuelPlatform.Services
{
    public class QuestionCacheService
    {
        private readonly ILogger<QuestionCacheService> _logger;
        private readonly ApplicationDbContext _context;
        private readonly IRedisService _redisService;
        
        public QuestionCacheService(
            ILogger<QuestionCacheService> logger,
            ApplicationDbContext context,
            IRedisService redisService)
        {
            _logger = logger;
            _context = context;
            _redisService = redisService;
        }
        
        /// <summary>
        /// Загружает все вопросы из базы данных в кеш Redis
        /// </summary>
        public async Task LoadQuestionsToCache()
        {
            try
            {
                _logger.LogInformation("Загрузка вопросов в кеш Redis...");
                
                // Получаем все вопросы из базы данных
                var questions = await _context.Questions.ToListAsync();
                
                if (questions.Count == 0)
                {
                    _logger.LogWarning("Нет вопросов для загрузки в кеш");
                    return;
                }
                
                // Сохраняем вопросы в Redis
                var success = await _redisService.CacheQuestionsListAsync(questions);
                
                if (success)
                {
                    _logger.LogInformation($"Успешно загружено {questions.Count} вопросов в кеш Redis");
                }
                else
                {
                    _logger.LogError("Не удалось загрузить вопросы в кеш Redis");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при загрузке вопросов в кеш Redis");
            }
        }
        
        /// <summary>
        /// Получает случайный набор вопросов для дуэли
        /// </summary>
        public async Task<List<Question>> GetRandomQuestionsForDuelAsync(int count)
        {
            try
            {
                // Пробуем получить вопросы из кеша
                var cachedQuestions = await _redisService.GetCachedQuestionsListAsync();
                
                if (cachedQuestions != null && cachedQuestions.Count >= count)
                {
                    // Перемешиваем вопросы и выбираем нужное количество
                    var random = new Random();
                    var randomQuestions = cachedQuestions
                        .OrderBy(_ => random.Next())
                        .Take(count)
                        .ToList();
                    
                    _logger.LogInformation($"Получено {count} случайных вопросов из кеша Redis");
                    return randomQuestions;
                }
                
                // Если не удалось получить из кеша, обращаемся к базе данных
                _logger.LogWarning("Не удалось получить вопросы из кеша, обращаемся к базе данных");
                
                var questions = await _context.Questions
                    .OrderBy(_ => EF.Functions.Random())
                    .Take(count)
                    .ToListAsync();
                
                _logger.LogInformation($"Получено {questions.Count} случайных вопросов из базы данных");
                return questions;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении случайных вопросов для дуэли");
                return new List<Question>();
            }
        }
        
        /// <summary>
        /// Обновляет кеш вопросов после изменений в базе данных
        /// </summary>
        public async Task RefreshQuestionCacheAsync()
        {
            try
            {
                _logger.LogInformation("Обновление кеша вопросов...");
                
                // Получаем все вопросы из базы данных
                var questions = await _context.Questions.ToListAsync();
                
                // Обновляем кеш
                var success = await _redisService.CacheQuestionsListAsync(questions);
                
                if (success)
                {
                    _logger.LogInformation($"Кеш вопросов успешно обновлен. В кеше {questions.Count} вопросов");
                }
                else
                {
                    _logger.LogError("Не удалось обновить кеш вопросов");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при обновлении кеша вопросов");
            }
        }
    }
} 