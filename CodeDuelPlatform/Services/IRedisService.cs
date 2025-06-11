using CodeDuelPlatform.Models;

namespace CodeDuelPlatform.Services;

public interface IRedisService
{
    Task<bool> AddUserToMatchmakingQueueAsync(int userId, int rating);
    Task<bool> RemoveUserFromMatchmakingQueueAsync(int userId);
    Task<bool> IsUserInMatchmakingQueueAsync(int userId);
    Task<List<int>> FindMatchesInRangeAsync(int rating, int range = 100);
    Task<List<int>> GetAllUsersInMatchmakingQueueAsync();
    Task<bool> SaveActiveDuelAsync(Duel duel);
    Task<Duel> GetActiveDuelAsync(int duelId);
    Task<bool> RemoveActiveDuelAsync(int duelId);
    Task<List<Duel>> GetUserActiveDuelsAsync(int userId);
    Task<bool> StartQuestionTimerAsync(int duelId, int questionOrder);
    Task<long> GetRemainingTimeAsync(int duelId, int questionOrder);
    Task<bool> SetActiveQuestionAsync(int duelId, int questionOrder);
    Task<int> GetActiveQuestionAsync(int duelId);
    Task<bool> CacheQuestionsListAsync(List<Question> questions);
    Task<List<Question>> GetCachedQuestionsListAsync();
    Task<bool> CacheDuelQuestionsAsync(int duelId, List<(int, Question)> duelQuestions);
    Task<Question> GetDuelQuestionAsync(int duelId, int questionOrder);
    Task<bool> SaveUserAnswerAsync(int duelId, int questionOrder, int userId, string answer);
    Task<string> GetUserAnswerAsync(int duelId, int questionOrder, int userId);
    Task<bool> HasUserSubmittedAnswerAsync(int duelId, int questionOrder, int userId);
    Task<(string firstUserAnswer, string secondUserAnswer, bool firstUserSubmitted, bool secondUserSubmitted)> GetQuestionAnswersInfoAsync(int duelId, int questionOrder, int firstUserId, int secondUserId);
        
    // Добавляем методы, необходимые для DuelService
    Task<Duel> CreateDuelAsync(int firstUserId, int secondUserId);
    Task CompleteDuelAsync(int duelId);
    Task CompleteAllActiveDuelsAsync();
}