import React, { useState } from 'react';
import BonusBridgeExplanation from './BonusBridgeExplanation';
import './FinalScoreAnalysis.css';

/**
 * Component to display final score analysis after Bonus Bridge adjustments
 * Redesigned for mobile with tabbed sections and improved UI
 */
const FinalScoreAnalysis = ({ 
  analysisData, 
  currentDeal, 
  onSave, 
  onEdit,
  setGameState,
  scores
}) => {
  // State for active tab
  const [activeTab, setActiveTab] = useState('calculation');
  // State for showing explanation
  const [showExplanation, setShowExplanation] = useState(false);
  // State for showing scores so far
  const [showScoresSoFar, setShowScoresSoFar] = useState(false);
  // State for end game confirmation
  const [showEndGameConfirm, setShowEndGameConfirm] = useState(false);
  
  // Determine if the contract was made
  const madeContract = currentDeal.result >= 0;
  
  // Extract information for display
  const {
    totalHCP,
    declarerHCPPercentage,
    defenderHCPPercentage,
    hcpAdvantage,
    advantageSide,
    expectedHCP,
    singletons,
    voids,
    longSuits,
    distributionPoints,
    contractExpectedTricks,
    handExpectedTricks,
    nsPoints,
    ewPoints
  } = analysisData;
  
  // Format contract for display
  const formatContract = () => {
    if (!currentDeal || !currentDeal.contract) return "";
    
    // Parse contract components
    const contractMatch = currentDeal.contract.match(/(\d)([♣♦♥♠]|NT)\s+([NESW])(X{0,2})/);
    if (!contractMatch) return currentDeal.contract;
    
    const level = contractMatch[1];
    const suit = contractMatch[2];
    const declarer = contractMatch[3];
    const doubled = contractMatch[4] || "";
    
    // Format doubled status
    let doubledText = "";
    if (doubled === "X") {
      doubledText = " Doubled";
    } else if (doubled === "XX") {
      doubledText = " Redoubled";
    }
    
    // Get full declarer direction
    let declarerFull = "";
    switch (declarer) {
      case 'N': declarerFull = "North"; break;
      case 'E': declarerFull = "East"; break;
      case 'S': declarerFull = "South"; break;
      case 'W': declarerFull = "West"; break;
      default: declarerFull = declarer;
    }
    
    return `${level}${suit} By ${declarerFull}${doubledText}`;
  };
  
  // Get contract category description
  const getContractCategory = () => {
    if (!madeContract) {
      // For defeated contracts
      const undertricks = Math.abs(currentDeal.result);
      
      // Check if it's a game contract
      const contractMatch = currentDeal.contract.match(/(\d)([♣♦♥♠]|NT)\s+([NESW])(X{0,2})/);
      if (!contractMatch) return "Defeated Contract";
      
      const level = parseInt(contractMatch[1]);
      const suit = contractMatch[2];
      
      const isGameContract = 
        (level === 3 && suit === 'NT') ||
        (level === 4 && (suit === '♥' || suit === '♠')) ||
        (level === 5 && (suit === '♣' || suit === '♦')) ||
        level >= 6;
      
      if (level >= 6) {
        return `Failed Slam Attempt (Down ${undertricks})`;
      } else if (isGameContract) {
        return `Failed Game Contract (Down ${undertricks})`;
      } else {
        return `Failed Part Score (Down ${undertricks})`;
      }
    } else {
      // For made contracts
      const overtricks = currentDeal.result;
      
      // Check contract type
      const contractMatch = currentDeal.contract.match(/(\d)([♣♦♥♠]|NT)\s+([NESW])(X{0,2})/);
      if (!contractMatch) return "Made Contract";
      
      const level = parseInt(contractMatch[1]);
      const suit = contractMatch[2];
      const doubled = contractMatch[4] || "";
      
      const isGameContract = 
        (level === 3 && suit === 'NT') ||
        (level === 4 && (suit === '♥' || suit === '♠')) ||
        (level === 5 && (suit === '♣' || suit === '♦')) ||
        level >= 6;
      
      // Check HCP relationship to expected
      const hcpDifference = totalHCP - expectedHCP;
      const hcpStatus = hcpDifference >= 2 ? "Strong" : (hcpDifference <= -2 ? "Weak" : "Balanced");
      
      // Include doubled status in category
      let doubledStatus = "";
      if (doubled === "X") {
        doubledStatus = " Doubled";
      } else if (doubled === "XX") {
        doubledStatus = " Redoubled";
      }
      
      if (level >= 6) {
        return `Made Slam${doubledStatus}${overtricks > 0 ? ` (+${overtricks})` : ''}`;
      } else if (isGameContract) {
        return `Made Game${doubledStatus} with ${hcpStatus} Hand${overtricks > 0 ? ` (+${overtricks})` : ''}`;
      } else {
        return `Made Part Score${doubledStatus}${overtricks > 0 ? ` (+${overtricks})` : ''}`;
      }
    }
  };
  
  // Various handlers
  const handleShowExplanation = () => setShowExplanation(true);
  const handleHideExplanation = () => setShowExplanation(false);
  const toggleScoresSoFar = () => setShowScoresSoFar(!showScoresSoFar);
  const handleShowEndGameConfirm = () => setShowEndGameConfirm(true);
  const handleHideEndGameConfirm = () => setShowEndGameConfirm(false);
  
  // End the game and show final results
  const handleEndGame = () => {
    // First save the current deal's scores
    handleSave();
    
    // Then set the game as ended to trigger GameScoreSheet display
    setTimeout(() => {
      setGameState(prevState => ({
        ...prevState,
        gameEnded: true
      }));
    }, 100);
  };
  
  // Change active tab
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  // Handle save and continue
  const handleSave = () => {
    // Calculate final scores to send to parent
    const finalScore = {
      nsPoints: nsPoints || 0,
      ewPoints: ewPoints || 0,
      currentDealWithBonusScores: {
        ...currentDeal,
        bonusNsPoints: nsPoints || 0,
        bonusEwPoints: ewPoints || 0
      }
    };
    
    onSave(finalScore);
  };
  
  // Get final score from calculation steps
  const getFinalScore = () => {
    if (madeContract) {
      // Determine which side gets the score
      const contractMatch = currentDeal.contract.match(/(\d)([♣♦♥♠]|NT)\s+([NESW])(X{0,2})/);
      if (!contractMatch) return { declarerPoints: 0, defenderPoints: 0 };
      
      const declarer = contractMatch[3];
      const isNS = declarer === 'N' || declarer === 'S';
      
      if (isNS) {
        return {
          declarerTeam: "North-South",
          defenderTeam: "East-West",
          declarerPoints: nsPoints,
          defenderPoints: ewPoints
        };
      } else {
        return {
          declarerTeam: "East-West",
          defenderTeam: "North-South",
          declarerPoints: ewPoints,
          defenderPoints: nsPoints
        };
      }
    } else {
      // For defeated contracts - defenders get the points
      const contractMatch = currentDeal.contract.match(/(\d)([♣♦♥♠]|NT)\s+([NESW])(X{0,2})/);
      if (!contractMatch) return { defenderPoints: 0, declarerPoints: 0 };
      
      const declarer = contractMatch[3];
      const isNS = declarer === 'N' || declarer === 'S';
      
      if (isNS) {
        // NS is declarer, EW is defender
        return {
          declarerTeam: "North-South",
          defenderTeam: "East-West",
          declarerPoints: nsPoints,
          defenderPoints: ewPoints
        };
      } else {
        // EW is declarer, NS is defender
        return {
          declarerTeam: "East-West",
          defenderTeam: "North-South",
          declarerPoints: ewPoints,
          defenderPoints: nsPoints
        };
      }
    }
  };
  
  // Get calculation steps for display
  const getCalculationSteps = () => {
    if (madeContract) {
      return [
        { 
          label: "1. Raw Score / 20:", 
          value: `${(analysisData.rawScore || 0).toFixed(1)} points` 
        },
        { 
          label: "2. HCP Adjustment:", 
          value: `${(analysisData.hcpAdjustment || 0).toFixed(2)} points` 
        },
        { 
          label: "3. After HCP Adjustment:", 
          value: `${(analysisData.afterHcpAdjustment || 0).toFixed(1)} points` 
        },
        { 
          label: "4. Performance Variance:", 
          value: `${analysisData.performanceVariance || 0} tricks` 
        },
        { 
          label: "5. After Performance Assessment:", 
          value: `${(analysisData.afterPerformanceAssessment || 0).toFixed(1)} points` 
        },
        { 
          label: "6. Contract Type Adjustment:", 
          value: `${(analysisData.contractTypeAdjustment || 0).toFixed(1)} ${analysisData.contractTypeDescription || ''}` 
        },
        { 
          label: "7. After Contract Adjustments:", 
          value: `${(analysisData.afterContractAdjustments || 0).toFixed(1)} points` 
        },
        { 
          label: "8. Distribution Adjustment:", 
          value: `${(analysisData.distributionAdjustment || 0).toFixed(1)} points` 
        },
        { 
          label: "9. Defender Reward:", 
          value: `${(analysisData.defenderReward || 0).toFixed(1)} points` 
        }
      ];
    } else {
      // For defeated contracts
      return [
        { 
          label: "1. Base Penalty:", 
          value: `${(analysisData.basePenalty || 0).toFixed(1)} points` 
        },
        { 
          label: "2. Contract Level Penalties:", 
          value: `${(analysisData.levelPenalties || 0).toFixed(1)} points` 
        },
        { 
          label: "3. Performance Bonus:", 
          value: `${(analysisData.performanceBonus || 0).toFixed(1)} points` 
        },
        { 
          label: "4. Declarer Consolation:", 
          value: `${(analysisData.consolationPoints || 0).toFixed(1)} points` 
        }
      ];
    }
  };
  
  // Get final score for display
  const finalScore = getFinalScore();
  
  // Get scores so far for display - including the current deal's scores
  const getScoresSoFar = () => {
    // Get the running totals from scores prop
    const baseTotals = {
      nsTotal: scores?.nsTotal || 0,
      ewTotal: scores?.ewTotal || 0,
      bonusNsTotal: scores?.bonusNsTotal || 0,
      bonusEwTotal: scores?.bonusEwTotal || 0
    };
    
    // Add the current deal's points to provide the most updated view
    return {
      nsTotal: baseTotals.nsTotal,
      ewTotal: baseTotals.ewTotal,
      bonusNsTotal: baseTotals.bonusNsTotal + (nsPoints || 0),
      bonusEwTotal: baseTotals.bonusEwTotal + (ewPoints || 0)
    };
  };
  
  const scoresSoFar = getScoresSoFar();
  
  // Popup styles
  const popupStyles = {
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
      backgroundColor: '#3c8c5c'
    }
  };
  
  return (
    <div className="final-score-analysis">
      <header className="analysis-header">
        <div className="title-container">
          <h1>Final Score Analysis - Deal #{currentDeal.dealNumber}</h1>
          <p>Bonus Bridge Score Calculation</p>
        </div>
        <div className="header-buttons">
          <button className="scores-btn" onClick={toggleScoresSoFar}>
            Scores
          </button>
          <button className="info-btn" onClick={handleShowExplanation}>
            ?
          </button>
        </div>
      </header>
      
      {/* Scores Popup */}
      {showScoresSoFar && (
        <div className="scores-popup">
          <div className="scores-popup-content">
            <h3>Scores So Far</h3>
            <div className="scores-table">
              <div className="scores-header">
                <div className="team-col">Team</div>
                <div className="party-col">Party Bridge</div>
                <div className="bonus-col">Bonus Bridge</div>
              </div>
              <div className="scores-row">
                <div className="team-col">North-South</div>
                <div className="party-col">{scoresSoFar.nsTotal}</div>
                <div className="bonus-col">{scoresSoFar.bonusNsTotal}</div>
              </div>
              <div className="scores-row">
                <div className="team-col">East-West</div>
                <div className="party-col">{scoresSoFar.ewTotal}</div>
                <div className="bonus-col">{scoresSoFar.bonusEwTotal}</div>
              </div>
            </div>
            <button className="close-scores-btn" onClick={toggleScoresSoFar}>Close</button>
          </div>
        </div>
      )}
      
      {/* Contract Category Banner */}
      <div className="contract-category">
        <h2>{getContractCategory()}</h2>
      </div>
      
      {/* Contract Details */}
      <div className="contract-details">
        <p>Contract: {formatContract()} {madeContract ? 'Made' : 'Down'} {currentDeal.result !== 0 ? Math.abs(currentDeal.result) : 'exactly'}</p>
        <p>Raw score: {currentDeal.rawScore} points</p>
      </div>
      
      {/* Tab Navigation */}
      <div className="analysis-tabs">
        <button 
          className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => handleTabChange('summary')}
        >
          Summary
        </button>
        <button 
          className={`tab-btn ${activeTab === 'hand' ? 'active' : ''}`}
          onClick={() => handleTabChange('hand')}
        >
          Hand Analysis
        </button>
        <button 
          className={`tab-btn ${activeTab === 'calculation' ? 'active' : ''}`}
          onClick={() => handleTabChange('calculation')}
        >
          Calculation
        </button>
      </div>
      
      {/* Tab Content */}
      <div className="tab-content">
        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="summary-tab">
            <div className="final-scores">
              <h3>Final Bonus Bridge Score</h3>
              <div className="score-box">
                {/* For defeated contracts, show defender first since they get the points */}
                {!madeContract ? (
                  <>
                    <div className="score-row">
                      <span className="score-label">{finalScore.defenderTeam} (Defender):</span>
                      <span className="score-value">{finalScore.defenderPoints} points</span>
                    </div>
                    <div className="score-row">
                      <span className="score-label">{finalScore.declarerTeam} (Declarer):</span>
                      <span className="score-value">{finalScore.declarerPoints} points</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="score-row">
                      <span className="score-label">{finalScore.declarerTeam} (Declarer):</span>
                      <span className="score-value">{finalScore.declarerPoints} points</span>
                    </div>
                    <div className="score-row">
                      <span className="score-label">{finalScore.defenderTeam} (Defender):</span>
                      <span className="score-value">{finalScore.defenderPoints} points</span>
                    </div>
                  </>
                )}
              </div>
              
              <p className="score-explanation">
                {madeContract ? 
                  `The contract was made${currentDeal.result > 0 ? ' with ' + currentDeal.result + ' overtrick' + (currentDeal.result > 1 ? 's' : '') : ' exactly'}.` :
                  `The contract was defeated by ${Math.abs(currentDeal.result)} trick${Math.abs(currentDeal.result) > 1 ? 's' : ''}.`
                }
              </p>
            </div>
          </div>
        )}
        
        {/* Hand Analysis Tab */}
        {activeTab === 'hand' && (
          <div className="hand-tab">
            <h3>Hand Analysis</h3>
            <div className="analysis-details">
              <div className="detail-row">
                <span className="detail-label">Combined HCP (Declarer + Dummy):</span>
                <span className="detail-value">{totalHCP}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Declarer HCP Percentage:</span>
                <span className="detail-value">{declarerHCPPercentage}%</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Defender HCP Percentage:</span>
                <span className="detail-value">{defenderHCPPercentage}%</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">HCP Advantage:</span>
                <span className="detail-value">{hcpAdvantage}% to {advantageSide}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Number of Singletons:</span>
                <span className="detail-value">{singletons}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Number of Voids:</span>
                <span className="detail-value">{voids}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Number of Long Suits (6+ cards):</span>
                <span className="detail-value">{longSuits}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Distribution Points:</span>
                <span className="detail-value">{distributionPoints}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Expected HCP for Contract:</span>
                <span className="detail-value">{expectedHCP}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Contract Expected Tricks:</span>
                <span className="detail-value">{contractExpectedTricks}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Hand Expected Tricks:</span>
                <span className="detail-value">{handExpectedTricks}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Calculation Tab */}
        {activeTab === 'calculation' && (
          <div className="calculation-tab">
            <h3>Calculation Steps ({madeContract ? 'Made Contract' : 'Defeated Contract'})</h3>
            
            <div className="calculation-steps">
              {getCalculationSteps().map((step, index) => (
                <div className="calc-step" key={index}>
                  <span className="step-label">{step.label}</span>
                  <span className="step-value">{step.value}</span>
                </div>
              ))}
            </div>
            
            <div className="final-calculation">
              <h3>Final Result</h3>
              {!madeContract ? (
                <>
                  <div className="calc-step">
                    <span className="step-label">{finalScore.defenderTeam} Points:</span>
                    <span className="step-value">{finalScore.defenderPoints}</span>
                  </div>
                  <div className="calc-step">
                    <span className="step-label">{finalScore.declarerTeam} Points:</span>
                    <span className="step-value">{finalScore.declarerPoints}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="calc-step">
                    <span className="step-label">{finalScore.declarerTeam} Points:</span>
                    <span className="step-value">{finalScore.declarerPoints}</span>
                  </div>
                  <div className="calc-step">
                    <span className="step-label">{finalScore.defenderTeam} Points:</span>
                    <span className="step-value">{finalScore.defenderPoints}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* UPDATED: Optimized button layout - Two equal buttons side by side */}
      <div className="main-action-buttons">
        <button className="edit-analysis-btn" onClick={onEdit}>
          Edit Analysis
        </button>
        
        <button className="save-continue-btn" onClick={handleSave}>
          Save & Continue
        </button>
      </div>
      
      {/* End Game button in a separate row */}
      <div className="end-game-row">
        <button className="end-game-btn" onClick={handleShowEndGameConfirm}>
          End Game & View Results
        </button>
      </div>
      
      {/* Explanation popup when shown */}
      {showExplanation && (
        <BonusBridgeExplanation onClose={handleHideExplanation} />
      )}
      
      {/* End Game Confirmation Popup */}
      {showEndGameConfirm && (
        <div style={popupStyles.overlay}>
          <div style={popupStyles.container}>
            <h2 style={popupStyles.title}>End Current Game?</h2>
            <p style={popupStyles.message}>
              Are you sure you want to end the current game? This will save the current deal and show the final game results.
            </p>
            <div style={popupStyles.buttonContainer}>
              <button 
                style={{...popupStyles.button, ...popupStyles.cancelButton}}
                onClick={handleHideEndGameConfirm}
              >
                Cancel
              </button>
              <button 
                style={{...popupStyles.button, ...popupStyles.confirmButton}}
                onClick={handleEndGame}
              >
                End Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinalScoreAnalysis;