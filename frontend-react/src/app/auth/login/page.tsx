'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function LoginPage() {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await login(usernameOrEmail, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при входе');
    }
  };

  return (
    <div className="auth-container">
      <div className="login-box">
        <h1>Вход</h1>
        
        {error && (
          <div className="error-message" role="alert">
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="user-box">
            <input
              id="usernameOrEmail"
              type="text"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              required
              placeholder=" "
            />
            <label htmlFor="usernameOrEmail">Имя пользователя или email</label>
          </div>
          
          <div className="user-box">
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder=" "
            />
            <label htmlFor="password">Пароль</label>
          </div>
          
          <button type="submit" disabled={isLoading}>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            {isLoading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        
        <div className="text-center mt-6">
          <p className="text-sm text-white mt-4">
            Еще нет аккаунта?{' '}
            <Link href="/auth/register">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 