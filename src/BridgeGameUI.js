import React, { useState, useEffect } from 'react';
import ContractInput from './components/ContractInput';
import TrickInput from './components/TrickInput';
import ScoreTracking from './components/ScoreTracking';
import { 
  requestWakeLock, 
  releaseWakeLock, 
  isWakeLockSupported 
} from './utils/wakeLock';
import { 
  vulnerabilityDescription, 
  parseContract,
  determineDealer
} from './utils/scoring';
import './global.css';
import './styles/BridgeGame.css';
import './styles/OverrideStyles.css';

/**
 * BridgeGameUI - Main game interface, redesigned for better mobile experience
 */
const BridgeGameUI = ({ 
  gameState, 
  updateCurrentDeal, 
  onNextDeal, 
  onNewGame, 
  setGameState,
  onChooseBonusBridge,
  onChoosePartyBridge
}) => {
  // State for quit confirmation
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  // State for current input step (0 = contract, 1 = tricks)
  const [inputStep, setInputStep] = useState(0);
  
  // Function to keep the device awake
  const toggleKeepAwake = async () => {
    const newAwakeState = !gameState.isAwake;
    
    // Update state first for immediate UI feedback
    setGameState(prev => ({
      ...prev,
      isAwake: newAwakeState
    }));
    
    if (newAwakeState) {
      // Turn on wake lock
      if (isWakeLockSupported()) {
        const success = await requestWakeLock();
        if (!success) {
          // Wake lock request failed, revert state
          setGameState(prev => ({
            ...prev,
            isAwake: false
          }));
        }
      } else {
        console.log('Wake Lock API not supported in this browser');
      }
    } else {
      // Turn off wake lock
      await releaseWakeLock();
    }
  };

  // Show score popup
  const showScorePopup = () => {
    console.log('Showing score popup with current deal:', gameState.currentDeal);
    console.log('Current scores:', gameState.scores);
    
    setGameState(prev => ({
      ...prev,
      showScorePopup: true
    }));
  };

  // Hide score popup
  const hideScorePopup = () => {
    console.log("Hiding score popup");
    setGameState(prev => ({
      ...prev,
      showScorePopup: false
    }));
  };

  // Show quit confirmation
  const showQuitConfirmation = () => {
    setShowQuitConfirm(true);
  };

  // Hide quit confirmation
  const hideQuitConfirmation = () => {
    setShowQuitConfirm(false);
  };

  // Handle quitting the app
  const handleQuit = () => {
    // This would actually close the app in a native environment
    // For web, we'll just show an alert
    alert('App would close here in the final version');
    // You would add your native app closing code here
  };

  // Handle contract input changes
  const handleContractChange = (contract) => {
    updateCurrentDeal({ contract });
    // The automatic transition is handled by onComplete callback
  };

  // Handle trick input changes
  const handleTrickChange = (result, tricks) => {
    updateCurrentDeal({ result, tricks });
  };

  // Format contract for display
  const formatContractForDisplay = (contract, vulnerable) => {
    if (!contract) return "";
    
    const contractMatch = contract.match(/(\d)([♣♦♥♠]|NT)\s+([NESW])(X{0,2})/);
    if (!contractMatch) return contract;
    
    const level = contractMatch[1];
    const suit = contractMatch[2];
    const declarer = contractMatch[3];
    const doubled = contractMatch[4] || "";
    
    // Get full declarer name
    let declarerName = "";
    switch (declarer) {
      case 'N': declarerName = "North"; break;
      case 'E': declarerName = "East"; break;
      case 'S': declarerName = "South"; break;
      case 'W': declarerName = "West"; break;
      default: declarerName = declarer;
    }
    
    // Format doubled status
    let doubledText = "";
    if (doubled === "X") {
      doubledText = " Doubled";
    } else if (doubled === "XX") {
      doubledText = " Redoubled";
    }
    
    // Get vulnerability text
    const isNS = declarer === 'N' || declarer === 'S';
    const declarerVulnerable = isNS ? 
      (vulnerable?.ns || false) : 
      (vulnerable?.ew || false);
    
    const vulText = declarerVulnerable ? "vul" : "not vul";
    
    return `${level}${suit} by ${declarerName}${doubledText} ${vulText}`;
  };
  
  // Go back to contract input
  const goBackToContract = () => {
    setInputStep(0);
  };

  // Reset the game state when component mounts or when a new game starts
  useEffect(() => {
    if (gameState.dealNumber === 1) {
      // Clear any previously selected inputs
      updateCurrentDeal({
        contract: '',
        declarer: '',
        result: null,
        tricks: null
      });
      
      // Reset to contract input step
      setInputStep(0);
    }
  }, [gameState.dealNumber, gameState.gameNumber]); 

  // Ensure score popup is closed when deal changes or contract is reset
  useEffect(() => {
    // This ensures the showScorePopup state is properly reset when the deal changes
    if (gameState.showScorePopup && gameState.currentDeal.contract === '') {
      console.log('Automatically closing score popup on new deal');
      setGameState(prev => ({
        ...prev,
        showScorePopup: false
      }));
    }
  }, [gameState.dealNumber, gameState.currentDeal.contract, setGameState]);

  // Determine if Show Scores button should flash
  const shouldFlashScoreButton = () => {
    // Flash when both contract and result are entered
    return gameState.currentDeal.contract && 
           gameState.currentDeal.result !== null && 
           gameState.currentDeal.result !== undefined;
  };

  // Styles for quit confirmation
  const quitConfirmStyles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    },
    container: {
      backgroundColor: '#fff',
      borderRadius: '8px',
      padding: '20px',
      width: '80%',
      maxWidth: '320px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
    },
    title: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '15px',
      textAlign: 'center',
      color: '#1e5c8b'
    },
    message: {
      marginBottom: '15px',
      lineHeight: '1.4',
      textAlign: 'center',
      fontSize: '15px'
    },
    buttonContainer: {
      display: 'flex',
      justifyContent: 'space-around'
    },
    button: {
      padding: '8px 15px',
      borderRadius: '5px',
      border: 'none',
      color: '#fff',
      fontWeight: 'bold',
      cursor: 'pointer',
      fontSize: '14px'
    },
    cancelButton: {
      backgroundColor: '#1e5c8b'
    },
    confirmButton: {
      backgroundColor: '#e74c3c'
    }
  };

  return (
    <div className="bridge-game-container">
      <header className="game-header">
        <div className="game-header-top">
          <div className="game-info-left">
            <span>Bonus Bridge</span>
          </div>
          <div className="game-title">
            <h1>Game #{gameState.gameNumber}</h1>
          </div>
          <div className="game-info-right">
            <span>Deal #{gameState.dealNumber}</span>
          </div>
        </div>
        <div className="vulnerability-info">
          Dealer: {determineDealer(gameState.dealNumber)} - {vulnerabilityDescription(gameState.currentDeal.vulnerable)}
        </div>
      </header>
      
      <div className="game-board">
        {/* Step 1: Contract Input (shown only if inputStep is 0) */}
        {inputStep === 0 && (
          <div className="contract-container">
            <div className="contract-label">Contract:</div>
            <ContractInput 
              onContractChange={handleContractChange}
              initialContract={gameState.currentDeal.contract}
              onComplete={() => setInputStep(1)}  // Trigger transition on confirm
            />
          </div>
        )}
        
        {/* Current Contract Display (shown always if contract exists) */}
        {gameState.currentDeal.contract && (
          <div className="current-contract-display">
            <span>Contract: </span>{gameState.currentDeal.contract}
          </div>
        )}

        {/* Step 2: Tricks Input (shown only if inputStep is 1) */}
        {inputStep === 1 && (
          <>
            <div className="tricks-container">
              <div className="tricks-label">Tricks Taken:</div>
              <TrickInput 
                onTrickChange={handleTrickChange}
                initialResult={gameState.currentDeal.result}
                contract={gameState.currentDeal.contract}
                onChangeContract={goBackToContract} // Pass the function to go back
              />
            </div>
            
            {/* Result Display (shown if result is set) */}
            {gameState.currentDeal.result !== null && (
              <div className="result-display">
                <div className="result-text">
                  Result: {gameState.currentDeal.result > 0 ? `+${gameState.currentDeal.result}` : gameState.currentDeal.result} 
                  ({gameState.currentDeal.tricks} tricks)
                </div>
                
                {/* Score display if available */}
                {(gameState.currentDeal.nsPoints || gameState.currentDeal.ewPoints) && (
                  <div className="score-text">
                    Score: {gameState.currentDeal.nsPoints ? 
                      `${gameState.currentDeal.nsPoints} to NS` : 
                      `${gameState.currentDeal.ewPoints} to EW`}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <footer className="game-controls">
        <div className="top-controls">
          <button 
            className={`keep-awake-btn ${gameState.isAwake ? 'active' : ''}`}
            onClick={toggleKeepAwake}
          >
            <span className="icon">⏰</span>
            <span className="text">{gameState.isAwake ? 'Awake: ON' : 'Awake: OFF'}</span>
          </button>
          
          {/* UPDATED: Add flash class when conditions are met */}
          <button 
            className={`score-btn ${shouldFlashScoreButton() ? 'flash' : ''}`}
            onClick={showScorePopup}
          >
            <span className="icon">📊</span>
            <span className="text">Show Scores</span>
          </button>
        </div>
        
        <div className="bottom-controls">
          <button 
            className="quit-btn"
            onClick={showQuitConfirmation}
          >
            Quit
          </button>
          
          <button 
            className="new-game-btn"
            onClick={onNewGame}
          >
            New Game
          </button>
        </div>
      </footer>

{/* Score Popup - FIXED to always include Close button */}
{gameState.showScorePopup && (
  <div className="score-popup">
    <div className="score-popup-content">
      <h2>Current Scores</h2>
      <ScoreTracking 
        scores={{
          // Party Bridge scores (standard)
          nsPoints: gameState.currentDeal.nsPoints || 0,
          ewPoints: gameState.currentDeal.ewPoints || 0,
          nsTotal: gameState.scores.nsTotal || 0,
          ewTotal: gameState.scores.ewTotal || 0,
          
          // Bonus Bridge scores
          bonusNsPoints: gameState.currentDeal.bonusNsPoints || 0,
          bonusEwPoints: gameState.currentDeal.bonusEwPoints || 0,
          bonusNsTotal: gameState.scores.bonusNsTotal || 0,
          bonusEwTotal: gameState.scores.bonusEwTotal || 0,
          
          // Current deal tracking
          currentDealNumber: gameState.dealNumber,
          
          // Flag to show which type of score to display
          showBonusScores: false // Show Party Bridge scores by default in popup
        }}
        currentDeal={gameState.currentDeal}
        onChooseBonusBridge={onChooseBonusBridge}
        onChoosePartyBridge={onChoosePartyBridge}
      />
      {/* ALWAYS show the close button - this was the fix */}
      <button className="close-btn" onClick={hideScorePopup}>
        Close
      </button>
    </div>
  </div>
)}

      {/* Quit Confirmation Popup */}
      {showQuitConfirm && (
        <div style={quitConfirmStyles.overlay}>
          <div style={quitConfirmStyles.container}>
            <h2 style={quitConfirmStyles.title}>Confirm Quit</h2>
            <p style={quitConfirmStyles.message}>
              Are you sure you want to quit? This will close the app and all unsaved data will be lost.
            </p>
            <div style={quitConfirmStyles.buttonContainer}>
              <button 
                style={{...quitConfirmStyles.button, ...quitConfirmStyles.cancelButton}}
                onClick={hideQuitConfirmation}
              >
                Cancel
              </button>
              <button 
                style={{...quitConfirmStyles.button, ...quitConfirmStyles.confirmButton}}
                onClick={handleQuit}
              >
                Quit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BridgeGameUI;