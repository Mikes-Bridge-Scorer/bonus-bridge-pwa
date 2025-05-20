/**
 * Utility functions for bridge scoring calculations
 */

/**
 * Parse a contract string into its components
 * @param {string} contractString - The contract string (e.g., "4♥ N")
 * @param {number} result - The result (positive for made contracts, negative for defeated)
 * @param {Object} vulnerable - Vulnerability object with ns and ew properties
 * @returns {Object} Contract details
 */
export const parseContract = (contractString, result, vulnerable) => {
  if (!contractString) return null;
  
  const contractMatch = contractString.match(/(\d)([♣♦♥♠]|NT)\s+([NESW])(X{0,2})/);
  if (!contractMatch) return null;
  
  const level = parseInt(contractMatch[1]);
  const suit = contractMatch[2];
  const declarer = contractMatch[3];
  const doubled = contractMatch[4] || '';
  
  const isNS = declarer === 'N' || declarer === 'S';
  const vulnerableNS = vulnerable?.ns || false;
  const vulnerableEW = vulnerable?.ew || false;
  
  const declarerVulnerable = isNS ? vulnerableNS : vulnerableEW;
  const requiredTricks = level + 6;
  const actualTricks = requiredTricks + (result || 0);
  const madeContract = result >= 0;
  
  return {
    level,
    suit,
    declarer,
    doubled,
    isNS,
    declarerVulnerable,
    requiredTricks,
    actualTricks,
    madeContract,
    result: result || 0
  };
};

/**
 * Calculate standard bridge score
 * @param {Object} contractDetails - Contract details object from parseContract
 * @returns {Object} Scoring object with nsPoints and ewPoints
 */
export const calculateBridgeScore = (contractDetails) => {
  if (!contractDetails) return { nsPoints: 0, ewPoints: 0 };
  
  const {
    level,
    suit,
    isNS,
    declarerVulnerable,
    madeContract,
    result,
    doubled
  } = contractDetails;
  
  let score = 0;
  
  // Calculate score for made contracts
  if (madeContract) {
    // Base trick score
    let trickScore = 0;
    
    if (suit === '♣' || suit === '♦') {
      // Minor suits: 20 points per trick
      trickScore = level * 20;
    } else if (suit === '♥' || suit === '♠') {
      // Major suits: 30 points per trick
      trickScore = level * 30;
    } else if (suit === 'NT') {
      // No Trump: 40 for first trick, 30 for additional tricks
      trickScore = 40 + (level - 1) * 30;
    }
    
    // Apply doubling if applicable
    if (doubled === 'X') {
      trickScore *= 2;
    } else if (doubled === 'XX') {
      trickScore *= 4;
    }
    
    score += trickScore;
    
    // Add bonus for game contracts (300 non-vul, 500 vul)
    if (trickScore >= 100) {
      score += declarerVulnerable ? 500 : 300;
    } else {
      // Partial contract bonus
      score += 50;
    }
    
    // Slam bonuses
    if (level === 6) {
      // Small slam bonus
      score += declarerVulnerable ? 750 : 500;
    } else if (level === 7) {
      // Grand slam bonus
      score += declarerVulnerable ? 1500 : 1000;
    }
    
    // Doubled/redoubled bonus ("insult bonus")
    if (doubled === 'X') {
      score += 50;
    } else if (doubled === 'XX') {
      score += 100;
    }
    
    // Overtrick points
    if (result > 0) {
      let overtrickPoints = 0;
      
      if (doubled === 'X') {
        // Doubled overtricks
        overtrickPoints = result * (declarerVulnerable ? 200 : 100);
      } else if (doubled === 'XX') {
        // Redoubled overtricks
        overtrickPoints = result * (declarerVulnerable ? 400 : 200);
      } else {
        // Undoubled overtricks
        if (suit === '♣' || suit === '♦') {
          overtrickPoints = result * 20;
        } else if (suit === '♥' || suit === '♠') {
          overtrickPoints = result * 30;
        } else { // NT
          overtrickPoints = result * 30;
        }
      }
      
      score += overtrickPoints;
    }
  } else {
    // Score for defeated contracts
    let undertrickPoints = 0;
    
    if (doubled === 'X') {
      // Doubled undertricks
      if (declarerVulnerable) {
        // Vulnerable doubled undertricks
        undertrickPoints = 200 + (Math.abs(result) - 1) * 300;
      } else {
        // Non-vulnerable doubled undertricks
        undertrickPoints = 100 + (Math.abs(result) > 1 ? 200 : 0) + 
                           (Math.abs(result) > 2 ? (Math.abs(result) - 2) * 300 : 0);
      }
    } else if (doubled === 'XX') {
      // Redoubled undertricks (double the doubled undertricks)
      if (declarerVulnerable) {
        undertrickPoints = 400 + (Math.abs(result) - 1) * 600;
      } else {
        undertrickPoints = 200 + (Math.abs(result) > 1 ? 400 : 0) + 
                           (Math.abs(result) > 2 ? (Math.abs(result) - 2) * 600 : 0);
      }
    } else {
      // Undoubled undertricks
      undertrickPoints = Math.abs(result) * (declarerVulnerable ? 100 : 50);
    }
    
    score = -undertrickPoints;
  }
  
  // Assign points to the appropriate side
  if (isNS) {
    return {
      nsPoints: madeContract ? score : 0,
      ewPoints: madeContract ? 0 : -score
    };
  } else {
    return {
      nsPoints: madeContract ? 0 : -score,
      ewPoints: madeContract ? score : 0
    };
  }
};

