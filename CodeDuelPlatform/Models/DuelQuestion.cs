using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CodeDuelPlatform.Models
{
    public class DuelQuestion
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int DuelId { get; set; }
        
        [Required]
        public int QuestionId { get; set; }
        
        [ForeignKey("DuelId")]
        public Duel Duel { get; set; }
        
        [ForeignKey("QuestionId")]
        public Question Question { get; set; }
        
        public int QuestionOrder { get; set; } // Порядок вопроса в дуэли
        
        public string? FirstUserAnswer { get; set; }
        
        public string? SecondUserAnswer { get; set; }
        
        public bool? IsFirstUserAnswerCorrect { get; set; }
        
        public bool? IsSecondUserAnswerCorrect { get; set; }
        
        public DateTime? AnswerTime { get; set; }
        
        // Флаги отправки ответов
        public bool FirstUserSubmitted { get; set; } = false;
        
        public bool SecondUserSubmitted { get; set; } = false;
    }
} 