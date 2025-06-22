import React, { useState } from 'react';
import './GameAnalysisExplanation.css';

/**
 * Component to explain Game Analysis features - Mobile Optimized
 * @param {Object} props - Component props
 * @param {Function} props.onClose - Function to close the explanation
 */
const GameAnalysisExplanation = ({ onClose }) => {
  // State for active tab
  const [activeTab, setActiveTab] = useState('overview');
  
  // Change active tab
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Handle overlay click (close popup)
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  return (
    <div className="game-analysis-explanation" onClick={handleOverlayClick}>
      <div className="explanation-content">
        <div className="explanation-header">
          <h2>Game Analysis Features</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <div className="explanation-tabs">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => handleTabChange('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab-btn ${activeTab === 'tracking' ? 'active' : ''}`}
            onClick={() => handleTabChange('tracking')}
          >
            Tracking
          </button>
          <button 
            className={`tab-btn ${activeTab === 'insights' ? 'active' : ''}`}
            onClick={() => handleTabChange('insights')}
          >
            Insights
          </button>
          <button 
            className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => handleTabChange('reports')}
          >
            Reports
          </button>
        </div>
        
        <div className="explanation-body">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <h3>Comprehensive Game Analysis</h3>
              <p>
                Bonus Bridge provides detailed analysis of your bridge games, helping you understand patterns, improve your play, and track your progress over time.
              </p>
              
              <h3>What Gets Analyzed</h3>
              <ul>
                <li>
                  <strong>Contract Success Rate:</strong> Track your bidding accuracy
                </li>
                <li>
                  <strong>Performance vs Hand Strength:</strong> See how well you play given your cards
                </li>
                <li>
                  <strong>Vulnerability Patterns:</strong> Analyze your vulnerable vs non-vulnerable results
                </li>
                <li>
                  <strong>Suit Preferences:</strong> Discover your strongest and weakest suits
                </li>
                <li>
                  <strong>Partnership Dynamics:</strong> Compare NS vs EW performance
                </li>
              </ul>
              
              <h3>Key Benefits</h3>
              <ul>
                <li>Identify areas for improvement</li>
                <li>Track progress over multiple games</li>
                <li>Understand your playing strengths</li>
                <li>Make informed partnership decisions</li>
              </ul>
            </div>
          )}
          
          {/* Tracking Tab */}
          {activeTab === 'tracking' && (
            <div className="tracking-tab">
              <h3>Real-Time Game Tracking</h3>
              <p>
                Every deal is automatically analyzed and stored for comprehensive review.
              </p>
              
              <h3>Deal-by-Deal Analysis</h3>
              <ul>
                <li><strong>Contract Analysis:</strong> Level, suit, declarer, vulnerability</li>
                <li><strong>HCP Distribution:</strong> Point balance between partnerships</li>
                <li><strong>Expected vs Actual:</strong> Performance compared to hand strength</li>
                <li><strong>Scoring Comparison:</strong> Party Bridge vs Bonus Bridge results</li>
              </ul>
              
              <h3>Automatic Calculations</h3>
              <div className="calculation-example">
                <h4>For Each Deal:</h4>
                <ul>
                  <li>Expected tricks based on HCP and distribution</li>
                  <li>Performance bonus/penalty calculations</li>
                  <li>Contract ambition assessment</li>
                  <li>Defender effectiveness rating</li>
                </ul>
              </div>
              
              <h3>Game Session Summary</h3>
              <ul>
                <li>Total deals played</li>
                <li>Overall scoring comparison</li>
                <li>Best and worst performing deals</li>
                <li>Partnership balance analysis</li>
              </ul>
            </div>
          )}
          
          {/* Insights Tab */}
          {activeTab === 'insights' && (
            <div className="insights-tab">
              <h3>Performance Insights</h3>
              <p>
                Discover patterns and trends in your bridge play through detailed statistics.
              </p>
              
              <h3>Contract Performance</h3>
              <div className="insight-category">
                <h4>Success Rates by Level</h4>
                <ul>
                  <li>Part-game contracts (1-2 level)</li>
                  <li>Game contracts (3NT, 4♥/♠, 5♣/♦)</li>
                  <li>Slam contracts (6 and 7 level)</li>
                </ul>
              </div>
              
              <div className="insight-category">
                <h4>Suit Analysis</h4>
                <ul>
                  <li>Major suit vs minor suit success</li>
                  <li>No-trump vs suit contracts</li>
                  <li>Trump suit quality impact</li>
                </ul>
              </div>
              
              <h3>Hand Strength Correlation</h3>
              <ul>
                <li><strong>Overachievement:</strong> Success with weak hands</li>
                <li><strong>Underachievement:</strong> Failures with strong hands</li>
                <li><strong>Optimal Play:</strong> Expected results achieved</li>
              </ul>
              
              <h3>Vulnerability Impact</h3>
              <ul>
                <li>Risk-taking when vulnerable</li>
                <li>Conservative vs aggressive bidding</li>
                <li>Penalty avoidance effectiveness</li>
              </ul>
            </div>
          )}
          
          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="reports-tab">
              <h3>Game Summary Reports</h3>
              <p>
                At the end of each game session, view comprehensive reports showing your performance.
              </p>
              
              <h3>Session Report Includes</h3>
              <div className="report-section">
                <h4>📊 Score Comparison</h4>
                <ul>
                  <li>Party Bridge vs Bonus Bridge totals</li>
                  <li>Point differences and explanations</li>
                  <li>Partnership balance assessment</li>
                </ul>
              </div>
              
              <div className="report-section">
                <h4>🎯 Performance Highlights</h4>
                <ul>
                  <li>Best performed deals</li>
                  <li>Most challenging contracts</li>
                  <li>Exceptional achievements</li>
                  <li>Learning opportunities</li>
                </ul>
              </div>
              
              <div className="report-section">
                <h4>📈 Trends & Patterns</h4>
                <ul>
                  <li>Bidding accuracy trends</li>
                  <li>Play execution consistency</li>
                  <li>Risk vs reward analysis</li>
                  <li>Improvement recommendations</li>
                </ul>
              </div>
              
              <h3>Export & Sharing</h3>
              <ul>
                <li>Save reports for future reference</li>
                <li>Share with bridge partners</li>
                <li>Compare multiple game sessions</li>
                <li>Track long-term progress</li>
              </ul>
              
              <div className="future-features">
                <h4>🔮 Coming Soon</h4>
                <ul>
                  <li>Historical trend graphs</li>
                  <li>Multi-session comparisons</li>
                  <li>Advanced statistical analysis</li>
                  <li>Personalized improvement tips</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameAnalysisExplanation;