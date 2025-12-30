import React, { useState } from 'react';
import { GameMode, Language } from './types';
import GameCanvas from './components/GameCanvas';
import MainMenu from './components/MainMenu';
import GameOverScreen from './components/GameOverScreen';

function App() {
  const [gameState, setGameState] = useState<GameMode>(GameMode.MENU);
  const [lastScore, setLastScore] = useState(0);
  const [lastBestCombo, setLastBestCombo] = useState(0);
  const [useCamera, setUseCamera] = useState(false);
  // Remember the last played mode for "Play Again"
  const [activeMode, setActiveMode] = useState<GameMode>(GameMode.CLASSIC); 
  // Language State
  const [language, setLanguage] = useState<Language>('EN');

  const handleStartGame = (mode: GameMode, camera: boolean) => {
    setActiveMode(mode);
    setUseCamera(camera);
    setGameState(mode);
  };

  const handleGameOver = (score: number, bestCombo: number) => {
    setLastScore(score);
    setLastBestCombo(bestCombo);
    setGameState(GameMode.GAME_OVER);
  };

  const handleRestart = () => {
    setGameState(activeMode);
  };

  const handleReturnToMenu = () => {
    setGameState(GameMode.MENU);
  };

  return (
    <div className="w-full h-screen overflow-hidden bg-black select-none">
      {gameState === GameMode.MENU && (
        <MainMenu 
          onStartGame={handleStartGame} 
          language={language}
          setLanguage={setLanguage}
        />
      )}

      {(gameState === GameMode.CLASSIC || gameState === GameMode.ZEN) && (
        <GameCanvas 
            gameMode={gameState} 
            onGameOver={handleGameOver} 
            onReturnToMenu={handleReturnToMenu}
            isInputMethodCamera={useCamera}
            language={language}
        />
      )}

      {gameState === GameMode.GAME_OVER && (
        <GameOverScreen 
            score={lastScore} 
            onRestart={handleRestart} 
            onMenu={handleReturnToMenu}
            language={language} 
        />
      )}
    </div>
  );
}

export default App;