/**
 * Generate a readable vulnerability description
 * @param {Object} vulnerable - Vulnerability object with ns and ew properties
 * @returns {string} Description of vulnerability
 */
export const vulnerabilityDescription = (vulnerable) => {
  if (!vulnerable) return "None Vulnerable";
  
  const nsVul = vulnerable.ns || false;
  const ewVul = vulnerable.ew || false;
  
  if (nsVul && ewVul) return "All Vulnerable";
  if (nsVul) return "NS Vulnerable";
  if (ewVul) return "EW Vulnerable";
  return "None Vulnerable";
};

/**
 * Determine vulnerability based on deal number
 * @param {number} dealNumber - Current deal number
 * @returns {Object} Vulnerability object with ns and ew properties
 */
export const determineVulnerability = (dealNumber) => {
  if (!dealNumber) return { ns: false, ew: false };
  
  // Standard bridge vulnerability rotation based on deal number
  const vulPattern = (dealNumber - 1) % 16;
  
  switch (vulPattern) {
    case 0:
    case 7:
    case 10:
    case 13:
      return { ns: false, ew: false }; // None Vulnerable
    case 1:
    case 4:
    case 11:
    case 14:
      return { ns: true, ew: false }; // NS Vulnerable
    case 2:
    case 5:
    case 8:
    case 15:
      return { ns: false, ew: true }; // EW Vulnerable
    case 3:
    case 6:
    case 9:
    case 12:
      return { ns: true, ew: true }; // Both Vulnerable
    default:
      return { ns: false, ew: false }; // Default to None Vulnerable
  }
};

/**
 * Determine dealer based on deal number
 * @param {number} dealNumber - Current deal number
 * @returns {string} Dealer position (North, East, South, West)
 */
export const determineDealer = (dealNumber) => {
  const positions = ["North", "East", "South", "West"];
  const index = (dealNumber - 1) % 4;
  return positions[index];
};

/**
 * Check if a contract is a game contract
 * @param {Object} contractDetails - Contract details from parseContract
 * @returns {boolean} True if the contract is a game contract
 */
export const isGameContract = (contractDetails) => {
  if (!contractDetails) return false;
  
  const { level, suit } = contractDetails;
  
  return (
    (level === 3 && suit === 'NT') ||
    (level === 4 && (suit === '♥' || suit === '♠')) ||
    (level === 5 && (suit === '♣' || suit === '♦')) ||
    level >= 6
  );
};

/**
 * Calculate bonus bridge score based on the enhanced scoring system
 * @param {Object} contractDetails - Contract details from parseContract
 * @param {Object} handAnalysis - Hand analysis data (HCP, distribution, etc.)
 * @returns {Object} Bonus bridge scoring object
 */
