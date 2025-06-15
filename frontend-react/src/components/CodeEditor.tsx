import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  code: string;
  language: string;
  blanks: string[];
  blankValues: string[];
  onBlankChange: (index: number, value: string) => void;
  readOnly?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  language,
  blanks,
  blankValues,
  onBlankChange,
  readOnly = false
}) => {
  const editorRef = useRef<any>(null);
  
  // Функция для обработки редактора после его монтирования
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Регистрируем пользовательскую тему для подсветки пропусков
    monaco.editor.defineTheme('codeWithBlanks', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'blank.filled', foreground: '008800', fontStyle: 'bold' },
        { token: 'blank.empty', foreground: 'cc0000', fontStyle: 'italic' }
      ],
      colors: {}
    });
    
    // Применяем тему
    monaco.editor.setTheme('codeWithBlanks');
    
    // Регистрируем токенизатор для подсветки пропусков
    monaco.languages.setMonarchTokensProvider('custom-' + language, {
      tokenizer: {
        root: [
          [/__FILLED_BLANK_\d+__/, 'blank.filled'],
          [/__EMPTY_BLANK_\d+__/, 'blank.empty']
        ]
      }
    });
  };

  // Подготавливаем код с пропусками для отображения
  const prepareCodeWithBlanks = () => {
    let result = code;
    const placeholders = [];
    
    // Заменяем все пропуски __ на идентификаторы
    for (let i = 0; i < blanks.length; i++) {
      // Находим первое вхождение '__' и заменяем его на уникальный идентификатор
      const parts = result.split('__', 2);
      
      if (parts.length === 2) {
        // Определяем, заполнен ли пропуск
        const isFilled = blankValues[i] && blankValues[i].trim() !== '';
        const placeholder = isFilled ? `__FILLED_BLANK_${i}__` : `__EMPTY_BLANK_${i}__`;
        
        // Заменяем первый пропуск на идентификатор
        result = parts[0] + placeholder + result.substring(parts[0].length + 2);
        placeholders.push({ placeholder, index: i, isFilled });
      }
    }
    
    // Заменяем идентификаторы на значения из blankValues или на комментарии с номером пропуска
    for (const { placeholder, index, isFilled } of placeholders) {
      const value = isFilled ? blankValues[index] : `/* ${blanks[index]} */`;
      result = result.replace(placeholder, value);
    }
    
    return result;
  };

  // Обновляем редактор при изменении значений
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setValue(prepareCodeWithBlanks());
    }
  }, [blankValues]);

  return (
    <div className="code-editor-container">
      <Editor
        height="200px"
        language={language}
        value={prepareCodeWithBlanks()}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          lineNumbers: 'on',
          automaticLayout: true,
          wordWrap: 'on',
          readOnly: true // Всегда только для чтения, так как редактирование происходит через поля ввода
        }}
        onMount={handleEditorDidMount}
      />
      
      {/* Поля ввода для заполнения пропусков */}
      <div className="blanks-container mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {blanks.map((blank, index) => (
          <div key={index} className="blank-input flex items-center">
            <label className="text-sm font-medium text-gray-700 mr-2">
              {blank}:
            </label>
            <input
              type="text"
              className={`flex-1 p-1.5 border rounded-md text-sm ${
                blankValues[index] && blankValues[index].trim() !== '' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-300'
              }`}
              value={blankValues[index] || ''}
              onChange={(e) => onBlankChange(index, e.target.value)}
              disabled={readOnly}
              placeholder={`Введите ${blank}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CodeEditor; 