namespace CodeDuelPlatform.Models.Enums
{
    /// <summary>
    /// Типы вопросов в дуэлях
    /// </summary>
    public enum QuestionType
    {
        /// <summary>
        /// Простой текстовый ввод
        /// </summary>
        TextInput = 1,
        
        /// <summary>
        /// Выбор из нескольких вариантов ответа
        /// </summary>
        MultipleChoice = 2,
        
        /// <summary>
        /// Заполнение пропусков
        /// </summary>
        FillBlanks = 3
    }
}