export const calculateBonusBridgeScore = (contractDetails, handAnalysis) => {
  if (!contractDetails || !handAnalysis) return { nsPoints: 0, ewPoints: 0 };
  
  const {
    level,
    suit,
    isNS,
    declarerVulnerable,
    madeContract,
    result,
    doubled,
    actualTricks,
    requiredTricks
  } = contractDetails;
  
  const {
    totalHCP,
    singletons,
    voids,
    longSuits
  } = handAnalysis;
  
  let declarerPoints = 0;
  let defenderPoints = 0;
  
  // Get standard bridge score for raw score calculation
  const standardScore = calculateBridgeScore(contractDetails);
  
  // Extract raw score (absolute value)
  const rawScore = Math.abs(madeContract ? 
                           (isNS ? standardScore.nsPoints : standardScore.ewPoints) : 
                           (isNS ? standardScore.ewPoints : standardScore.nsPoints));
  
  if (madeContract) {
    // ***** STEP 1: Calculate Raw Score and Reduce Scale *****
    const initialPoints = rawScore / 20;
    
    // ***** STEP 2: Calculate HCP Advantage *****
    const declarerHCPPercentage = (totalHCP / 40) * 100;
    const defenderHCPPercentage = 100 - declarerHCPPercentage;
    const hcpAdvantage = Math.abs(declarerHCPPercentage - defenderHCPPercentage);
    const advantageSide = declarerHCPPercentage > 50 ? "declarer" : "defender";
    
    // ***** STEP 3: Apply HCP Adjustment Based on Contract Type *****
    let expectedHCP;
    
    // Determine Expected HCP based on contract type
    if (level <= 2) {
      // Part Scores (1-2 level)
      expectedHCP = 21;
    } else if (level === 3 && suit === 'NT') {
      // 3NT Game
      expectedHCP = 25;
    } else if (level === 4 && (suit === '♥' || suit === '♠')) {
      // 4♥/♠ Game
      expectedHCP = 24;
    } else if (level === 5 && (suit === '♣' || suit === '♦')) {
      // 5♣/♦ Game
      expectedHCP = 27;
    } else if (level === 6) {
      // Small Slams (6 level)
      expectedHCP = 30;
    } else if (level === 7) {
      // Grand Slams (7 level)
      expectedHCP = 32;
    } else {
      // Other levels
      expectedHCP = 21 + (level * 1.5);
    }
    
    // Calculate adjustment
    const hcpAdjustment = (totalHCP - expectedHCP) * 0.75;
    let adjustedPoints = initialPoints;
    
    if (totalHCP > expectedHCP) {
      // If Declarer HCP > Expected HCP: Subtract adjustment
      adjustedPoints -= hcpAdjustment;
    } else if (totalHCP < expectedHCP) {
      // If Declarer HCP < Expected HCP: Add adjustment
      adjustedPoints += Math.abs(hcpAdjustment);
    }
    // No adjustment if Declarer HCP = Expected HCP
    
    // ***** STEP 4: Calculate Expected Tricks *****
    const contractExpectedTricks = requiredTricks;
    const distributionPoints = (voids * 3) + (singletons * 2) + longSuits;
    const handExpectedTricks = Math.min(13, 6 + Math.floor(totalHCP / 3) + Math.floor(distributionPoints / 4));
    
    // ***** STEP 5: Performance Assessment *****
    let performancePoints = adjustedPoints;
    
    // For Contract Performance
    const performanceVariance = actualTricks - contractExpectedTricks;
    if (performanceVariance > 0) {
      // If Variance > 0 (overtricks): Add (Variance × 1.5) points
      performancePoints += (performanceVariance * 1.5);
    }
    
    // For Hand Potential Performance (only if Hand Expected > Contract Expected)
    if (handExpectedTricks > contractExpectedTricks) {
      const potentialVariance = actualTricks - handExpectedTricks;
      if (potentialVariance < 0) {
        // If Potential Variance < 0 (underperformance): Subtract (|Potential Variance| × 0.75) points
        performancePoints -= (Math.abs(potentialVariance) * 0.75);
      }
    }
    
    // ***** STEP 6: Apply Contract Type Adjustments *****
    let contractPoints = performancePoints;
    
    // Check if it's a Game contract
    const isGameContractVal = isGameContract(contractDetails);
    
    if (isGameContractVal) {
      // For Game contracts
      contractPoints += 2;
    }
    
    if (level === 6) {
      // For Small Slam contracts
      contractPoints += 4;
    } else if (level === 7) {
      // For Grand Slam contracts
      contractPoints += 6;
    }
    
    if (suit === 'NT') {
      // For NT contracts
      contractPoints += 1;
    }
    
    const overtricks = actualTricks - contractExpectedTricks;
    
    if (overtricks >= 4) {
      // For contracts with 4+ overtricks
      contractPoints += 1;
      
      if (overtricks >= 7) {
        // For contracts with 7+ overtricks
        contractPoints += 2;
      }
    }
    
    // ***** STEP 7: Distribution Adjustment (Suit Contracts Only) *****
    let finalDeclarerPoints = contractPoints;
    
    if (suit !== 'NT') {
      // Only apply for suit contracts
      if (distributionPoints >= 7) {
        finalDeclarerPoints -= 3;
      } else if (distributionPoints >= 5) {
        finalDeclarerPoints -= 2;
      } else if (distributionPoints >= 3) {
        finalDeclarerPoints -= 1;
      }
      // 1-2 dist points: No deduction
    }
    
    // ***** STEP 8: Defender Reward Calculation *****
    if (handExpectedTricks > contractExpectedTricks && 
        actualTricks < handExpectedTricks) {
      // Defender Reward = (Hand Expected Tricks - Actual Tricks) × 2
      const defenderReward = (handExpectedTricks - actualTricks) * 2;
      
      // Extra reward if defending at disadvantage
      const extraReward = Math.min(3, hcpAdvantage / 10);
      
      defenderPoints = defenderReward + (advantageSide === "declarer" ? extraReward : 0);
    }
    
    // ***** STEP 9: Finalize Scores *****
    declarerPoints = Math.max(1, Math.round(finalDeclarerPoints)); // Minimum declarer score for made contracts: 1 point
    defenderPoints = Math.round(defenderPoints);
    
  } else {
    // ***** SCORING FOR DEFEATED CONTRACTS *****
    
    // ***** STEP 1: Calculate Base Penalty *****
    const basePenalty = rawScore / 10;
    
    // ***** STEP 2: Add Contract Level Penalties *****
    let levelPenalties = 0;
    
    // Check if it's a Game contract
    const isGameContractVal = isGameContract(contractDetails);
    
    if (isGameContractVal) {
      // For defeated Game contracts
      levelPenalties += 3;
    }
    
    if (level === 6) {
      // For defeated Small Slams
      levelPenalties += 5;
    } else if (level === 7) {
      // For defeated Grand Slams
      levelPenalties += 7;
    }
    
    // ***** STEP 3: Calculate Defender Performance Bonus *****
    let performanceBonus = 0;
    
    const declarerHCPPercentage = (totalHCP / 40) * 100;
    
    if (declarerHCPPercentage > 60) {
      // If Declarer HCP% > 60%
      performanceBonus += (declarerHCPPercentage - 50) / 5;
    }
    
    if (Math.abs(result) >= 2) {
      // If contract defeated by 2+ tricks
      performanceBonus += 2;
      
      if (Math.abs(result) >= 3) {
        // If contract defeated by 3+ tricks
        performanceBonus += 3;
      }
    }
    
    // ***** STEP 4: Calculate Declarer Consolation (Optional) *****
    let consolationPoints = 0;
    
    if (declarerHCPPercentage < 40) {
      // If Declarer HCP% < 40%
      consolationPoints = (50 - declarerHCPPercentage) / 10;
    }
    
    // ***** STEP 5: Finalize Scores for Defeated Contracts *****
    const totalDefenderPoints = basePenalty + levelPenalties + performanceBonus;
    defenderPoints = Math.max(3, Math.round(totalDefenderPoints)); // Minimum defender score: 3 points
    declarerPoints = Math.round(consolationPoints);
  }
  
  // Return final scores for NS and EW
  if (isNS) {
    return {
      nsPoints: madeContract ? declarerPoints : declarerPoints,
      ewPoints: madeContract ? defenderPoints : defenderPoints,
      rawScore
    };
  } else {
    return {
      nsPoints: madeContract ? defenderPoints : defenderPoints,
      ewPoints: madeContract ? declarerPoints : declarerPoints,
      rawScore
    };
  }
};