import axios from 'axios';

// Базовый URL для API
const API_URL = '/api';

// Типы данных
export interface Question {
  id: number;
  questionId: number;
  order: number;
  text: string;
  questionType: 'TextInput' | 'MultipleChoice' | 'FillBlanks'; // Тип вопроса
  firstUserAnswer?: string | null;
  secondUserAnswer?: string | null;
  isFirstUserAnswerCorrect?: boolean;
  isSecondUserAnswerCorrect?: boolean;
  firstUserSubmitted?: boolean;
  secondUserSubmitted?: boolean;
  correctAnswer?: string;
  explanation?: string;
  // Поля для вопросов с выбором вариантов
  options?: string[];
  correctOptionIndex?: number;
  // Поля для вопросов с заполнением пропусков
  template?: string;
  blanks?: string[];
}

export interface Duel {
  id: number;
  firstUserId: number;
  secondUserId: number;
  startTime: string;
  firstUserCorrectAnswers: number;
  secondUserCorrectAnswers: number;
  questions: Question[];
}

export interface DuelResult {
  id: number;
  firstUser?: { id: number; username: string };
  secondUser?: { id: number; username: string };
  firstUserId: number;
  secondUserId: number;
  startTime: string;
  endTime?: string;
  winnerId: number | null;
  isDraw: boolean;
  firstUserCorrectAnswers: number;
  secondUserCorrectAnswers: number;
  questions: Question[];
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  rating: number;
  totalWins: number;
  totalLosses: number;
}

export interface ActiveDuelCheck {
  duelId: number;
  hasActiveDuel: boolean;
}

