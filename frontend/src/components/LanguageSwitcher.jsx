import React from 'react';
import { useLanguage } from '../utils/LanguageContext';
import { useTheme } from '../utils/ThemeContext';
import vnFlag from '../assets/flags/vn.svg';
import gbFlag from '../assets/flags/gb.svg';

const LanguageSwitcher = () => {
  const { language, changeLanguage } = useLanguage();
  const { theme } = useTheme();

  return (
    <div className={`p-4 border-t flex gap-2 justify-center ${
      theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
    }`}>
      <button
        onClick={() => changeLanguage('vi')}
        className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${
          language === 'vi' 
            ? 'border-cyan-400 scale-110' 
            : 'border-transparent opacity-60 hover:opacity-100'
        }`}
        title="Tiếng Việt"
      >
        <img src={vnFlag} alt="VN" className="w-full h-full object-cover" />
      </button>
      <button
        onClick={() => changeLanguage('en')}
        className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${
          language === 'en' 
            ? 'border-cyan-400 scale-110' 
            : 'border-transparent opacity-60 hover:opacity-100'
        }`}
        title="English"
      >
        <img src={gbFlag} alt="EN" className="w-full h-full object-cover" />
      </button>
    </div>
  );
};

export default LanguageSwitcher;
