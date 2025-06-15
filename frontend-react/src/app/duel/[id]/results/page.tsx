'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { apiService, DuelResult, Question } from '@/services/apiService';
import { useDuel } from '@/contexts/DuelContext';
import React from 'react';

export default function DuelResultsPage() {
  const params = useParams();
  const router = useRouter();
  const duelId = Number(params.id);
  const { user } = useAuth();
  const { resetActiveDuel } = useDuel();
  
  const [duelResult, setDuelResult] = useState<DuelResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загружаем результаты дуэли
  useEffect(() => {
    const loadDuelResults = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const result = await apiService.getDuelResults(duelId, user.id);
        setDuelResult(result);
      } catch (err) {
        console.error('Ошибка при загрузке результатов дуэли:', err);
        setError('Не удалось загрузить результаты дуэли');
      } finally {
        setLoading(false);
      }
    };

    loadDuelResults();
  }, [duelId, user]);

  // Проверяем, является ли пользователь победителем или была ничья
  const getUserResult = () => {
    if (!duelResult || !user) return null;
    
    if (duelResult.isDraw) {
      return 'draw';
    }
    
    return duelResult.winnerId === user.id ? 'win' : 'lose';
  };

  const userResult = getUserResult();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h1 className="text-xl">Загрузка результатов дуэли...</h1>
        </div>
      </div>
    );
  }

  if (error || !duelResult) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
            <p>{error || 'Произошла ошибка при загрузке результатов дуэли'}</p>
          </div>
          <button 
            onClick={() => {
              resetActiveDuel();
              router.push('/');
            }}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Заголовок и итоги дуэли */}
          <div className={`text-center p-8 rounded-t-lg shadow-lg border-b-4 ${
            userResult === 'win' 
              ? 'bg-green-50 border-green-500' 
              : userResult === 'lose'
                ? 'bg-red-50 border-red-500'
                : 'bg-yellow-50 border-yellow-500'
          }`}>
            <h1 className="text-3xl font-bold mb-2 text-gray-900">
              {userResult === 'win' 
                ? 'Поздравляем! Вы победили!' 
                : userResult === 'lose'
                  ? 'К сожалению, вы проиграли'
                  : 'Ничья!'}
            </h1>
            <p className="text-lg mb-6 text-gray-800">
              Дуэль #{duelId} завершена
            </p>

            <div className="flex justify-center items-center space-x-12">
              <div className="text-center">
                <p className="text-lg font-medium text-gray-800">
                  {user?.id && user.id === duelResult.firstUserId ? 'Вы' : (duelResult.firstUser?.username || 'Игрок 1')}
                </p>
                <p className={`text-4xl font-bold ${duelResult.firstUserCorrectAnswers > duelResult.secondUserCorrectAnswers ? 'text-green-600' : 'text-gray-900'}`}>
                  {duelResult.firstUserCorrectAnswers}
                </p>
              </div>
              
              <div className="text-xl font-semibold text-gray-900">vs</div>
              
              <div className="text-center">
                <p className="text-lg font-medium text-gray-800">
                  {user?.id && user.id === duelResult.secondUserId ? 'Вы' : (duelResult.secondUser?.username || 'Игрок 2')}
                </p>
                <p className={`text-4xl font-bold ${duelResult.secondUserCorrectAnswers > duelResult.firstUserCorrectAnswers ? 'text-green-600' : 'text-gray-900'}`}>
                  {duelResult.secondUserCorrectAnswers}
                </p>
              </div>
            </div>
          </div>

          {/* Результаты вопросов */}
          <div className="bg-white rounded-b-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Результаты по вопросам</h2>
            
            <div className="space-y-8">
              {duelResult.questions.map((question, index) => {
                // Определяем, является ли текущий пользователь первым игроком
                const isUserFirst = user?.id ? user.id === duelResult.firstUserId : false;
                
                // Определяем ответы и их правильность в зависимости от того, кто текущий пользователь
                const userAnswer = isUserFirst ? question.firstUserAnswer : question.secondUserAnswer;
                const isUserCorrect = isUserFirst ? question.isFirstUserAnswerCorrect : question.isSecondUserAnswerCorrect;
                const opponentAnswer = isUserFirst ? question.secondUserAnswer : question.firstUserAnswer;
                const isOpponentCorrect = isUserFirst ? question.isSecondUserAnswerCorrect : question.isFirstUserAnswerCorrect;
                
                return (
                  <div key={question.id} className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 p-4 border-b">
                      <h3 className="font-bold text-gray-900">Вопрос {index + 1}</h3>
                    </div>
                    
                    <div className="p-4">
                      <p className="text-lg font-medium mb-4 text-gray-900">{question.text}</p>
                      
                      {/* Отображение дополнительной информации в зависимости от типа вопроса */}
                      {question.questionType === 'MultipleChoice' && question.options && (
                        <div className="mb-4 p-3 bg-gray-50 rounded">
                          <p className="font-semibold mb-2 text-gray-900">Варианты ответов:</p>
                          <ul className="list-disc pl-5 text-gray-800">
                            {question.options.map((option, optIndex) => (
                              <li 
                                key={optIndex} 
                                className={question.correctOptionIndex === optIndex ? 'font-bold text-green-600' : 'text-gray-800'}
                              >
                                {option} {question.correctOptionIndex === optIndex && '✓'}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {question.questionType === 'FillBlanks' && question.template && (
                        <div className="mb-4 p-3 bg-gray-50 rounded">
                          <p className="font-semibold mb-2 text-gray-900">Шаблон с пропусками:</p>
                          <pre className="block p-2 bg-gray-100 rounded font-mono text-gray-800 overflow-x-auto whitespace-pre-wrap">
                            {question.template && question.template.split('\n').map((line, lineIndex) => {
                              // Заменяем пропуски на выделенные блоки
                              const parts = line.split('__');
                              return (
                                <div key={lineIndex} className="whitespace-pre">
                                  {parts.map((part, partIndex) => (
                                    <React.Fragment key={`part-${lineIndex}-${partIndex}`}>
                                      {part}
                                      {partIndex < parts.length - 1 && (
                                        <span className="bg-blue-100 px-1 py-0.5 rounded mx-1 text-blue-800 inline-block">
                                          {question.blanks?.[partIndex] || '...'}
                                        </span>
                                      )}
                                    </React.Fragment>
                                  ))}
                                </div>
                              );
                            })}
                          </pre>
                          {question.blanks && question.blanks.length > 0 && (
                            <div className="mt-2">
                              <p className="font-semibold mb-1 text-gray-900">Значения для заполнения:</p>
                              <ul className="list-disc pl-5 text-gray-800">
                                {question.blanks.map((blank, blankIndex) => (
                                  <li key={blankIndex}>{blank}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                          <p className="font-semibold mb-2 text-gray-900">Ваш ответ:</p>
                          <div className={`p-3 rounded ${
                            isUserCorrect 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {question.questionType === 'FillBlanks' && userAnswer ? (
                              <div className="space-y-1">
                                {userAnswer.split(';').map((value, idx) => (
                                  <div key={idx} className="flex items-start">
                                    <span className="font-medium mr-2 whitespace-nowrap">Пропуск {idx + 1}: </span>
                                    <span className="break-all">{value || '-'}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              userAnswer || 'Нет ответа'
                            )}
                            {isUserCorrect && (
                              <span className="ml-2">✓</span>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <p className="font-semibold mb-2 text-gray-900">Ответ оппонента:</p>
                          <div className={`p-3 rounded ${
                            isOpponentCorrect 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {question.questionType === 'FillBlanks' && opponentAnswer ? (
                              <div className="space-y-1">
                                {opponentAnswer.split(';').map((value, idx) => (
                                  <div key={idx} className="flex items-start">
                                    <span className="font-medium mr-2 whitespace-nowrap">Пропуск {idx + 1}: </span>
                                    <span className="break-all">{value || '-'}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              opponentAnswer || 'Нет ответа'
                            )}
                            {isOpponentCorrect && (
                              <span className="ml-2">✓</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-8 text-center">
              <button 
                onClick={() => {
                  resetActiveDuel();
                  router.push('/');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg"
              >
                Вернуться на главную
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 