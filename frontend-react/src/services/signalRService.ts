import * as signalR from '@microsoft/signalr';

class SignalRService {
  private hubConnection: signalR.HubConnection | null = null;
  private callbacks: Record<string, Array<(...args: any[]) => void>> = {};

  // Инициализация соединения с хабом
  async init(userId: number): Promise<void> {
    try {
      // Если соединение уже существует, не создаем новое
      if (this.hubConnection) {
        console.log('SignalR соединение уже существует, не создаем новое');
        return;
      }

      console.log(`Инициализация SignalR соединения для пользователя ${userId}...`);
      
      // Создаем подключение к хабу
      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl('/hubs/duel')
        .withAutomaticReconnect()
        .build();

      // Настраиваем логирование событий
      this.hubConnection.onreconnecting((error) => {
        console.log('SignalR пытается переподключиться...', error);
      });
      
      this.hubConnection.onreconnected((connectionId) => {
        console.log('SignalR переподключен с ID:', connectionId);
        // Повторно регистрируем пользователя после переподключения
        this.hubConnection?.invoke('RegisterConnection', userId)
          .then(() => console.log(`Пользователь ${userId} повторно зарегистрирован после переподключения`))
          .catch(err => console.error('Ошибка при повторной регистрации:', err));
      });
      
      this.hubConnection.onclose((error) => {
        console.log('SignalR соединение закрыто', error);
      });

      // Стартуем соединение
      await this.hubConnection.start();
      console.log('SignalR соединение установлено');

      // Добавляем общие обработчики
      this.setupCommonHandlers();

      // Регистрируем соединение пользователя
      await this.hubConnection.invoke('RegisterConnection', userId);
      console.log(`Пользователь ${userId} зарегистрирован`);

    } catch (error) {
      console.error('Ошибка подключения к SignalR:', error);
      throw error;
    }
  }

  // Настройка общих обработчиков для всех клиентов
  private setupCommonHandlers(): void {
    if (!this.hubConnection) {
      console.error('Ошибка: hubConnection не инициализирован при настройке обработчиков');
      return;
    }

    console.log('Настройка обработчиков SignalR...');

    // Обработчик ошибок
    this.hubConnection.on('ErrorOccurred', (message: string) => {
      console.error('SignalR ошибка:', message);
      // Вызываем все callback-функции для этого события
      this.executeCallbacks('ErrorOccurred', message);
    });

    // Регистрация соединения
    this.hubConnection.on('ConnectionRegistered', (userId: number) => {
      console.log(`Соединение для пользователя ${userId} зарегистрировано`);
      this.executeCallbacks('ConnectionRegistered', userId);
    });

    // Обработчик создания дуэли
    this.hubConnection.on('DuelCreated', (duelId: number) => {
      console.log(`=== SignalR: Создана дуэль с ID: ${duelId} ===`);
      console.log(`Зарегистрированные обработчики для события DuelCreated: ${this.callbacks['DuelCreated']?.length || 0}`);
      
      // Выводим подробную информацию о состоянии обработчиков
      if (this.callbacks['DuelCreated'] && this.callbacks['DuelCreated'].length > 0) {
        console.log('Обработчики DuelCreated:', this.callbacks['DuelCreated']);
      } else {
        console.warn('Нет зарегистрированных обработчиков для события DuelCreated');
      }
      
      this.executeCallbacks('DuelCreated', duelId);
    });

    // Начало поиска оппонента
    this.hubConnection.on('SearchStarted', (userId: number) => {
      console.log(`Начат поиск оппонента для пользователя ${userId}`);
      this.executeCallbacks('SearchStarted', userId);
    });

    // Поиск отменен
    this.hubConnection.on('SearchCancelled', (userId: number) => {
      console.log(`Поиск оппонента для пользователя ${userId} отменен`);
      this.executeCallbacks('SearchCancelled', userId);
    });

    // Истекло время поиска
    this.hubConnection.on('SearchTimedOut', (userId: number) => {
      console.log(`Истекло время поиска для пользователя ${userId}`);
      this.executeCallbacks('SearchTimedOut', userId);
    });

    // Оппонент не найден
    this.hubConnection.on('OpponentNotFound', () => {
      console.log('Оппонент не найден');
      this.executeCallbacks('OpponentNotFound');
    });

    // Начало дуэли
    this.hubConnection.on('DuelStarted', (duelId: number, questionIndex: number) => {
      console.log(`Дуэль ${duelId} начата с вопроса ${questionIndex}`);
      this.executeCallbacks('DuelStarted', duelId, questionIndex);
    });

    // Ответ принят
    this.hubConnection.on('AnswerSubmitted', (duelId: number, questionOrder: number) => {
      console.log(`Ответ на вопрос ${questionOrder} дуэли ${duelId} принят`);
      this.executeCallbacks('AnswerSubmitted', duelId, questionOrder);
    });

    // Оба игрока ответили
    this.hubConnection.on('BothAnswersSubmitted', (duelId: number, questionOrder: number) => {
      console.log(`Оба игрока ответили на вопрос ${questionOrder} дуэли ${duelId}`);
      this.executeCallbacks('BothAnswersSubmitted', duelId, questionOrder);
    });

    // Время для ответа на вопрос истекло
    this.hubConnection.on('QuestionTimeEnded', (duelId: number, questionOrder: number) => {
      console.log(`Время ответа на вопрос ${questionOrder} дуэли ${duelId} истекло`);
      this.executeCallbacks('QuestionTimeEnded', duelId, questionOrder);
    });

    // Результаты ответов на вопрос
    this.hubConnection.on('QuestionResults', (duelId: number, questionOrder: number, results: any) => {
      console.log(`Получены результаты для вопроса ${questionOrder} дуэли ${duelId}:`, results);
      this.executeCallbacks('QuestionResults', duelId, questionOrder, results);
    });

    // Следующий вопрос
    this.hubConnection.on('NextQuestion', (duelId: number, questionOrder: number) => {
      console.log(`Переход к вопросу ${questionOrder} дуэли ${duelId}`);
      this.executeCallbacks('NextQuestion', duelId, questionOrder);
    });

    // Дуэль завершена
    this.hubConnection.on('DuelCompleted', (results: any) => {
      console.log('Дуэль завершена:', results);
      this.executeCallbacks('DuelCompleted', results);
    });
  }

