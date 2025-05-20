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
  // Add debug logging
  useEffect(() => {
    console.log('ScoreProcessor received deal:', currentDeal);
  }, [currentDeal]);
  
  // FIXED: Improved dependency array to ensure score recalculation happens reliably
  useEffect(() => {
    // Only process scores if we have a valid contract and result
    if (currentDeal && currentDeal.contract && currentDeal.result !== null && currentDeal.result !== undefined) {
      console.log('Processing score for deal:', currentDeal);
      processDealScore(currentDeal);
    }
  }, [
    currentDeal?.contract, 
    currentDeal?.result, 
    currentDeal?.vulnerable?.ns, 
    currentDeal?.vulnerable?.ew,
    onScoreCalculated  // FIXED: Added callback to dependencies 
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
    console.log('Standard bridge score calculated:', standardScore);
    
    // If we have HCP data, calculate bonus bridge score
    let bonusScore = standardScore;
    
    if (deal.handAnalysis) {
      bonusScore = calculateBonusBridgeScore(contractDetails, deal.handAnalysis);
      console.log('Bonus bridge score calculated:', bonusScore);
    }
    
    // Determine which score to use based on the scoring mode
    const finalScore = deal.bonusScoringEnabled ? bonusScore : standardScore;
    
    // Calculate raw score - the maximum absolute value of NS or EW points
    const rawScore = Math.max(
      Math.abs(finalScore.nsPoints || 0), 
      Math.abs(finalScore.ewPoints || 0)
    );
    
    console.log('Raw score calculated:', rawScore);
    
    // FIXED: Ensure we always have defined scores to prevent undefined values
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
    
    console.log('Final score result:', scoreResult);
    
    // Make sure we're passing zero instead of undefined/null
    if (isNaN(scoreResult.nsPoints)) scoreResult.nsPoints = 0;
    if (isNaN(scoreResult.ewPoints)) scoreResult.ewPoints = 0;
    if (isNaN(scoreResult.rawScore)) scoreResult.rawScore = 0;
    
    // FIXED: Added additional debug logging
    console.log('Score calculation complete for deal:', deal.dealNumber);
    console.log('NS Points:', scoreResult.nsPoints);
    console.log('EW Points:', scoreResult.ewPoints);
    console.log('Raw Score:', scoreResult.rawScore);
    
    // Send the calculated score to the parent component
    onScoreCalculated(scoreResult);
  };
  
  // This is a utility component, so it doesn't render anything
  return null;
};

export default ScoreProcessor;