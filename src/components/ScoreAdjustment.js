import React, { useState, useEffect, useRef } from 'react';
import BonusBridgeExplanation from './BonusBridgeExplanation';
import './ScoreAdjustment.css';

// ─────────────────────────────────────────────────────────────
// BONUS BRIDGE SCORING CONSTANTS — Version 2.0
// Adjust these values to tune the scoring system without
// touching the calculation logic below.
// ─────────────────────────────────────────────────────────────

const SCORING = {
  // Base score for all contracts (made or defeated)
  BASE: 30,

  // HCP adjustment per point above/below expected (made contracts)
  SURPLUS_PENALTY: 1.5,      // per HCP point above expected → subtracted from declarer
  DEFICIT_BONUS: 1.5,        // per HCP point below expected → added to declarer

  // Maximum HCP adjustment either way (caps at 8 point surplus/deficit)
  HCP_ADJ_CAP: 12,           // = 8 points × 1.5

  // Contract level bonuses (made contracts)
  GAME_BONUS: 3,
  SMALL_SLAM_BONUS: 8,
  GRAND_SLAM_BONUS: 15,

  // Weak hand part score bonus (deficit > 3, part score only)
  WEAK_PART_SCORE_BONUS: 3,
  WEAK_PART_SCORE_THRESHOLD: 3,  // deficit must exceed this

  // Overtrick bonus (made contracts, max 3 overtricks rewarded)
  OVERTRICK_BONUS: 1,
  OVERTRICK_MAX: 3,

  // Distribution penalty thresholds (suit contracts only, not NT)
  DIST_PENALTY_LOW: 1,       // 3-4 distribution points
  DIST_PENALTY_MID: 2,       // 5-6 distribution points
  DIST_PENALTY_HIGH: 3,      // 7+ distribution points

  // Minimum declarer score for made contracts
  DECLARER_MIN: 3,

  // Defender reward per HCP surplus point (made contracts)
  DEFENDER_REWARD_PER_SURPLUS: 1.0,

  // Defender overtrick reward (only when declarer surplus > 3)
  DEFENDER_OVERTRICK_SURPLUS_THRESHOLD: 3,
  DEFENDER_OVERTRICK_BONUS: 1,

  // Defeated contracts — defender HCP adjustment
  DEFEATED_SURPLUS_BONUS: 1.5,   // per surplus point (strong hand going down)
  DEFEATED_DEFICIT_PENALTY: 0.75, // per deficit point (weak hand going down)
  DEFEATED_HCP_ADJ_CAP: 10,

  // Defeat margin bonuses
  DEFEAT_DOWN1: 2,
  DEFEAT_DOWN2: 5,
  DEFEAT_DOWN3: 8,
  DEFEAT_DOWN4PLUS: 10,

  // Defeated contract level bonuses
  DEFEATED_GAME_BONUS: 3,
  DEFEATED_SLAM_BONUS: 6,
  DEFEATED_GRAND_SLAM_BONUS: 10,

  // Minimum defender score for defeated contracts
  DEFENDER_MIN: 3,

  // Declarer consolation (defeated contracts, weak hand only)
  CONSOLATION_PER_DEFICIT: 0.5,
  CONSOLATION_MAX: 5,
  CONSOLATION_MIN_DOWN1: 2,   // minimum consolation if down 1 and deficit > threshold
};

// ─────────────────────────────────────────────────────────────
// EXPECTED HCP TABLE — by contract type
// ─────────────────────────────────────────────────────────────
const getExpectedHCP = (level, suit) => {
  if (level <= 2) return 21;                                    // Part score
  if (level === 3 && suit === 'NT') return 25;                  // 3NT
  if (level === 3 && (suit === '♥' || suit === '♠')) return 23; // 3 major
  if (level === 4 && (suit === '♥' || suit === '♠')) return 24; // 4 major game
  if (level === 4 && suit === 'NT') return 27;                  // 4NT
  if (level === 5 && (suit === '♣' || suit === '♦')) return 27; // 5 minor game
  if (level === 5 && (suit === '♥' || suit === '♠')) return 28; // 5 major
  if (level === 5 && suit === 'NT') return 29;                  // 5NT
  if (level === 6) return 30;                                   // Small slam
  if (level === 7) return 32;                                   // Grand slam
  return 21 + (level * 1.5);                                   // Fallback
};

