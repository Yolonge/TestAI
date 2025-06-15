using CodeDuelPlatform.Data;
using CodeDuelPlatform.Models;
using CodeDuelPlatform.Models.Enums;
using CodeDuelPlatform.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CodeDuelPlatform.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class QuestionsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly QuestionService _questionService;
        private readonly QuestionCacheService _questionCacheService;

        public QuestionsController(
            ApplicationDbContext context,
            QuestionService questionService,
            QuestionCacheService questionCacheService)
        {
            _context = context;
            _questionService = questionService;
            _questionCacheService = questionCacheService;
        }

        /// <summary>
        /// Получает список всех вопросов (только для администратора)
        /// </summary>
        [HttpGet]
        // [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetQuestions(
            [FromQuery] string category = null, 
            [FromQuery] int? difficulty = null,
            [FromQuery] QuestionType? type = null)
        {
            var query = _context.Questions.AsQueryable();
            
            if (!string.IsNullOrEmpty(category))
                query = query.Where(q => q.Category == category);
                
            if (difficulty.HasValue)
                query = query.Where(q => q.Difficulty == difficulty.Value);
                
            if (type.HasValue)
                query = query.Where(q => q.QuestionType == type.Value);
                
            var questions = await query.ToListAsync();
            
            return Ok(questions);
        }

        /// <summary>
        /// Получает вопрос по ID (только для администратора)
        /// </summary>
        [HttpGet("{id}")]
        // [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetQuestion(int id)
        {
            var question = await _context.Questions.FindAsync(id);
            
            if (question == null)
                return NotFound(new { Message = "Вопрос не найден" });
                
            // Подготавливаем представление в зависимости от типа вопроса
            object result;
            switch (question.QuestionType)
            {
                case QuestionType.TextInput:
                    result = new
                    {
                        question.Id,
                        question.Text,
                        question.CorrectAnswer,
                        question.Explanation,
                        question.Difficulty,
                        question.Category,
                        Type = "TextInput"
                    };
                    break;
                case QuestionType.MultipleChoice:
                    result = new
                    {
                        question.Id,
                        question.Text,
                        question.CorrectAnswer,
                        question.Explanation,
                        question.Difficulty,
                        question.Category,
                        Type = "MultipleChoice",
                        Options = question.GetOptions(),
                        CorrectOptionIndex = question.GetCorrectOptionIndex()
                    };
                    break;
                case QuestionType.FillBlanks:
                    result = new
                    {
                        question.Id,
                        question.Text,
                        question.CorrectAnswer,
                        question.Explanation,
                        question.Difficulty,
                        question.Category,
                        Type = "FillBlanks",
                        Template = question.GetBlanksTemplate(),
                        Blanks = question.GetBlankValues()
                    };
                    break;
                default:
                    result = question;
                    break;
            }
                
            return Ok(result);
        }

        /// <summary>
        /// Создает новый вопрос с текстовым вводом
        /// </summary>
        [HttpPost("text-input")]
        // [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateTextInputQuestion([FromBody] TextInputQuestionModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            
            try
            {
                var question = await _questionService.CreateTextInputQuestionAsync(
                    model.Text,
                    model.CorrectAnswer,
                    model.Category,
                    model.Difficulty,
                    model.Explanation
                );
                
                return CreatedAtAction(nameof(GetQuestion), new { id = question.Id }, question);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Ошибка при создании вопроса: {ex.Message}" });
            }
        }

        /// <summary>
        /// Создает новый вопрос с выбором вариантов ответов
        /// </summary>
        [HttpPost("multiple-choice")]
        // [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateMultipleChoiceQuestion([FromBody] MultipleChoiceQuestionModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
                
            if (model.Options == null || model.Options.Count < 2)
                return BadRequest(new { Message = "Для вопроса с выбором должно быть как минимум 2 варианта ответа" });
                
            if (model.CorrectOptionIndex < 0 || model.CorrectOptionIndex >= model.Options.Count)
                return BadRequest(new { Message = "Индекс правильного ответа выходит за пределы списка вариантов" });
            
            try
            {
                var question = await _questionService.CreateMultipleChoiceQuestionAsync(
                    model.Text,
                    model.Options,
                    model.CorrectOptionIndex,
                    model.Category,
                    model.Difficulty,
                    model.Explanation
                );
                
                return CreatedAtAction(nameof(GetQuestion), new { id = question.Id }, question);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Ошибка при создании вопроса: {ex.Message}" });
            }
        }
        
        /// <summary>
        /// Создает новый вопрос с заполнением пропусков
        /// </summary>
        [HttpPost("fill-blanks")]
        // [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateFillBlanksQuestion([FromBody] FillBlanksQuestionModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            
            if (string.IsNullOrEmpty(model.Template))
                return BadRequest(new { Message = "Шаблон с пропусками обязателен" });
                
            if (model.Blanks == null || model.Blanks.Count == 0)
                return BadRequest(new { Message = "Необходимо указать хотя бы один пропуск" });
            
            // Проверяем, что количество пропусков соответствует количеству заполнителей в шаблоне
            int placeholderCount = CountPlaceholders(model.Template);
            if (placeholderCount != model.Blanks.Count)
                return BadRequest(new { Message = $"Количество пропусков ({model.Blanks.Count}) не соответствует количеству заполнителей в шаблоне ({placeholderCount})" });
            
            try
            {
                var question = await _questionService.CreateFillBlanksQuestionAsync(
                    model.Text,
                    model.Template,
                    model.Blanks,
                    model.CorrectAnswer,
                    model.Category,
                    model.Difficulty,
                    model.Explanation
                );
            
                return CreatedAtAction(nameof(GetQuestion), new { id = question.Id }, question);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Ошибка при создании вопроса: {ex.Message}" });
            }
        }

        // Вспомогательный метод для подсчета заполнителей в шаблоне
        private int CountPlaceholders(string template)
        {
            if (string.IsNullOrEmpty(template))
                return 0;
            
            // Считаем количество заполнителей "__" в шаблоне
            // Учитываем, что они могут быть на разных строках
            int count = 0;
            int index = 0;
            
            while ((index = template.IndexOf("__", index)) != -1)
            {
                count++;
                index += 2; // Перемещаем индекс после найденного заполнителя
            }
            
            return count;
        }

        /// <summary>
        /// Обновляет существующий вопрос (только для администратора)
        /// </summary>
        [HttpPut("{id}")]
        //[Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateQuestion(int id, [FromBody] UpdateQuestionModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
                
            var question = await _context.Questions.FindAsync(id);
            
            if (question == null)
                return NotFound(new { Message = "Вопрос не найден" });
                
            // Обновляем базовые поля
            question.Text = model.Text;
            question.CorrectAnswer = model.CorrectAnswer;
            question.Explanation = model.Explanation;
            question.Difficulty = model.Difficulty;
            question.Category = model.Category;
            
            // Если тип вопроса изменился или это не соответствует текущим данным, 
            // очищаем специфические для типа поля
            if (model.QuestionType != question.QuestionType)
            {
                question.Options = null;
                question.BlanksData = null;
                question.QuestionType = model.QuestionType;
            }
            
            // Обновляем специфические поля в зависимости от типа вопроса
            switch (model.QuestionType)
            {
                case QuestionType.MultipleChoice when model.Options != null && model.CorrectOptionIndex.HasValue:
                    // Создаем JSON структуру для вариантов ответов
                    var optionsData = new
                    {
                        options = model.Options,
                        correctIndex = model.CorrectOptionIndex.Value
                    };
                    
                    question.Options = System.Text.Json.JsonSerializer.Serialize(optionsData);
                    break;
                    
                case QuestionType.FillBlanks when !string.IsNullOrEmpty(model.Template) && model.Blanks != null:
                    // Создаем JSON структуру для данных с пропусками
                    var blanksData = new
                    {
                        template = model.Template,
                        blanks = model.Blanks
                    };
                    
                    question.BlanksData = System.Text.Json.JsonSerializer.Serialize(blanksData);
                    break;
            }
            
            try
            {
            await _context.SaveChangesAsync();
                
                // Обновляем кеш вопросов
                await _questionCacheService.RefreshQuestionCacheAsync();
            
            return Ok(question);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Ошибка при обновлении вопроса: {ex.Message}" });
            }
        }

        /// <summary>
        /// Удаляет вопрос (только для администратора)
        /// </summary>
        [HttpDelete("{id}")]
        // [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteQuestion(int id)
        {
            var question = await _context.Questions.FindAsync(id);
            
            if (question == null)
                return NotFound(new { Message = "Вопрос не найден" });
                
            _context.Questions.Remove(question);
            await _context.SaveChangesAsync();
            
            // Обновляем кеш вопросов
            await _questionCacheService.RefreshQuestionCacheAsync();
            
            return NoContent();
        }

        /// <summary>
        /// Получает категории вопросов
        /// </summary>
        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _context.Questions
                .Select(q => q.Category)
                .Distinct()
                .ToListAsync();
                
            return Ok(categories);
        }
        
        /// <summary>
        /// Получает типы вопросов
        /// </summary>
        [HttpGet("types")]
        public IActionResult GetQuestionTypes()
        {
            var types = Enum.GetValues(typeof(QuestionType))
                .Cast<QuestionType>()
                .Select(t => new
                {
                    Id = (int)t,
                    Name = t.ToString()
                })
                .ToList();
                
            return Ok(types);
        }
        
        /// <summary>
        /// Получает случайные вопросы для дуэли
        /// </summary>
        [HttpGet("random")]
        public async Task<IActionResult> GetRandomQuestions(
            [FromQuery] int count = 5,
            [FromQuery] string category = null,
            [FromQuery] QuestionType? type = null)
        {
            var query = _context.Questions.AsQueryable();
            
            if (!string.IsNullOrEmpty(category))
                query = query.Where(q => q.Category == category);
                
            if (type.HasValue)
                query = query.Where(q => q.QuestionType == type.Value);
                
            var questions = await query
                .OrderBy(q => EF.Functions.Random())
                .Take(count)
                .ToListAsync();
                
            return Ok(questions);
        }
    }

    // Базовая модель вопроса
    public class BaseQuestionModel
    {
        public string Text { get; set; }
        public string CorrectAnswer { get; set; }
        public string Explanation { get; set; }
        public int Difficulty { get; set; } = 1;
        public string Category { get; set; }
    }
    
    // Модель для вопроса с текстовым вводом
    public class TextInputQuestionModel : BaseQuestionModel
    {
        // Использует только базовые поля
    }
    
    // Модель для вопроса с выбором вариантов
    public class MultipleChoiceQuestionModel : BaseQuestionModel
    {
        public List<string> Options { get; set; }
        public int CorrectOptionIndex { get; set; }
    }
    
    // Модель для вопроса с заполнением пропусков
    public class FillBlanksQuestionModel : BaseQuestionModel
    {
        public string Template { get; set; }
        public List<string> Blanks { get; set; }
    }
    
    // Универсальная модель для обновления вопроса любого типа
    public class UpdateQuestionModel : BaseQuestionModel
    {
        public QuestionType QuestionType { get; set; }
        
        // Поля для вопроса с выбором вариантов
        public List<string> Options { get; set; }
        public int? CorrectOptionIndex { get; set; }
        
        // Поля для вопроса с заполнением пропусков
        public string Template { get; set; }
        public List<string> Blanks { get; set; }
    }
} 