  // Начать поиск оппонента
  async startSearchingOpponent(userId: number): Promise<void> {
    if (!this.hubConnection) {
      throw new Error('SignalR соединение не установлено');
    }
    
    await this.hubConnection.invoke('StartSearchingOpponent', userId);
  }

  // Отменить поиск оппонента
  async cancelSearchingOpponent(userId: number): Promise<void> {
    if (!this.hubConnection) {
      throw new Error('SignalR соединение не установлено');
    }
    
    await this.hubConnection.invoke('CancelSearchingOpponent', userId);
  }

  // Отправить ответ на вопрос
  async submitAnswer(duelId: number, questionOrder: number, userId: number, answer: string): Promise<void> {
    if (!this.hubConnection) {
      throw new Error('SignalR соединение не установлено');
    }
    
    await this.hubConnection.invoke('SubmitAnswer', duelId, questionOrder, userId, answer);
  }

  // Начать дуэль
  async startDuel(duelId: number): Promise<void> {
    if (!this.hubConnection) {
      throw new Error('SignalR соединение не установлено');
    }
    
    await this.hubConnection.invoke('StartDuel', duelId);
  }

  // Проверить статус поиска
  async checkSearchStatus(userId: number): Promise<void> {
    if (!this.hubConnection) {
      throw new Error('SignalR соединение не установлено');
    }
    
    await this.hubConnection.invoke('CheckSearchStatus', userId);
  }

  // Регистрация обработчика события
  on(eventName: string, callback: (...args: any[]) => void): void {
    if (!this.callbacks[eventName]) {
      this.callbacks[eventName] = [];
    }
    this.callbacks[eventName].push(callback);
  }

  // Отмена регистрации обработчика
  off(eventName: string, callback: (...args: any[]) => void): void {
    if (this.callbacks[eventName]) {
      this.callbacks[eventName] = this.callbacks[eventName].filter(cb => cb !== callback);
    }
  }

  // Выполнение всех зарегистрированных обработчиков для события
  private executeCallbacks(eventName: string, ...args: any[]): void {
    if (this.callbacks[eventName]) {
      this.callbacks[eventName].forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Ошибка в обработчике для ${eventName}:`, error);
        }
      });
    }
  }

  // Закрытие соединения
  async stop(): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.stop();
      this.hubConnection = null;
      console.log('SignalR соединение закрыто');
    }
  }
}

// Создаем синглтон-экземпляр сервиса
export const signalRService = new SignalRService();
export default signalRService; 