class ApiService {
  // Легковесная проверка наличия активной дуэли в Redis
  async checkActiveDuel(userId: number): Promise<ActiveDuelCheck | null> {
    try {
      const response = await fetch(`${API_URL}/duels/check-active?userId=${userId}`, {
        headers: this.getAuthHeaders()
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Ошибка при проверке активной дуэли: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Ошибка при проверке активной дуэли:', error);
      return null;
    }
  }

  // Получение активной дуэли пользователя
  async getActiveDuel(userId: number): Promise<Duel | null> {
    try {
      const response = await fetch(`${API_URL}/duels/active?userId=${userId}`, {
        headers: this.getAuthHeaders()
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Ошибка при получении активной дуэли: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Ошибка при получении активной дуэли:', error);
      throw error;
    }
  }

  // Начать поиск оппонента через REST API
  async searchOpponent(userId: number): Promise<{ message: string }> {
    try {
      const response = await axios.post(`${API_URL}/duels/search`, { userId });
      return response.data;
    } catch (error) {
      console.error('Ошибка при поиске оппонента:', error);
      throw error;
    }
  }

  // Отменить поиск оппонента через REST API
  async cancelSearch(userId: number): Promise<{ message: string }> {
    try {
      const response = await axios.post(`${API_URL}/duels/search/cancel`, { userId });
      return response.data;
    } catch (error) {
      console.error('Ошибка при отмене поиска:', error);
      throw error;
    }
  }

  // Отправить ответ на вопрос
  async submitAnswer(duelId: number, questionOrder: number, answer: string | { 
    answer?: string; 
    selectedOptionIndex?: number; 
    blankValues?: string[] 
  }): Promise<{ message: string }> {
    try {
      let requestBody: {
        answer?: string;
        selectedOptionIndex?: number;
        blankValues?: string[];
      } = {};

      if (typeof answer === 'string') {
        requestBody = { answer };
      } else {
        requestBody = answer;
      }

      const response = await axios.post(
        `${API_URL}/duels/${duelId}/questions/${questionOrder}/answer`,
        requestBody
      );
      return response.data;
    } catch (error) {
      console.error('Ошибка при отправке ответа:', error);
      throw error;
    }
  }

  // Получить результаты дуэли
  async getDuelResults(duelId: number, userId?: number): Promise<DuelResult> {
    try {
      const params = userId ? { userId } : {};
      const response = await axios.get(`${API_URL}/duels/${duelId}/results`, { params });
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении результатов дуэли:', error);
      throw error;
    }
  }

  // Получить детали дуэли
  async getDuelDetails(duelId: number): Promise<DuelResult> {
    try {
      const response = await axios.get(`${API_URL}/duels/${duelId}`);
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении деталей дуэли:', error);
      throw error;
    }
  }

  // Получить историю дуэлей пользователя
  async getDuelHistory(pageNumber = 0, pageSize = 10, sortBy = 'endTime', isAscending = false): Promise<any> {
    try {
      const response = await axios.get(`${API_URL}/duels/history`, {
        params: {
          pageNumber,
          pageSize,
          sortBy,
          isAscending
        },
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении истории дуэлей:', error);
      throw error;
    }
  }

  // Получить профиль пользователя
  async getUserProfile(): Promise<UserProfile> {
    try {
      const response = await axios.get(`${API_URL}/users/profile`);
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении профиля:', error);
      throw error;
    }
  }

  // Получить таблицу лидеров
  async getLeaderboard(pageNumber = 0, pageSize = 10, sortBy = 'rating', isAscending = false): Promise<any> {
    try {
      const response = await axios.get(`${API_URL}/users/leaderboard`, { 
        params: { 
          pageNumber,
          pageSize,
          sortBy,
          isAscending
        },
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении таблицы лидеров:', error);
      throw error;
    }
  }

  // Завершить все активные дуэли (только для админа)
  async completeAllDuels(): Promise<{ message: string }> {
    try {
      const response = await axios.post(`${API_URL}/duels/complete-all`, {}, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка при завершении всех дуэлей:', error);
      throw error;
    }
  }

  async getDuelStatus(duelId: number): Promise<{ status: string }> {
    try {
      const response = await fetch(`${API_URL}/duels/${duelId}/status`);
      if (!response.ok) {
        throw new Error('Не удалось получить статус дуэли');
      }
      return await response.json();
    } catch (error) {
      console.error('Ошибка при получении статуса дуэли:', error);
      throw error;
    }
  }

  // Получение категорий вопросов
  async getQuestionCategories(): Promise<string[]> {
    try {
      const response = await axios.get(`${API_URL}/questions/categories`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении категорий вопросов:', error);
      throw error;
    }
  }

  // Получение типов вопросов
  async getQuestionTypes(): Promise<string[]> {
    try {
      const response = await axios.get(`${API_URL}/questions/types`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении типов вопросов:', error);
      throw error;
    }
  }

  // Создание вопроса с текстовым вводом
  async createTextInputQuestion(questionData: {
    text: string;
    correctAnswer: string;
    category: string;
    difficulty: number;
    explanation?: string;
  }): Promise<any> {
    try {
      const response = await axios.post(
        `${API_URL}/questions/text-input`,
        questionData,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Ошибка при создании вопроса с текстовым вводом:', error);
      throw error;
    }
  }

  // Создание вопроса с множественным выбором
  async createMultipleChoiceQuestion(questionData: {
    text: string;
    options: string[];
    correctOptionIndex: number;
    category: string;
    difficulty: number;
    explanation?: string;
    correctAnswer?: string;
  }): Promise<any> {
    try {
      const response = await axios.post(
        `${API_URL}/questions/multiple-choice`,
        questionData,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Ошибка при создании вопроса с множественным выбором:', error);
      throw error;
    }
  }

  // Создание вопроса с заполнением пропусков
  async createFillBlanksQuestion(questionData: {
    text: string;
    template: string;
    blanks: string[];
    correctAnswer: string;
    category: string;
    difficulty: number;
    explanation?: string;
  }): Promise<any> {
    try {
      const response = await axios.post(
        `${API_URL}/questions/fill-blanks`,
        questionData,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Ошибка при создании вопроса с заполнением пропусков:', error);
      throw error;
    }
  }

  private getAuthHeaders() {
    try {
      const userJson = localStorage.getItem('user');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (userJson) {
        const user = JSON.parse(userJson);
        if (user.token) {
          headers['Authorization'] = `Bearer ${user.token}`;
        }
      }
      
      return headers;
    } catch (error) {
      console.error('Ошибка при получении токена:', error);
      return {
        'Content-Type': 'application/json'
      };
    }
  }
}

// Создаем синглтон-экземпляр сервиса
export const apiService = new ApiService();
export default apiService; 