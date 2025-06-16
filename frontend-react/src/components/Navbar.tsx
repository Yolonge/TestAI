'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Функция для определения мобильного устройства
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768); // 768px - стандартная точка для md в Tailwind
    };

    // Проверяем при загрузке
    checkIsMobile();

    // Добавляем слушатель изменения размера окна
    window.addEventListener('resize', checkIsMobile);

    // Очищаем слушатель при размонтировании
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const isAdmin = user?.username === 'admin';

  return (
    <nav className="navbar bg-gray-900 text-white shadow-md">
      <div className="flex flex-wrap justify-between items-center relative">
        {/* Мобильная версия навбара */}
        <div className="md:hidden flex w-full items-center justify-between">
          <button 
            className="p-2 sm:p-3 hover:bg-gray-800" 
            type="button" 
            onClick={toggleMenu} 
            aria-label="Меню приложения"
          >
            <svg className="w-5 h-5" fill="white" fillRule="evenodd" viewBox="0 0 20 20">
              <title>Меню</title>
              <path d="M0 0h20v2H0zm0 6h20v2H0zm0 6h20v2H0z" />
            </svg>
          </button>

          <div className="absolute left-0 right-0 mx-auto w-fit">
            <Link href="/" className="flex items-center py-2 px-2 sm:py-3 sm:px-4">
              <h4 className="logo-title">
                <span>DealW/</span>
              </h4>
            </Link>
          </div>

          {user ? (
            <button
              onClick={toggleMenu}
              className="flex items-center p-2 rounded-full hover:bg-gray-800"
              aria-label="Профиль пользователя"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white">
                <title>Пользователь</title>
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm0 4.6c2.8 0 5 2.2 5 5s-2.2 5-5 5-5-2.2-5-5 2.2-5 5-5zm7 14.5c-1.8 1.8-4.3 2.9-7 2.9s-5.2-1.1-7-2.9v-1.6c0-1.3.7-2 2-2h10c1.3 0 2 .7 2 2v1.6z" />
              </svg>
            </button>
          ) : (
            <div className="flex items-center space-x-1">
              <Link
                href="/auth/login"
                className="px-2 py-1 rounded-md text-xs font-medium text-white border border-gray-600 hover:bg-gray-800"
              >
                Войти
              </Link>
            </div>
          )}
        </div>

        {/* Десктопная версия навбара */}
        <div className="hidden md:flex items-center space-x-1 sm:space-x-2">
          <Link href="/" className="flex items-center py-2 px-2 sm:py-3 sm:px-4 flex-shrink-0">
            <h4 className="logo-title">
              <span>DealW/</span>
            </h4>
          </Link>
          
          <ul className="flex ml-0 lg:ml-2">
            <li className="flex items-center flex-wrap">
              <Link href="/" className="btn-14 mx-1 lg:mx-2 text-sm lg:text-base">Главная</Link>
              <Link href="/duel/history" className="btn-14 mx-1 lg:mx-2 text-sm lg:text-base">История дуэлей</Link>
              <Link href="/leaderboard" className="btn-14 mx-1 lg:mx-2 text-sm lg:text-base">Рейтинг</Link>
              {isAdmin && (
                <Link href="/admin" className="px-2 py-1 lg:px-3 lg:py-2 text-sm lg:text-base text-red-400 hover:bg-gray-800 mx-1 lg:mx-2">Админ-панель</Link>
              )}
            </li>
          </ul>
        </div>
        
        {/* Правая часть хедера - только для десктопа */}
        <div className="hidden md:flex items-center">
          <ul className="flex items-center">
            <li className="px-1">
              <button className="p-2 rounded-full hover:bg-gray-800" type="button" aria-label="Поиск">
                <svg className="w-5 h-5" viewBox="0 0 16 16" fill="white" fillRule="evenodd">
                  <title>Поиск</title>
                  <path d="M6 2c2.2 0 4 1.8 4 4s-1.8 4-4 4-4-1.8-4-4 1.8-4 4-4zm0-2C2.7 0 0 2.7 0 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm10 13.8L13.8 16l-3.6-3.6 2.2-2.2z" />
                  <path d="M16 13.8L13.8 16l-3.6-3.6 2.2-2.2z" />
                </svg>
              </button>
            </li>
            <li className="px-1">
              <button className="p-2 rounded-full hover:bg-gray-800" type="button" aria-label="Уведомления">
                <svg className="w-5 h-5" viewBox="0 0 16 16" fill="white">
                  <title>Уведомления</title>
                  <path d="M9 1.11V0H7v1.11A5.022 5.022 0 0 0 3.1 4.9L1 14h5a2 2 0 0 0 4 0h5l-2.1-9.1A5.022 5.022 0 0 0 9 1.11z" />
                </svg>
              </button>
            </li>
            <li className="px-1">
              <button className="p-2 rounded-full hover:bg-gray-800" type="button" aria-label="Приложения">
                <svg className="w-5 h-5" viewBox="0 0 16 16" fill="white">
                  <title>Приложения</title>
                  <circle cx="2" cy="2" r="2" />
                  <circle cx="8" cy="2" r="2" />
                  <circle cx="14" cy="2" r="2" />
                  <circle cx="2" cy="8" r="2" />
                  <circle cx="8" cy="8" r="2" />
                  <circle cx="14" cy="8" r="2" />
                  <circle cx="2" cy="14" r="2" />
                  <circle cx="8" cy="14" r="2" />
                  <circle cx="14" cy="14" r="2" />
                </svg>
              </button>
            </li>
            <li className="px-1 mr-1 sm:mr-2">
              {user ? (
                <div className="relative">
                  <button
                    onClick={toggleMenu}
                    className="flex items-center p-2 rounded-full hover:bg-gray-800"
                    aria-label="Профиль пользователя"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white">
                      <title>Пользователь</title>
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm0 4.6c2.8 0 5 2.2 5 5s-2.2 5-5 5-5-2.2-5-5 2.2-5 5-5zm7 14.5c-1.8 1.8-4.3 2.9-7 2.9s-5.2-1.1-7-2.9v-1.6c0-1.3.7-2 2-2h10c1.3 0 2 .7 2 2v1.6z" />
                    </svg>
                  </button>
                  
                  {/* Выпадающее окно только для ПК */}
                  {isMenuOpen && !isMobile && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-10">
                      <div className="px-4 py-2 text-sm font-medium border-b border-gray-700">
                        {user.username}
                      </div>
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                        onClick={toggleMenu}
                      >
                        Профиль
                      </Link>
                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="block px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
                          onClick={toggleMenu}
                        >
                          Админ-панель
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          toggleMenu();
                          logout();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                      >
                        Выйти
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Link
                    href="/auth/login"
                    className="px-2 py-1 sm:px-3 sm:py-2 rounded-md text-xs sm:text-sm font-medium text-white border border-gray-600 hover:bg-gray-800"
                  >
                    Войти
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-2 py-1 sm:px-3 sm:py-2 rounded-md text-xs sm:text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Регистрация
                  </Link>
                </div>
              )}
            </li>
          </ul>
        </div>
      </div>
      
      {/* Мобильное меню */}
      <div className={`md:hidden w-full px-2 pt-2 pb-3 space-y-1 bg-gray-800 ${isMenuOpen ? 'block' : 'hidden'}`}>
        <Link
          href="/"
          className="block px-3 py-2 rounded-md text-sm sm:text-base font-medium text-white hover:bg-gray-700"
          onClick={toggleMenu}
        >
          Главная
        </Link>
        <Link
          href="/duel/history"
          className="block px-3 py-2 rounded-md text-sm sm:text-base font-medium text-white hover:bg-gray-700"
          onClick={toggleMenu}
        >
          История дуэлей
        </Link>
        <Link
          href="/leaderboard"
          className="block px-3 py-2 rounded-md text-sm sm:text-base font-medium text-white hover:bg-gray-700"
          onClick={toggleMenu}
        >
          Рейтинг
        </Link>
        {isAdmin && (
          <Link
            href="/admin"
            className="block px-3 py-2 rounded-md text-sm sm:text-base font-medium text-red-400 hover:bg-gray-700"
            onClick={toggleMenu}
          >
            Админ-панель
          </Link>
        )}
        {user && (
          <>
            <Link
              href="/profile"
              className="block px-3 py-2 rounded-md text-sm sm:text-base font-medium text-white hover:bg-gray-700"
              onClick={toggleMenu}
            >
              Профиль
            </Link>
            <button
              onClick={() => {
                toggleMenu();
                logout();
              }}
              className="block w-full text-left px-3 py-2 rounded-md text-sm sm:text-base font-medium text-white hover:bg-gray-700"
            >
              Выйти
            </button>
          </>
        )}
      </div>
    </nav>
  );
} 