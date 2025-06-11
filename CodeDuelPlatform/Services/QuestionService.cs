using System.Text.Json;
using CodeDuelPlatform.Data;
using CodeDuelPlatform.Models;
using CodeDuelPlatform.Models.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CodeDuelPlatform.Services
{
    public class QuestionService
    {
        private readonly ILogger<QuestionService> _logger;
        private readonly ApplicationDbContext _context;
        private readonly QuestionCacheService _questionCacheService;
        
        public QuestionService(
            ILogger<QuestionService> logger,
            ApplicationDbContext context,
            QuestionCacheService questionCacheService)
        {
            _logger = logger;
            _context = context;
            _questionCacheService = questionCacheService;
        }
        
        /// <summary>
        /// Создает вопрос с простым текстовым вводом
        /// </summary>
        public async Task<Question> CreateTextInputQuestionAsync(
            string text, 
            string correctAnswer, 
            string category, 
            int difficulty = 1, 
            string explanation = null)
        {
            var question = new Question
            {
                Text = text,
                QuestionType = QuestionType.TextInput,
                CorrectAnswer = correctAnswer,
                Category = category,
                Difficulty = difficulty,
                Explanation = explanation
            };
            
            _context.Questions.Add(question);
            await _context.SaveChangesAsync();
            
            // Обновляем кеш вопросов
            await _questionCacheService.RefreshQuestionCacheAsync();
            
            return question;
        }
        
        /// <summary>
        /// Создает вопрос с выбором вариантов ответов
        /// </summary>
        public async Task<Question> CreateMultipleChoiceQuestionAsync(
            string text,
            List<string> options,
            int correctOptionIndex,
            string category,
            int difficulty = 1,
            string explanation = null)
        {
            if (correctOptionIndex < 0 || correctOptionIndex >= options.Count)
            {
                throw new ArgumentException("Индекс правильного ответа выходит за пределы списка вариантов");
            }
            
            // Создаем JSON структуру для вариантов ответов
            var optionsData = new
            {
                options = options,
                correctIndex = correctOptionIndex
            };
            
            var question = new Question
            {
                Text = text,
                QuestionType = QuestionType.MultipleChoice,
                CorrectAnswer = options[correctOptionIndex], // Сохраняем правильный ответ в текстовом виде
                Options = JsonSerializer.Serialize(optionsData),
                Category = category,
                Difficulty = difficulty,
                Explanation = explanation
            };
            
            _context.Questions.Add(question);
            await _context.SaveChangesAsync();
            
            // Обновляем кеш вопросов
            await _questionCacheService.RefreshQuestionCacheAsync();
            
            return question;
        }
        
        /// <summary>
        /// Создает вопрос с заполнением пропусков
        /// </summary>
        public async Task<Question> CreateFillBlanksQuestionAsync(
            string text,
            string template,
            List<string> blanks,
            string correctAnswer,
            string category,
            int difficulty = 1,
            string explanation = null)
        {
            // Создаем JSON структуру для данных с пропусками
            var blanksData = new
            {
                template = template,
                blanks = blanks
            };
            
            var question = new Question
            {
                Text = text,
                QuestionType = QuestionType.FillBlanks,
                CorrectAnswer = correctAnswer,
                BlanksData = JsonSerializer.Serialize(blanksData),
                Category = category,
                Difficulty = difficulty,
                Explanation = explanation
            };
            
            _context.Questions.Add(question);
            await _context.SaveChangesAsync();
            
            // Обновляем кеш вопросов
            await _questionCacheService.RefreshQuestionCacheAsync();
            
            return question;
        }
        
        /// <summary>
        /// Получает вопросы по типу и категории
        /// </summary>
        public async Task<List<Question>> GetQuestionsByTypeAndCategoryAsync(
            QuestionType questionType, 
            string category = null, 
            int count = 10)
        {
            var query = _context.Questions.Where(q => q.QuestionType == questionType);
            
            if (!string.IsNullOrEmpty(category))
            {
                query = query.Where(q => q.Category == category);
            }
            
            return await query
                .OrderBy(_ => EF.Functions.Random())
                .Take(count)
                .ToListAsync();
        }
        
        /// <summary>
        /// Проверяет правильность ответа на вопрос
        /// </summary>
        public bool CheckAnswer(Question question, string userAnswer)
        {
            if (question == null || string.IsNullOrEmpty(userAnswer))
            {
                return false;
            }
            
            return question.QuestionType switch
            {
                QuestionType.TextInput => CheckTextInputAnswer(question, userAnswer),
                QuestionType.MultipleChoice => CheckMultipleChoiceAnswer(question, userAnswer),
                QuestionType.FillBlanks => CheckFillBlanksAnswer(question, userAnswer),
                _ => false
            };
        }
        
        private bool CheckTextInputAnswer(Question question, string userAnswer)
        {
            // Для простого текстового ввода сравниваем ответы без учета регистра
            return string.Equals(question.CorrectAnswer.Trim(), userAnswer.Trim(), 
                StringComparison.OrdinalIgnoreCase);
        }
        
        private bool CheckMultipleChoiceAnswer(Question question, string userAnswer)
        {
            // Для вопроса с вариантами ответов
            // Пользователь может ответить либо индексом правильного ответа,
            // либо текстом варианта
            
            // Сначала проверяем, является ли ответ индексом
            if (int.TryParse(userAnswer, out int index))
            {
                return index == question.GetCorrectOptionIndex();
            }
            
            // Если не индекс, сравниваем с текстом правильного ответа
            return string.Equals(question.CorrectAnswer.Trim(), userAnswer.Trim(), 
                StringComparison.OrdinalIgnoreCase);
        }
        
        private bool CheckFillBlanksAnswer(Question question, string userAnswer)
        {
            // Для вопроса с заполнением пропусков
            // Сравниваем с правильным ответом
            return string.Equals(question.CorrectAnswer.Trim(), userAnswer.Trim(), 
                StringComparison.OrdinalIgnoreCase);
        }
    }
} 