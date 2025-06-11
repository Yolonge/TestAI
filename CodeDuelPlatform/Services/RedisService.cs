using StackExchange.Redis;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;
using Microsoft.Extensions.Logging;
using CodeDuelPlatform.Models;
using Microsoft.EntityFrameworkCore;
using CodeDuelPlatform.Data;

namespace CodeDuelPlatform.Services
{
    
    public class RedisService : IRedisService
    {
        private readonly ConnectionMultiplexer _redis;
        private readonly ILogger<RedisService> _logger;
        private readonly IConfiguration _configuration;
        private readonly ApplicationDbContext _context;

        // Константы для ключей Redis
        private const string MATCHMAKING_QUEUE_KEY = "matchmaking:queue";
        private const string ACTIVE_DUELS_KEY = "duels:active";
        private const string QUESTION_TIMER_KEY = "duel:timer:";
        private const string ACTIVE_QUESTION_KEY = "duel:question:";
        private const string QUESTIONS_LIST_KEY = "questions:list";
        private const string DUEL_QUESTIONS_KEY = "duel:questions:";

        public RedisService(
            ConnectionMultiplexer redis, 
            ILogger<RedisService> logger, 
            IConfiguration configuration, 
            ApplicationDbContext context)
        {
            _redis = redis;
            _logger = logger;
            _configuration = configuration;
            _context = context;
        }

        #region Matchmaking Queue Operations

        /// <summary>
        /// Добавляет пользователя в очередь поиска оппонента
        /// </summary>
        /// <param name="userId">ID пользователя</param>
        /// <param name="rating">Рейтинг пользователя для матчмейкинга</param>
        /// <returns>True если успешно, иначе False</returns>
        public async Task<bool> AddUserToMatchmakingQueueAsync(int userId, int rating)
        {
            try
            {
                var db = _redis.GetDatabase();
                var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                
                // Добавляем пользователя в sorted set с оценкой, равной его рейтингу
                // Это позволит искать оппонентов с близким рейтингом
                await db.SortedSetAddAsync(MATCHMAKING_QUEUE_KEY, userId.ToString(), rating);
                
                // Устанавливаем срок истечения для всей очереди, если она еще не установлена
                var expiry = TimeSpan.FromSeconds(_configuration.GetValue<int>("Redis:MatchmakingQueueExpiry", 300));
                await db.KeyExpireAsync(MATCHMAKING_QUEUE_KEY, expiry);
                
                _logger.LogInformation($"Пользователь {userId} с рейтингом {rating} добавлен в очередь матчмейкинга");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Ошибка при добавлении пользователя {userId} в очередь матчмейкинга");
                return false;
            }
        }

        /// <summary>
        /// Удаляет пользователя из очереди поиска оппонента
        /// </summary>
        /// <param name="userId">ID пользователя</param>
        /// <returns>True если успешно, иначе False</returns>
        public async Task<bool> RemoveUserFromMatchmakingQueueAsync(int userId)
        {
            try
            {
                var db = _redis.GetDatabase();
                await db.SortedSetRemoveAsync(MATCHMAKING_QUEUE_KEY, userId.ToString());
                _logger.LogInformation($"Пользователь {userId} удален из очереди матчмейкинга");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Ошибка при удалении пользователя {userId} из очереди матчмейкинга");
                return false;
            }
        }

        /// <summary>
        /// Проверяет, находится ли пользователь в очереди матчмейкинга
        /// </summary>
        /// <param name="userId">ID пользователя</param>
        /// <returns>True если пользователь в очереди, иначе False</returns>
        public async Task<bool> IsUserInMatchmakingQueueAsync(int userId)
        {
            try
            {
                var db = _redis.GetDatabase();
                return await db.SortedSetScoreAsync(MATCHMAKING_QUEUE_KEY, userId.ToString()) != null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Ошибка при проверке наличия пользователя {userId} в очереди матчмейкинга");
                return false;
            }
        }

        /// <summary>
        /// Получает список пользователей в очереди матчмейкинга с рейтингом близким к указанному
        /// </summary>
        /// <param name="rating">Рейтинг, вокруг которого искать</param>
        /// <param name="range">Диапазон рейтинга</param>
        /// <returns>Список ID пользователей</returns>
        public async Task<List<int>> FindMatchesInRangeAsync(int rating, int range = 100)
        {
            try
            {
                var db = _redis.GetDatabase();
                
                // Ищем пользователей в заданном диапазоне рейтинга
                var minScore = Math.Max(0, rating - range);
                var maxScore = rating + range;
                
                var entries = await db.SortedSetRangeByScoreAsync(
                    MATCHMAKING_QUEUE_KEY,
                    minScore,
                    maxScore);
                
                var userIds = new List<int>();
                foreach (var entry in entries)
                {
                    if (int.TryParse(entry.ToString(), out int userId))
                    {
                        userIds.Add(userId);
                    }
                }
                
                return userIds;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Ошибка при поиске совпадений в диапазоне {rating} +/- {range}");
                return new List<int>();
            }
        }

