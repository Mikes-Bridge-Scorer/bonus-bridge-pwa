import React, { useState, useEffect } from 'react';
import './ScoreTracking.css';

/**
 * Component for displaying and tracking scores in the Bridge game
 * @param {Object} props - Component props
 * @param {Object} props.scores - Current game scores object
 * @param {Object} props.currentDeal - Current deal information
 * @param {Function} props.onChooseBonusBridge - Function to handle bonus bridge selection
 * @param {Function} props.onChoosePartyBridge - Function to handle party bridge selection
 */
const ScoreTracking = ({ scores, currentDeal, onChooseBonusBridge, onChoosePartyBridge }) => {
  // Debug log for incoming props
  useEffect(() => {
    console.log('ScoreTracking - Current Scores:', scores);
    console.log('ScoreTracking - Current Deal:', currentDeal);
  }, [scores, currentDeal]);
  
  // Format contract for display
  const formatContract = () => {
    if (!currentDeal || !currentDeal.contract) return "";
    
    const contractMatch = currentDeal.contract.match(/(\d)([♣♦♥♠]|NT)\s+([NESW])(X{0,2})/);
    if (!contractMatch) return currentDeal.contract;
    
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
    
    return `${level}${suit} by ${declarerName}${doubledText}`;
  };
  
  // Format result for display
  const formatResult = () => {
    if (!currentDeal || currentDeal.result === null || currentDeal.result === undefined) return "";
    
    const result = currentDeal.result;
    if (result >= 0) {
      return result > 0 ? `Made +${result}` : "Made";
    } else {
      return `Down ${Math.abs(result)}`;
    }
  };
  
  // Calculate score details for display
  const getScoreDetails = () => {
    if (!currentDeal || !currentDeal.contract) return [];
    
    const contractMatch = currentDeal.contract.match(/(\d)([♣♦♥♠]|NT)\s+([NESW])(X{0,2})/);
    if (!contractMatch) return [];
    
    const level = parseInt(contractMatch[1]);
    const suit = contractMatch[2];
    const declarer = contractMatch[3];
    const doubled = contractMatch[4] || "";
    
    // Determine declarer's team
    const isNS = declarer === 'N' || declarer === 'S';
    const team = isNS ? "NS" : "EW";
    
    // Determine vulnerability
    const vulnerable = isNS ? 
      (currentDeal.vulnerable?.ns || false) : 
      (currentDeal.vulnerable?.ew || false);
    
    const vulText = vulnerable ? "vulnerable" : "not vulnerable";
    
    // Calculate required tricks and actual tricks
    const requiredTricks = level + 6;
    const result = currentDeal.result || 0;
    const actualTricks = requiredTricks + result;
    
    // Determine score description
    const scoringSide = getScoringTeam();
    let scoreAmount = 0;
    
    // Calculate the score amount based on which team is scoring
    if (scoringSide === "NS") {
      scoreAmount = Math.abs(currentDeal.nsPoints || 0);
    } else {
      scoreAmount = Math.abs(currentDeal.ewPoints || 0);
    }
    
    // If score amount is still 0, use the raw score
    if (scoreAmount === 0) {
      scoreAmount = Math.abs(currentDeal.rawScore || 0);
    }
    
    // Format the calculation steps
    return [
      `Contract: ${level}${suit} by ${team} (${vulText})`,
      `Required tricks: ${level} + 6 = ${requiredTricks}`,
      `Actual tricks: ${actualTricks}`,
      result >= 0 ? 
        `Total: ${scoreAmount} points to ${scoringSide}` : 
        `Undertricks (${Math.abs(result)}): ${scoreAmount} points to ${scoringSide}`
    ];
  };

  // Get the side that scores (NS or EW)
  const getScoringTeam = () => {
    if (!currentDeal || !currentDeal.contract) return "NS";
    
    const contractMatch = currentDeal.contract.match(/(\d)([♣♦♥♠]|NT)\s+([NESW])(X{0,2})/);
    if (!contractMatch) return "NS";
    
    const declarer = contractMatch[3];
    const isNS = declarer === 'N' || declarer === 'S';
    const result = currentDeal.result || 0;
    
    // If made contract, declarer's side scores
    // If defeated, defenders score
    if (result >= 0) {
      return isNS ? "NS" : "EW";
    } else {
      return isNS ? "EW" : "NS";
    }
  };
  
  // Get display score for a team - shows Party Bridge OR Bonus Bridge scores
  const getDisplayScore = (team) => {
    // Check if we're showing bonus scores or standard party bridge scores
    const showingBonusScores = scores.showBonusScores || false;
    
    // If it's a fresh deal with no contract yet, show 0
    if (!currentDeal || !currentDeal.contract) return 0;
    
    // FIXED: Directly access the scores from currentDeal first with fallbacks
    if (team === 'NS') {
      // For North-South
      if (showingBonusScores) {
        // Bonus Bridge scoring
        return currentDeal.bonusNsPoints || scores.bonusNsPoints || 0;
      } else {
        // Party Bridge (standard) scoring
        return currentDeal.nsPoints || scores.nsPoints || 0;
      }
    } else {
      // For East-West
      if (showingBonusScores) {
        // Bonus Bridge scoring
        return currentDeal.bonusEwPoints || scores.bonusEwPoints || 0;
      } else {
        // Party Bridge (standard) scoring
        return currentDeal.ewPoints || scores.ewPoints || 0;
      }
    }
  };
  
  // Format running total scores properly
  const formatTotal = (team) => {
    if (!scores) return 0;
    
    // Check if we're showing bonus scores or standard party bridge scores
    const showingBonusScores = scores.showBonusScores || false;
    
    // Choose which total to show based on the flag
    let total;
    if (showingBonusScores) {
      // Show Bonus Bridge totals
      total = team === 'NS' ? scores.bonusNsTotal : scores.bonusEwTotal;
    } else {
      // Show Party Bridge totals (standard)
      total = team === 'NS' ? scores.nsTotal : scores.ewTotal;
    }
    
    // FIXED: Handle edge cases
    if (total === undefined || total === null) {
      console.warn(`Running total for ${team} is undefined or null`);
      return 0;
    }
    
    if (typeof total === 'object') {
      // Handle case where score is incorrectly an object
      console.warn(`Running total for ${team} is an object instead of a number`, total);
      return 0;
    }
    
    // Make sure we're returning a number
    return parseInt(total) || 0;
  };
  
  // Determine if we show contract info or not
  const shouldShowContractInfo = () => {
    // FIXED: Show contract info if there's a contract regardless of deal number
    return currentDeal && currentDeal.contract;
  };
  
  // Determine if we show scoring options
  const shouldShowScoringOptions = () => {
    // Only show scoring options if we have a contract and result
    return currentDeal && 
           currentDeal.contract && 
           currentDeal.result !== null && 
           currentDeal.result !== undefined &&
           !scores.showBonusScores; // Don't show if already in bonus mode
  };
  
  return (
    <div className="score-tracking">
      <h3>Score Summary</h3>
      
      <table className="score-table">
        <thead>
          <tr>
            <th>Team</th>
            <th>This Deal</th>
            <th>Running Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>North-South</td>
            <td>{getDisplayScore('NS')}</td>
            <td>{formatTotal('NS')}</td>
          </tr>
          <tr>
            <td>East-West</td>
            <td>{getDisplayScore('EW')}</td>
            <td>{formatTotal('EW')}</td>
          </tr>
        </tbody>
      </table>
      
      {shouldShowContractInfo() && (
        <div className="contract-summary">
          <p>
            <strong>Contract:</strong> {formatContract()}
            <br />
            <strong>Result:</strong> {formatResult()}
          </p>
          
          {/* FIXED: Removed the toggle button and always show score details */}
          <div className="score-details">
            <h4>Score Calculation</h4>
            <ul>
              {getScoreDetails().map((detail, index) => (
                <li key={index}>{detail}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {shouldShowScoringOptions() && (
        <div className="scoring-options">
          <button 
            className="bonus-bridge-btn"
            onClick={onChooseBonusBridge}
          >
            Bonus Bridge Score Adjustments (recommended)
          </button>
          
          <button 
            className="party-bridge-btn"
            onClick={onChoosePartyBridge}
          >
            Skip Adjustment (Party Bridge scoring)
          </button>
        </div>
      )}
    </div>
  );
};

export default ScoreTracking;