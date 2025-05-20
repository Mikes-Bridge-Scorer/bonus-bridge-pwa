import React, { useState, useEffect } from 'react';
import BonusBridgeExplanation from './BonusBridgeExplanation';
import './ScoreAdjustment.css';

const ScoreAdjustment = ({ currentDeal, onSaveAdjustment, onCancel }) => {
  // State for form inputs
  const [totalHCP, setTotalHCP] = useState(20);
  const [singletons, setSingletons] = useState(0);
  const [voids, setVoids] = useState(0);
  const [longSuits, setLongSuits] = useState(0);
  // State for showing explanation
  const [showExplanation, setShowExplanation] = useState(false);
  // State for flashing effect
  const [isFlashing, setIsFlashing] = useState(true);
  
  // Effect to initialize with default values based on current deal
  useEffect(() => {
    if (currentDeal) {
      console.log('ScoreAdjustment: Current deal loaded', currentDeal);
      // If we have previous analysis data, use it
      if (currentDeal.handAnalysis) {
        setTotalHCP(currentDeal.handAnalysis.totalHCP || 20);
        setSingletons(currentDeal.handAnalysis.singletons || 0);
        setVoids(currentDeal.handAnalysis.voids || 0);
        setLongSuits(currentDeal.handAnalysis.longSuits || 0);
      }
    }
  }, [currentDeal]);
  
  // Create flashing effect for the pause notice
  useEffect(() => {
    const flashInterval = setInterval(() => {
      setIsFlashing(prev => !prev);
    }, 800); // Toggle every 800ms
    
    return () => clearInterval(flashInterval);
  }, []);
  
  // Validate and handle input changes
  const handleHCPChange = (increment) => {
    setTotalHCP(prev => {
      const newValue = prev + increment;
      return Math.min(Math.max(0, newValue), 40); // Limit between 0-40
    });
  };
  
  const handleSingletonChange = (increment) => {
    setSingletons(prev => {
      const newValue = prev + increment;
      return Math.min(Math.max(0, newValue), 4); // Max 4 singletons possible
    });
  };
  
  const handleVoidChange = (increment) => {
    setVoids(prev => {
      const newValue = prev + increment;
      return Math.min(Math.max(0, newValue), 4); // Max 4 voids possible
    });
  };
  
  const handleLongSuitChange = (increment) => {
    setLongSuits(prev => {
      const newValue = prev + increment;
      return Math.min(Math.max(0, newValue), 4); // Limit for practical purposes
    });
  };

  // Handler for showing explanation
  const handleShowExplanation = () => {
    setShowExplanation(true);
  };
  
  // Handler for hiding explanation
  const handleHideExplanation = () => {
    setShowExplanation(false);
  };
  
  // Calculate and prepare final analysis data
  const calculateFinalAnalysis = () => {
    // Extract contract details
    const contractMatch = currentDeal.contract.match(/(\d)([♣♦♥♠]|NT)\s+([NESW])(X{0,2})/);
    if (!contractMatch) {
      console.error('Unable to parse contract:', currentDeal.contract);
      return null;
    }
    
    const level = parseInt(contractMatch[1]);
    const suit = contractMatch[2];
    const declarer = contractMatch[3];
    const doubled = contractMatch[4] || '';
    
    // Basic data
    const madeContract = currentDeal.result >= 0;
    const isNS = declarer === 'N' || declarer === 'S';
    
    // Calculate distribution points
    const distributionPoints = (voids * 3) + (singletons * 2) + longSuits;
    
    // Calculate HCP distribution
    const totalPoints = 40; // Total HCP in a deck
    const declarerHCPPercentage = Math.round((totalHCP / totalPoints) * 100);
    const defenderHCPPercentage = 100 - declarerHCPPercentage;
    const hcpAdvantage = Math.abs(declarerHCPPercentage - 50);
    const advantageSide = declarerHCPPercentage > 50 ? "declarer" : "defender";
    
    // Determine expected HCP for contract
    let expectedHCP;
    if (level <= 2) {
      // Part scores
      expectedHCP = 21;
    } else if (level === 3 && suit === 'NT') {
      // 3NT
      expectedHCP = 25;
    } else if (level === 4 && (suit === '♥' || suit === '♠')) {
      // 4 major
      expectedHCP = 24;
    } else if (level === 5 && (suit === '♣' || suit === '♦')) {
      // 5 minor
      expectedHCP = 27;
    } else if (level === 6) {
      // Small slam
      expectedHCP = 30;
    } else if (level === 7) {
      // Grand slam
      expectedHCP = 32;
    } else {
      // Other levels - formula based on level
      expectedHCP = 21 + (level * 1.5);
    }
    
    // Expected tricks calculations
    const contractExpectedTricks = level + 6;
    const handExpectedTricks = Math.min(13, 6 + Math.floor(totalHCP / 3) + Math.floor(distributionPoints / 4));
    
    // Calculate the raw score and steps for made contracts
    let calculationSteps = {};
    let nsPoints = 0;
    let ewPoints = 0;
    
    if (madeContract) {
      // Step 1: Raw score calculation
      const rawScore = (currentDeal.rawScore || 0) / 20;
      
      // Step 2: HCP Adjustment
      const hcpAdjustment = (totalHCP - expectedHCP) * 0.75;
      const afterHcpAdjustment = totalHCP > expectedHCP 
        ? rawScore - hcpAdjustment 
        : rawScore + Math.abs(hcpAdjustment);
      
      // Step 3: Performance Assessment
      const performanceVariance = currentDeal.result || 0;
      let afterPerformanceAssessment = afterHcpAdjustment;
      
      if (performanceVariance > 0) {
        // Add points for overtricks
        afterPerformanceAssessment += (performanceVariance * 1.5);
      }
      
      // Step 4: Contract Type Adjustment
      let contractTypeAdjustment = 0;
      let contractTypeDescription = "";
      
      // Check if it's a game contract
      const isGameContract = 
        (level === 3 && suit === 'NT') ||
        (level === 4 && (suit === '♥' || suit === '♠')) ||
        (level === 5 && (suit === '♣' || suit === '♦')) ||
        level >= 6;
      
      if (isGameContract) {
        contractTypeAdjustment += 2;
        contractTypeDescription = "(Game)";
      }
      
      if (level === 6) {
        contractTypeAdjustment += 4;
        contractTypeDescription = "(Small Slam)";
      } else if (level === 7) {
        contractTypeAdjustment += 6;
        contractTypeDescription = "(Grand Slam)";
      }
      
      if (suit === 'NT') {
        contractTypeAdjustment += 1;
        contractTypeDescription += " (NT)";
      }
      
      const afterContractAdjustments = afterPerformanceAssessment + contractTypeAdjustment;
      
      // Step 5: Distribution Adjustment
      let distributionAdjustment = 0;
      if (suit !== 'NT') {
        if (distributionPoints >= 7) {
          distributionAdjustment = -3;
        } else if (distributionPoints >= 5) {
          distributionAdjustment = -2;
        } else if (distributionPoints >= 3) {
          distributionAdjustment = -1;
        }
      }
      
      // Step 6: Calculate Defender Reward
      let defenderReward = 0;
      if (handExpectedTricks > contractExpectedTricks && currentDeal.result < (handExpectedTricks - contractExpectedTricks)) {
        // Defender reward calculation
        const trickDifference = handExpectedTricks - (contractExpectedTricks + currentDeal.result);
        defenderReward = trickDifference * 2;
        
        // Extra reward if defending at disadvantage
        if (advantageSide === "declarer") {
          const extraReward = Math.min(3, hcpAdvantage / 10);
          defenderReward += extraReward;
        }
      }
      
      // Final declarer points calculation
      const declarerPoints = Math.max(1, Math.round(afterContractAdjustments + distributionAdjustment));
      
      // Final defender points
      const defenderPoints = Math.round(defenderReward);
      
      // Assign points to the correct side
      if (isNS) {
        nsPoints = declarerPoints;
        ewPoints = defenderPoints;
      } else {
        nsPoints = defenderPoints;
        ewPoints = declarerPoints;
      }
      
      // Store calculation steps for display
      calculationSteps = {
        rawScore,
        hcpAdjustment,
        afterHcpAdjustment,
        performanceVariance,
        afterPerformanceAssessment,
        contractTypeAdjustment,
        contractTypeDescription,
        afterContractAdjustments,
        distributionAdjustment,
        defenderReward
      };
      
    } else {
      // Calculation for defeated contracts
      // Base penalty
      const basePenalty = Math.abs(currentDeal.rawScore || 0) / 10;
      
      // Contract level penalties
      let levelPenalties = 0;
      
      // Check if it's a game contract
      const isGameContract = 
        (level === 3 && suit === 'NT') ||
        (level === 4 && (suit === '♥' || suit === '♠')) ||
        (level === 5 && (suit === '♣' || suit === '♦')) ||
        level >= 6;
      
      if (isGameContract) {
        levelPenalties += 3;
      }
      
      if (level === 6) {
        levelPenalties += 5;
      } else if (level === 7) {
        levelPenalties += 7;
      }
      
      // Defender performance bonus
      let performanceBonus = 0;
      
      if (declarerHCPPercentage > 60) {
        performanceBonus += (declarerHCPPercentage - 50) / 5;
      }
      
      if (Math.abs(currentDeal.result) >= 2) {
        performanceBonus += 2;
        
        if (Math.abs(currentDeal.result) >= 3) {
          performanceBonus += 3;
        }
      }
      
      // Declarer consolation
      let consolationPoints = 0;
      
      if (declarerHCPPercentage < 40) {
        consolationPoints = (50 - declarerHCPPercentage) / 10;
      }
      
      // Calculate final points - FIXED: For defeated contracts, defenders get the points
      const defenderPoints = Math.max(3, Math.round(basePenalty + levelPenalties + performanceBonus));
      const declarerPoints = Math.round(consolationPoints);
      
      // FIXED: Assign points to the correct side - defenders get the points for defeating the contract
      if (isNS) {
        // Declarer is NS, so EW are defenders and get the points
        ewPoints = defenderPoints;
        nsPoints = declarerPoints;
      } else {
        // Declarer is EW, so NS are defenders and get the points
        nsPoints = defenderPoints;
        ewPoints = declarerPoints;
      }
      
      // Store calculation steps for defeated contracts
      calculationSteps = {
        basePenalty,
        levelPenalties,
        performanceBonus,
        consolationPoints
      };
    }
    
    // Return complete analysis data
    return {
      totalHCP,
      singletons,
      voids,
      longSuits,
      distributionPoints,
      declarerHCPPercentage,
      defenderHCPPercentage,
      hcpAdvantage,
      advantageSide,
      expectedHCP,
      contractExpectedTricks,
      handExpectedTricks,
      nsPoints,
      ewPoints,
      ...calculationSteps
    };
  };
  
  // Handle save button click
  const handleSave = () => {
    const analysisData = calculateFinalAnalysis();
    if (analysisData) {
      console.log('Calculated analysis data:', analysisData);
      onSaveAdjustment(analysisData);
    } else {
      alert('Error calculating score. Please check your inputs.');
    }
  };
  
  // Format contract for display
  const formatContract = () => {
    if (!currentDeal || !currentDeal.contract) return "";
    
    const contractMatch = currentDeal.contract.match(/(\d)([♣♦♥♠]|NT)\s+([NESW])(X{0,2})/);
    if (!contractMatch) return currentDeal.contract;
    
    const level = contractMatch[1];
    const suit = contractMatch[2];
    const declarer = contractMatch[3];
    const doubled = contractMatch[4] || "";
    
    return `${level}${suit} ${declarer}`;
  };
  
  // Format result for display
  const formatResult = () => {
    if (!currentDeal || currentDeal.result === null || currentDeal.result === undefined) return "";
    
    if (currentDeal.result >= 0) {
      return currentDeal.result > 0 ? `Made +${currentDeal.result}` : "Made exactly";
    } else {
      return `Down ${Math.abs(currentDeal.result)}`;
    }
  };
  
  // Fixed styles for info button
  const fixedInfoButtonStyle = {
    backgroundColor: '#468bbf',
    color: 'white',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
    position: 'absolute',
    right: '15px',
    top: '0px',
    zIndex: 10
  };
  
  return (
    <div className="score-adjustment">
      <h1 className="main-title">Bonus Bridge Score Adjustment</h1>
      
      <div className={`pause-notice ${isFlashing ? 'flashing' : ''}`}>
        Game Paused for Analysis
        <br />
        Declarer and Dummy, please show your cards to all players.
      </div>
      
      <div style={{ position: 'relative', height: '40px', marginBottom: '10px' }}>
        <button 
          style={fixedInfoButtonStyle}
          onClick={handleShowExplanation}
        >
          What is this?
        </button>
      </div>
      
      <div className="points-guide">
        <strong>Counting Guide:</strong> Add up the combined HCP (High Card Points) for Declarer + Dummy.
        <br />
        Ace = 4 points | King = 3 points | Queen = 2 points | Jack = 1 point
        <br />
        Also count distribution: Singletons, Voids, and Long Suits (6+ cards in one suit).
      </div>
      
      <div className="contract-info">
        <h3>
          Contract: {formatContract()} {formatResult()}
        </h3>
        <p>Raw score: {currentDeal.rawScore} points</p>
      </div>
      
      <div className="input-sections">
        <div className="input-section">
          <h3>Combined HCP (Declarer + Dummy)</h3>
          <div className="numeric-input">
            <button 
              className="decrement-btn"
              onClick={() => handleHCPChange(-1)}
              disabled={totalHCP <= 0}
            >
              -
            </button>
            <div className="input-value">{totalHCP}</div>
            <button 
              className="increment-btn"
              onClick={() => handleHCPChange(1)}
              disabled={totalHCP >= 40}
            >
              +
            </button>
          </div>
        </div>
        
        <div className="input-section">
          <h3>Number of Singletons</h3>
          <div className="numeric-input">
            <button 
              className="decrement-btn"
              onClick={() => handleSingletonChange(-1)}
              disabled={singletons <= 0}
            >
              -
            </button>
            <div className="input-value">{singletons}</div>
            <button 
              className="increment-btn"
              onClick={() => handleSingletonChange(1)}
              disabled={singletons >= 4}
            >
              +
            </button>
          </div>
        </div>
        
        <div className="input-section">
          <h3>Number of Voids</h3>
          <div className="numeric-input">
            <button 
              className="decrement-btn"
              onClick={() => handleVoidChange(-1)}
              disabled={voids <= 0}
            >
              -
            </button>
            <div className="input-value">{voids}</div>
            <button 
              className="increment-btn"
              onClick={() => handleVoidChange(1)}
              disabled={voids >= 4}
            >
              +
            </button>
          </div>
        </div>
        
        <div className="input-section">
          <h3>Number of Long Suits (6+ cards)</h3>
          <div className="numeric-input">
            <button 
              className="decrement-btn"
              onClick={() => handleLongSuitChange(-1)}
              disabled={longSuits <= 0}
            >
              -
            </button>
            <div className="input-value">{longSuits}</div>
            <button 
              className="increment-btn"
              onClick={() => handleLongSuitChange(1)}
              disabled={longSuits >= 4}
            >
              +
            </button>
          </div>
        </div>
      </div>
      
      <div className="action-buttons">
        <button 
          className="cancel-btn"
          onClick={onCancel}
        >
          Cancel
        </button>
        
        <button 
          className="save-btn"
          onClick={handleSave}
        >
          Calculate Final Score
        </button>
      </div>
      
      {showExplanation && (
        <BonusBridgeExplanation onClose={handleHideExplanation} />
      )}
    </div>
  );
};

export default ScoreAdjustment;