import React, { useState } from 'react';
import './BonusBridgeExplanation.css';

/**
 * Component to explain Bonus Bridge scoring system - Mobile Optimized
 * @param {Object} props - Component props
 * @param {Function} props.onClose - Function to close the explanation
 */
const BonusBridgeExplanation = ({ onClose }) => {
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
    <div className="bonus-bridge-explanation" onClick={handleOverlayClick}>
      <div className="explanation-content">
        <div className="explanation-header">
          <h2>Bonus Bridge Scoring</h2>
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
            className={`tab-btn ${activeTab === 'hcp' ? 'active' : ''}`}
            onClick={() => handleTabChange('hcp')}
          >
            HCP
          </button>
          <button 
            className={`tab-btn ${activeTab === 'performance' ? 'active' : ''}`}
            onClick={() => handleTabChange('performance')}
          >
            Performance
          </button>
          <button 
            className={`tab-btn ${activeTab === 'examples' ? 'active' : ''}`}
            onClick={() => handleTabChange('examples')}
          >
            Examples
          </button>
        </div>
        
        <div className="explanation-body">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <h3>What is Bonus Bridge?</h3>
              <p>
                An enhanced scoring system that rewards both declarers and defenders based on hand strength and performance versus expectations.
              </p>
              
              <h3>Key Features</h3>
              <ul>
                <li>
                  <strong>HCP Balance:</strong> Evaluates point distribution between teams
                </li>
                <li>
                  <strong>Performance Analysis:</strong> Compares expected vs. actual tricks
                </li>
                <li>
                  <strong>Contract Ambition:</strong> Rewards appropriate bidding choices
                </li>
                <li>
                  <strong>Distribution Points:</strong> Accounts for shapely hands
                </li>
              </ul>
              
              <h3>How It Works</h3>
              <p>
                After each deal, enter the HCP and distribution for declarer/dummy and defenders. The system calculates expected performance and adjusts scores based on actual results.
              </p>
            </div>
          )}
          
          {/* HCP & Distribution Tab */}
          {activeTab === 'hcp' && (
            <div className="hcp-tab">
              <h3>High Card Points</h3>
              <p>
                Standard valuation: A=4, K=3, Q=2, J=1
              </p>
              
              <h3>Expected HCP by Level</h3>
              <table className="expected-hcp-table">
                <thead>
                  <tr>
                    <th>Level</th>
                    <th>Expected HCP</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>1-2</td><td>20-24</td></tr>
                  <tr><td>3</td><td>25-26</td></tr>
                  <tr><td>4</td><td>27-28</td></tr>
                  <tr><td>5</td><td>29-30</td></tr>
                  <tr><td>6</td><td>31-35</td></tr>
                  <tr><td>7</td><td>36+</td></tr>
                </tbody>
              </table>
              
              <h3>HCP Balance Impact</h3>
              <ul>
                <li><strong>Advantage (60%+):</strong> Reduced performance bonuses</li>
                <li><strong>Disadvantage (40%-):</strong> Increased bonuses for success</li>
              </ul>
              
              <h3>Distribution Points</h3>
              <ul>
                <li>Singleton: 1 pt</li>
                <li>Void: 3 pts</li>
                <li>Long suit (6+): 1 pt per card over 4</li>
              </ul>
            </div>
          )}
          
          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="performance-tab">
              <h3>Expected Tricks</h3>
              <div className="formula">
                6 + (HCP / 3) + (Distribution / 4)
              </div>
              
              <h3>Performance Adjustments</h3>
              <ul>
                <li><strong>Over-performance:</strong> +10 pts per extra trick</li>
                <li><strong>Under-performance:</strong> -8 pts per missed trick</li>
              </ul>
              
              <h3>Contract Ambition</h3>
              <ul>
                <li><strong>Underbidding:</strong> -10 pts (with strong hands)</li>
                <li><strong>Appropriate bidding:</strong> No penalty</li>
              </ul>
              
              <h3>Defender Rewards</h3>
              <ul>
                <li>Setting contracts with HCP disadvantage</li>
                <li>Limiting overtricks when possible</li>
              </ul>
            </div>
          )}
          
          {/* Examples Tab */}
          {activeTab === 'examples' && (
            <div className="examples-tab">
              <h3>Made with HCP Advantage</h3>
              <div className="example-scenario">
                <p><strong>4♠ by N, 28 HCP (70%)</strong></p>
                <p>Made exactly (10 tricks)</p>
              </div>
              <div className="example-calculation">
                <p>Base: 21 pts → HCP adj: -2 → Performance: -10 → <strong>Final: 9 pts</strong></p>
              </div>
              
              <h3>Failed with HCP Disadvantage</h3>
              <div className="example-scenario">
                <p><strong>3NT by E, 18 HCP (45%)</strong></p>
                <p>Down 1 (8 tricks)</p>
              </div>
              <div className="example-calculation">
                <p>Defenders: 11 pts → Declarer consolation: 3 pts</p>
              </div>
              
              <h3>Overtricks</h3>
              <div className="example-scenario">
                <p><strong>2♥ by S, 23 HCP, +2</strong></p>
                <p>Made +2 (10 tricks)</p>
              </div>
              <div className="example-calculation">
                <p>Base: 6 pts → Performance: +8 → Ambition: -5 → <strong>Final: 9 pts</strong></p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BonusBridgeExplanation;