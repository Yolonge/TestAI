'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import apiService from '@/services/apiService';

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Проверяем, что пользователь авторизован и его имя 'admin'
    if (!user || user.username !== 'admin') {
      router.push('/auth/login');
    }
  }, [user, router]);

  const handleCompleteAllDuels = async () => {
    if (!user || user.username !== 'admin') {
      setMessage('Только администратор может выполнить эту операцию');
      setIsError(true);
      return;
    }

    setIsLoading(true);
    setMessage(null);
    setIsError(false);

    try {
      const response = await apiService.completeAllDuels();
      setMessage(response.message || 'Все активные дуэли успешно завершены');
      setIsError(false);
    } catch (error) {
      console.error('Ошибка при завершении дуэлей:', error);
      setMessage('Произошла ошибка при попытке завершить дуэли');
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null; // Скрываем содержимое страницы до проверки авторизации
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Панель администратора</h1>
      
      {message && (
        <div 
          className={`${isError ? 'bg-red-100 border-red-400 text-red-700' : 'bg-green-100 border-green-400 text-green-700'} 
                     border px-4 py-3 rounded mb-4`} 
          role="alert"
        >
          <span className="block sm:inline">{message}</span>
        </div>
      )}
      
      <div className="bg-white shadow-md rounded p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Управление дуэлями</h2>
        <button 
          onClick={handleCompleteAllDuels}
          disabled={isLoading}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          {isLoading ? 'Завершение...' : 'Завершить все активные дуэли'}
        </button>
        <p className="text-sm text-black-600 mt-2">
          Нажатие на эту кнопку принудительно завершит все текущие активные дуэли.
        </p>
      </div>
    </div>
  );
} 