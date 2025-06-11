'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiService, Duel, Question } from '@/services/apiService';
import signalRService from '@/services/signalRService';
import { useAuth } from './AuthContext';

interface DuelContextType {
  isSearching: boolean;
  activeDuel: Duel | null;
  currentQuestion: Question | null;
  currentQuestionIndex: number;
  timeLeft: number;
  startSearch: () => Promise<void>;
  cancelSearch: () => Promise<void>;
  submitAnswer: (
    answer: string | { 
      answer?: string; 
      selectedOptionIndex?: number; 
      blankValues?: string[] 
    }
  ) => Promise<void>;
  startDuel: (duelId: number) => Promise<void>;
  loading: boolean;
  error: string | null;
  questionResults: any | null;
  waitingForNextQuestion: boolean;
  resetActiveDuel: () => void;
}

const DuelContext = createContext<DuelContextType | undefined>(undefined);

export const useDuel = () => {
  const context = useContext(DuelContext);
  if (context === undefined) {
    throw new Error('useDuel must be used within a DuelProvider');
  }
  return context;
};

interface DuelProviderProps {
  children: ReactNode;
}

export const DuelProvider = ({ children }: DuelProviderProps) => {
  const { user } = useAuth();
  const router = useRouter();
  const [isSearching, setIsSearching] = useState(false);
  const [activeDuel, setActiveDuel] = useState<Duel | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15); // 15 секунд на вопрос вместо 30
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [questionResults, setQuestionResults] = useState<any | null>(null);
  const [waitingForNextQuestion, setWaitingForNextQuestion] = useState(false);

  const userId = user?.id;

  // Получить текущий вопрос
  const currentQuestion = activeDuel?.questions && activeDuel.questions.length > 0
    ? activeDuel.questions[currentQuestionIndex]
    : null;

  // Обновление таймера каждую секунду
  useEffect(() => {
    if (timeLeft > 0 && !waitingForNextQuestion) {
      const interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timeLeft, waitingForNextQuestion]);

  // Проверка активной дуэли при загрузке компонента
  useEffect(() => {
    if (userId) {
      checkActiveDuel();
    }
  }, [userId]);

  // Настройка обработчиков SignalR
  useEffect(() => {
    if (userId) {
      setupSignalRHandlers();
    }

    return () => {
      // Отключение обработчиков при размонтировании
      cleanupSignalRHandlers();
    };
  }, [userId, activeDuel]);

  // Проверка активной дуэли периодически во время поиска
  useEffect(() => {
    let checkInterval: NodeJS.Timeout | null = null;
    
    if (isSearching && userId) {
      checkInterval = setInterval(async () => {
        try {
          console.log('Периодическая проверка активной дуэли...');
          
          // Сначала проверяем через легковесный эндпоинт
          const activeDuelCheck = await apiService.checkActiveDuel(userId);
          
          if (activeDuelCheck && activeDuelCheck.hasActiveDuel) {
            // Если найдена активная дуэль, получаем полную информацию
            const duel = await apiService.getActiveDuel(userId);
            
            if (duel) {
              // Проверяем статус дуэли в базе данных
              const duelStatus = await apiService.getDuelStatus(duel.id);
              
              if (duelStatus && duelStatus.status === 'active') {
                console.log('Загружены полные данные дуэли:', duel);
                setActiveDuel(duel);
                setIsSearching(false);
                setCurrentQuestionIndex(0);
                setTimeLeft(15);
                
                // Проверяем, не находимся ли мы уже на странице дуэли
                const isDuelPage = typeof window !== 'undefined' && window.location.pathname.includes(`/duel/${duel.id}`);
                if (!isDuelPage) {
                  console.log(`Перенаправление на страницу дуэли: /duel/${duel.id}`);
                  router.push(`/duel/${duel.id}`);
                }
              } else {
                // Если дуэль завершена в базе данных, но все еще в Redis,
                // сбрасываем состояние и очищаем интервал
                setActiveDuel(null);
                setIsSearching(false);
                if (checkInterval) {
                  clearInterval(checkInterval);
                }
              }
            }
          }
        } catch (error) {
          console.error('Ошибка при периодической проверке дуэли:', error);
        }
      }, 3000); // Проверка каждые 3 секунды
    }
    
    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };
  }, [isSearching, userId, router]);

  // Настройка обработчиков SignalR
  const setupSignalRHandlers = () => {
    if (!userId) return;

    // Инициализация SignalR если ещё не инициализирован
    const initSignalRIfNeeded = async () => {
      try {
        await signalRService.init(userId);
      } catch (error) {
        console.error('Ошибка при инициализации SignalR:', error);
      }
    };
    
    initSignalRIfNeeded();

    // Обработчик создания дуэли
    signalRService.on('DuelCreated', handleDuelCreated);
    
    // Обработчик начала поиска
    signalRService.on('SearchStarted', handleSearchStarted);
    
    // Обработчик отмены поиска
    signalRService.on('SearchCancelled', handleSearchCancelled);
    
    // Обработчик истечения времени поиска
    signalRService.on('SearchTimedOut', handleSearchTimedOut);
    
    // Обработчик ненахождения оппонента
    signalRService.on('OpponentNotFound', handleOpponentNotFound);
    
    // Обработчик начала дуэли
    signalRService.on('DuelStarted', handleDuelStarted);
    
    // Обработчик принятия ответа
    signalRService.on('AnswerSubmitted', handleAnswerSubmitted);
    
    // Обработчик отправки обоих ответов
    signalRService.on('BothAnswersSubmitted', handleBothAnswersSubmitted);
    
    // Обработчик истечения времени на вопрос
    signalRService.on('QuestionTimeEnded', handleQuestionTimeEnded);
    
    // Обработчик результатов вопроса
    signalRService.on('QuestionResults', handleQuestionResults);
    
    // Обработчик перехода к следующему вопросу
    signalRService.on('NextQuestion', handleNextQuestion);
    
    // Обработчик завершения дуэли
    signalRService.on('DuelCompleted', handleDuelCompleted);
    
    // Обработчик ошибок
    signalRService.on('ErrorOccurred', handleError);
  };

  // Очистка обработчиков SignalR
  const cleanupSignalRHandlers = () => {
    signalRService.off('DuelCreated', handleDuelCreated);
    signalRService.off('SearchStarted', handleSearchStarted);
    signalRService.off('SearchCancelled', handleSearchCancelled);
    signalRService.off('SearchTimedOut', handleSearchTimedOut);
    signalRService.off('OpponentNotFound', handleOpponentNotFound);
    signalRService.off('DuelStarted', handleDuelStarted);
    signalRService.off('AnswerSubmitted', handleAnswerSubmitted);
    signalRService.off('BothAnswersSubmitted', handleBothAnswersSubmitted);
    signalRService.off('QuestionTimeEnded', handleQuestionTimeEnded);
    signalRService.off('QuestionResults', handleQuestionResults);
    signalRService.off('NextQuestion', handleNextQuestion);
    signalRService.off('DuelCompleted', handleDuelCompleted);
    signalRService.off('ErrorOccurred', handleError);
  };

  // Проверка наличия активной дуэли
  const checkActiveDuel = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      
      // Сначала используем легковесный метод для проверки наличия активной дуэли
      const activeDuelCheck = await apiService.checkActiveDuel(userId);
      
      if (activeDuelCheck && activeDuelCheck.hasActiveDuel) {
        // Если есть активная дуэль, загружаем полные данные
        const duel = await apiService.getActiveDuel(userId);
        
        if (duel) {
          setActiveDuel(duel);
          // Находим индекс первого неотвеченного вопроса
          const firstUnansweredIndex = duel.questions.findIndex(q => {
            if (duel.firstUserId === userId) {
              return q.firstUserAnswer === null || q.firstUserAnswer === undefined;
            } else {
              return q.secondUserAnswer === null || q.secondUserAnswer === undefined;
            }
          });
          
          setCurrentQuestionIndex(firstUnansweredIndex >= 0 ? firstUnansweredIndex : 0);
          setTimeLeft(15); // Сбрасываем таймер на 15 секунд
        }
      } else {
        // Если дуэль не найдена, сбрасываем состояние
        setActiveDuel(null);
        setError(null);
      }
    } catch (error: any) {
      // Проверяем, является ли ошибка 404
      if (error?.response?.status === 404) {
        setActiveDuel(null);
        setError(null);
      } else {
        setError('Ошибка при проверке активной дуэли');
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Обработчики событий SignalR
  const handleDuelCreated = async (duelId: number) => {
    console.log(`Получено событие DuelCreated для дуэли: ${duelId}`);
    setIsSearching(false);
    try {
      setLoading(true);
      console.log('Ожидаем 1 секунду перед запросом данных для синхронизации с сервером...');
      
      // Добавляем задержку в 1 секунду перед запросом данных
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Сначала проверяем наличие дуэли с помощью легковесного метода
      console.log(`Проверяем наличие дуэли ${duelId} для пользователя ${userId} через легковесный эндпоинт`);
      const activeDuelCheck = await apiService.checkActiveDuel(userId!);
      
      if (activeDuelCheck && activeDuelCheck.hasActiveDuel) {
        console.log(`Запрашиваем полную информацию о дуэли ${duelId} для пользователя ${userId}`);
        const duel = await apiService.getActiveDuel(userId!);
        console.log('Полученные данные о дуэли:', duel);
        
        if (duel) {
          setActiveDuel(duel);
          setCurrentQuestionIndex(0);
          setTimeLeft(15);
          
          // Перенаправление на страницу дуэли
          const isDuelPage = typeof window !== 'undefined' && window.location.pathname.includes(`/duel/${duel.id}`);
          if (!isDuelPage) {
            console.log(`Перенаправление на страницу дуэли: /duel/${duel.id}`);
            router.push(`/duel/${duel.id}`);
          }
        }
      }
    } catch (error) {
      console.error('Ошибка при получении данных о дуэли:', error);
      setError('Ошибка при получении данных о дуэли');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchStarted = (searchUserId: number) => {
    if (userId === searchUserId) {
      setIsSearching(true);
    }
  };

  const handleSearchCancelled = (searchUserId: number) => {
    if (userId === searchUserId) {
      setIsSearching(false);
    }
  };

  const handleSearchTimedOut = (searchUserId: number) => {
    if (userId === searchUserId) {
      setIsSearching(false);
      setError('Время поиска оппонента истекло. Попробуйте снова.');
    }
  };
  
  const handleOpponentNotFound = () => {
    setIsSearching(false);
    setError('Оппонент не найден. Попробуйте снова.');
  };
  
  const handleDuelStarted = (duelId: number, questionIndex: number) => {
    console.log(`Получено событие DuelStarted: Дуэль ${duelId}, вопрос ${questionIndex}`);
    setCurrentQuestionIndex(questionIndex);
    setTimeLeft(15);
    setWaitingForNextQuestion(false);
    setQuestionResults(null);
    
    // Проверяем, есть ли у нас уже данные об этой дуэли
    const needToFetchDuel = !activeDuel || activeDuel.id !== duelId;
    
    if (needToFetchDuel) {
      console.log(`Необходимо загрузить данные о дуэли ${duelId} (текущая дуэль: ${activeDuel?.id || 'нет'})`);
      checkActiveDuel();
      
      // Проверяем, находимся ли мы на странице дуэли
      const isDuelPage = typeof window !== 'undefined' && window.location.pathname.includes(`/duel/${duelId}`);
      if (!isDuelPage) {
        console.log(`Перенаправление на страницу дуэли: /duel/${duelId}`);
        router.push(`/duel/${duelId}`);
      }
    }
  };

  const handleAnswerSubmitted = (duelId: number, answer: string) => {
    console.log('Ответ принят сервером');
  };

  const handleBothAnswersSubmitted = (duelId: number, firstAnswer: string, secondAnswer: string) => {
    setWaitingForNextQuestion(true);
  };

  const handleQuestionTimeEnded = (duelId: number, questionIndex: number) => {
    setTimeLeft(0);
    setWaitingForNextQuestion(true);
  };

  const handleQuestionResults = (duelId: number, questionIndex: number, results: any) => {
    setQuestionResults(results);
    setWaitingForNextQuestion(true);
  };

  const handleNextQuestion = (duelId: number, nextQuestionIndex: number) => {
    setCurrentQuestionIndex(nextQuestionIndex);
    setTimeLeft(15);
    setWaitingForNextQuestion(false);
    setQuestionResults(null);
  };

  const handleDuelCompleted = (duelId: number) => {
    if (activeDuel && activeDuel.id) {
      router.push(`/duel/${activeDuel.id}/results`);
      setTimeout(() => {
        resetActiveDuel();
      }, 500);
    }
  };

  const handleError = (error: string) => {
    setError(error);
  };

  const startSearch = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      await signalRService.startSearchingOpponent(userId);
      setIsSearching(true);
    } catch (error) {
      console.error('Ошибка при начале поиска:', error);
      setError('Не удалось начать поиск. Попробуйте снова.');
      setIsSearching(false);
    } finally {
      setLoading(false);
    }
  };

  const cancelSearch = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      await signalRService.cancelSearchingOpponent(userId);
      setIsSearching(false);
    } catch (error) {
      console.error('Ошибка при отмене поиска:', error);
      setError('Не удалось отменить поиск.');
      setIsSearching(false);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (
    answer: string | { 
      answer?: string; 
      selectedOptionIndex?: number; 
      blankValues?: string[] 
    }
  ) => {
    if (!userId || !activeDuel || !currentQuestion) return;
    
    try {
      setLoading(true);
      setError(null);
      
      let formattedAnswer: string;
      
      // Обработка разных типов вопросов
      if (typeof answer === 'string') {
        // Если строка, то это либо прямой текстовый ответ, либо уже текст выбранного варианта
        formattedAnswer = answer;
      } else {
        // Форматируем ответ в зависимости от типа вопроса
        switch (currentQuestion.questionType) {
          case 'MultipleChoice':
            // Для MultipleChoice мы уже отправляем текст варианта напрямую, поэтому эта ветка 
            // скорее всего не будет использоваться, но оставим для совместимости
            if (answer.selectedOptionIndex !== undefined && currentQuestion.options) {
              const selectedOption = currentQuestion.options[answer.selectedOptionIndex];
              formattedAnswer = selectedOption || '';
            } else {
              formattedAnswer = answer.answer || '';
            }
            break;
          case 'FillBlanks':
            if (answer.blankValues && answer.blankValues.length > 0) {
              formattedAnswer = answer.blankValues.join(';');
            } else {
              formattedAnswer = answer.answer || '';
            }
            break;
          default:
            formattedAnswer = answer.answer || '';
        }
      }
      
      await signalRService.submitAnswer(
        activeDuel.id,
        currentQuestionIndex,
        userId,
        formattedAnswer
      );
    } catch (error) {
      console.error('Ошибка при отправке ответа:', error);
      setError('Не удалось отправить ответ. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  const startDuel = async (duelId: number) => {
    try {
      setLoading(true);
      setError(null);
      await signalRService.startDuel(duelId);
    } catch (error) {
      console.error('Ошибка при начале дуэли:', error);
      setError('Не удалось начать дуэль. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  const resetActiveDuel = () => {
    setActiveDuel(null);
    setCurrentQuestionIndex(0);
    setTimeLeft(15);
    setError(null);
    setQuestionResults(null);
    setWaitingForNextQuestion(false);
  };

  return (
    <DuelContext.Provider
      value={{
        isSearching,
        activeDuel,
        currentQuestion,
        currentQuestionIndex,
        timeLeft,
        startSearch,
        cancelSearch,
        submitAnswer,
        startDuel,
        loading,
        error,
        questionResults,
        waitingForNextQuestion,
        resetActiveDuel
      }}
    >
      {children}
    </DuelContext.Provider>
  );
};