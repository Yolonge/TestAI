using CodeDuelPlatform.Data;
using CodeDuelPlatform.Extensions;
using CodeDuelPlatform.Extensions.Models.Pagination;
using CodeDuelPlatform.Models;
using CodeDuelPlatform.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace CodeDuelPlatform.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    // [Authorize] // Временно отключено для тестирования
    public class DuelsController : ControllerBase
    {
        private readonly DuelService _duelService;
        private readonly UserService _userService;
        private readonly ApplicationDbContext _context;
        private readonly IRedisService _redisService;

        public DuelsController(
            DuelService duelService, 
            UserService userService, 
            ApplicationDbContext context, 
            IRedisService redisService)
        {
            _duelService = duelService;
            _userService = userService;
            _context = context;
            _redisService = redisService;
        }

        /// <summary>
        /// Проверяет наличие активной дуэли пользователя только в Redis (легковесный запрос)
        /// </summary>
        [HttpGet("check-active")]
        public async Task<IActionResult> CheckActiveDuel([FromQuery] int? userId = null)
        {
            int userIdValue;
            
            // Если userId передан как параметр, используем его
            if (userId.HasValue)
            {
                userIdValue = userId.Value;
            }
            // Иначе пытаемся получить из токена
            else if (User.Identity.IsAuthenticated)
            {
                userIdValue = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
            }
            else
            {
                return Unauthorized(new { Message = "Требуется авторизация или указание userId" });
            }
            
            // Проверяем только в Redis
            var activeDuels = await _redisService.GetUserActiveDuelsAsync(userIdValue);
            
            if (activeDuels.Count == 0)
                return NotFound(new { Message = "Активная дуэль не найдена" });

            // Возвращаем только ID дуэли для легковесности
            return Ok(new { duelId = activeDuels.First().Id, hasActiveDuel = true });
        }

        /// <summary>
        /// Получает активную дуэль пользователя
        /// </summary>
        [HttpGet("active")]
        public async Task<IActionResult> GetActiveDuel([FromQuery] int? userId = null)
        {
            int userIdValue;
            
            // Если userId передан как параметр, используем его
            if (userId.HasValue)
            {
                userIdValue = userId.Value;
            }
            // Иначе пытаемся получить из токена
            else if (User.Identity.IsAuthenticated)
            {
                userIdValue = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
            }
            else
            {
                return Unauthorized(new { Message = "Требуется авторизация или указание userId" });
            }
            
            // Проверяем только в Redis
            var activeDuels = await _redisService.GetUserActiveDuelsAsync(userIdValue);
            
            if (activeDuels.Count == 0)
                return NotFound(new { Message = "Активная дуэль не найдена" });

            var duel = activeDuels.First();

            // Преобразуем в DTO, включая информацию о вопросах
            // Важно: используем имена полей с маленькой буквы для совместимости с клиентом
            var result = new
            {
                id = duel.Id,
                startTime = duel.StartTime,
                status = "active",
                firstUserId = duel.FirstUserId,
                secondUserId = duel.SecondUserId,
                questions = await GetDuelQuestionsInfoAsync(duel, userIdValue)
            };
            
            return Ok(result);
        }

        /// <summary>
        /// Создает новую дуэль между двумя пользователями
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateDuel([FromBody] CreateDuelModel model)
        {
            try
            {
                var duel = await _redisService.CreateDuelAsync(model.FirstUserId, model.SecondUserId);
                
                if (duel == null)
                    return BadRequest(new { Message = "Не удалось создать дуэль" });
                
                return Ok(new { DuelId = duel.Id, Message = "Дуэль успешно создана" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        /// <summary>
        /// Получает историю дуэлей пользователя
        /// </summary>
        [HttpGet("history")]
        public async Task<IActionResult> GetUserDuelHistory([FromQuery] PaginationParams paginationParams, [FromQuery] SortParams? sortParams = null)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
            var duelsQuery = await _duelService.GetUserDuelHistoryQueryAsync(userId);
            
            var logger = HttpContext.RequestServices.GetRequiredService<ILogger<DuelsController>>();
            var paginatedDuels = duelsQuery.AsPaginated(paginationParams, sortParams, logger);
            
            var result = paginatedDuels.Items.Select(d => new
            {
                id = d.Id,
                opponent = d.FirstUserId == userId 
                    ? new { id = d.SecondUser.Id, username = d.SecondUser.Username }
                    : new { id = d.FirstUser.Id, username = d.FirstUser.Username },
                startTime = d.StartTime,
                endTime = d.EndTime,
                yourScore = d.FirstUserId == userId ? d.FirstUserCorrectAnswers : d.SecondUserCorrectAnswers,
                opponentScore = d.FirstUserId == userId ? d.SecondUserCorrectAnswers : d.FirstUserCorrectAnswers,
                isWin = d.WinnerId == userId,
                isDraw = d.IsDraw
            });
            
            return Ok(new
            {
                items = result,
                paginationParams = paginatedDuels.PaginationParams,
                totalPages = paginatedDuels.TotalPages,
                hasNextPage = paginatedDuels.HasNextPage,
                hasPreveiwPage = paginatedDuels.HasPreveiwPage
            });
        }

        /// <summary>
        /// Отправляет ответ пользователя на вопрос
        /// </summary>
        [HttpPost("{duelId}/questions/{questionOrder}/answer")]
        public async Task<IActionResult> SubmitAnswer(int duelId, int questionOrder, [FromBody] AnswerModel model)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
                
                // Проверяем существование и активность дуэли
                var duel = await _redisService.GetActiveDuelAsync(duelId);
                if (duel == null)
                {
                    return NotFound(new { Message = "Дуэль не найдена или уже завершена" });
                }
                
                // Проверяем, что пользователь участвует в дуэли
                if (duel.FirstUserId != userId && duel.SecondUserId != userId)
                {
                    return BadRequest(new { Message = "Вы не являетесь участником данной дуэли" });
                }
                
                // Проверяем, что вопрос существует
                if (questionOrder < 0 || questionOrder > 4)
                {
                    return BadRequest(new { Message = "Некорректный номер вопроса" });
                }
                
                // Проверяем, что пользователь еще не отвечал на этот вопрос
                var hasSubmitted = await _redisService.HasUserSubmittedAnswerAsync(duelId, questionOrder, userId);
                if (hasSubmitted)
                {
                    return BadRequest(new { Message = "Вы уже ответили на этот вопрос" });
                }
                
                // Получаем вопрос для определения его типа
                var question = await _redisService.GetDuelQuestionAsync(duelId, questionOrder);
                if (question == null)
                {
                    return BadRequest(new { Message = "Вопрос не найден" });
                }
                
                // Форматируем ответ в зависимости от типа вопроса
                string formattedAnswer;
                
                switch (question.QuestionType)
                {
                    case Models.Enums.QuestionType.MultipleChoice:
                        // Для вопроса с выбором вариантов ответ может быть индексом или текстом
                        if (model.SelectedOptionIndex.HasValue)
                        {
                            // Проверяем валидность индекса
                            var options = question.GetOptions();
                            if (options != null && model.SelectedOptionIndex.Value >= 0 && model.SelectedOptionIndex.Value < options.Count)
                            {
                                formattedAnswer = model.SelectedOptionIndex.Value.ToString();
                            }
                            else
                            {
                                return BadRequest(new { Message = "Некорректный индекс варианта ответа" });
                            }
                        }
                        else
                        {
                            formattedAnswer = model.Answer;
                        }
                        break;
                        
                    case Models.Enums.QuestionType.FillBlanks:
                        // Для вопроса с заполнением пропусков
                        if (model.BlankValues != null && model.BlankValues.Count > 0)
                        {
                            // Форматируем ответ из значений для пропусков
                            formattedAnswer = string.Join(";", model.BlankValues);
                        }
                        else
                        {
                            formattedAnswer = model.Answer;
                        }
                        break;
                        
                    default: // TextInput и другие типы
                        formattedAnswer = model.Answer;
                        break;
                }
                
                // Проверяем, что ответ не пустой
                if (string.IsNullOrWhiteSpace(formattedAnswer))
                {
                    return BadRequest(new { Message = "Ответ не может быть пустым" });
                }
                
                // Сохраняем ответ пользователя
                await _redisService.SaveUserAnswerAsync(duelId, questionOrder, userId, formattedAnswer);
                
                return Ok(new { Message = "Ответ успешно сохранен" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        /// <summary>
        /// Завершает дуэль
        /// </summary>
        [HttpPost("{duelId}/complete")]
        public async Task<IActionResult> CompleteDuel(int duelId)
        {
            try
            {
                await _redisService.CompleteDuelAsync(duelId);
                return Ok(new { Message = "Дуэль успешно завершена" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        /// <summary>
        /// Административная функция для завершения всех активных дуэлей
        /// </summary>
        [HttpPost("complete-all")]
        public async Task<IActionResult> CompleteAllDuels()
        {
            try
            {
                await _redisService.CompleteAllActiveDuelsAsync();
                return Ok(new { Message = "Все активные дуэли завершены" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }
        
        /// <summary>
        /// Получает результаты дуэли для отображения на странице с результатами
        /// </summary>
        [HttpGet("{duelId}/results")]
        public async Task<IActionResult> GetDuelResults(int duelId, [FromQuery] int? userId = null)
        {
            try
            {
                int userIdValue;
                
                // Если userId передан как параметр, используем его
                if (userId.HasValue)
                {
                    userIdValue = userId.Value;
                }
                // Иначе пытаемся получить из токена
                else if (User.Identity.IsAuthenticated)
                {
                    userIdValue = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
                }
                else
                {
                    return Unauthorized(new { Message = "Требуется авторизация или указание userId" });
                }
                
                // Сначала проверяем в Redis
                var duel = await _redisService.GetActiveDuelAsync(duelId);
                
                // Если в Redis не найдено, ищем в базе данных
                if (duel == null)
                {
                    duel = await _duelService.GetDuelByIdAsync(duelId);
                    
                    if (duel == null)
                    {
                        return NotFound(new { Message = "Дуэль не найдена" });
                    }
                }
                
                // Проверяем, что пользователь участвует в дуэли
                if (duel.FirstUserId != userIdValue && duel.SecondUserId != userIdValue)
                {
                    return Forbid();
                }
                
                // Формируем объект результатов
                var result = new
                {
                    id = duel.Id,
                    firstUserId = duel.FirstUserId,
                    secondUserId = duel.SecondUserId,
                    status = duel.IsCompleted ? "Completed" : "Active",
                    firstUserScore = duel.FirstUserCorrectAnswers,
                    secondUserScore = duel.SecondUserCorrectAnswers,
                    winnerId = duel.WinnerId,
                    isDraw = duel.IsDraw,
                    questions = duel.DuelQuestions?.OrderBy(dq => dq.QuestionOrder).Select(dq => new
                    {
                        order = dq.QuestionOrder,
                        text = dq.Question?.Text,
                        questionType = dq.Question?.QuestionType.ToString(),
                        firstUserAnswer = dq.FirstUserAnswer,
                        secondUserAnswer = dq.SecondUserAnswer,
                        isFirstUserAnswerCorrect = dq.IsFirstUserAnswerCorrect,
                        isSecondUserAnswerCorrect = dq.IsSecondUserAnswerCorrect,
                        correctAnswer = duel.IsCompleted ? dq.Question?.CorrectAnswer : null,
                        // Добавляем дополнительные данные для разных типов вопросов
                        options = dq.Question?.QuestionType == Models.Enums.QuestionType.MultipleChoice && duel.IsCompleted ? 
                            dq.Question.GetOptions() : null,
                        template = dq.Question?.QuestionType == Models.Enums.QuestionType.FillBlanks && duel.IsCompleted ? 
                            dq.Question.GetBlanksTemplate() : null,
                        blanks = dq.Question?.QuestionType == Models.Enums.QuestionType.FillBlanks && duel.IsCompleted ? 
                            dq.Question.GetBlankValues() : null
                    }).ToList()
                };
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }
        
        /// <summary>
        /// Вспомогательный метод для получения информации о вопросах дуэли
        /// </summary>
        private async Task<List<object>> GetDuelQuestionsInfoAsync(Duel duel, int userId)
        {
            var result = new List<object>();
            
            for (int i = 0; i < 5; i++)
            {
                var question = await _redisService.GetDuelQuestionAsync(duel.Id, i);
                var hasSubmitted = await _redisService.HasUserSubmittedAnswerAsync(duel.Id, i, userId);
                
                if (question == null)
                {
                    result.Add(new
                    {
                        order = i,
                        text = "Вопрос загружается...",
                        isAnswered = hasSubmitted,
                        questionType = "TextInput" // По умолчанию текстовый ввод
                    });
                    continue;
                }
                
                // Базовые данные для всех типов вопросов
                var questionData = new Dictionary<string, object>
                {
                    { "order", i },
                    { "text", question.Text },
                    { "isAnswered", hasSubmitted },
                    { "questionType", question.QuestionType.ToString() }
                };
                
                // Добавляем специфические данные в зависимости от типа вопроса
                switch (question.QuestionType)
                {
                    case Models.Enums.QuestionType.MultipleChoice:
                        // Для вопроса с выбором вариантов, добавляем варианты
                        var options = question.GetOptions();
                        if (options != null)
                        {
                            questionData.Add("options", options);
                        }
                        break;
                        
                    case Models.Enums.QuestionType.FillBlanks:
                        // Для вопроса с заполнением пропусков добавляем шаблон и пропуски
                        var template = question.GetBlanksTemplate();
                        var blanks = question.GetBlankValues();
                        
                        if (!string.IsNullOrEmpty(template))
                        {
                            questionData.Add("template", template);
                        }
                        
                        if (blanks != null)
                        {
                            questionData.Add("blanks", blanks);
                        }
                        break;
                        
                    // Для TextInput ничего дополнительно не добавляем
                }
                
                result.Add(questionData);
            }
            
            return result;
        }

        /// <summary>
        /// Получает статус дуэли
        /// </summary>
        [HttpGet("{duelId}/status")]
        public async Task<IActionResult> GetDuelStatus(int duelId)
        {
            try
            {
                // Получаем дуэль из базы данных
                var duel = await _duelService.GetDuelByIdAsync(duelId);
                
                if (duel == null)
                {
                    return NotFound(new { Message = "Дуэль не найдена" });
                }
                
                return Ok(new { status = duel.Status });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }
    }

    public class CreateDuelModel
    {
        public int FirstUserId { get; set; }
        public int SecondUserId { get; set; }
    }
    
    public class AnswerModel
    {
        // Ответ пользователя
        public string Answer { get; set; }
        
        // Для вопросов с выбором варианта можно указать индекс выбранного варианта
        // Если указан и Answer и SelectedOptionIndex, приоритет у SelectedOptionIndex
        public int? SelectedOptionIndex { get; set; }
        
        // Для вопросов с заполнением пропусков можно указать значения для заполнения
        // Если указан и Answer и BlankValues, приоритет у BlankValues
        public List<string> BlankValues { get; set; }
    }
    
    public class SearchOpponentModel
    {
        public int UserId { get; set; }
    }
} 