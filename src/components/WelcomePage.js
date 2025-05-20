import React, { useState, useEffect } from 'react';
import './WelcomePage.css';

const WelcomePage = ({ onStartGame }) => {
  const [logoAnimated, setLogoAnimated] = useState(false);

  useEffect(() => {
    // Trigger logo animation after component mounts
    const timer = setTimeout(() => {
      setLogoAnimated(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="welcome-page">
      <div className="welcome-container">
        {/* Animated Logo - Smaller */}
        <div className={`logo-container ${logoAnimated ? 'animated' : ''}`}>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="120" 
            height="120" 
            viewBox="0 0 100 100"
            className="app-logo"
          >
            <defs>
              <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e5c8b" />
                <stop offset="50%" stopColor="#3498db" />
                <stop offset="100%" stopColor="#87CEFA" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Background circle */}
            <circle cx="50" cy="50" r="45" fill="url(#logoGradient)" filter="url(#glow)"/>
            
            {/* Playing card suits in corners */}
            <text x="25" y="30" fontSize="12" fill="red" className="suit-symbol">♥</text>
            <text x="75" y="30" fontSize="12" fill="black" className="suit-symbol">♠</text>
            <text x="25" y="80" fontSize="12" fill="red" className="suit-symbol">♦</text>
            <text x="75" y="80" fontSize="12" fill="black" className="suit-symbol">♣</text>
            
            {/* Main "B" letter */}
            <text 
              x="50" 
              y="70" 
              fontFamily="Georgia, serif" 
              fontSize="48" 
              fontWeight="bold" 
              textAnchor="middle" 
              fill="white"
              className="main-letter"
            >
              B
            </text>
            
            {/* "BONUS" text */}
            <text 
              x="50" 
              y="25" 
              fontFamily="Arial, sans-serif" 
              fontSize="10" 
              fontWeight="bold" 
              textAnchor="middle" 
              fill="white"
              className="bonus-text"
            >
              BONUS
            </text>
          </svg>
        </div>

        {/* Main Heading - Smaller */}
        <h1 className="app-title">Welcome to Bonus Bridge</h1>
        
        {/* Subtitle - More Compact */}
        <p className="app-subtitle">
          Exciting competitive Bridge for 4 players
        </p>

        {/* Creator Credits - Compact */}
        <div className="credits-section">
          <div className="creator-info">
            <p className="creator-name">Created by Mike Smith</p>
            <div className="affiliations">
              <p className="affiliation">Javea School of Bridge</p>
              <p className="affiliation">The Valley's International Bridge Club</p>
            </div>
          </div>
        </div>

        {/* Features Preview - Two Columns */}
        <div className="features-preview">
          <div className="feature-item">
            <span className="feature-icon">🃏</span>
            <span>Party Bridge Scoring</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">⭐</span>
            <span>Bonus Bridge System</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📊</span>
            <span>Game Analysis</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📱</span>
            <span>Mobile-Friendly</span>
          </div>
        </div>

        {/* Call to Action Button */}
        <button 
          className="start-game-btn"
          onClick={onStartGame}
        >
          <span className="btn-text">Let's Play Bonus Bridge!</span>
          <span className="btn-icon">🚀</span>
        </button>
      </div>
    </div>
  );
};

export default WelcomePage;