        /// <summary>
        /// Получает список всех пользователей в очереди матчмейкинга
        /// </summary>
        /// <returns>Список ID пользователей</returns>
        public async Task<List<int>> GetAllUsersInMatchmakingQueueAsync()
        {
            try
            {
                var db = _redis.GetDatabase();
                
                var entries = await db.SortedSetRangeByScoreAsync(MATCHMAKING_QUEUE_KEY);
                
                var userIds = new List<int>();
                foreach (var entry in entries)
                {
                    if (int.TryParse(entry.ToString(), out int userId))
                    {
                        userIds.Add(userId);
                    }
                }
                
                return userIds;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении всех пользователей из очереди матчмейкинга");
                return new List<int>();
            }
        }

        #endregion

        #region Active Duels Operations

        /// <summary>
        /// Сохраняет активную дуэль в Redis
        /// </summary>
        /// <param name="duel">Объект дуэли</param>
        /// <returns>True если успешно, иначе False</returns>
        public async Task<bool> SaveActiveDuelAsync(Duel duel)
        {
            try
            {
                var db = _redis.GetDatabase();
                var duelKey = $"{ACTIVE_DUELS_KEY}:{duel.Id}";
                
                // Настройка сериализатора для игнорирования циклических ссылок
                var options = new JsonSerializerOptions
                {
                    ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles
                };
                
                var serialized = JsonSerializer.Serialize(duel, options);
                var expiry = TimeSpan.FromSeconds(_configuration.GetValue<int>("Redis:ActiveDuelExpiry", 3600));
                
                await db.StringSetAsync(duelKey, serialized, expiry);
                
                _logger.LogInformation($"Дуэль {duel.Id} сохранена в Redis");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Ошибка при сохранении дуэли {duel.Id} в Redis");
                return false;
            }
        }

        /// <summary>
        /// Получает активную дуэль из Redis
        /// </summary>
        /// <param name="duelId">ID дуэли</param>
        /// <returns>Объект дуэли или null, если не найден</returns>
        public async Task<Duel> GetActiveDuelAsync(int duelId)
        {
            try
            {
                var db = _redis.GetDatabase();
                var duelKey = $"{ACTIVE_DUELS_KEY}:{duelId}";
                
                var serialized = await db.StringGetAsync(duelKey);
                if (serialized.IsNullOrEmpty)
                {
                    return null;
                }
                
                var options = new JsonSerializerOptions
                {
                    ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles
                };
                
                var duel = JsonSerializer.Deserialize<Duel>(serialized, options);
                return duel;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Ошибка при получении дуэли {duelId} из Redis");
                return null;
            }
        }

        /// <summary>
        /// Удаляет активную дуэль из Redis
        /// </summary>
        /// <param name="duelId">ID дуэли</param>
        /// <returns>True если успешно, иначе False</returns>
        public async Task<bool> RemoveActiveDuelAsync(int duelId)
        {
            try
            {
                var db = _redis.GetDatabase();
                var duelKey = $"{ACTIVE_DUELS_KEY}:{duelId}";
                
                await db.KeyDeleteAsync(duelKey);
                
                _logger.LogInformation($"Дуэль {duelId} удалена из Redis");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Ошибка при удалении дуэли {duelId} из Redis");
                return false;
            }
        }

        /// <summary>
        /// Получает все активные дуэли пользователя
        /// </summary>
        /// <param name="userId">ID пользователя</param>
        /// <returns>Список дуэлей</returns>
        public async Task<List<Duel>> GetUserActiveDuelsAsync(int userId)
        {
            try
            {
                var db = _redis.GetDatabase();
                var pattern = $"{ACTIVE_DUELS_KEY}:*";
                
                // Используем GetServer и KEYS вместо LuaScript
                var server = _redis.GetServer(_redis.GetEndPoints()[0]);
                var keys = server.Keys(pattern: pattern);
                
                var result = new List<Duel>();
                var options = new JsonSerializerOptions
                {
                    ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles
                };
                
                foreach (var key in keys)
                {
                    var keyStr = key.ToString();
                    var serialized = await db.StringGetAsync(keyStr);
                    
                    if (!serialized.IsNullOrEmpty)
                    {
                        var duel = JsonSerializer.Deserialize<Duel>(serialized, options);
                        if (duel.FirstUserId == userId || duel.SecondUserId == userId)
                        {
                            result.Add(duel);
                        }
                    }
                }
                
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Ошибка при получении активных дуэлей пользователя {userId}");
                return new List<Duel>();
            }
        }

        #endregion

        #region Duel Questions and Timers

