'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useDuel } from '@/contexts/DuelContext';
import { useAuth } from '@/contexts/AuthContext';
import QuestionContainer from '@/components/questions/QuestionContainer';

export default function DuelPage() {
  const params = useParams();
  const router = useRouter();
  const duelId = Number(params.id);
  const { user } = useAuth();
  const { 
    activeDuel, 
    currentQuestion,
    currentQuestionIndex,
    timeLeft,
    submitAnswer,
    startDuel,
    loading,
    error,
    questionResults,
    waitingForNextQuestion
  } = useDuel();
  
  const [submitted, setSubmitted] = useState(false);
  const [duelStarted, setDuelStarted] = useState(false);
  
  // Запускаем дуэль при загрузке страницы
  useEffect(() => {
    const initDuel = async () => {
      if (activeDuel && activeDuel.id === duelId && !duelStarted) {
        try {
          console.log(`Инициализация дуэли ${duelId}...`);
          setDuelStarted(true);
          await startDuel(duelId);
          console.log(`Дуэль ${duelId} успешно инициализирована`);
        } catch (error) {
          console.error(`Ошибка при инициализации дуэли ${duelId}:`, error);
          // Устанавливаем флаг в false, чтобы можно было повторить попытку
          setDuelStarted(false);
        }
      }
    };
    
    // Добавляем небольшую задержку, чтобы избежать гонки условий
    const timer = setTimeout(() => {
      initDuel();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [activeDuel, duelId, duelStarted, startDuel]);
  
  // Проверка, соответствует ли URL текущей дуэли
  useEffect(() => {
    if (activeDuel && activeDuel.id !== duelId) {
      router.push(`/duel/${activeDuel.id}`);
    }
  }, [activeDuel, duelId, router]);
  
  // Если дуэль закончилась, перенаправляем на страницу результатов
  useEffect(() => {
    if (activeDuel && currentQuestionIndex >= (activeDuel.questions?.length || 0)) {
      router.push(`/duel/${duelId}/results`);
    }
  }, [activeDuel, currentQuestionIndex, duelId, router]);

  // Сброс состояния при смене вопроса
  useEffect(() => {
    setSubmitted(false);
  }, [currentQuestionIndex]);

  // Проверяем, ответил ли уже пользователь на текущий вопрос
  useEffect(() => {
    if (currentQuestion && user) {
      const userIsFirst = activeDuel?.firstUserId === user.id;
      const hasAnswered = userIsFirst 
        ? currentQuestion.firstUserSubmitted
        : currentQuestion.secondUserSubmitted;
        
      if (hasAnswered) {
        setSubmitted(true);
      }
    }
  }, [currentQuestion, user, activeDuel]);

  // Вычисляем прогресс (текущий вопрос / всего вопросов)
  const progressPercentage = activeDuel && activeDuel.questions && activeDuel.questions.length > 0
    ? ((currentQuestionIndex + 1) / activeDuel.questions.length) * 100
    : 0;

  if (!activeDuel || !currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h1 className="text-xl">Загрузка дуэли...</h1>
          {error && <p className="text-red-500 mt-4">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="max-w-7xl mx-auto py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Хедер дуэли */}
            <div className="bg-blue-600 text-white p-3 sm:p-4 md:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-center">
                <h1 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-0">Дуэль #{duelId}</h1>
                <div className="text-base sm:text-lg md:text-xl font-semibold">
                  Вопрос {currentQuestionIndex + 1} из {activeDuel.questions.length}
                </div>
              </div>
              
              {/* Индикатор прогресса */}
              <div className="w-full bg-blue-300 rounded-full h-2 sm:h-2.5 mt-3 sm:mt-4">
                <div 
                  className="bg-blue-100 h-2 sm:h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
            
            {/* Таймер */}
            <div className="p-3 sm:p-4 bg-gray-50 border-b flex justify-center">
              <div className={`text-xl sm:text-2xl font-bold ${timeLeft <= 5 ? 'text-red-500' : 'text-gray-700'}`}>
                {timeLeft} секунд
              </div>
            </div>
            
            {/* Контент вопроса */}
            <div className="p-3 sm:p-4 md:p-6">
              {!waitingForNextQuestion ? (
                <>
                  {currentQuestion && (
                    <QuestionContainer
                      question={currentQuestion}
                      onSubmitAnswer={submitAnswer}
                      submitted={submitted}
                      loading={loading}
                      timeLeft={timeLeft}
                    />
                  )}
                  
                  {error && (
                    <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-100 border-l-4 border-red-500 text-red-700 text-sm sm:text-base">
                      {error}
                    </div>
                  )}
                </>
              ) : questionResults ? (
                <div className="bg-gray-50 p-3 sm:p-4 md:p-6 rounded-lg mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900">Результаты вопроса:</h2>
                  
                  <div className="bg-white p-3 sm:p-4 rounded border mb-3 sm:mb-4">
                    <p className="text-base sm:text-lg font-medium mb-1 sm:mb-2 text-gray-900">Вопрос:</p>
                    <p className="text-sm sm:text-base text-gray-800">{questionResults.questionText}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className={`p-3 sm:p-4 rounded ${questionResults.isFirstUserCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                      <p className="font-medium text-gray-900 text-sm sm:text-base">{user?.id === activeDuel.firstUserId ? 'Ваш ответ:' : 'Ответ соперника:'}</p>
                      <p className="text-base sm:text-lg text-gray-800">{questionResults.firstUserAnswer || 'Нет ответа'}</p>
                      {questionResults.isFirstUserCorrect && <span className="text-green-600 font-bold text-sm sm:text-base">✓ Верно</span>}
                    </div>
                    
                    <div className={`p-3 sm:p-4 rounded ${questionResults.isSecondUserCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                      <p className="font-medium text-gray-900 text-sm sm:text-base">{user?.id === activeDuel.secondUserId ? 'Ваш ответ:' : 'Ответ соперника:'}</p>
                      <p className="text-base sm:text-lg text-gray-800">{questionResults.secondUserAnswer || 'Нет ответа'}</p>
                      {questionResults.isSecondUserCorrect && <span className="text-green-600 font-bold text-sm sm:text-base">✓ Верно</span>}
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-3 sm:p-4 rounded">
                    <p className="font-medium mb-1 sm:mb-2 text-gray-900 text-sm sm:text-base">Правильный ответ:</p>
                    <p className="text-base sm:text-lg text-blue-800 font-medium">{questionResults.correctAnswer}</p>
                  </div>
                  
                  <div className="mt-3 sm:mt-4 text-center text-gray-800 text-sm sm:text-base">
                    <p>Ожидание следующего вопроса...</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-4 sm:p-8">
                  <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-t-2 border-b-2 border-blue-500 mb-3 sm:mb-4"></div>
                  <p className="text-base sm:text-lg">Обработка ответов...</p>
                </div>
              )}
            </div>
            
            {/* Счет дуэли */}
            <div className="bg-gray-50 p-3 sm:p-4 md:p-6 border-t">
              <h3 className="font-bold mb-2 text-center text-gray-900 text-sm sm:text-base">Текущий счет:</h3>
              <div className="flex justify-center space-x-8 sm:space-x-12">
                <div className="text-center">
                  <div className="font-medium text-gray-800 text-sm sm:text-base">Вы</div>
                  <div className="text-lg sm:text-xl font-bold text-gray-900">
                    {user?.id === activeDuel.firstUserId 
                      ? activeDuel.firstUserCorrectAnswers 
                      : activeDuel.secondUserCorrectAnswers}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-800 text-sm sm:text-base">Оппонент</div>
                  <div className="text-lg sm:text-xl font-bold text-gray-900">
                    {user?.id === activeDuel.firstUserId 
                      ? activeDuel.secondUserCorrectAnswers 
                      : activeDuel.firstUserCorrectAnswers}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 