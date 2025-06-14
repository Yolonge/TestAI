'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: number;
  username: string;
  email: string;
  token: string;
}

interface AuthContextType {
  user: User | null;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    // Проверяем, есть ли пользовательская сессия в localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as User;
        
        // Проверяем, не истек ли токен
        const token = parsedUser.token;
        const decodedToken = jwtDecode(token) as { exp: number };
        const currentTime = Date.now() / 1000;
        
        if (decodedToken.exp > currentTime) {
          setUser(parsedUser);
          
          // Устанавливаем токен для всех будущих запросов
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
          // Токен истек, удаляем пользователя
          localStorage.removeItem('user');
        }
      } catch (error) {
        // Если произошла ошибка при парсинге, удаляем данные пользователя
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (usernameOrEmail: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post('/api/users/login', {
        usernameOrEmail,
        password
      });
      
      const userData = response.data;
      setUser(userData);
      
      // Сохраняем в localStorage и устанавливаем токен для запросов
      localStorage.setItem('user', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
      
      router.push('/');
    } catch (error) {
      throw new Error('Не удалось войти в систему. Проверьте свои учетные данные.');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      await axios.post('/api/users/register', {
        username,
        email,
        password
      });
      
      // После регистрации сразу выполняем вход
      await login(email, password);
    } catch (error) {
      throw new Error('Не удалось зарегистрироваться. Пожалуйста, попробуйте другие данные.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    router.push('/auth/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}; 