        /// <summary>
        /// Запускает таймер для вопроса
        /// </summary>
        /// <param name="duelId">ID дуэли</param>
        /// <param name="questionOrder">Порядок вопроса</param>
        /// <returns>True если успешно, иначе False</returns>
        public async Task<bool> StartQuestionTimerAsync(int duelId, int questionOrder)
        {
            try
            {
                var db = _redis.GetDatabase();
                var timerKey = $"{QUESTION_TIMER_KEY}{duelId}:{questionOrder}";
                
                // Устанавливаем время начала вопроса
                var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                await db.StringSetAsync(timerKey, now.ToString(), TimeSpan.FromMinutes(30));
                
                // Проверяем, был ли уже установлен активный вопрос
                var questionKey = $"{ACTIVE_QUESTION_KEY}{duelId}";
                var currentQuestion = await db.StringGetAsync(questionKey);
                
                // Логируем только если это первый вызов для данного вопроса или если активный вопрос изменился
                if (currentQuestion.IsNullOrEmpty || !currentQuestion.ToString().Equals(questionOrder.ToString()))
                {
                    _logger.LogInformation($"Инициализирован таймер для вопроса {questionOrder} дуэли {duelId}");
                }
                
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Ошибка при инициализации таймера для вопроса {questionOrder} дуэли {duelId}");
                return false;
            }
        }

        /// <summary>
        /// Получает оставшееся время для текущего вопроса в миллисекундах
        /// </summary>
        /// <param name="duelId">ID дуэли</param>
        /// <param name="questionOrder">Порядок вопроса</param>
        /// <returns>Оставшееся время в миллисекундах или -1 в случае ошибки</returns>
        public async Task<long> GetRemainingTimeAsync(int duelId, int questionOrder)
        {
            try
            {
                var db = _redis.GetDatabase();
                var timerKey = $"{QUESTION_TIMER_KEY}{duelId}:{questionOrder}";
                
                var startTimeStr = await db.StringGetAsync(timerKey);
                if (startTimeStr.IsNullOrEmpty)
                {
                    return -1;
                }
                
                if (!long.TryParse(startTimeStr, out long startTime))
                {
                    return -1;
                }
                
                var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                var elapsed = now - startTime;
                
                // Таймер для вопроса - 15 секунд (15000 миллисекунд)
                var remaining = 15000 - elapsed;
                
                return remaining > 0 ? remaining : 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Ошибка при получении оставшегося времени для вопроса {questionOrder} дуэли {duelId}");
                return -1;
            }
        }

        /// <summary>
        /// Устанавливает текущий активный вопрос для дуэли
        /// </summary>
        /// <param name="duelId">ID дуэли</param>
        /// <param name="questionOrder">Порядок вопроса</param>
        /// <returns>True если успешно, иначе False</returns>
        public async Task<bool> SetActiveQuestionAsync(int duelId, int questionOrder)
        {
            try
            {
                var db = _redis.GetDatabase();
                var questionKey = $"{ACTIVE_QUESTION_KEY}{duelId}";
                
                // Проверяем, был ли уже установлен этот вопрос как активный
                var currentQuestion = await db.StringGetAsync(questionKey);
                bool isNewQuestion = currentQuestion.IsNullOrEmpty || !currentQuestion.ToString().Equals(questionOrder.ToString());
                
                // Устанавливаем вопрос как активный
                await db.StringSetAsync(questionKey, questionOrder.ToString(), TimeSpan.FromMinutes(30));
                
                // Логируем только если это новый вопрос
                if (isNewQuestion)
                {
                    _logger.LogInformation($"Установлен активный вопрос {questionOrder} для дуэли {duelId}");
                }
                
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Ошибка при установке активного вопроса {questionOrder} для дуэли {duelId}");
                return false;
            }
        }

        /// <summary>
        /// Получает текущий активный вопрос для дуэли
        /// </summary>
        /// <param name="duelId">ID дуэли</param>
        /// <returns>Порядок текущего вопроса или -1 в случае ошибки</returns>
        public async Task<int> GetActiveQuestionAsync(int duelId)
        {
            try
            {
                var db = _redis.GetDatabase();
                var questionKey = $"{ACTIVE_QUESTION_KEY}{duelId}";
                
                var questionOrderStr = await db.StringGetAsync(questionKey);
                if (questionOrderStr.IsNullOrEmpty)
                {
                    return -1;
                }
                
                if (!int.TryParse(questionOrderStr, out int questionOrder))
                {
                    return -1;
                }
                
                return questionOrder;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Ошибка при получении активного вопроса для дуэли {duelId}");
                return -1;
            }
        }

        /// <summary>
        /// Кеширует список всех вопросов при старте приложения
        /// </summary>
        /// <param name="questions">Список всех вопросов</param>
        /// <returns>True если успешно, иначе False</returns>
        public async Task<bool> CacheQuestionsListAsync(List<Question> questions)
        {
            try
            {
                var db = _redis.GetDatabase();
                
                var serialized = JsonSerializer.Serialize(questions);
                await db.StringSetAsync(QUESTIONS_LIST_KEY, serialized);
                
                _logger.LogInformation($"Кеширован список из {questions.Count} вопросов");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при кешировании списка вопросов");
                return false;
            }
        }

