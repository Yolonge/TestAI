'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useDuel } from '@/contexts/DuelContext';

export default function HomePage() {
  const { user } = useAuth();
  const { isSearching, startSearch, cancelSearch, activeDuel, loading, error } = useDuel();
  const router = useRouter();
  const filterRef = useRef<HTMLDivElement>(null);

  // Обработчик движения курсора для эффекта подсветки
  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (filterRef.current) {
        // Проверяем, находится ли курсор над навбаром
        const navbarElements = document.querySelectorAll('.navbar');
        let isOverNavbar = false;
        
        for (const navbarElement of navbarElements) {
          const rect = navbarElement.getBoundingClientRect();
          if (
            event.clientX >= rect.left &&
            event.clientX <= rect.right &&
            event.clientY >= rect.top &&
            event.clientY <= rect.bottom
          ) {
            isOverNavbar = true;
            break;
          }
        }
        
        // Если курсор над навбаром, скрываем фильтр
        if (isOverNavbar) {
          filterRef.current.style.opacity = '0';
        } else {
          // В противном случае показываем и обновляем позицию
          filterRef.current.style.opacity = '1';
          
          // Плавное движение для фильтра
          const rect = document.body.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;
          
          requestAnimationFrame(() => {
            if (filterRef.current) {
              filterRef.current.style.left = `${x}px`;
              filterRef.current.style.top = `${y}px`;
            }
          });
        }
      }
    };

    document.addEventListener('pointermove', handlePointerMove);
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
    };
  }, []);

  // Проверяем, есть ли активная дуэль для перенаправления
  useEffect(() => {
    if (activeDuel) {
      router.push(`/duel/${activeDuel.id}`);
    }
  }, [activeDuel, router]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Добро пожаловать в дуэли программистов!
          </h1>
          <p className="mt-4 text-xl text-gray-500">
            Соревнуйтесь с другими разработчиками в режиме реального времени.
          </p>
          <div className="mt-8">
            <p>Пожалуйста, войдите или зарегистрируйтесь, чтобы начать!</p>
          </div>
        </div>
        <div ref={filterRef} className="filter"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h1 className="text-xl">Загрузка...</h1>
        </div>
        <div ref={filterRef} className="filter"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8">
          <div className="card max-w-xl mx-auto text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">
              Готовы к дуэли?
            </h1>
            
            <p className="text-gray-300 mb-6 sm:mb-8 text-sm sm:text-base">
              Нажмите кнопку ниже, чтобы найти оппонента и начать дуэль. Вам будет предложено
              ответить на 5 вопросов по программированию. Победитель определяется по количеству
              правильных ответов.
            </p>
            
            {error && (
              <div className="mb-6 p-3 sm:p-4 bg-red-900/50 border-l-4 border-red-500 text-red-200 text-sm sm:text-base">
                <p>{error}</p>
              </div>
            )}
            
            <div className="flex justify-center">
              {isSearching ? (
                <div className="text-center">
                  <div className="flex justify-center items-center mb-3 sm:mb-4">
                    <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                  <p className="text-base sm:text-lg text-gray-300 mb-3 sm:mb-4">Ищем оппонента для вас...</p>
                  <button
                    onClick={cancelSearch}
                    disabled={loading}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 sm:py-3 sm:px-6 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 text-sm sm:text-base"
                  >
                    Отменить поиск
                  </button>
                </div>
              ) : (
                <button
                  onClick={startSearch}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 sm:py-4 sm:px-8 rounded-lg text-base sm:text-xl transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Загрузка...
                    </span>
                  ) : (
                    'Найти оппонента'
                  )}
                </button>
              )}
            </div>
            
            <div className="mt-8 sm:mt-12 border-t border-gray-700 pt-6 sm:pt-8">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-100">Как это работает?</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 text-left">
                <div className="p-3 sm:p-4 bg-gray-900/50 rounded-md">
                  <div className="text-blue-400 font-bold mb-1 sm:mb-2">1. Поиск</div>
                  <p className="text-xs sm:text-sm text-gray-300">Нажмите кнопку поиска и система найдет для вас оппонента близкого по рейтингу.</p>
                </div>
                <div className="p-3 sm:p-4 bg-gray-900/50 rounded-md">
                  <div className="text-blue-400 font-bold mb-1 sm:mb-2">2. Вопросы </div>
                  <p className="text-xs sm:text-sm text-gray-300">Ответьте на 5 вопросов по программированию. На каждый вопрос дается 15 секунд.</p>
                </div>
                <div className="p-3 sm:p-4 bg-gray-900/50 rounded-md">
                  <div className="text-blue-400 font-bold mb-1 sm:mb-2">3. Результаты</div>
                  <p className="text-xs sm:text-sm text-gray-300">Побеждает участник с наибольшим количеством правильных ответов. Повышайте свой рейтинг!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div ref={filterRef} className="filter"></div>
      </div>
    </ProtectedRoute>
  );
}
