// File: src/context/GameContext.js
import React, { createContext, useReducer, useEffect } from 'react';
import { saveGameState, loadGameState, updateTotalDealCount, getTotalDealCount } from '../utils/storage';
import { calculateRawScore, calculateDefenderBonus } from '../utils/scoring';

// Initial game state
const initialState = {
  deals: [],
  dealCount: 0,
  totalScore: 0,
  currentDeal: {
    contract: null,
    level: null,
    suit: null,
    doubled: false,
    redoubled: false,
    vulnerable: false,
    declarer: null,
    tricksRequired: null,
    tricksMade: null,
    rawScore: null,
    adjustedScore: null,
    bonus: 0,
    scoringMethod: 'enhanced' // default to enhanced scoring
  }
};

// Game state reducer
const gameReducer = (state, action) => {
  let newState;
  
  switch (action.type) {
    case 'SET_CONTRACT':
      newState = {
        ...state,
        currentDeal: {
          ...state.currentDeal,
          contract: action.payload,
          level: parseInt(action.payload.charAt(0)),
          suit: action.payload.substring(1),
          tricksRequired: parseInt(action.payload.charAt(0)) + 6
        }
      };
      break;
      
    case 'SET_DOUBLED':
      newState = {
        ...state,
        currentDeal: {
          ...state.currentDeal,
          doubled: action.payload,
          // Reset redoubled if doubled is set to false
          redoubled: action.payload ? state.currentDeal.redoubled : false
        }
      };
      break;
      
    case 'SET_REDOUBLED':
      newState = {
        ...state,
        currentDeal: {
          ...state.currentDeal,
          redoubled: action.payload,
          // Ensure doubled is true if redoubled is true
          doubled: action.payload ? true : state.currentDeal.doubled
        }
      };
      break;
      
    case 'SET_VULNERABLE':
      newState = {
        ...state,
        currentDeal: {
          ...state.currentDeal,
          vulnerable: action.payload
        }
      };
      break;
      
    case 'SET_DECLARER':
      newState = {
        ...state,
        currentDeal: {
          ...state.currentDeal,
          declarer: action.payload
        }
      };
      break;
      
    case 'SET_TRICKS_MADE':
      const tricksMade = action.payload;
      const contractDetails = {
        level: state.currentDeal.level,
        suit: state.currentDeal.suit,
        doubled: state.currentDeal.doubled,
        redoubled: state.currentDeal.redoubled,
        vulnerable: state.currentDeal.vulnerable
      };
      
      const rawScore = calculateRawScore(contractDetails, tricksMade);
      let adjustedScore = rawScore;
      
      // If using enhanced scoring, add defender bonus
      if (state.currentDeal.scoringMethod === 'enhanced') {
        const defenderBonus = calculateDefenderBonus(contractDetails, tricksMade);
        adjustedScore = rawScore - defenderBonus;
      }
      
      // Add any manual bonus
      if (state.currentDeal.bonus) {
        adjustedScore += state.currentDeal.bonus;
      }
      
      newState = {
        ...state,
        currentDeal: {
          ...state.currentDeal,
          tricksMade,
          rawScore,
          adjustedScore
        }
      };
      break;
      
    case 'SET_SCORING_METHOD':
      const scoringMethod = action.payload;
      let scoreAdjustment = 0;
      
      // Recalculate adjusted score based on scoring method
      if (state.currentDeal.rawScore !== null) {
        if (scoringMethod === 'enhanced') {
          const contractDetails = {
            level: state.currentDeal.level,
            suit: state.currentDeal.suit,
            doubled: state.currentDeal.doubled,
            redoubled: state.currentDeal.redoubled,
            vulnerable: state.currentDeal.vulnerable
          };
          
          scoreAdjustment = calculateDefenderBonus(contractDetails, state.currentDeal.tricksMade);
        }
        
        newState = {
          ...state,
          currentDeal: {
            ...state.currentDeal,
            scoringMethod,
            adjustedScore: state.currentDeal.rawScore - scoreAdjustment + (state.currentDeal.bonus || 0)
          }
        };
      } else {
        newState = {
          ...state,
          currentDeal: {
            ...state.currentDeal,
            scoringMethod
          }
        };
      }
      break;
      
    case 'SET_BONUS':
      const bonus = action.payload;
      
      newState = {
        ...state,
        currentDeal: {
          ...state.currentDeal,
          bonus,
          adjustedScore: state.currentDeal.rawScore !== null
            ? state.currentDeal.rawScore - (state.currentDeal.scoringMethod === 'enhanced' 
                ? calculateDefenderBonus({
                    level: state.currentDeal.level,
                    suit: state.currentDeal.suit,
                    doubled: state.currentDeal.doubled,
                    redoubled: state.currentDeal.redoubled,
                    vulnerable: state.currentDeal.vulnerable
                  }, state.currentDeal.tricksMade)
                : 0) + bonus
            : null
        }
      };
      break;
      
    case 'SUBMIT_DEAL':
      const newDeal = { ...state.currentDeal };
      const newDeals = [...state.deals, newDeal];
      const newTotalScore = state.totalScore + newDeal.adjustedScore;
      const newDealCount = state.dealCount + 1;
      
      // Update total deal count for evaluation limit
      updateTotalDealCount(getTotalDealCount() + 1);
      
      newState = {
        ...state,
        deals: newDeals,
        dealCount: newDealCount,
        totalScore: newTotalScore,
        currentDeal: {
          ...initialState.currentDeal,
          scoringMethod: state.currentDeal.scoringMethod // keep current scoring method
        }
      };
      break;
      
    case 'NEW_GAME':
      newState = {
        ...initialState,
        currentDeal: {
          ...initialState.currentDeal,
          scoringMethod: state.currentDeal.scoringMethod // keep current scoring method
        }
      };
      break;
      
    case 'LOAD_GAME':
      newState = action.payload || initialState;
      break;
      
    default:
      newState = state;
  }
  
  // Save state to localStorage
  if (action.type !== 'LOAD_GAME') {
    saveGameState(newState);
  }
  
  return newState;
};

// Create the context
export const GameContext = createContext();

// Create the provider component
export const GameProvider = ({ children }) => {
  const [gameState, dispatch] = useReducer(gameReducer, initialState);
  
  // Load saved game state on initial mount
  useEffect(() => {
    const savedState = loadGameState();
    if (savedState) {
      dispatch({ type: 'LOAD_GAME', payload: savedState });
    }
  }, []);
  
  return (
    <GameContext.Provider value={{ gameState, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};