        /// <summary>
        /// Получает список всех вопросов из кеша
        /// </summary>
        /// <returns>Список вопросов или null в случае ошибки</returns>
        public async Task<List<Question>> GetCachedQuestionsListAsync()
        {
            try
            {
                var db = _redis.GetDatabase();
                
                var serialized = await db.StringGetAsync(QUESTIONS_LIST_KEY);
                if (serialized.IsNullOrEmpty)
                {
                    return null;
                }
                
                var questions = JsonSerializer.Deserialize<List<Question>>(serialized);
                return questions;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении кешированного списка вопросов");
                return null;
            }
        }
        
        /// <summary>
        /// Кеширует вопросы для конкретной дуэли
        /// </summary>
        /// <param name="duelId">ID дуэли</param>
        /// <param name="duelQuestions">Список вопросов дуэли с порядковыми номерами</param>
        /// <returns>True если успешно, иначе False</returns>
        public async Task<bool> CacheDuelQuestionsAsync(int duelId, List<(int, Question)> duelQuestions)
        {
            try
            {
                var db = _redis.GetDatabase();
                
                foreach (var duelQuestion in duelQuestions)
                {
                    var questionKey = $"{DUEL_QUESTIONS_KEY}{duelId}:{duelQuestion.Item1}";
                    var serialized = JsonSerializer.Serialize(duelQuestion.Item2);
                    await db.StringSetAsync(questionKey, serialized, TimeSpan.FromHours(24));
                }
                
                _logger.LogInformation($"Вопросы для дуэли {duelId} кешированы в Redis");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Ошибка при кешировании вопросов для дуэли {duelId}");
                return false;
            }
        }
        
        /// <summary>
        /// Получает вопрос для дуэли из кеша
        /// </summary>
        /// <param name="duelId">ID дуэли</param>
        /// <param name="questionOrder">Порядковый номер вопроса</param>
        /// <returns>Вопрос или null, если не найден</returns>
        public async Task<Question> GetDuelQuestionAsync(int duelId, int questionOrder)
        {
            try
            {
                var db = _redis.GetDatabase();
                var questionKey = $"{DUEL_QUESTIONS_KEY}{duelId}:{questionOrder}";
                
                var serialized = await db.StringGetAsync(questionKey);
                if (serialized.IsNullOrEmpty)
                {
                    return null;
                }
                
                var question = JsonSerializer.Deserialize<Question>(serialized);
                return question;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Ошибка при получении вопроса {questionOrder} для дуэли {duelId} из Redis");
                return null;
            }
        }
        
        #endregion

        #region User Answers Operations
        
        /// <summary>
        /// Сохраняет ответ пользователя в Redis
        /// </summary>
        /// <param name="duelId">ID дуэли</param>
        /// <param name="questionOrder">Порядок вопроса</param>
        /// <param name="userId">ID пользователя</param>
        /// <param name="answer">Ответ пользователя</param>
        /// <returns>True если успешно, иначе False</returns>
        public async Task<bool> SaveUserAnswerAsync(int duelId, int questionOrder, int userId, string answer)
        {
            try
            {
                var db = _redis.GetDatabase();
                var answerKey = $"duel:{duelId}:user:{userId}:question:{questionOrder}:answer";
                var submittedKey = $"duel:{duelId}:user:{userId}:question:{questionOrder}:submitted";
                
                // Проверяем, был ли уже сохранен ответ
                var existingAnswer = await db.StringGetAsync(answerKey);
                var wasSubmitted = await db.StringGetAsync(submittedKey);
                
                // Если ответ уже был сохранен и отмечен как отправленный, не логируем повторно
                bool isNewAnswer = existingAnswer.IsNullOrEmpty || wasSubmitted.IsNullOrEmpty;
                
                // Сохраняем ответ в Redis
                await db.StringSetAsync(answerKey, answer);
                
                // Отмечаем, что пользователь ответил на вопрос
                await db.StringSetAsync(submittedKey, "true");
                
                // Устанавливаем срок истечения для ключей (например, 1 час)
                var expiry = TimeSpan.FromHours(1);
                await db.KeyExpireAsync(answerKey, expiry);
                await db.KeyExpireAsync(submittedKey, expiry);
                
                // Логируем только если это новый ответ
                if (isNewAnswer)
                {
                    _logger.LogInformation($"Сохранен ответ пользователя {userId} на вопрос {questionOrder} для дуэли {duelId}");
                }
                
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Ошибка при сохранении ответа пользователя {userId} на вопрос {questionOrder} для дуэли {duelId}");
                return false;
            }
        }
        
        /// <summary>
        /// Получает ответ пользователя из Redis
        /// </summary>
        /// <param name="duelId">ID дуэли</param>
        /// <param name="questionOrder">Порядок вопроса</param>
        /// <param name="userId">ID пользователя</param>
        /// <returns>Ответ пользователя или null в случае ошибки</returns>
        public async Task<string> GetUserAnswerAsync(int duelId, int questionOrder, int userId)
        {
            try
            {
                var db = _redis.GetDatabase();
                var answerKey = $"duel:{duelId}:user:{userId}:question:{questionOrder}:answer";
                
                var answer = await db.StringGetAsync(answerKey);
                return answer.IsNullOrEmpty ? null : answer.ToString();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Ошибка при получении ответа пользователя {userId} на вопрос {questionOrder} для дуэли {duelId}");
                return null;
            }
        }
        
