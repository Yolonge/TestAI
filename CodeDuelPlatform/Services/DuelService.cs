using CodeDuelPlatform.Data;
using CodeDuelPlatform.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CodeDuelPlatform.Services
{
    public class DuelService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<DuelService> _logger;
        private readonly IRedisService _redisService;
        private readonly QuestionCacheService _questionCacheService;
        private readonly Random _random = new Random();

        public DuelService(
            ApplicationDbContext context, 
            ILogger<DuelService> logger, 
            IRedisService redisService,
            QuestionCacheService questionCacheService)
        {
            _context = context;
            _logger = logger;
            _redisService = redisService;
            _questionCacheService = questionCacheService;
        }

        /// <summary>
        /// Создает новую дуэль между двумя пользователями
        /// </summary>
        public async Task<Duel> CreateDuelAsync(int firstUserId, int secondUserId)
        {
            // Делегируем создание дуэли в RedisService
            return await _redisService.CreateDuelAsync(firstUserId, secondUserId);
        }

        /// <summary>
        /// Сохраняет ответ пользователя на вопрос
        /// </summary>
        public async Task SaveUserAnswerAsync(int duelId, int questionOrder, int userId, string answer)
        {
            // Делегируем сохранение ответа в RedisService
            await _redisService.SaveUserAnswerAsync(duelId, questionOrder, userId, answer);
        }

        /// <summary>
        /// Завершает дуэль и определяет победителя
        /// </summary>
        public async Task CompleteDuelAsync(int duelId)
        {
            // Делегируем завершение дуэли в RedisService
            await _redisService.CompleteDuelAsync(duelId);
        }

        /// <summary>
        /// Получает активную дуэль пользователя
        /// </summary>
        public async Task<Duel> GetUserActiveDuelAsync(int userId)
        {
            try
            {
                // Проверяем только в Redis
                var activeDuels = await _redisService.GetUserActiveDuelsAsync(userId);
                if (activeDuels.Count > 0)
                {
                    return activeDuels.First();
                }
                
                // Если в Redis нет активных дуэлей, возвращаем null
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Ошибка при получении активной дуэли для пользователя {userId}");
                return null;
            }
        }

        /// <summary>
        /// Получает дуэль по ID независимо от статуса завершения
        /// </summary>
        public async Task<Duel> GetDuelByIdAsync(int duelId)
        {
            return await _context.Duels
                .Include(d => d.DuelQuestions)
                    .ThenInclude(dq => dq.Question)
                .Include(d => d.FirstUser)
                .Include(d => d.SecondUser)
                .FirstOrDefaultAsync(d => d.Id == duelId);
        }

        /// <summary>
        /// Получает историю дуэлей пользователя в виде запроса для пагинации
        /// </summary>
        public async Task<IQueryable<Duel>> GetUserDuelHistoryQueryAsync(int userId)
        {
            return _context.Duels
                .Include(d => d.FirstUser)
                .Include(d => d.SecondUser)
                .Include(d => d.Winner)
                .Where(d => 
                    (d.FirstUserId == userId || d.SecondUserId == userId) && 
                    d.IsCompleted)
                .OrderByDescending(d => d.EndTime);
        }

        /// <summary>
        /// Получает историю дуэлей пользователя
        /// </summary>
        public async Task<List<Duel>> GetUserDuelHistoryAsync(int userId)
        {
            return await _context.Duels
                .Include(d => d.FirstUser)
                .Include(d => d.SecondUser)
                .Include(d => d.Winner)
                .Where(d => 
                    (d.FirstUserId == userId || d.SecondUserId == userId) && 
                    d.IsCompleted)
                .OrderByDescending(d => d.EndTime)
                .ToListAsync();
        }

        /// <summary>
        /// Завершает все активные дуэли
        /// </summary>
        public async Task CompleteAllActiveDuelsAsync()
        {
            // Делегируем завершение всех активных дуэлей в RedisService
            await _redisService.CompleteAllActiveDuelsAsync();
        }
    }
} 