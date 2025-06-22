import React, { useState, useCallback } from 'react';
import WelcomePage from './components/WelcomePage';
import TrialManager from './utils/TrialManager';
import TrialPopup from './components/TrialPopup';
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
  const [showWelcome, setShowWelcome] = useState(true);
  const [trialManager] = useState(new TrialManager());
  const [showTrialPopup, setShowTrialPopup] = useState(false);
  const [trialType, setTrialType] = useState('info');
  const [currentView, setCurrentView] = useState('game');
  
  const [gameState, setGameState] = useState({
    gameNumber: 1,
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
    isAwake: false,
    gameEnded: false
  });

  const handleStartGame = () => {
    setShowWelcome(false);
    
    const remainingDeals = trialManager.getRemainingDeals();
    const stats = trialManager.getStats();
    const totalDeals = stats?.maxDeals || 50;
    const dealsPlayed = stats?.dealsPlayed || 0;
    
    if (trialManager.isExpired()) {
      setTrialType('expired');
      setShowTrialPopup(true);
    } else if (dealsPlayed === 0 && totalDeals <= 50) {
      setTrialType('info');
      setShowTrialPopup(true);
    } else if (remainingDeals <= 10 && remainingDeals > 0) {
      setTrialType('warning');
      setShowTrialPopup(true);
    } else if (trialManager.shouldShowWarning()) {
      setTrialType('warning');
      setShowTrialPopup(true);
    }
  };

  const handleTrialPopupClose = () => {
    if (trialType !== 'expired') {
      setShowTrialPopup(false);
    }
  };

  const handleTrialExtended = () => {
    setShowTrialPopup(false);
  };

  const handleExtensionRequest = (returnType = null) => {
    if (returnType === 'info') {
      setTrialType('info');
    } else {
      setTrialType('extension');
    }
  };
  
  const handleScoreCalculated = (scoreResult) => {
    const { nsPoints, ewPoints, rawScore } = scoreResult;
    
    setGameState(prevState => {
      if (prevState.currentDeal.nsPoints === nsPoints && 
          prevState.currentDeal.ewPoints === ewPoints) {
        return prevState;
      }
      
      const updatedCurrentDeal = {
        ...prevState.currentDeal,
        nsPoints,
        ewPoints,
        rawScore: rawScore || Math.max(Math.abs(nsPoints), Math.abs(ewPoints))
      };
      
      const nsScores = nsPoints > 0;
      const ewScores = ewPoints > 0;
      
      const calculatedNsTotal = nsScores ? 
        (prevState.scores.nsTotal || 0) + rawScore : 
        (prevState.scores.nsTotal || 0);
        
      const calculatedEwTotal = ewScores ? 
        (prevState.scores.ewTotal || 0) + rawScore : 
        (prevState.scores.ewTotal || 0);
      
      const updatedScores = {
        ...prevState.scores,
        nsPoints,
        ewPoints,
        nsTotal: calculatedNsTotal,
        ewTotal: calculatedEwTotal,
        currentDealNumber: prevState.dealNumber
      };
      
      return {
        ...prevState,
        currentDeal: updatedCurrentDeal,
        scores: updatedScores
      };
    });
  };
  
  const updateCurrentDeal = useCallback((dealUpdates) => {
    setGameState(prevState => ({
      ...prevState,
      currentDeal: {
        ...prevState.currentDeal,
        ...dealUpdates
      }
    }));
  }, []);
  
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
  
  const handleSaveAnalysis = (scoreResult) => {
    if (!trialManager.canPlayDeals()) {
      setTrialType('expired');
      setShowTrialPopup(true);
      return;
    }

    const currentDealWithBonusScores = scoreResult.currentDealWithBonusScores || {
      ...gameState.currentDeal,
      dealNumber: gameState.dealNumber,
      bonusNsPoints: scoreResult.nsPoints || 0,
      bonusEwPoints: scoreResult.ewPoints || 0
    };
    
    const bonusRawScore = Math.max(
      Math.abs(scoreResult.nsPoints || 0),
      Math.abs(scoreResult.ewPoints || 0)
    );
    
    const nsScores = scoreResult.nsPoints > 0;
    const ewScores = scoreResult.ewPoints > 0;
    
    const bonusNsTotal = nsScores ? 
      (gameState.scores.bonusNsTotal || 0) + bonusRawScore : 
      (gameState.scores.bonusNsTotal || 0);
    
    const bonusEwTotal = ewScores ? 
      (gameState.scores.bonusEwTotal || 0) + bonusRawScore : 
      (gameState.scores.bonusEwTotal || 0);
    
    const completeCurrentDeal = {
      ...currentDealWithBonusScores,
      rawScore: currentDealWithBonusScores.rawScore || 0,
      bonusRawScore: bonusRawScore,
      nsPoints: currentDealWithBonusScores.nsPoints || 0,
      ewPoints: currentDealWithBonusScores.ewPoints || 0,
      bonusNsPoints: scoreResult.nsPoints || 0,
      bonusEwPoints: scoreResult.ewPoints || 0
    };

    const canContinue = trialManager.incrementDeals();
    
    setGameState(prevState => {
      return {
        ...prevState,
        dealNumber: prevState.dealNumber + 1,
        deals: [...prevState.deals, completeCurrentDeal],
        scores: {
          ...prevState.scores,
          nsPoints: 0,
          ewPoints: 0,
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

    if (!canContinue) {
      setTrialType('expired');
      setShowTrialPopup(true);
    } else if (trialManager.shouldShowWarning()) {
      setTrialType('warning');
      setShowTrialPopup(true);
    }
    
    setCurrentView('game');
  };
  
  const handleNextDeal = (currentDealWithScores = null, updatedScores = null) => {
    if (!trialManager.canPlayDeals()) {
      setTrialType('expired');
      setShowTrialPopup(true);
      return;
    }

    const dealToSave = currentDealWithScores || gameState.currentDeal;
    const scoresToUse = updatedScores || gameState.scores;
    
    if (!dealToSave.nsPoints && !dealToSave.ewPoints && dealToSave.contract) {
      const contractDetails = parseContract(
        dealToSave.contract, 
        dealToSave.result, 
        dealToSave.vulnerable
      );
      
      if (contractDetails) {
        const standardScore = calculateBridgeScore(contractDetails);
        
        const rawScore = Math.max(
          Math.abs(standardScore.nsPoints || 0), 
          Math.abs(standardScore.ewPoints || 0)
        );
        
        dealToSave.nsPoints = standardScore.nsPoints || 0;
        dealToSave.ewPoints = standardScore.ewPoints || 0;
        dealToSave.rawScore = rawScore;
        
        const nsScores = standardScore.nsPoints > 0;
        const ewScores = standardScore.ewPoints > 0;
        
        const calculatedNsTotal = nsScores ? 
          (scoresToUse.nsTotal || 0) + rawScore : 
          (scoresToUse.nsTotal || 0);
        
        const calculatedEwTotal = ewScores ? 
          (scoresToUse.ewTotal || 0) + rawScore : 
          (scoresToUse.ewTotal || 0);

        const canContinue = trialManager.incrementDeals();
        
        setGameState(prevState => {
          return {
            ...prevState,
            dealNumber: prevState.dealNumber + 1,
            deals: [...prevState.deals, dealToSave],
            scores: {
              ...prevState.scores,
              nsPoints: 0,
              ewPoints: 0,
              nsTotal: calculatedNsTotal,
              ewTotal: calculatedEwTotal,
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

        if (!canContinue) {
          setTrialType('expired');
          setShowTrialPopup(true);
        } else if (trialManager.shouldShowWarning()) {
          setTrialType('warning');
          setShowTrialPopup(true);
        }
      }
    } else {
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

      const canContinue = trialManager.incrementDeals();
      
      setGameState(prevState => {
        return {
          ...prevState,
          dealNumber: prevState.dealNumber + 1,
          deals: [...prevState.deals, dealToSave],
          scores: {
            ...prevState.scores,
            nsPoints: 0,
            ewPoints: 0,
            nsTotal: calculatedNsTotal,
            ewTotal: calculatedEwTotal,
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

      if (!canContinue) {
        setTrialType('expired');
        setShowTrialPopup(true);
      } else if (trialManager.shouldShowWarning()) {
        setTrialType('warning');
        setShowTrialPopup(true);
      }
    }
  };
  
  const handleNewGame = () => {
    if (gameState.deals.length > 0) {
      setGameState(prevState => ({
        ...prevState,
        gameEnded: true
      }));
    } else {
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
  
  const handleReturnToGame = () => {
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
  
  const handleChooseBonusBridge = () => {
    setCurrentView('adjustment');
  };
  
  const handleChoosePartyBridge = () => {
    const contractDetails = parseContract(
      gameState.currentDeal.contract, 
      gameState.currentDeal.result, 
      gameState.currentDeal.vulnerable
    );
    
    if (contractDetails) {
      const standardScore = calculateBridgeScore(contractDetails);
      
      const rawScore = Math.max(
        Math.abs(standardScore.nsPoints || 0), 
        Math.abs(standardScore.ewPoints || 0)
      );
      
      const currentDealWithScores = {
        ...gameState.currentDeal,
        nsPoints: standardScore.nsPoints || 0,
        ewPoints: standardScore.ewPoints || 0,
        rawScore,
        bonusScoringEnabled: false
      };
      
      const nsScores = standardScore.nsPoints > 0;
      const ewScores = standardScore.ewPoints > 0;
      
      const nsRawTotal = nsScores ? 
        (gameState.scores.nsTotal || 0) + rawScore : 
        (gameState.scores.nsTotal || 0);
      
      const ewRawTotal = ewScores ? 
        (gameState.scores.ewTotal || 0) + rawScore : 
        (gameState.scores.ewTotal || 0);
      
      const updatedScores = {
        ...gameState.scores,
        nsPoints: standardScore.nsPoints || 0,
        ewPoints: standardScore.ewPoints || 0,
        nsTotal: nsRawTotal,
        ewTotal: ewRawTotal,
        currentDealNumber: gameState.dealNumber
      };
      
      setGameState(prevState => {
        return {
          ...prevState,
          currentDeal: currentDealWithScores,
          scores: updatedScores,
          showScorePopup: false
        };
      });
      
      setTimeout(() => {
        handleNextDeal(currentDealWithScores, updatedScores);
      }, 100);
    }
  };
  
  const renderCurrentView = () => {
    if (showWelcome) {
      return <WelcomePage onStartGame={handleStartGame} />;
    }

    if (showTrialPopup) {
      return (
        <TrialPopup
          trialManager={trialManager}
          onClose={handleTrialPopupClose}
          onExtended={handleTrialExtended}
          onExtensionRequest={handleExtensionRequest}
          type={trialType}
        />
      );
    }

    if (trialManager.isExpired()) {
      setTrialType('expired');
      setShowTrialPopup(true);
      return null;
    }

    if (gameState.gameEnded) {
      return (
        <GameScoreSheet 
          gameState={gameState}
          onNewGame={handleReturnToGame}
          trialManager={trialManager}
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