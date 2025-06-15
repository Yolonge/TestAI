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
            // Сохраняем шаблон как есть, чтобы сохранить форматирование
            var blanksData = new
            {
                template = template, // Шаблон с сохранением форматирования
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
            if (string.IsNullOrEmpty(userAnswer))
                return false;
            
            // Проверяем точное совпадение (для обратной совместимости)
            if (string.Equals(question.CorrectAnswer.Trim(), userAnswer.Trim(), StringComparison.OrdinalIgnoreCase))
                return true;
            
            // Если ответ содержит разделитель ";" - разбиваем на части и проверяем каждую
            if (userAnswer.Contains(';') && question.CorrectAnswer.Contains(';'))
            {
                var userValues = userAnswer.Split(';').Select(v => v.Trim()).ToArray();
                var correctValues = question.CorrectAnswer.Split(';').Select(v => v.Trim()).ToArray();
                
                // Если количество значений не совпадает, ответ неверный
                if (userValues.Length != correctValues.Length)
                    return false;
                
                // Проверяем каждое значение
                for (int i = 0; i < userValues.Length; i++)
                {
                    if (!string.Equals(userValues[i], correctValues[i], StringComparison.OrdinalIgnoreCase))
                        return false;
                }
                
                return true;
            }
            
            // Если формат не соответствует ожидаемому, используем обычное сравнение
            return false;
        }
    }
} 