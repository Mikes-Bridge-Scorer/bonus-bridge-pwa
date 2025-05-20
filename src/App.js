import React, { useState, useEffect, useCallback } from 'react';
import WelcomePage from './components/WelcomePage';
import TrialManager from './utils/TrialManager'; // NEW: Trial system import
import TrialPopup from './components/TrialPopup'; // NEW: Trial popup import
import BridgeGameUI from './BridgeGameUI';
import ScoreAdjustment from './components/ScoreAdjustment';
import FinalScoreAnalysis from './components/FinalScoreAnalysis';
import ScoreProcessor from './components/ScoreProcessor';
import GameScoreSheet from './components/GameScoreSheet';
import { 
  determineVulnerability,
  parseContract,
  calculateBridgeScore
} from './utils/scoring';
import './global.css';

const App = () => {
  // Welcome page state
  const [showWelcome, setShowWelcome] = useState(true);
  
  // NEW: Trial management state
  const [trialManager] = useState(new TrialManager());
  const [showTrialPopup, setShowTrialPopup] = useState(false);
  const [trialType, setTrialType] = useState('info'); // 'info', 'warning', 'expired'
  
  // State to track current view (main game, score adjustment, or final analysis)
  const [currentView, setCurrentView] = useState('game');
  
  // Game state with updated scores structure
  const [gameState, setGameState] = useState({
    gameNumber: 1,
    dealNumber: 1,
    deals: [],
    scores: {
      // Standard bridge (Party Bridge) scores
      nsPoints: 0,
      ewPoints: 0,
      nsTotal: 0,
      ewTotal: 0,
      
      // Bonus Bridge scores - separate tracking
      bonusNsPoints: 0,
      bonusEwPoints: 0,
      bonusNsTotal: 0,
      bonusEwTotal: 0,
      
      // Track which deal number we're on
      currentDealNumber: 1
    },
    currentDeal: {
      dealNumber: 1,
      vulnerable: determineVulnerability(1),
      contract: '',
      result: null,
      tricks: null,
      
      // Standard bridge scores
      nsPoints: 0,
      ewPoints: 0,
      rawScore: 0,
      
      // Bonus bridge scores
      bonusNsPoints: 0,
      bonusEwPoints: 0,
      bonusRawScore: 0,
      
      bonusScoringEnabled: true,
      handAnalysis: null
    },
    showScorePopup: false,
    isAwake: false,
    gameEnded: false
  });

  // NEW: Check trial status when app loads
  useEffect(() => {
    // Check for expiry first
    if (trialManager.isExpired()) {
      setTrialType('expired');
      setShowTrialPopup(true);
      return;
    }
    
    // Check for warnings
    if (trialManager.shouldShowWarning()) {
      setTrialType('warning');
      setShowTrialPopup(true);
      return;
    }
    
    // Show welcome popup on first visit (optional)
    const isFirstVisit = !sessionStorage.getItem('trial_seen');
    if (isFirstVisit && !showWelcome) {
      setTrialType('info');
      setShowTrialPopup(true);
      sessionStorage.setItem('trial_seen', 'true');
    }
  }, [trialManager, showWelcome]);

  // Function to start the game from welcome page
  const handleStartGame = () => {
    setShowWelcome(false);
    
    // Show trial info after welcome if first visit
    const isFirstVisit = !sessionStorage.getItem('trial_seen');
    if (isFirstVisit) {
      setTimeout(() => {
        setTrialType('info');
        setShowTrialPopup(true);
        sessionStorage.setItem('trial_seen', 'true');
      }, 500);
    }
  };

  // NEW: Handle trial popup close
  const handleTrialPopupClose = () => {
    // Can't close expired popup without extension
    if (trialType !== 'expired') {
      setShowTrialPopup(false);
    }
  };

  // NEW: Handle trial extension
  const handleTrialExtended = () => {
    setShowTrialPopup(false);
    // Refresh trial status
    if (trialManager.shouldShowWarning()) {
      setTrialType('warning');
    } else {
      setTrialType('info');
    }
  };
  
  // Function to handle score calculation from ScoreProcessor
  const handleScoreCalculated = (scoreResult) => {
    const { nsPoints, ewPoints, rawScore } = scoreResult;
    
    console.log('App received score calculation:', scoreResult);
    
    // Update the current deal with the calculated scores
    setGameState(prevState => {
      // Check if scores have changed
      if (prevState.currentDeal.nsPoints === nsPoints && 
          prevState.currentDeal.ewPoints === ewPoints) {
        return prevState; // No change needed
      }
      
      const updatedCurrentDeal = {
        ...prevState.currentDeal,
        nsPoints,
        ewPoints,
        rawScore: rawScore || Math.max(Math.abs(nsPoints), Math.abs(ewPoints))
      };
      
      // Calculate which team gets the raw score based on which has positive points
      const nsScores = nsPoints > 0;
      const ewScores = ewPoints > 0;
      
      // Calculate running totals for Party Bridge (standard) scoring
      // Only add raw score to the running total of the team that scored
      const calculatedNsTotal = nsScores ? 
        (prevState.scores.nsTotal || 0) + rawScore : 
        (prevState.scores.nsTotal || 0);
        
      const calculatedEwTotal = ewScores ? 
        (prevState.scores.ewTotal || 0) + rawScore : 
        (prevState.scores.ewTotal || 0);
      
      // Log the calculation details
      console.log('Party Bridge (standard) score calculation:', {
        previousNsTotal: prevState.scores.nsTotal || 0,
        previousEwTotal: prevState.scores.ewTotal || 0,
        nsScores,
        ewScores,
        rawScore,
        newNsTotal: calculatedNsTotal,
        newEwTotal: calculatedEwTotal
      });
      
      // Updated scores with correct running totals
      const updatedScores = {
        ...prevState.scores,
        nsPoints,
        ewPoints,
        nsTotal: calculatedNsTotal,
        ewTotal: calculatedEwTotal,
        currentDealNumber: prevState.dealNumber
      };
      
      console.log('Updating score state:', {
        currentDeal: updatedCurrentDeal,
        scores: updatedScores
      });
      
      return {
        ...prevState,
        currentDeal: updatedCurrentDeal,
        scores: updatedScores
      };
    });
  };
  
  // Function to update current deal
  const updateCurrentDeal = useCallback((dealUpdates) => {
    setGameState(prevState => ({
      ...prevState,
      currentDeal: {
        ...prevState.currentDeal,
        ...dealUpdates
      }
    }));
  }, []);
  
  // Function to handle adjustment input
  const handleSaveAdjustment = (adjustmentData) => {
    setGameState(prevState => ({
      ...prevState,
      currentDeal: {
        ...prevState.currentDeal,
        handAnalysis: adjustmentData,
        bonusScoringEnabled: true
      }
    }));
    
    setCurrentView('analysis');
  };
  
  // Function to handle score analysis saving - UPDATED with trial check
  const handleSaveAnalysis = (scoreResult) => {
    // NEW: Check trial limit before proceeding
    if (!trialManager.canPlayDeals()) {
      setTrialType('expired');
      setShowTrialPopup(true);
      return; // Block progression
    }

    console.log('Handling save analysis with result:', scoreResult);
    
    // Extract the complete deal with bonus scores
    const currentDealWithBonusScores = scoreResult.currentDealWithBonusScores || {
      ...gameState.currentDeal,
      dealNumber: gameState.dealNumber,
      bonusNsPoints: scoreResult.nsPoints || 0,  // Store as bonus scores
      bonusEwPoints: scoreResult.ewPoints || 0   // Store as bonus scores
    };
    
    // Calculate raw score for bonus scoring if not provided
    const bonusRawScore = Math.max(
      Math.abs(scoreResult.nsPoints || 0),
      Math.abs(scoreResult.ewPoints || 0)
    );
    
    // Calculate running totals for bonus scoring
    const nsScores = scoreResult.nsPoints > 0;
    const ewScores = scoreResult.ewPoints > 0;
    
    const bonusNsTotal = nsScores ? 
      (gameState.scores.bonusNsTotal || 0) + bonusRawScore : 
      (gameState.scores.bonusNsTotal || 0);
    
    const bonusEwTotal = ewScores ? 
      (gameState.scores.bonusEwTotal || 0) + bonusRawScore : 
      (gameState.scores.bonusEwTotal || 0);
    
    console.log('Bonus Bridge score calculation:', {
      nsScores,
      ewScores,
      bonusRawScore,
      previousBonusNsTotal: gameState.scores.bonusNsTotal || 0,
      previousBonusEwTotal: gameState.scores.bonusEwTotal || 0,
      newBonusNsTotal: bonusNsTotal,
      newBonusEwTotal: bonusEwTotal
    });
    
    // Store the complete deal with both raw and bonus scores
    const completeCurrentDeal = {
      ...currentDealWithBonusScores,
      rawScore: currentDealWithBonusScores.rawScore || 0,  // Party Bridge score
      bonusRawScore: bonusRawScore,                        // Bonus Bridge score
      nsPoints: currentDealWithBonusScores.nsPoints || 0,  // Party Bridge points
      ewPoints: currentDealWithBonusScores.ewPoints || 0,  // Party Bridge points
      bonusNsPoints: scoreResult.nsPoints || 0,            // Bonus Bridge points
      bonusEwPoints: scoreResult.ewPoints || 0             // Bonus Bridge points
    };

    // NEW: Increment deal counter
    const canContinue = trialManager.incrementDeals();
    
    // Update game state with new deal
    setGameState(prevState => {
      return {
        ...prevState,
        dealNumber: prevState.dealNumber + 1,
        deals: [...prevState.deals, completeCurrentDeal],
        scores: {
          ...prevState.scores,
          // Reset current deal scores to 0
          nsPoints: 0,
          ewPoints: 0,
          // Preserve running totals for both scoring systems
          nsTotal: prevState.scores.nsTotal || 0,
          ewTotal: prevState.scores.ewTotal || 0,
          bonusNsTotal: bonusNsTotal,
          bonusEwTotal: bonusEwTotal,
          currentDealNumber: prevState.dealNumber + 1
        },
        currentDeal: {
          dealNumber: prevState.dealNumber + 1,
          vulnerable: determineVulnerability(prevState.dealNumber + 1),
          contract: '',
          result: null,
          tricks: null,
          nsPoints: 0,
          ewPoints: 0,
          rawScore: 0,
          bonusNsPoints: 0,
          bonusEwPoints: 0,
          bonusRawScore: 0,
          bonusScoringEnabled: true,
          handAnalysis: null
        },
        showScorePopup: false
      };
    });

    // NEW: Check trial status after increment
    if (!canContinue) {
      setTrialType('expired');
      setShowTrialPopup(true);
    } else if (trialManager.shouldShowWarning()) {
      setTrialType('warning');
      setShowTrialPopup(true);
    }
    
    // Return to the game view
    setCurrentView('game');
  };
  
  // Function to handle next deal without adjustments - UPDATED with trial check
  const handleNextDeal = (currentDealWithScores = null, updatedScores = null) => {
    // NEW: Check trial limit before proceeding
    if (!trialManager.canPlayDeals()) {
      setTrialType('expired');
      setShowTrialPopup(true);
      return; // Block progression
    }

    // Use provided scores or current state
    const dealToSave = currentDealWithScores || gameState.currentDeal;
    const scoresToUse = updatedScores || gameState.scores;
    
    // Ensure the deal has scores
    if (!dealToSave.nsPoints && !dealToSave.ewPoints && dealToSave.contract) {
      // Calculate if needed
      const contractDetails = parseContract(
        dealToSave.contract, 
        dealToSave.result, 
        dealToSave.vulnerable
      );
      
      if (contractDetails) {
        const standardScore = calculateBridgeScore(contractDetails);
        
        // Calculate raw score
        const rawScore = Math.max(
          Math.abs(standardScore.nsPoints || 0), 
          Math.abs(standardScore.ewPoints || 0)
        );
        
        // Update scores
        dealToSave.nsPoints = standardScore.nsPoints || 0;
        dealToSave.ewPoints = standardScore.ewPoints || 0;
        dealToSave.rawScore = rawScore;
        
        // Determine which team scores positive points
        const nsScores = standardScore.nsPoints > 0;
        const ewScores = standardScore.ewPoints > 0;
        
        // Calculate running totals for Party Bridge
        const calculatedNsTotal = nsScores ? 
          (scoresToUse.nsTotal || 0) + rawScore : 
          (scoresToUse.nsTotal || 0);
        
        const calculatedEwTotal = ewScores ? 
          (scoresToUse.ewTotal || 0) + rawScore : 
          (scoresToUse.ewTotal || 0);
        
        console.log('Next deal Party Bridge score calculation:', {
          nsScores, 
          ewScores, 
          rawScore, 
          previousNsTotal: scoresToUse.nsTotal || 0,
          previousEwTotal: scoresToUse.ewTotal || 0,
          newNsTotal: calculatedNsTotal,
          newEwTotal: calculatedEwTotal
        });

        // NEW: Increment deal counter
        const canContinue = trialManager.incrementDeals();
        
        // Update game state with new deal
        setGameState(prevState => {
          return {
            ...prevState,
            dealNumber: prevState.dealNumber + 1,
            deals: [...prevState.deals, dealToSave],
            scores: {
              ...prevState.scores,
              nsPoints: 0, // Reset to 0 for the new deal
              ewPoints: 0, // Reset to 0 for the new deal
              nsTotal: calculatedNsTotal,
              ewTotal: calculatedEwTotal,
              // Keep bonus scores unchanged
              bonusNsTotal: prevState.scores.bonusNsTotal || 0,
              bonusEwTotal: prevState.scores.bonusEwTotal || 0,
              currentDealNumber: prevState.dealNumber + 1
            },
            currentDeal: {
              dealNumber: prevState.dealNumber + 1,
              vulnerable: determineVulnerability(prevState.dealNumber + 1),
              contract: '',
              result: null,
              tricks: null,
              nsPoints: 0,
              ewPoints: 0,
              rawScore: 0,
              bonusNsPoints: 0,
              bonusEwPoints: 0,
              bonusRawScore: 0,
              bonusScoringEnabled: true,
              handAnalysis: null
            },
            showScorePopup: false
          };
        });

        // NEW: Check trial status after increment
        if (!canContinue) {
          setTrialType('expired');
          setShowTrialPopup(true);
        } else if (trialManager.shouldShowWarning()) {
          setTrialType('warning');
          setShowTrialPopup(true);
        }
      }
    } else {
      // Already has scores, just save and proceed
      const rawScore = dealToSave.rawScore || Math.max(
        Math.abs(dealToSave.nsPoints || 0), 
        Math.abs(dealToSave.ewPoints || 0)
      );
      
      const nsScores = dealToSave.nsPoints > 0;
      const ewScores = dealToSave.ewPoints > 0;
      
      const calculatedNsTotal = nsScores ? 
        (scoresToUse.nsTotal || 0) + rawScore : 
        (scoresToUse.nsTotal || 0);
      
      const calculatedEwTotal = ewScores ? 
        (scoresToUse.ewTotal || 0) + rawScore : 
        (scoresToUse.ewTotal || 0);
      
      console.log('Next deal with existing scores:', {
        nsScores, 
        ewScores, 
        rawScore, 
        previousNsTotal: scoresToUse.nsTotal || 0,
        previousEwTotal: scoresToUse.ewTotal || 0,
        newNsTotal: calculatedNsTotal,
        newEwTotal: calculatedEwTotal
      });

      // NEW: Increment deal counter
      const canContinue = trialManager.incrementDeals();
      
      // Update game state with new deal
      setGameState(prevState => {
        return {
          ...prevState,
          dealNumber: prevState.dealNumber + 1,
          deals: [...prevState.deals, dealToSave],
          scores: {
            ...prevState.scores,
            nsPoints: 0, // Reset to 0 for the new deal
            ewPoints: 0, // Reset to 0 for the new deal
            nsTotal: calculatedNsTotal,
            ewTotal: calculatedEwTotal,
            // Keep bonus scores unchanged
            bonusNsTotal: prevState.scores.bonusNsTotal || 0,
            bonusEwTotal: prevState.scores.bonusEwTotal || 0,
            currentDealNumber: prevState.dealNumber + 1
          },
          currentDeal: {
            dealNumber: prevState.dealNumber + 1,
            vulnerable: determineVulnerability(prevState.dealNumber + 1),
            contract: '',
            result: null,
            tricks: null,
            nsPoints: 0,
            ewPoints: 0,
            rawScore: 0,
            bonusNsPoints: 0,
            bonusEwPoints: 0,
            bonusRawScore: 0,
            bonusScoringEnabled: true,
            handAnalysis: null
          },
          showScorePopup: false
        };
      });

      // NEW: Check trial status after increment
      if (!canContinue) {
        setTrialType('expired');
        setShowTrialPopup(true);
      } else if (trialManager.shouldShowWarning()) {
        setTrialType('warning');
        setShowTrialPopup(true);
      }
    }
  };
  
  // Function to start a new game
  const handleNewGame = () => {
    // Check if we're ending the current game or starting fresh
    if (gameState.deals.length > 0) {
      // Mark game as ended to show summary
      setGameState(prevState => ({
        ...prevState,
        gameEnded: true
      }));
    } else {
      // Reset the game state for a fresh start
      setGameState({
        gameNumber: gameState.gameNumber + 1,
        dealNumber: 1,
        deals: [],
        scores: {
          nsPoints: 0,
          ewPoints: 0,
          nsTotal: 0,
          ewTotal: 0,
          bonusNsPoints: 0,
          bonusEwPoints: 0,
          bonusNsTotal: 0,
          bonusEwTotal: 0,
          currentDealNumber: 1
        },
        currentDeal: {
          dealNumber: 1,
          vulnerable: determineVulnerability(1),
          contract: '',
          result: null,
          tricks: null,
          nsPoints: 0,
          ewPoints: 0,
          rawScore: 0,
          bonusNsPoints: 0,
          bonusEwPoints: 0,
          bonusRawScore: 0,
          bonusScoringEnabled: true,
          handAnalysis: null
        },
        showScorePopup: false,
        isAwake: gameState.isAwake,
        gameEnded: false
      });
    }
  };
  
  // Function to return to the game after viewing summary
  const handleReturnToGame = () => {
    // Reset the game state for a fresh start
    setGameState({
      gameNumber: gameState.gameNumber + 1,
      dealNumber: 1,
      deals: [],
      scores: {
        nsPoints: 0,
        ewPoints: 0,
        nsTotal: 0,
        ewTotal: 0,
        bonusNsPoints: 0,
        bonusEwPoints: 0,
        bonusNsTotal: 0,
        bonusEwTotal: 0,
        currentDealNumber: 1
      },
      currentDeal: {
        dealNumber: 1,
        vulnerable: determineVulnerability(1),
        contract: '',
        result: null,
        tricks: null,
        nsPoints: 0,
        ewPoints: 0,
        rawScore: 0,
        bonusNsPoints: 0,
        bonusEwPoints: 0,
        bonusRawScore: 0,
        bonusScoringEnabled: true,
        handAnalysis: null
      },
      showScorePopup: false,
      isAwake: gameState.isAwake,
      gameEnded: false
    });
  };
  
  // Function to handle choosing Bonus Bridge scoring
  const handleChooseBonusBridge = () => {
    setCurrentView('adjustment');
  };
  
  // Function to handle choosing Party Bridge scoring (standard)
  const handleChoosePartyBridge = () => {
    // Calculate standard bridge score
    const contractDetails = parseContract(
      gameState.currentDeal.contract, 
      gameState.currentDeal.result, 
      gameState.currentDeal.vulnerable
    );
    
    if (contractDetails) {
      const standardScore = calculateBridgeScore(contractDetails);
      
      // Calculate raw score
      const rawScore = Math.max(
        Math.abs(standardScore.nsPoints || 0), 
        Math.abs(standardScore.ewPoints || 0)
      );
      
      // Update current deal with standard scores
      const currentDealWithScores = {
        ...gameState.currentDeal,
        nsPoints: standardScore.nsPoints || 0,
        ewPoints: standardScore.ewPoints || 0,
        rawScore,
        bonusScoringEnabled: false
      };
      
      // Calculate running totals using raw scores
      const nsScores = standardScore.nsPoints > 0;
      const ewScores = standardScore.ewPoints > 0;
      
      const nsRawTotal = nsScores ? 
        (gameState.scores.nsTotal || 0) + rawScore : 
        (gameState.scores.nsTotal || 0);
      
      const ewRawTotal = ewScores ? 
        (gameState.scores.ewTotal || 0) + rawScore : 
        (gameState.scores.ewTotal || 0);
      
      // For immediate feedback of the current score
      const updatedScores = {
        ...gameState.scores,
        nsPoints: standardScore.nsPoints || 0,
        ewPoints: standardScore.ewPoints || 0,
        nsTotal: nsRawTotal,
        ewTotal: ewRawTotal,
        
        // Important: Don't update bonus scores for Party Bridge
        currentDealNumber: gameState.dealNumber
      };
      
      // Update game state with scores
      setGameState(prevState => {
        return {
          ...prevState,
          currentDeal: currentDealWithScores,
          scores: updatedScores,
          showScorePopup: false // Make sure popup is closed
        };
      });
      
      // Then proceed to next deal after a short delay to ensure UI updates
      setTimeout(() => {
        handleNextDeal(currentDealWithScores, updatedScores);
      }, 100);
    }
  };
  
  // Determine which view to show - UPDATED with trial popup
  const renderCurrentView = () => {
    // Show trial popup if needed (highest priority)
    if (showTrialPopup) {
      return (
        <TrialPopup
          trialManager={trialManager}
          onClose={handleTrialPopupClose}
          onExtended={handleTrialExtended}
          type={trialType}
        />
      );
    }

    // Show welcome page
    if (showWelcome) {
      return <WelcomePage onStartGame={handleStartGame} />;
    }

    // Block access if trial expired (backup check)
    if (trialManager.isExpired() && trialType === 'expired') {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          flexDirection: 'column',
          textAlign: 'center',
          padding: '20px',
          backgroundColor: '#f5f5f5'
        }}>
          <h2 style={{ color: '#f44336', marginBottom: '20px' }}>
            🚫 Trial Period Expired
          </h2>
          <p style={{ marginBottom: '20px', color: '#555' }}>
            Your evaluation period has ended. Please contact Mike Smith for an extension.
          </p>
          <button 
            onClick={() => setShowTrialPopup(true)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#1e5c8b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Enter Extension Code
          </button>
        </div>
      );
    }

    // Regular app flow
    if (gameState.gameEnded) {
      return (
        <GameScoreSheet 
          gameState={gameState}
          onNewGame={handleReturnToGame}
        />
      );
    }
    
    switch(currentView) {
      case 'adjustment':
        return (
          <ScoreAdjustment 
            currentDeal={gameState.currentDeal}
            onSaveAdjustment={handleSaveAdjustment}
            onCancel={() => setCurrentView('game')}
          />
        );
      case 'analysis':
        return (
          <FinalScoreAnalysis 
            analysisData={gameState.currentDeal.handAnalysis}
            currentDeal={gameState.currentDeal}
            onSave={handleSaveAnalysis}
            onEdit={() => setCurrentView('adjustment')}
            setGameState={setGameState}
            scores={gameState.scores}
          />
        );
      case 'game':
      default:
        return (
          <>
            <ScoreProcessor 
              currentDeal={gameState.currentDeal}
              onScoreCalculated={handleScoreCalculated}
            />
            <BridgeGameUI 
              gameState={gameState}
              updateCurrentDeal={updateCurrentDeal}
              onNextDeal={handleNextDeal}
              onNewGame={handleNewGame}
              setGameState={setGameState}
              onChooseBonusBridge={handleChooseBonusBridge}
              onChoosePartyBridge={handleChoosePartyBridge}
              // NEW: Pass trial info to UI (optional)
              remainingDeals={trialManager.getRemainingDeals()}
              trialManager={trialManager}
            />
          </>
        );
    }
  };
  
  return (
    <div className="app-container">
      {renderCurrentView()}
    </div>
  );
};

export default App;