// ─────────────────────────────────────────────────────────────
// HELPER — is this a game or slam contract?
// ─────────────────────────────────────────────────────────────
const classifyContract = (level, suit) => {
  const isGame =
    (level === 3 && suit === 'NT') ||
    (level === 4 && (suit === '♥' || suit === '♠')) ||
    (level === 5 && (suit === '♣' || suit === '♦')) ||
    level >= 6;
  const isSmallSlam = level === 6;
  const isGrandSlam = level === 7;
  const isPartScore = !isGame;
  const isNT = suit === 'NT';
  return { isGame, isSmallSlam, isGrandSlam, isPartScore, isNT };
};

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
const ScoreAdjustment = ({ currentDeal, onSaveAdjustment, onCancel }) => {
  const [totalHCP, setTotalHCP] = useState(20);
  const [singletons, setSingletons] = useState(0);
  const [voids, setVoids] = useState(0);
  const [longSuits, setLongSuits] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isFlashing, setIsFlashing] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (currentDeal) {
      console.log('ScoreAdjustment: Current deal loaded', currentDeal);
      if (currentDeal.handAnalysis) {
        setTotalHCP(currentDeal.handAnalysis.totalHCP || 20);
        setSingletons(currentDeal.handAnalysis.singletons || 0);
        setVoids(currentDeal.handAnalysis.voids || 0);
        setLongSuits(currentDeal.handAnalysis.longSuits || 0);
      }
    }
  }, [currentDeal]);

  useEffect(() => {
    const flashInterval = setInterval(() => {
      setIsFlashing(prev => !prev);
    }, 800);
    return () => clearInterval(flashInterval);
  }, []);

  const createPixelHandler = (action, value = null) => {
    return (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log(`🔥 Pixel 9a action: ${action}`);

      const btn = e.target;
      btn.style.transform = 'scale(0.95)';
      btn.style.opacity = '0.8';

      if (navigator.vibrate) {
        navigator.vibrate([30]);
      }

      setTimeout(() => {
        switch (action) {
          case 'hcp-increment':       handleHCPChange(1);       break;
          case 'hcp-decrement':       handleHCPChange(-1);      break;
          case 'singleton-increment': handleSingletonChange(1); break;
          case 'singleton-decrement': handleSingletonChange(-1);break;
          case 'void-increment':      handleVoidChange(1);      break;
          case 'void-decrement':      handleVoidChange(-1);     break;
          case 'longsuit-increment':  handleLongSuitChange(1);  break;
          case 'longsuit-decrement':  handleLongSuitChange(-1); break;
          case 'save':                handleSave();             break;
          case 'cancel':              onCancel();               break;
          case 'show-explanation':    setShowExplanation(true); break;
          default: break;
        }
        btn.style.transform = 'scale(1)';
        btn.style.opacity = '1';
      }, 100);
    };
  };

  const handleHCPChange     = (inc) => setTotalHCP(prev   => Math.min(Math.max(0, prev + inc), 40));
  const handleSingletonChange = (inc) => setSingletons(prev => Math.min(Math.max(0, prev + inc), 4));
  const handleVoidChange    = (inc) => setVoids(prev      => Math.min(Math.max(0, prev + inc), 4));
  const handleLongSuitChange  = (inc) => setLongSuits(prev  => Math.min(Math.max(0, prev + inc), 4));
  const handleHideExplanation = () => setShowExplanation(false);

  // ─────────────────────────────────────────────────────────
  // SCORING ENGINE — Version 2.0
  // ─────────────────────────────────────────────────────────
  const calculateFinalAnalysis = () => {
    const contractMatch = currentDeal.contract.match(/(\d)([♣♦♥♠]|NT)\s+([NESW])(X{0,2})/);
    if (!contractMatch) {
      console.error('Unable to parse contract:', currentDeal.contract);
      return null;
    }

    const level    = parseInt(contractMatch[1]);
    const suit     = contractMatch[2];
    const declarer = contractMatch[3];
    const doubled  = contractMatch[4] || '';

    const madeContract = currentDeal.result >= 0;
    const isNS         = declarer === 'N' || declarer === 'S';
    const overtricks   = madeContract ? (currentDeal.result || 0) : 0;
    const undertricks  = madeContract ? 0 : Math.abs(currentDeal.result || 0);

    // Distribution points
    const distributionPoints = (voids * 3) + (singletons * 2) + longSuits;

    // Expected HCP for this contract
    const expectedHCP = getExpectedHCP(level, suit);

    // HCP surplus/deficit
    const hcpSurplus = Math.max(0, totalHCP - expectedHCP);
    const hcpDeficit = Math.max(0, expectedHCP - totalHCP);

    // Contract classification
    const { isGame, isSmallSlam, isGrandSlam, isPartScore, isNT } = classifyContract(level, suit);

    let declarerPoints = 0;
    let defenderPoints = 0;
    let calculationSteps = {};

    // ── MADE CONTRACTS ────────────────────────────────────
    if (madeContract) {

      // Step 1: Base
      const base = SCORING.BASE;

      // Step 2: HCP Adjustment
      const rawHcpAdj = hcpSurplus > 0
        ? -Math.min(hcpSurplus * SCORING.SURPLUS_PENALTY, SCORING.HCP_ADJ_CAP)
        :  Math.min(hcpDeficit  * SCORING.DEFICIT_BONUS,  SCORING.HCP_ADJ_CAP);
      const afterHcp = base + rawHcpAdj;

      // Step 3: Contract Level Bonus
      let levelBonus = 0;
      let levelDescription = 'Part score';
      if (isGrandSlam)  { levelBonus = SCORING.GRAND_SLAM_BONUS;  levelDescription = 'Grand Slam'; }
      else if (isSmallSlam) { levelBonus = SCORING.SMALL_SLAM_BONUS; levelDescription = 'Small Slam'; }
      else if (isGame)  { levelBonus = SCORING.GAME_BONUS;         levelDescription = 'Game'; }
      const afterLevel = afterHcp + levelBonus;

      // Step 4: Weak Hand Part Score Bonus
      const weakPartScoreBonus =
        (isPartScore && hcpDeficit > SCORING.WEAK_PART_SCORE_THRESHOLD)
          ? SCORING.WEAK_PART_SCORE_BONUS
          : 0;
      const afterWeakBonus = afterLevel + weakPartScoreBonus;

      // Step 5: Overtrick Bonus
      const overtrickBonus = Math.min(overtricks, SCORING.OVERTRICK_MAX) * SCORING.OVERTRICK_BONUS;
      const afterOvertricks = afterWeakBonus + overtrickBonus;

      // Step 6: Distribution Penalty (suit contracts only)
      let distPenalty = 0;
      if (!isNT) {
        if      (distributionPoints >= 7) distPenalty = SCORING.DIST_PENALTY_HIGH;
        else if (distributionPoints >= 5) distPenalty = SCORING.DIST_PENALTY_MID;
        else if (distributionPoints >= 3) distPenalty = SCORING.DIST_PENALTY_LOW;
      }
      const afterDist = afterOvertricks - distPenalty;

      // Step 7: Declarer Final
      declarerPoints = Math.max(SCORING.DECLARER_MIN, Math.round(afterDist));

      // Step 8: Defender Score on Made Contract
      let defenderBase = hcpSurplus * SCORING.DEFENDER_REWARD_PER_SURPLUS;

      // Extra defender reward if strong hand needed overtricks to look good
      let defenderOvertrickBonus = 0;
      if (hcpSurplus > SCORING.DEFENDER_OVERTRICK_SURPLUS_THRESHOLD && overtricks > 0) {
        defenderOvertrickBonus = overtricks * SCORING.DEFENDER_OVERTRICK_BONUS;
      }

      // Defenders cannot outscore declarers on a made contract
      defenderPoints = Math.min(
        declarerPoints,
        Math.round(defenderBase + defenderOvertrickBonus)
      );
      defenderPoints = Math.max(0, defenderPoints);

      calculationSteps = {
        base,
        rawHcpAdj,
        hcpSurplus,
        hcpDeficit,
        expectedHCP,
        afterHcp,
        levelBonus,
        levelDescription,
        weakPartScoreBonus,
        overtrickBonus,
        distPenalty,
        declarerFinal: declarerPoints,
        defenderBase,
        defenderOvertrickBonus,
        defenderFinal: defenderPoints,
      };

    // ── DEFEATED CONTRACTS ────────────────────────────────
    } else {

      // Step 1: Base for defenders
      const base = SCORING.BASE;

      // Step 2: HCP Adjustment for defenders
      const rawHcpAdj = hcpSurplus > 0
        ?  Math.min(hcpSurplus * SCORING.DEFEATED_SURPLUS_BONUS,  SCORING.DEFEATED_HCP_ADJ_CAP)
        : -Math.min(hcpDeficit  * SCORING.DEFEATED_DEFICIT_PENALTY, SCORING.DEFEATED_HCP_ADJ_CAP);
      const afterHcp = base + rawHcpAdj;

      // Step 3: Defeat Margin Bonus
      // If doubled/redoubled, halve the margin bonus — the penalty is inflated
      // by the double itself, not by defensive skill
      const doubledMultiplier = doubled === 'XX' ? 0.25 : doubled === 'X' ? 0.5 : 1.0;
      let defeatMarginBonus = 0;
      let defeatDescription = '';
      if      (undertricks >= 4) { defeatMarginBonus = SCORING.DEFEAT_DOWN4PLUS; defeatDescription = 'Down 4+'; }
      else if (undertricks === 3) { defeatMarginBonus = SCORING.DEFEAT_DOWN3;    defeatDescription = 'Down 3'; }
      else if (undertricks === 2) { defeatMarginBonus = SCORING.DEFEAT_DOWN2;    defeatDescription = 'Down 2'; }
      else if (undertricks === 1) { defeatMarginBonus = SCORING.DEFEAT_DOWN1;    defeatDescription = 'Down 1'; }
      defeatMarginBonus = defeatMarginBonus * doubledMultiplier;
      if (doubled) defeatDescription += doubled === 'XX' ? ' (Redoubled — margin ÷4)' : ' (Doubled — margin ÷2)';
      const afterMargin = afterHcp + defeatMarginBonus;

      // Step 4: Contract Level Bonus for defenders
      let defeatedLevelBonus = 0;
      let defeatedLevelDescription = '';
      if      (isGrandSlam) { defeatedLevelBonus = SCORING.DEFEATED_GRAND_SLAM_BONUS; defeatedLevelDescription = 'Grand Slam'; }
      else if (isSmallSlam) { defeatedLevelBonus = SCORING.DEFEATED_SLAM_BONUS;       defeatedLevelDescription = 'Small Slam'; }
      else if (isGame)      { defeatedLevelBonus = SCORING.DEFEATED_GAME_BONUS;       defeatedLevelDescription = 'Game'; }
      const afterLevelBonus = afterMargin + defeatedLevelBonus;

      // Step 5: Defender Final
      defenderPoints = Math.max(SCORING.DEFENDER_MIN, Math.round(afterLevelBonus));

      // Step 6: Declarer Consolation (weak hand only)
      let consolationPoints = 0;
      if (hcpDeficit > 0) {
        consolationPoints = Math.min(
          hcpDeficit * SCORING.CONSOLATION_PER_DEFICIT,
          SCORING.CONSOLATION_MAX
        );
        // Minimum consolation if only down 1 with a weak hand
        if (undertricks === 1 && hcpDeficit > SCORING.WEAK_PART_SCORE_THRESHOLD) {
          consolationPoints = Math.max(consolationPoints, SCORING.CONSOLATION_MIN_DOWN1);
        }
      }
      declarerPoints = Math.round(consolationPoints);

      calculationSteps = {
        base,
        rawHcpAdj,
        hcpSurplus,
        hcpDeficit,
        expectedHCP,
        afterHcp,
        defeatMarginBonus,
        defeatDescription,
        doubledMultiplier,
        defeatedLevelBonus,
        defeatedLevelDescription,
        defenderFinal: defenderPoints,
        consolationPoints,
        declarerFinal: declarerPoints,
      };
    }

    // ── ASSIGN POINTS TO CORRECT SIDE ────────────────────
    let nsPoints = 0;
    let ewPoints = 0;

    if (madeContract) {
      if (isNS) { nsPoints = declarerPoints; ewPoints = defenderPoints; }
      else      { ewPoints = declarerPoints; nsPoints = defenderPoints; }
    } else {
      // Defeated: defenders earn points, declarer gets consolation
      if (isNS) { ewPoints = defenderPoints; nsPoints = declarerPoints; }
      else      { nsPoints = defenderPoints; ewPoints = declarerPoints; }
    }

    // ── RETURN FULL ANALYSIS ──────────────────────────────
    return {
      totalHCP,
      singletons,
      voids,
      longSuits,
      distributionPoints,
      expectedHCP,
      hcpSurplus,
      hcpDeficit,
      madeContract,
      overtricks,
      undertricks,
      nsPoints,
      ewPoints,
      // Legacy fields kept for compatibility with display components
      declarerHCPPercentage: Math.round((totalHCP / 40) * 100),
      defenderHCPPercentage: Math.round(((40 - totalHCP) / 40) * 100),
      contractExpectedTricks: level + 6,
      ...calculationSteps,
    };
  };

  const handleSave = () => {
    const analysisData = calculateFinalAnalysis();
    if (analysisData) {
      console.log('Calculated analysis data:', analysisData);
      onSaveAdjustment(analysisData);
    } else {
      alert('Error calculating score. Please check your inputs.');
    }
  };

  const formatContract = () => {
    if (!currentDeal || !currentDeal.contract) return "";
    const contractMatch = currentDeal.contract.match(/(\d)([♣♦♥♠]|NT)\s+([NESW])(X{0,2})/);
    if (!contractMatch) return currentDeal.contract;
    return `${contractMatch[1]}${contractMatch[2]} ${contractMatch[3]}`;
  };

  const formatResult = () => {
    if (!currentDeal || currentDeal.result === null || currentDeal.result === undefined) return "";
    if (currentDeal.result >= 0) {
      return currentDeal.result > 0 ? `Made +${currentDeal.result}` : "Made exactly";
    }
    return `Down ${Math.abs(currentDeal.result)}`;
  };

  const createButton = (type, action, disabled = false, text, className = '') => {
    const handleClick = createPixelHandler(action);
    const handleTouch = createPixelHandler(action);
    return (
      <button
        className={className}
        onClick={handleClick}
        onTouchEnd={handleTouch}
        disabled={disabled}
        style={{
          touchAction: 'manipulation',
          userSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
          minHeight: '50px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {text}
      </button>
    );
  };

  return (
    <div className="score-adjustment" ref={containerRef}>
      <h1 className="main-title">Bonus Bridge Score Adjustment</h1>

      <div className={`pause-notice ${isFlashing ? 'flashing' : ''}`}>
        Game Paused for Analysis
        <br />
        Declarer and Dummy, please show your cards to all players.
      </div>

      <div className="counting-guide-wrapper">
        <div className="counting-guide-bar">
          Count combined HCP for Declarer &amp; Dummy, then add any distribution points.
        </div>
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
            {createButton('decrement', 'hcp-decrement', totalHCP <= 0, '-', 'decrement-btn')}
            <div className="input-value">{totalHCP}</div>
            {createButton('increment', 'hcp-increment', totalHCP >= 40, '+', 'increment-btn')}
          </div>
        </div>

        <div className="input-section">
          <h3>Number of Singletons</h3>
          <div className="numeric-input">
            {createButton('decrement', 'singleton-decrement', singletons <= 0, '-', 'decrement-btn')}
            <div className="input-value">{singletons}</div>
            {createButton('increment', 'singleton-increment', singletons >= 4, '+', 'increment-btn')}
          </div>
        </div>

        <div className="input-section">
          <h3>Number of Voids</h3>
          <div className="numeric-input">
            {createButton('decrement', 'void-decrement', voids <= 0, '-', 'decrement-btn')}
            <div className="input-value">{voids}</div>
            {createButton('increment', 'void-increment', voids >= 4, '+', 'increment-btn')}
          </div>
        </div>

        <div className="input-section">
          <h3>Number of Long Suits (6+ cards)</h3>
          <div className="numeric-input">
            {createButton('decrement', 'longsuit-decrement', longSuits <= 0, '-', 'decrement-btn')}
            <div className="input-value">{longSuits}</div>
            {createButton('increment', 'longsuit-increment', longSuits >= 4, '+', 'increment-btn')}
          </div>
        </div>
      </div>

      <div className="action-buttons">
        {createButton('cancel', 'cancel', false, 'Cancel', 'cancel-btn')}
        {createButton('save', 'save', false, 'Calculate Final Score', 'save-btn')}
      </div>

      {showExplanation && (
        <BonusBridgeExplanation onClose={handleHideExplanation} />
      )}
    </div>
  );
};

export default ScoreAdjustment;