        /// <summary>
        /// Проверяет, ответил ли пользователь на вопрос
        /// </summary>
        /// <param name="duelId">ID дуэли</param>
        /// <param name="questionOrder">Порядок вопроса</param>
        /// <param name="userId">ID пользователя</param>
        /// <returns>True если пользователь ответил, иначе False</returns>
        public async Task<bool> HasUserSubmittedAnswerAsync(int duelId, int questionOrder, int userId)
        {
            try
            {
                var db = _redis.GetDatabase();
                var submittedKey = $"duel:{duelId}:user:{userId}:question:{questionOrder}:submitted";
                
                var submitted = await db.StringGetAsync(submittedKey);
                return !submitted.IsNullOrEmpty && submitted.ToString() == "true";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Ошибка при проверке статуса ответа пользователя {userId} на вопрос {questionOrder} для дуэли {duelId}");
                return false;
            }
        }
        
        /// <summary>
        /// Получает информацию об ответах на вопрос для обоих пользователей
        /// </summary>
        /// <param name="duelId">ID дуэли</param>
        /// <param name="questionOrder">Порядок вопроса</param>
        /// <param name="firstUserId">ID первого пользователя</param>
        /// <param name="secondUserId">ID второго пользователя</param>
        /// <returns>Кортеж с ответами и статусами отправки</returns>
        public async Task<(string firstUserAnswer, string secondUserAnswer, bool firstUserSubmitted, bool secondUserSubmitted)> GetQuestionAnswersInfoAsync(
            int duelId, int questionOrder, int firstUserId, int secondUserId)
        {
            try
            {
                var db = _redis.GetDatabase();
                
                // Ключи для ответов
                var firstUserAnswerKey = $"duel:{duelId}:user:{firstUserId}:question:{questionOrder}:answer";
                var secondUserAnswerKey = $"duel:{duelId}:user:{secondUserId}:question:{questionOrder}:answer";
                
                // Ключи для статусов отправки
                var firstUserSubmittedKey = $"duel:{duelId}:user:{firstUserId}:question:{questionOrder}:submitted";
                var secondUserSubmittedKey = $"duel:{duelId}:user:{secondUserId}:question:{questionOrder}:submitted";
                
                // Получаем ответы
                var firstUserAnswer = await db.StringGetAsync(firstUserAnswerKey);
                var secondUserAnswer = await db.StringGetAsync(secondUserAnswerKey);
                
                // Получаем статусы отправки
                var firstUserSubmitted = await db.StringGetAsync(firstUserSubmittedKey);
                var secondUserSubmitted = await db.StringGetAsync(secondUserSubmittedKey);
                
                return (
                    firstUserAnswer.IsNullOrEmpty ? null : firstUserAnswer.ToString(),
                    secondUserAnswer.IsNullOrEmpty ? null : secondUserAnswer.ToString(),
                    !firstUserSubmitted.IsNullOrEmpty && firstUserSubmitted.ToString() == "true",
                    !secondUserSubmitted.IsNullOrEmpty && secondUserSubmitted.ToString() == "true"
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Ошибка при получении информации об ответах для дуэли {duelId}, вопрос {questionOrder}");
                return (null, null, false, false);
            }
        }
        
        #endregion

        #region Duel Operations

        /// <summary>
        /// Создает новую дуэль между двумя пользователями, хранит её в Redis
        /// </summary>
        public async Task<Duel> CreateDuelAsync(int firstUserId, int secondUserId)
        {
            try
            {
                // Проверяем, существуют ли пользователи (используя ApplicationDbContext через DI)
                var firstUser = await _context.Users.FindAsync(firstUserId);
                var secondUser = await _context.Users.FindAsync(secondUserId);
                
                if (firstUser == null || secondUser == null)
                {
                    _logger.LogWarning($"Не удалось создать дуэль: один из пользователей не найден ({firstUserId}, {secondUserId})");
                    return null;
                }
                
                // Проверяем, не находятся ли пользователи уже в активной дуэли через Redis
                var firstUserActiveDuels = await GetUserActiveDuelsAsync(firstUserId);
                var secondUserActiveDuels = await GetUserActiveDuelsAsync(secondUserId);
                
                if (firstUserActiveDuels.Count > 0 || secondUserActiveDuels.Count > 0)
                {
                    _logger.LogWarning($"Не удалось создать дуэль: один из пользователей уже участвует в активной дуэли");
                    return null;
                }
                
                // Получаем 5 случайных вопросов из базы данных напрямую, вместо использования QuestionCacheService
                var selectedQuestions = await GetRandomQuestionsForDuelAsync(5);
                
                if (selectedQuestions.Count < 5)
                {
                    _logger.LogWarning("Не удалось создать дуэль: недостаточно вопросов");
                    return null;
                }
                
                // Создаем новую дуэль и сохраняем в Postgres
                using var transaction = await _context.Database.BeginTransactionAsync();
                try 
                {
                    var duel = new Duel
                    {
                        FirstUserId = firstUserId,
                        SecondUserId = secondUserId,
                        StartTime = DateTime.UtcNow,
                        IsCompleted = false,
                        Status = "active"
                    };
                    
                    _context.Duels.Add(duel);
                    await _context.SaveChangesAsync();
                    
                    // Создаем связи между дуэлью и вопросами
                    var duelQuestionList = new List<(int, Question)>();
                    foreach (var (question, index) in selectedQuestions.Select((q, i) => (q, i)))
                    {
                        var duelQuestion = new DuelQuestion
                        {
                            DuelId = duel.Id,
                            QuestionId = question.Id,
                            QuestionOrder = index,
                            FirstUserAnswer = null,
                            SecondUserAnswer = null,
                            FirstUserSubmitted = false,
                            SecondUserSubmitted = false
                        };
                        
                        _context.DuelQuestions.Add(duelQuestion);
                        
                        // Добавляем вопрос в список для кеширования
                        duelQuestionList.Add((index, question));
                    }
                    
                    await _context.SaveChangesAsync();
                    
                    // Устанавливаем статус "не в поиске" для обоих пользователей
                    firstUser.IsSearchingOpponent = false;
                    secondUser.IsSearchingOpponent = false;
                    await _context.SaveChangesAsync();
                    
                    await transaction.CommitAsync();
                    
                    // Сохраняем дуэль в Redis для быстрого доступа
                    await SaveActiveDuelAsync(duel);
                    
                    // Кешируем вопросы дуэли в Redis
                    await CacheDuelQuestionsAsync(duel.Id, duelQuestionList);
                    
                    _logger.LogInformation($"Создана новая дуэль {duel.Id} между пользователями {firstUserId} и {secondUserId}");
                    return duel;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Ошибка при создании дуэли между пользователями {firstUserId} и {secondUserId}");
                    await transaction.RollbackAsync();
                    return null;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Ошибка при создании дуэли между пользователями {firstUserId} и {secondUserId}");
                return null;
            }
        }

        /// <summary>
        /// Получает случайные вопросы для дуэли из базы данных
        /// </summary>
        private async Task<List<Question>> GetRandomQuestionsForDuelAsync(int count)
        {
            try
            {
                // Проверяем сначала кешированные вопросы
                var cachedQuestions = await GetCachedQuestionsListAsync();
                if (cachedQuestions != null && cachedQuestions.Count >= count)
                {
                    // Перемешиваем и выбираем нужное количество вопросов
                    var random = new Random();
                    return cachedQuestions.OrderBy(q => random.Next()).Take(count).ToList();
                }
                
                // Если кеш пуст или в нем недостаточно вопросов, используем базу данных
                var questions = await _context.Questions
                    .OrderBy(q => Guid.NewGuid()) // Случайный порядок
                    .Take(count)
                    .ToListAsync();
                
                // Если нашли достаточно вопросов, кешируем их
                if (questions.Count >= count)
                {
                    await CacheQuestionsListAsync(questions);
                }
                
                return questions;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Ошибка при получении случайных вопросов для дуэли");
                return new List<Question>();
            }
        }

        /// <summary>
        /// Завершает дуэль и определяет победителя с сохранением в Postgres
        /// </summary>
        public async Task CompleteDuelAsync(int duelId)
        {
            try
            {
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    // Загружаем полные данные о дуэли из базы данных для сохранения результатов
                    var dbDuel = await _context.Duels
                        .Include(d => d.FirstUser)
                        .Include(d => d.SecondUser)
                        .Include(d => d.DuelQuestions)
                            .ThenInclude(dq => dq.Question)
                        .FirstOrDefaultAsync(d => d.Id == duelId);

                    if (dbDuel == null)
                    {
                        throw new Exception("Дуэль не найдена в базе данных");
                    }

                    if (dbDuel.FirstUser == null || dbDuel.SecondUser == null)
                    {
                        throw new Exception("Не найдены участники дуэли");
                    }
                    
                    // Получаем дуэль из Redis, если она там есть
                    var redisDuel = await GetActiveDuelAsync(duelId);
                    if (redisDuel != null)
                    {
                        // Если дуэль есть в Redis, переносим ответы из Redis в базу данных
                        await SaveAnswersFromRedisToDatabaseAsync(dbDuel);
                    }

                    dbDuel.EndTime = DateTime.UtcNow;
                    dbDuel.IsCompleted = true;
                    dbDuel.Status = "completed";

                    // Определяем победителя
                    if (dbDuel.FirstUserCorrectAnswers > dbDuel.SecondUserCorrectAnswers)
                    {
                        dbDuel.WinnerId = dbDuel.FirstUserId;
                        dbDuel.IsDraw = false;
                        dbDuel.FirstUser.TotalWins++;
                        dbDuel.SecondUser.TotalLosses++;
                        _logger.LogInformation($"Победил первый игрок с ID {dbDuel.FirstUserId}, правильных ответов: {dbDuel.FirstUserCorrectAnswers} vs {dbDuel.SecondUserCorrectAnswers}");
                    }
                    else if (dbDuel.SecondUserCorrectAnswers > dbDuel.FirstUserCorrectAnswers)
                    {
                        dbDuel.WinnerId = dbDuel.SecondUserId;
                        dbDuel.IsDraw = false;
                        dbDuel.SecondUser.TotalWins++;
                        dbDuel.FirstUser.TotalLosses++;
                        _logger.LogInformation($"Победил второй игрок с ID {dbDuel.SecondUserId}, правильных ответов: {dbDuel.SecondUserCorrectAnswers} vs {dbDuel.FirstUserCorrectAnswers}");
                    }
                    else
                    {
                        // Ничья
                        dbDuel.IsDraw = true;
                        dbDuel.WinnerId = null; // Явно устанавливаем null
                        _logger.LogInformation($"Ничья! Оба игрока набрали по {dbDuel.FirstUserCorrectAnswers} правильных ответов");
                    }

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();
                    
                    // Удаляем дуэль из Redis, если она там есть
                    if (redisDuel != null)
                    {
                        await RemoveActiveDuelAsync(duelId);
                    }
                }
                catch (Exception)
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Ошибка при завершении дуэли {duelId}: {ex.Message}");
                throw;
            }
        }
        
        /// <summary>
        /// Завершает все активные дуэли
        /// </summary>
        public async Task CompleteAllActiveDuelsAsync()
        {
            try
            {
                // Получаем список всех возможных активных дуэлей из Redis
                var redisActiveKeys = await GetAllActiveDuelIdsFromRedisAsync();
                _logger.LogInformation($"Найдено {redisActiveKeys.Count} ключей активных дуэлей в Redis");
                
                // Получаем все незавершенные дуэли из базы данных
                var activeDuelsFromDb = await _context.Duels
                    .Include(d => d.FirstUser)
                    .Include(d => d.SecondUser)
                    .Include(d => d.DuelQuestions)
                        .ThenInclude(dq => dq.Question)
                    .Where(d => !d.IsCompleted)
                    .ToListAsync();

                _logger.LogInformation($"Найдено {activeDuelsFromDb.Count} активных дуэлей в базе данных");
                
                // Проходим по всем активным дуэлям из базы данных
                foreach (var duel in activeDuelsFromDb)
                {
                    try
                    {
                        // Проверяем, есть ли дуэль в Redis
                        var redisDuel = await GetActiveDuelAsync(duel.Id);
                        if (redisDuel != null)
                        {
                            // Если дуэль есть в Redis, используем метод CompleteDuelAsync
                            // для корректного сохранения ответов из Redis в базу данных
                            await CompleteDuelAsync(duel.Id);
                            _logger.LogInformation($"Дуэль ID: {duel.Id} успешно завершена с использованием данных из Redis");
                        }
                        else
                        {
                            // Если дуэли нет в Redis, завершаем её с использованием данных из базы данных
                            duel.EndTime = DateTime.UtcNow;
                            duel.IsCompleted = true;
                            duel.Status = "completed";
                            
                            // Определяем победителя на основе количества правильных ответов
                            if (duel.FirstUserCorrectAnswers > duel.SecondUserCorrectAnswers)
                            {
                                duel.WinnerId = duel.FirstUserId;
                                duel.IsDraw = false;
                                if (duel.FirstUser != null && duel.SecondUser != null)
                                {
                                    duel.FirstUser.TotalWins++;
                                    duel.SecondUser.TotalLosses++;
                                }
                                _logger.LogInformation($"Дуэль ID: {duel.Id} завершена. Победил первый игрок с ID {duel.FirstUserId}, счет: {duel.FirstUserCorrectAnswers}:{duel.SecondUserCorrectAnswers}");
                            }
                            else if (duel.SecondUserCorrectAnswers > duel.FirstUserCorrectAnswers)
                            {
                                duel.WinnerId = duel.SecondUserId;
                                duel.IsDraw = false;
                                if (duel.FirstUser != null && duel.SecondUser != null)
                                {
                                    duel.SecondUser.TotalWins++;
                                    duel.FirstUser.TotalLosses++;
                                }
                                _logger.LogInformation($"Дуэль ID: {duel.Id} завершена. Победил второй игрок с ID {duel.SecondUserId}, счет: {duel.SecondUserCorrectAnswers}:{duel.FirstUserCorrectAnswers}");
                            }
                            else
                            {
                                duel.IsDraw = true;
                                duel.WinnerId = null;
                                _logger.LogInformation($"Дуэль ID: {duel.Id} завершена. Ничья! Счет: {duel.FirstUserCorrectAnswers}:{duel.SecondUserCorrectAnswers}");
                            }
                            
                            await _context.SaveChangesAsync();
                            _logger.LogInformation($"Дуэль ID: {duel.Id} завершена только с использованием данных из базы");
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Ошибка при завершении дуэли ID: {duel.Id}: {ex.Message}");
                    }
                }
                
                // Проверяем, есть ли дуэли в Redis, но нет в базе данных
                foreach (var duelId in redisActiveKeys)
                {
                    if (!activeDuelsFromDb.Any(d => d.Id == duelId))
                    {
                        try
                        {
                            _logger.LogInformation($"Найдена дуэль ID: {duelId} только в Redis, пытаемся завершить");
                            
                            // Получаем дуэль из базы данных
                            var duel = await _context.Duels
                                .Include(d => d.DuelQuestions)
                                    .ThenInclude(dq => dq.Question)
                                .Include(d => d.FirstUser)
                                .Include(d => d.SecondUser)
                                .FirstOrDefaultAsync(d => d.Id == duelId);
                                
                            if (duel != null)
                            {
                                await CompleteDuelAsync(duelId);
                                _logger.LogInformation($"Дуэль ID: {duelId} успешно завершена с использованием данных из Redis");
                            }
                            else
                            {
                                // Если дуэли нет в базе данных, просто удаляем из Redis
                                await RemoveActiveDuelAsync(duelId);
                                _logger.LogWarning($"Дуэль ID: {duelId} не найдена в базе данных, удалена из Redis");
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, $"Ошибка при завершении дуэли ID: {duelId} из Redis: {ex.Message}");
                        }
                    }
                }
                
                _logger.LogInformation("Все активные дуэли завершены");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при завершении всех активных дуэлей");
                throw;
            }
        }
        
        /// <summary>
        /// Получает список всех ID активных дуэлей из Redis
        /// </summary>
        private async Task<List<int>> GetAllActiveDuelIdsFromRedisAsync()
        {
            try
            {
                var db = _redis.GetDatabase();
                var pattern = $"{ACTIVE_DUELS_KEY}:*";
                
                // Используем GetServer и KEYS вместо LuaScript
                var server = _redis.GetServer(_redis.GetEndPoints()[0]);
                var keys = server.Keys(pattern: pattern);
                
                var result = new List<int>();
                
                foreach (var key in keys)
                {
                    var keyStr = key.ToString();
                    var parts = keyStr.Split(':');
                    if (parts.Length >= 2 && int.TryParse(parts[1], out int duelId))
                    {
                        result.Add(duelId);
                    }
                }
                
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении списка активных дуэлей из Redis");
                return new List<int>();
            }
        }
        
        /// <summary>
        /// Сохраняет все ответы из Redis в базу данных
        /// </summary>
        private async Task SaveAnswersFromRedisToDatabaseAsync(Duel duel)
        {
            try 
            {
                // Сбрасываем счетчики правильных ответов, чтобы их пересчитать
                duel.FirstUserCorrectAnswers = 0;
                duel.SecondUserCorrectAnswers = 0;
                
                // Для каждого вопроса дуэли
                foreach (var duelQuestion in duel.DuelQuestions)
                {
                    // Получаем ответы из Redis
                    var answers = await GetQuestionAnswersInfoAsync(
                        duel.Id,
                        duelQuestion.QuestionOrder,
                        duel.FirstUserId,
                        duel.SecondUserId
                    );
                    
                    // Нормализуем строки для сравнения
                    string correctAnswer = duelQuestion.Question.CorrectAnswer?.Trim().ToLowerInvariant() ?? string.Empty;
                    string firstUserAnswer = answers.firstUserAnswer?.Trim().ToLowerInvariant() ?? string.Empty;
                    string secondUserAnswer = answers.secondUserAnswer?.Trim().ToLowerInvariant() ?? string.Empty;
                    
                    // Проверяем правильность ответов
                    bool isFirstUserCorrect = firstUserAnswer.Equals(correctAnswer);
                    bool isSecondUserCorrect = secondUserAnswer.Equals(correctAnswer);
                    
                    // Сохраняем ответы и информацию о правильности в базу данных
                    duelQuestion.FirstUserAnswer = answers.firstUserAnswer;
                    duelQuestion.SecondUserAnswer = answers.secondUserAnswer;
                    duelQuestion.IsFirstUserAnswerCorrect = isFirstUserCorrect;
                    duelQuestion.IsSecondUserAnswerCorrect = isSecondUserCorrect;
                    duelQuestion.FirstUserSubmitted = answers.firstUserSubmitted;
                    duelQuestion.SecondUserSubmitted = answers.secondUserSubmitted;
                    duelQuestion.AnswerTime = DateTime.UtcNow;
                    
                    // Обновляем счетчики правильных ответов
                    if (isFirstUserCorrect)
                    {
                        duel.FirstUserCorrectAnswers++;
                    }
                    
                    if (isSecondUserCorrect)
                    {
                        duel.SecondUserCorrectAnswers++;
                    }
                }
                
                // Логируем информацию о финальных счетах
                _logger.LogInformation($"Итоговые счета: первый игрок - {duel.FirstUserCorrectAnswers}, второй игрок - {duel.SecondUserCorrectAnswers}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Ошибка при сохранении ответов из Redis в базу данных для дуэли {duel.Id}");
                throw;
            }
        }
        
        #endregion
    }
} 