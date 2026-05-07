import React, { useState, useEffect } from 'react';
import BonusBridgeExplanation from './BonusBridgeExplanation';
import PartyBridgeExplanation from './PartyBridgeExplanation';
import GameAnalysisExplanation from './GameAnalysisExplanation';
import MobileFriendlyExplanation from './MobileFriendlyExplanation';
import bonusBridgeLogo from '../bonus-bridge-logo.png';
import './WelcomePage.css';

const WelcomePage = ({ onStartGame }) => {
  const [logoAnimated, setLogoAnimated] = useState(false);
  const [showBonusExplanation, setShowBonusExplanation] = useState(false);
  const [showPartyExplanation, setShowPartyExplanation] = useState(false);
  const [showGameAnalysisExplanation, setShowGameAnalysisExplanation] = useState(false);
  const [showMobileFriendlyExplanation, setShowMobileFriendlyExplanation] = useState(false);

  useEffect(() => {
    // Trigger logo animation after component mounts
    const timer = setTimeout(() => {
      setLogoAnimated(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Handle feature box clicks
  const handleFeatureClick = (featureType) => {
    switch(featureType) {
      case 'bonus-bridge':
        setShowBonusExplanation(true);
        break;
      case 'party-bridge':
        setShowPartyExplanation(true);
        break;
      case 'game-analysis':
        setShowGameAnalysisExplanation(true);
        break;
      case 'mobile-friendly':
        setShowMobileFriendlyExplanation(true);
        break;
      default:
        break;
    }
  };

  return (
    <div className="welcome-page">
      <div className="welcome-container">
        {/* Logo */}
        <div className={`logo-container ${logoAnimated ? 'animated' : ''}`}>
          <img 
            src={bonusBridgeLogo}
            alt="Bonus Bridge Logo"
            style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover' }}
          />
        </div>

        {/* Main Heading - Smaller */}
        <h1 className="app-title">Welcome to Bonus Bridge</h1>
        
        {/* Subtitle - More Compact */}
        <p className="app-subtitle">
          Skill-based bridge scoring for 4 players — both sides earn points every deal
        </p>

        {/* Creator Credits - Compact */}
        <div className="credits-section">
          <div className="creator-info">
            <p className="affiliation">ONE TABLE BRIDGE</p>
            <p className="creator-name">Created By Mike Smith</p>
          </div>
        </div>

        {/* Features Preview - Two Columns with Click Handlers */}
        <div className="features-preview">
          <div 
            className="feature-item clickable-feature" 
            onClick={() => handleFeatureClick('party-bridge')}
          >
            <span className="feature-icon">🃏</span>
            <span>Party Bridge Scoring</span>
          </div>
          <div 
            className="feature-item clickable-feature" 
            onClick={() => handleFeatureClick('bonus-bridge')}
          >
            <span className="feature-icon">⭐</span>
            <span>Bonus Bridge System</span>
          </div>
          <div 
            className="feature-item clickable-feature" 
            onClick={() => handleFeatureClick('game-analysis')}
          >
            <span className="feature-icon">📊</span>
            <span>Game Analysis</span>
          </div>
          <div 
            className="feature-item clickable-feature" 
            onClick={() => handleFeatureClick('mobile-friendly')}
          >
            <span className="feature-icon">📱</span>
            <span>Mobile-Friendly</span>
          </div>
        </div>

        {/* Call to Action Button */}
        <button 
          className="start-game-btn"
          onClick={onStartGame}
        >
          <span className="btn-text">Let's Play Bridge!</span>
          <span className="btn-icon">🚀</span>
        </button>
      </div>

      {/* Bonus Bridge Explanation Popup */}
      {showBonusExplanation && (
        <BonusBridgeExplanation 
          onClose={() => setShowBonusExplanation(false)}
        />
      )}

      {/* Party Bridge Explanation Popup */}
      {showPartyExplanation && (
        <PartyBridgeExplanation 
          onClose={() => setShowPartyExplanation(false)}
        />
      )}

      {/* Game Analysis Explanation Popup */}
      {showGameAnalysisExplanation && (
        <GameAnalysisExplanation 
          onClose={() => setShowGameAnalysisExplanation(false)}
        />
      )}

      {/* Mobile-Friendly Explanation Popup */}
      {showMobileFriendlyExplanation && (
        <MobileFriendlyExplanation 
          onClose={() => setShowMobileFriendlyExplanation(false)}
        />
      )}
    </div>
  );
};

export default WelcomePage;