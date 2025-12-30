import React from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { soundManager } from '../utils/sound';

interface GameOverScreenProps {
  score: number;
  onRestart: () => void;
  onMenu: () => void;
  language: Language;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ score, onRestart, onMenu, language }) => {
  const T = TRANSLATIONS[language];

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black/80 backdrop-blur-sm text-white p-6">
      <div className="bg-gray-900 border-2 border-red-500 p-10 rounded-3xl shadow-2xl max-w-2xl w-full text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
        
        <h2 className="text-7xl font-display text-red-500 mb-2 transform rotate-2">{T.GAME_OVER}</h2>
        <div className="text-4xl font-bold mb-12 text-white">{T.SCORE}: <span className="text-yellow-400">{score}</span></div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
                onClick={() => { soundManager.playClick(); onRestart(); }}
                className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-full text-xl shadow-lg transform hover:scale-105 transition"
            >
                {T.PLAY_AGAIN}
            </button>
            <button 
                onClick={() => { soundManager.playClick(); onMenu(); }}
                className="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-full text-xl shadow-lg transform hover:scale-105 transition"
            >
                {T.MAIN_MENU}
            </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverScreen;