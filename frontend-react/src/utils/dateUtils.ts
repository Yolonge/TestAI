/**
 * Форматирует дату в удобочитаемый формат
 * @param date Объект даты для форматирования
 * @returns Строка даты в формате DD.MM.YYYY HH:MM
 */
export function formatDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

/**
 * Форматирует временные интервалы в человекочитаемый формат
 * @param seconds Количество секунд
 * @returns Строка в формате MM:SS
 */
export function formatTimeInterval(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Возвращает относительное время (например, "5 минут назад")
 * @param date Дата для форматирования
 * @returns Строка с относительным временем
 */
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  if (diffSec < 60) {
    return 'только что';
  } else if (diffMin < 60) {
    return `${diffMin} ${pluralize(diffMin, 'минуту', 'минуты', 'минут')} назад`;
  } else if (diffHour < 24) {
    return `${diffHour} ${pluralize(diffHour, 'час', 'часа', 'часов')} назад`;
  } else if (diffDay < 7) {
    return `${diffDay} ${pluralize(diffDay, 'день', 'дня', 'дней')} назад`;
  } else {
    return formatDate(date);
  }
}

/**
 * Вспомогательная функция для склонения слов в зависимости от числительного
 */
function pluralize(
  count: number, 
  one: string, 
  few: string, 
  many: string
): string {
  if (count % 10 === 1 && count % 100 !== 11) {
    return one;
  } else if (
    [2, 3, 4].includes(count % 10) && 
    ![12, 13, 14].includes(count % 100)
  ) {
    return few;
  } else {
    return many;
  }
} 