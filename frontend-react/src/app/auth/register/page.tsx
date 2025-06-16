'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { register, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    try {
      await register(username, email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при регистрации');
    }
  };

  return (
    <div className="auth-container">
      <div className="login-box">
        <h1>Регистрация</h1>
        
        {error && (
          <div className="error-message" role="alert">
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="user-box">
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder=" "
            />
            <label htmlFor="username">Имя пользователя</label>
          </div>
          
          <div className="user-box">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder=" "
            />
            <label htmlFor="email">Email</label>
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
          
          <div className="user-box">
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder=" "
            />
            <label htmlFor="confirmPassword">Подтвердите пароль</label>
          </div>
          
          <button type="submit" disabled={isLoading}>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
        
        <div className="text-center mt-6">
          <p className="text-sm text-white mt-4">
            Уже есть аккаунт?{' '}
            <Link href="/auth/login">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 