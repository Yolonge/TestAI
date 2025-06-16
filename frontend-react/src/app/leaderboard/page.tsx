'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/apiService';

interface LeaderboardUser {
  id: number;
  username: string;
  rating: number;
  totalWins: number;
  totalLosses: number;
}

interface PaginatedResponse {
  items: LeaderboardUser[];
  paginationParams: {
    pageNumber: number;
    pageSize: number;
  };
  totalPages: number;
  hasNextPage: boolean;
  hasPreveiwPage: boolean;
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await apiService.getLeaderboard(currentPage, pageSize, 'rating', false);
        setLeaderboard(response.items);
        setTotalPages(response.totalPages);
        setHasNextPage(response.hasNextPage);
        setHasPrevPage(response.hasPreveiwPage);
      } catch (err) {
        console.error('Ошибка при загрузке таблицы лидеров:', err);
        setError('Не удалось загрузить таблицу лидеров');
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [currentPage, pageSize]);

  const goToNextPage = () => {
    if (hasNextPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (hasPrevPage) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Таблица лидеров</h1>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div className="bg-white shadow overflow-x-auto rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Позиция
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Игрок
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Рейтинг
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Победы
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Поражения
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Винрейт
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaderboard.map((leader, index) => {
                    // Рассчитываем реальную позицию, учитывая пагинацию
                    const position = currentPage * pageSize + index + 1;
                    
                    // Рассчитываем процент побед (винрейт)
                    const totalGames = leader.totalWins + leader.totalLosses;
                    const winRate = totalGames > 0 
                      ? Math.round((leader.totalWins / totalGames) * 100) 
                      : 0;
                    
                    return (
                      <tr key={leader.id} className={leader.id === user?.id ? "bg-blue-50" : "hover:bg-gray-50"}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`flex items-center ${position <= 3 ? "font-bold" : ""}`}>
                            {position === 1 ? (
                              <span className="text-xl text-yellow-500 mr-2">👑</span>
                            ) : position === 2 ? (
                              <span className="text-lg text-gray-400 mr-2">🥈</span>
                            ) : position === 3 ? (
                              <span className="text-lg text-yellow-600 mr-2">🥉</span>
                            ) : null}
                            <span className="text-black">{position}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${leader.id === user?.id ? "text-blue-700" : "text-gray-900"}`}>
                            {leader.username}
                            {leader.id === user?.id && <span className="ml-2 text-xs text-blue-500">(вы)</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {leader.rating}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                          {leader.totalWins}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                          {leader.totalLosses}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <span className="mr-2">{winRate}%</span>
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  winRate >= 60 ? 'bg-green-500' : winRate >= 40 ? 'bg-blue-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${winRate}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Пагинация */}
            <div className="mt-5 flex justify-between items-center">
              <div>
                <span className="text-sm text-gray-700">
                  Страница {currentPage + 1} из {totalPages}
                </span>
              </div>
              <div className="flex">
                <button
                  onClick={goToPrevPage}
                  disabled={!hasPrevPage}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    hasPrevPage ? 'bg-white text-gray-700 hover:bg-gray-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Назад
                </button>
                <button
                  onClick={goToNextPage}
                  disabled={!hasNextPage}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    hasNextPage ? 'bg-white text-gray-700 hover:bg-gray-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Вперед
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 