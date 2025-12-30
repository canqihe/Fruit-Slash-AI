import React from 'react';
import { GameMode, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { soundManager } from '../utils/sound';

interface MainMenuProps {
  onStartGame: (mode: GameMode, useCamera: boolean) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStartGame, language, setLanguage }) => {
  const T = TRANSLATIONS[language];

  const handleLangChange = (lang: Language) => {
      soundManager.playClick();
      setLanguage(lang);
  };

  const handleStart = (mode: GameMode, useCamera: boolean) => {
      soundManager.playClick();
      onStartGame(mode, useCamera);
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-4">
      
      {/* Language Toggle */}
      <div className="absolute top-6 right-6 flex gap-2 z-20">
        <button 
          onClick={() => handleLangChange('EN')}
          className={`px-3 py-1 rounded-md text-sm font-bold border ${language === 'EN' ? 'bg-white text-black border-white' : 'bg-transparent text-gray-400 border-gray-600 hover:text-white'}`}
        >
          EN
        </button>
        <button 
          onClick={() => handleLangChange('CN')}
          className={`px-3 py-1 rounded-md text-sm font-bold border ${language === 'CN' ? 'bg-red-600 text-white border-red-600' : 'bg-transparent text-gray-400 border-gray-600 hover:text-white'}`}
        >
          中文
        </button>
      </div>

      <h1 className="text-7xl md:text-9xl font-display text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 drop-shadow-lg mb-2 transform -rotate-3 hover:rotate-3 transition duration-500 text-center">
        {T.TITLE}
      </h1>
      <h2 className="text-2xl font-light tracking-widest mb-12 text-gray-300 uppercase">{T.SUBTITLE}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Classic Mode */}
        <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 hover:border-yellow-400 hover:bg-white/20 transition group">
          <h3 className="text-4xl font-display text-yellow-400 mb-4 group-hover:scale-110 transition-transform origin-left">{T.CLASSIC_TITLE}</h3>
          <p className="mb-6 text-gray-300 min-h-[3rem]">{T.CLASSIC_DESC}</p>
          <div className="flex gap-4">
            <button 
              onClick={() => handleStart(GameMode.CLASSIC, true)}
              className="flex-1 py-3 px-6 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg shadow-lg transform transition hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              <span>{T.CAMERA_BTN}</span>
            </button>
            <button 
              onClick={() => handleStart(GameMode.CLASSIC, false)}
              className="flex-1 py-3 px-6 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg shadow-lg transform transition hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              <span>{T.MOUSE_BTN}</span>
            </button>
          </div>
        </div>

        {/* Zen Mode */}
        <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 hover:border-green-400 hover:bg-white/20 transition group">
          <h3 className="text-4xl font-display text-green-400 mb-4 group-hover:scale-110 transition-transform origin-left">{T.ZEN_TITLE}</h3>
          <p className="mb-6 text-gray-300 min-h-[3rem]">{T.ZEN_DESC}</p>
          <div className="flex gap-4">
            <button 
              onClick={() => handleStart(GameMode.ZEN, true)}
              className="flex-1 py-3 px-6 bg-green-500 hover:bg-green-400 text-black font-bold rounded-lg shadow-lg transform transition hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              <span>{T.CAMERA_BTN}</span>
            </button>
            <button 
              onClick={() => handleStart(GameMode.ZEN, false)}
              className="flex-1 py-3 px-6 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg shadow-lg transform transition hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              <span>{T.MOUSE_BTN}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-16 text-center text-gray-500 text-sm">
        {T.TIPS.map((tip, i) => <p key={i}>{tip}</p>)}
      </div>
    </div>
  );
};

export default MainMenu;