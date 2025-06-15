'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import apiService from '@/services/apiService';

// Типы вопросов
type QuestionType = 'TextInput' | 'MultipleChoice' | 'FillBlanks';

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Состояния для формы создания вопросов
  const [activeTab, setActiveTab] = useState<QuestionType>('TextInput');
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  
  // Общие поля для всех типов вопросов
  const [questionText, setQuestionText] = useState('');
  const [explanation, setExplanation] = useState('');
  const [difficulty, setDifficulty] = useState(1);
  const [category, setCategory] = useState('');
  
  // Поля для TextInput
  const [textAnswer, setTextAnswer] = useState('');
  
  // Поля для MultipleChoice
  const [options, setOptions] = useState<string[]>(['', '']);
  const [correctOptionIndex, setCorrectOptionIndex] = useState(0);
  
  // Поля для FillBlanks
  const [template, setTemplate] = useState('');
  const [blanks, setBlanks] = useState<string[]>(['']);
  const [fillBlanksAnswer, setFillBlanksAnswer] = useState('');

  useEffect(() => {
    // Проверяем, что пользователь авторизован и его имя 'admin'
    if (!user || user.username !== 'admin') {
      router.push('/auth/login');
    } else {
      // Загружаем категории
      loadCategories();
    }
  }, [user, router]);

  const loadCategories = async () => {
    try {
      const categoriesData = await apiService.getQuestionCategories();
      setCategories(categoriesData);
      if (categoriesData.length > 0) {
        setCategory(categoriesData[0]);
      }
    } catch (error) {
      console.error('Ошибка при загрузке категорий:', error);
      setMessage('Не удалось загрузить категории вопросов');
      setIsError(true);
    }
  };

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

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = [...options];
      newOptions.splice(index, 1);
      setOptions(newOptions);
      
      // Корректируем индекс правильного ответа, если он был удален
      if (correctOptionIndex >= index && correctOptionIndex > 0) {
        setCorrectOptionIndex(correctOptionIndex - 1);
      }
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleAddBlank = () => {
    setBlanks([...blanks, '']);
  };

  const handleRemoveBlank = (index: number) => {
    if (blanks.length > 1) {
      const newBlanks = [...blanks];
      newBlanks.splice(index, 1);
      setBlanks(newBlanks);
    }
  };

  const handleBlankChange = (index: number, value: string) => {
    const newBlanks = [...blanks];
    newBlanks[index] = value;
    setBlanks(newBlanks);
  };

  const handleAddCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setCategory(newCategory);
      setNewCategory('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || user.username !== 'admin') {
      setMessage('Только администратор может выполнить эту операцию');
      setIsError(true);
      return;
    }

    setIsLoading(true);
    setMessage(null);
    setIsError(false);

    try {
      let response;
      
      switch (activeTab) {
        case 'TextInput':
          response = await apiService.createTextInputQuestion({
            text: questionText,
            correctAnswer: textAnswer,
            category,
            difficulty,
            explanation
          });
          break;
          
        case 'MultipleChoice':
          // Проверка на пустые варианты
          if (options.some(option => !option.trim())) {
            throw new Error('Все варианты ответов должны быть заполнены');
          }
          
          response = await apiService.createMultipleChoiceQuestion({
            text: questionText,
            options,
            correctOptionIndex,
            category,
            difficulty,
            explanation,
            correctAnswer: options[correctOptionIndex]
          });
          break;
          
        case 'FillBlanks':
          // Проверка на пустые пропуски
          if (blanks.some(blank => !blank.trim())) {
            throw new Error('Все пропуски должны быть заполнены');
          }
          
          response = await apiService.createFillBlanksQuestion({
            text: questionText,
            template,
            blanks,
            correctAnswer: fillBlanksAnswer,
            category,
            difficulty,
            explanation
          });
          break;
      }
      
      setMessage('Вопрос успешно создан');
      setIsError(false);
      
      // Очистка формы
      setQuestionText('');
      setExplanation('');
      setTextAnswer('');
      setOptions(['', '']);
      setCorrectOptionIndex(0);
      setTemplate('');
      setBlanks(['']);
      setFillBlanksAnswer('');
      
    } catch (error: any) {
      console.error('Ошибка при создании вопроса:', error);
      setMessage(`Ошибка при создании вопроса: ${error.message || 'Неизвестная ошибка'}`);
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
      
      {/* Блок управления дуэлями */}
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
      
      {/* Блок создания вопросов */}
      <div className="bg-white shadow-md rounded p-6">
        <h2 className="text-xl font-semibold mb-4">Создание вопросов</h2>
        
        {/* Табы для выбора типа вопроса */}
        <div className="flex border-b mb-4">
          <button 
            className={`py-2 px-4 ${activeTab === 'TextInput' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('TextInput')}
          >
            Текстовый ввод
          </button>
          <button 
            className={`py-2 px-4 ${activeTab === 'MultipleChoice' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('MultipleChoice')}
          >
            Множественный выбор
          </button>
          <button 
            className={`py-2 px-4 ${activeTab === 'FillBlanks' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('FillBlanks')}
          >
            Заполнение пропусков
          </button>
        </div>
        
        {/* Форма создания вопроса */}
        <form onSubmit={handleSubmit}>
          {/* Общие поля для всех типов вопросов */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="questionText">
              Текст вопроса
            </label>
            <textarea
              id="questionText"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              required
              rows={3}
            />
          </div>
          
          {/* Категория */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Категория
            </label>
            <div className="flex gap-2">
              <select
                className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline flex-grow"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                {categories.map((cat, index) => (
                  <option key={index} value={cat}>{cat}</option>
                ))}
              </select>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Новая категория"
                  className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  +
                </button>
              </div>
            </div>
          </div>
          
          {/* Сложность */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Сложность
            </label>
            <select
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={difficulty}
              onChange={(e) => setDifficulty(parseInt(e.target.value))}
              required
            >
              <option value={1}>Легкий (1)</option>
              <option value={2}>Средний (2)</option>
              <option value={3}>Сложный (3)</option>
            </select>
          </div>
          
          {/* Пояснение */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="explanation">
              Пояснение (необязательно)
            </label>
            <textarea
              id="explanation"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={2}
            />
          </div>
          
          {/* Специфичные поля для TextInput */}
          {activeTab === 'TextInput' && (
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="textAnswer">
                Правильный ответ
              </label>
              <input
                id="textAnswer"
                type="text"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                required
              />
            </div>
          )}
          
          {/* Специфичные поля для MultipleChoice */}
          {activeTab === 'MultipleChoice' && (
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Варианты ответов
              </label>
              {options.map((option, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    required
                    placeholder={`Вариант ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    disabled={options.length <= 2}
                  >
                    -
                  </button>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={correctOptionIndex === index}
                      onChange={() => setCorrectOptionIndex(index)}
                      className="mr-2"
                    />
                    <label>Правильный</label>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddOption}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-2"
              >
                Добавить вариант
              </button>
            </div>
          )}
          
          {/* Специфичные поля для FillBlanks */}
          {activeTab === 'FillBlanks' && (
            <>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="template">
                  Шаблон с пропусками (используйте __ для обозначения пропуска)
                </label>
                <textarea
                  id="template"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline font-mono"
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  required
                  rows={5}
                  placeholder="Пример: def sum_two_smallest(numbers): return __(__(__)[:])"
                  style={{ whiteSpace: 'pre', tabSize: 4 }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Используйте пробелы для отступов. Переносы строк и табуляция будут сохранены.
                  Каждый символ __ будет заменен на поле ввода.
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Значения для пропусков (названия полей)
                </label>
                {blanks.map((blank, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      value={blank}
                      onChange={(e) => handleBlankChange(index, e.target.value)}
                      required
                      placeholder={`Название поля ${index + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveBlank(index)}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      disabled={blanks.length <= 1}
                    >
                      -
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddBlank}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-2"
                >
                  Добавить пропуск
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  Количество полей должно совпадать с количеством пропусков __ в шаблоне.
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fillBlanksAnswer">
                  Правильный ответ (полный)
                </label>
                <input
                  id="fillBlanksAnswer"
                  type="text"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={fillBlanksAnswer}
                  onChange={(e) => setFillBlanksAnswer(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Укажите правильный ответ в формате "значение1;значение2;значение3" (через точку с запятой).
                </p>
              </div>
            </>
          )}
          
          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              {isLoading ? 'Создание...' : 'Создать вопрос'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 