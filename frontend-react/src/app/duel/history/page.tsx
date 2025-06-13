'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { apiService } from '@/services/apiService';
import { formatDate } from '@/utils/dateUtils';

interface DuelHistoryItem {
  id: number;
  opponent: {
    id: number;
    username: string;
  };
  startTime: string;
  endTime: string;
  yourScore: number;
  opponentScore: number;
  isWin: boolean;
  isDraw: boolean;
}

interface PaginatedResponse {
  items: DuelHistoryItem[];
  paginationParams: {
    pageNumber: number;
    pageSize: number;
  };
  totalPages: number;
  hasNextPage: boolean;
  hasPreveiwPage: boolean;
}

export default function DuelHistoryPage() {
  const router = useRouter();
  const [duelHistory, setDuelHistory] = useState<DuelHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);

  useEffect(() => {
    const loadDuelHistory = async () => {
      try {
        setLoading(true);
        const response = await apiService.getDuelHistory(currentPage, pageSize);
        setDuelHistory(response.items);
        setTotalPages(response.totalPages);
        setHasNextPage(response.hasNextPage);
        setHasPrevPage(response.hasPreveiwPage);
      } catch (err) {
        console.error('Ошибка при загрузке истории дуэлей:', err);
        setError('Не удалось загрузить историю дуэлей');
      } finally {
        setLoading(false);
      }
    };

    loadDuelHistory();
  }, [currentPage, pageSize]);

  const viewDuelResults = (duelId: number) => {
    router.push(`/duel/${duelId}/results`);
  };

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
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">История дуэлей</h1>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
              <p>{error}</p>
            </div>
          ) : duelHistory.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-lg text-gray-600">У вас пока нет завершенных дуэлей.</p>
              <button
                onClick={() => router.push('/')}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Начать первую дуэль
              </button>
            </div>
          ) : (
            <>
              <div className="bg-white shadow overflow-x-auto sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Дата
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Оппонент
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Счет
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Результат
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {duelHistory.map((duel) => (
                      <tr key={duel.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(new Date(duel.endTime))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{duel.opponent.username}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{duel.yourScore} : {duel.opponentScore}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            duel.isDraw 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : duel.isWin
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                          }`}>
                            {duel.isDraw ? 'Ничья' : duel.isWin ? 'Победа' : 'Поражение'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => viewDuelResults(duel.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Подробнее
                          </button>
                        </td>
                      </tr>
                    ))}
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
    </ProtectedRoute>
  );
} 