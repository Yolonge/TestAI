namespace CodeDuelPlatform.Extensions.Models.Pagination;

public record Paginated<TData>
{
     /// <summary>
        /// Примененные параметры пагинации.
        /// </summary>
        public required PaginationParams PaginationParams { get; init; }

        /// <summary>
        /// Флаг, указывающий, имеет ли текущая страница предыдущую.
        /// </summary>
        public bool HasPreveiwPage { get; init; }

        /// <summary>
        /// Флаг, указывающий, имеет ли текущая страница следующую.
        /// </summary>
        public bool HasNextPage { get; init; }

        /// <summary>
        /// Всего страниц.
        /// </summary>
        public int TotalPages { get; init; }

        /// <summary>
        /// Неизменяемая коллекция, содержащая <typeparamref name="TData"/>.
        /// </summary>
        public required IReadOnlyCollection<TData> Items { get; init; }

        /// <summary>
        /// Сообщение об ошибке, если произошла ошибка при пагинации.
        /// </summary>
        public string? Error { get; init; }
}
