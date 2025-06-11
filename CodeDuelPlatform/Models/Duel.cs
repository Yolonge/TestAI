using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CodeDuelPlatform.Models
{
    public class Duel
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int FirstUserId { get; set; }
        
        [Required]
        public int SecondUserId { get; set; }
        
        [ForeignKey("FirstUserId")]
        public User FirstUser { get; set; }
        
        [ForeignKey("SecondUserId")]
        public User SecondUser { get; set; }
        
        public DateTime StartTime { get; set; } = DateTime.UtcNow;
        
        public DateTime? EndTime { get; set; }
        
        public int? WinnerId { get; set; }
        
        [ForeignKey("WinnerId")]
        public User Winner { get; set; }
        
        public bool IsDraw { get; set; } = false;
        
        public bool IsCompleted { get; set; } = false;
        
        public int FirstUserCorrectAnswers { get; set; } = 0;
        
        public int SecondUserCorrectAnswers { get; set; } = 0;
        
        public string Status { get; set; } = "waiting"; // waiting, active, completed, cancelled
        
        // Связь с вопросами через промежуточную таблицу
        public ICollection<DuelQuestion> DuelQuestions { get; set; }
    }
} 