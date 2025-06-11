'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { apiService, UserProfile } from '@/services/apiService';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const userProfile = await apiService.getUserProfile();
        setProfile(userProfile);
      } catch (err) {
        console.error('Ошибка при загрузке профиля:', err);
        setError('Не удалось загрузить данные профиля');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const totalGames = profile ? profile.totalWins + profile.totalLosses : 0;
  const winRate = totalGames > 0 ? Math.round((profile?.totalWins || 0) / totalGames * 100) : 0;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Профиль пользователя</h1>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
              <p>{error}</p>
            </div>
          ) : profile ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="border-b border-gray-200 bg-blue-50">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Информация о пользователе
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Личные данные и статистика
                  </p>
                </div>
              </div>
              
              <div className="border-t border-gray-200">
                <dl>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      Имя пользователя
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {profile.username}
                    </dd>
                  </div>
                  
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      Email
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {profile.email}
                    </dd>
                  </div>
                  
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      Рейтинг
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {profile.rating}
                    </dd>
                  </div>
                </dl>
              </div>
              
              <div className="border-t border-gray-200 bg-blue-50">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Статистика дуэлей
                  </h3>
                </div>
              </div>
              
              <div className="border-t border-gray-200">
                <dl>
                  <div className="bg-white px-4 py-5 grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <dt className="text-sm font-medium text-gray-500">
                        Всего дуэлей
                      </dt>
                      <dd className="mt-1 text-xl font-semibold text-gray-900">
                        {totalGames}
                      </dd>
                    </div>
                    
                    <div className="text-center">
                      <dt className="text-sm font-medium text-gray-500">
                        Победы
                      </dt>
                      <dd className="mt-1 text-xl font-semibold text-green-600">
                        {profile.totalWins}
                      </dd>
                    </div>
                    
                    <div className="text-center">
                      <dt className="text-sm font-medium text-gray-500">
                        Поражения
                      </dt>
                      <dd className="mt-1 text-xl font-semibold text-red-600">
                        {profile.totalLosses}
                      </dd>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 px-4 py-5 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 mb-2">
                      Процент побед: {winRate}%
                    </dt>
                    <dd className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${winRate}%` }}
                      ></div>
                    </dd>
                  </div>
                </dl>
              </div>
              
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6 flex justify-center">
                <button
                  onClick={() => router.push('/duel/history')}
                  className="mr-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  История дуэлей
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                >
                  Выйти
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </ProtectedRoute>
  );
} 