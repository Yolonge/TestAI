using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;
using CodeDuelPlatform.Models.Enums;

namespace CodeDuelPlatform.Models
{
    public class Question
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public string Text { get; set; }
        
        [Required]
        public QuestionType QuestionType { get; set; } = QuestionType.TextInput;
        
        [Required]
        public string CorrectAnswer { get; set; }
        
        public string? Explanation { get; set; }
        
        /// <summary>
        /// JSON данные для вопросов с вариантами ответов
        /// Структура: {"options": ["вариант1", "вариант2", ...], "correctIndex": 0}
        /// </summary>
        [Column(TypeName = "jsonb")]
        public string? Options { get; set; }
        
        /// <summary>
        /// JSON данные для вопросов с заполнением пропусков
        /// Структура: {"template": "n = Convert.ToInt32(__);", "blanks": ["str", "n"]}
        /// </summary>
        [Column(TypeName = "jsonb")]
        public string? BlanksData { get; set; }
        
        public int Difficulty { get; set; } = 1; // 1 - легкий, 2 - средний, 3 - сложный
        
        [Required]
        public string Category { get; set; } // например, "C#", "SQL", "Алгоритмы", и т.д.
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public ICollection<DuelQuestion> DuelQuestions { get; set; }
        
        // Вспомогательные методы для работы с JSON полями
        
        public List<string>? GetOptions()
        {
            if (string.IsNullOrEmpty(Options))
                return null;
                
            var optionsData = JsonSerializer.Deserialize<JsonElement>(Options);
            return optionsData.GetProperty("options").EnumerateArray()
                .Select(o => o.GetString())
                .ToList();
        }
        
        public int GetCorrectOptionIndex()
        {
            if (string.IsNullOrEmpty(Options))
                return -1;
                
            var optionsData = JsonSerializer.Deserialize<JsonElement>(Options);
            return optionsData.TryGetProperty("correctIndex", out var indexElement) 
                ? indexElement.GetInt32() 
                : -1;
        }
        
        public string? GetBlanksTemplate()
        {
            if (string.IsNullOrEmpty(BlanksData))
                return null;
                
            var blanksData = JsonSerializer.Deserialize<JsonElement>(BlanksData);
            return blanksData.TryGetProperty("template", out var templateElement)
                ? templateElement.GetString()
                : null;
        }
        
        public List<string>? GetBlankValues()
        {
            if (string.IsNullOrEmpty(BlanksData))
                return null;
                
            var blanksData = JsonSerializer.Deserialize<JsonElement>(BlanksData);
            return blanksData.TryGetProperty("blanks", out var blanksElement)
                ? blanksElement.EnumerateArray()
                    .Select(b => b.GetString())
                    .ToList()
                : null;
        }
    }
} 