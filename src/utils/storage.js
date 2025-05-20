// Local storage utility functions for Bonus Bridge

// Key for storing the current game state
const GAME_STATE_KEY = 'bridgeGameState';

// Key for storing historic game results
const GAME_HISTORY_KEY = 'bridgeGameHistory';

// Save the current game state to local storage
export const saveGameState = (gameState) => {
  try {
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(gameState));
    return true;
  } catch (error) {
    console.error('Error saving game state to local storage:', error);
    return false;
  }
};

// Load the current game state from local storage
export const loadGameState = () => {
  try {
    const savedState = localStorage.getItem(GAME_STATE_KEY);
    
    if (savedState) {
      return JSON.parse(savedState);
    }
  } catch (error) {
    console.error('Error loading game state from local storage:', error);
  }
  
  return null;
};

// Add a completed game to the history
export const saveCompletedGame = (gameData) => {
  try {
    let gameHistory = loadGameHistory();
    
    if (!gameHistory) {
      gameHistory = [];
    }
    
    // Add timestamp to the game data
    const gameWithTimestamp = {
      ...gameData,
      completedAt: new Date().toISOString()
    };
    
    // Add to history
    gameHistory.push(gameWithTimestamp);
    
    // Save back to local storage
    localStorage.setItem(GAME_HISTORY_KEY, JSON.stringify(gameHistory));
    
    return true;
  } catch (error) {
    console.error('Error saving completed game to history:', error);
    return false;
  }
};

// Load all historic games
export const loadGameHistory = () => {
  try {
    const historyData = localStorage.getItem(GAME_HISTORY_KEY);
    
    if (historyData) {
      return JSON.parse(historyData);
    }
  } catch (error) {
    console.error('Error loading game history from local storage:', error);
  }
  
  return [];
};

// Clear the current game state
export const clearCurrentGame = () => {
  try {
    localStorage.removeItem(GAME_STATE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing current game state:', error);
    return false;
  }
};

// Clear all game history
export const clearGameHistory = () => {
  try {
    localStorage.removeItem(GAME_HISTORY_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing game history:', error);
    return false;
  }
};

// Get the total storage used by the app (in bytes)
export const getStorageUsage = () => {
  try {
    let totalSize = 0;
    
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length * 2; // UTF-16 characters use 2 bytes each
      }
    }
    
    return totalSize;
  } catch (error) {
    console.error('Error calculating storage usage:', error);
    return 0;
  }
};

// Check if there's a saved game state
export const hasSavedGame = () => {
  return !!localStorage.getItem(GAME_STATE_KEY);
};