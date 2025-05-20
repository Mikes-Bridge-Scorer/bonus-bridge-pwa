import React, { useState, useEffect } from 'react';
import BridgeGameUI from './BridgeGameUI-simplified';
import { determineVulnerability } from './utils/scoring';
import './global.css';

const App = () => {
  const [gameState, setGameState] = useState({
    gameNumber: 1,
    dealNumber: 1,
    scores: {
      nsScore: 0,
      ewScore: 0
    },
    deals: [],
    currentDeal: {
      contract: '',
      declarer: '',
      result: null,
      tricks: null,
      vulnerable: { ns: false, ew: false }
    },
    isAwake: false,
    showScorePopup: false
  });
  
  // Save game state to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('bridgeGameState', JSON.stringify(gameState));
  }, [gameState]);
  
  // Handle starting a new deal
  const handleNextDeal = () => {
    setGameState(prev => ({
      ...prev,
      dealNumber: prev.dealNumber + 1,
      showScorePopup: false,
      currentDeal: {
        contract: '',
        declarer: '',
        result: null,
        tricks: null,
        vulnerable: determineVulnerability(prev.dealNumber + 1)
      }
    }));
  };
  
  // Handle starting a new game
  const handleNewGame = () => {
    setGameState({
      gameNumber: gameState.gameNumber + 1,
      dealNumber: 1,
      scores: {
        nsScore: 0,
        ewScore: 0
      },
      deals: [],
      currentDeal: {
        contract: '',
        declarer: '',
        result: null,
        tricks: null,
        vulnerable: determineVulnerability(1)
      },
      isAwake: gameState.isAwake,
      showScorePopup: false
    });
  };
  
  // Update the current deal in the game state
  const updateCurrentDeal = (updatedDeal) => {
    setGameState(prev => ({
      ...prev,
      currentDeal: {
        ...prev.currentDeal,
        ...updatedDeal
      }
    }));
  };
  
  return (
    <div className="app-container">
      <BridgeGameUI 
        gameState={gameState} 
        updateCurrentDeal={updateCurrentDeal}
        onNextDeal={handleNextDeal}
        onNewGame={handleNewGame}
        setGameState={setGameState}
      />
    </div>
  );
};

export default App;