import React, { useEffect } from 'react';
import { 
  parseContract, 
  calculateBridgeScore, 
  calculateBonusBridgeScore
} from '../utils/scoring';

/**
 * Bridge Game Score Processor component
 * This component acts as a bridge between the game state and the scoring system
 * It processes the current deal and applies the scoring rules
 */
const ScoreProcessor = ({ currentDeal, onScoreCalculated }) => {
  useEffect(() => {
    // Only process scores if we have a valid contract and result
    if (currentDeal && currentDeal.contract && currentDeal.result !== null && currentDeal.result !== undefined) {
      processDealScore(currentDeal);
    }
  }, [
    currentDeal?.contract, 
    currentDeal?.result, 
    currentDeal?.vulnerable?.ns, 
    currentDeal?.vulnerable?.ew,
    onScoreCalculated
  ]);
  
  // Process the current deal and calculate scores
  const processDealScore = (deal) => {
    // Parse the contract string
    const contractDetails = parseContract(deal.contract, deal.result, deal.vulnerable);
    
    if (!contractDetails) {
      console.error('Unable to parse contract', deal.contract);
      return;
    }
    
    // Calculate standard bridge score
    const standardScore = calculateBridgeScore(contractDetails);
    
    // If we have HCP data, calculate bonus bridge score
    let bonusScore = standardScore;
    
    if (deal.handAnalysis) {
      bonusScore = calculateBonusBridgeScore(contractDetails, deal.handAnalysis);
    }
    
    // Determine which score to use based on the scoring mode
    const finalScore = deal.bonusScoringEnabled ? bonusScore : standardScore;
    
    // Calculate raw score - the maximum absolute value of NS or EW points
    const rawScore = Math.max(
      Math.abs(finalScore.nsPoints || 0), 
      Math.abs(finalScore.ewPoints || 0)
    );
    
    // Ensure we always have defined scores to prevent undefined values
    const nsPoints = finalScore.nsPoints || 0;
    const ewPoints = finalScore.ewPoints || 0;
    
    // Format the score for sending to parent component
    const scoreResult = {
      nsPoints: nsPoints,
      ewPoints: ewPoints,
      rawScore: rawScore,
      bonusScoringEnabled: deal.bonusScoringEnabled || false,
      handAnalysis: deal.handAnalysis || null,
      madeContract: contractDetails.madeContract
    };
    
    // Make sure we're passing zero instead of undefined/null
    if (isNaN(scoreResult.nsPoints)) scoreResult.nsPoints = 0;
    if (isNaN(scoreResult.ewPoints)) scoreResult.ewPoints = 0;
    if (isNaN(scoreResult.rawScore)) scoreResult.rawScore = 0;
    
    // Send the calculated score to the parent component
    onScoreCalculated(scoreResult);
  };
  
  // This is a utility component, so it doesn't render anything
  return null;
};

export default ScoreProcessor;