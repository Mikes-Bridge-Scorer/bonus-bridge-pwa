import React, { useState } from 'react';
import './PartyBridgeExplanation.css';

/**
 * Component to explain Party Bridge scoring system - Mobile Optimized
 * @param {Object} props - Component props
 * @param {Function} props.onClose - Function to close the explanation
 */
const PartyBridgeExplanation = ({ onClose }) => {
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
    <div className="party-bridge-explanation" onClick={handleOverlayClick}>
      <div className="explanation-content">
        <div className="explanation-header">
          <h2>Party Bridge Scoring</h2>
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
            className={`tab-btn ${activeTab === 'scoring' ? 'active' : ''}`}
            onClick={() => handleTabChange('scoring')}
          >
            Scoring
          </button>
          <button 
            className={`tab-btn ${activeTab === 'limitations' ? 'active' : ''}`}
            onClick={() => handleTabChange('limitations')}
          >
            Limitations
          </button>
          <button 
            className={`tab-btn ${activeTab === 'comparison' ? 'active' : ''}`}
            onClick={() => handleTabChange('comparison')}
          >
            vs Bonus
          </button>
        </div>
        
        <div className="explanation-body">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <h3>What is Party Bridge?</h3>
              <p>
                Party Bridge is traditional bridge scoring designed for casual play at a single table with 4 players. It uses standard bridge scoring rules without any adjustments for hand strength or playing skill.
              </p>
              
              <h3>Key Characteristics</h3>
              <ul>
                <li>
                  <strong>Standard Scoring:</strong> Uses traditional bridge point values
                </li>
                <li>
                  <strong>4 Players Only:</strong> Designed for one table bridge
                </li>
                <li>
                  <strong>No Skill Adjustment:</strong> Same score regardless of hand strength
                </li>
                <li>
                  <strong>Simple & Quick:</strong> Easy to calculate, familiar to all bridge players
                </li>
              </ul>
              
              <h3>Perfect For</h3>
              <ul>
                <li>Casual home bridge games</li>
                <li>Learning bridge scoring</li>
                <li>Quick social games</li>
                <li>Traditional bridge enthusiasts</li>
              </ul>
            </div>
          )}
          
          {/* Scoring Tab */}
          {activeTab === 'scoring' && (
            <div className="scoring-tab">
              <h3>Basic Contract Scores</h3>
              <table className="scoring-table">
                <thead>
                  <tr>
                    <th>Contract</th>
                    <th>Points per Trick</th>
                    <th>Example (4-level)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>♣ ♦ (Minors)</td><td>20</td><td>4♣ = 80 pts</td></tr>
                  <tr><td>♥ ♠ (Majors)</td><td>30</td><td>4♥ = 120 pts</td></tr>
                  <tr><td>NT (No Trump)</td><td>30 + 10</td><td>3NT = 100 pts</td></tr>
                </tbody>
              </table>
              
              <h3>Bonus Points</h3>
              <ul>
                <li><strong>Game Bonus:</strong> 300 (not vulnerable) / 500 (vulnerable)</li>
                <li><strong>Part Game:</strong> 50 points</li>
                <li><strong>Small Slam:</strong> 500 / 750 points</li>
                <li><strong>Grand Slam:</strong> 1000 / 1500 points</li>
                <li><strong>Doubling:</strong> Doubles contract points and penalties</li>
              </ul>
              
              <h3>Overtricks & Penalties</h3>
              <ul>
                <li><strong>Overtricks:</strong> Same value as contract suit</li>
                <li><strong>Doubled Overtricks:</strong> 100/200 (not vul/vul)</li>
                <li><strong>Penalties:</strong> 50/100 per trick (not vul/vul)</li>
                <li><strong>Doubled Penalties:</strong> 100/200/300... progression</li>
              </ul>
            </div>
          )}
          
          {/* Limitations Tab */}
          {activeTab === 'limitations' && (
            <div className="limitations-tab">
              <h3>The Core Problem</h3>
              <p>
                <strong>Party Bridge treats all hands equally</strong> - a major flaw that makes the game less competitive and fair.
              </p>
              
              <h3>Unfair Scenarios</h3>
              
              <div className="scenario-example">
                <h4>Strong Hand vs Weak Hand</h4>
                <div className="scenario-comparison">
                  <div className="scenario-side">
                    <h5>Player A (Strong Hand)</h5>
                    <p>♠ AKQ ♥ AKQ ♦ AKQ ♣ AKQ</p>
                    <p><strong>28 HCP - Easy 4♥ make</strong></p>
                    <p>Score: <strong>420 points</strong></p>
                  </div>
                  <div className="scenario-side">
                    <h5>Player B (Weak Hand)</h5>
                    <p>♠ xxx ♥ Jxxx ♦ xxx ♣ xxx</p>
                    <p><strong>6 HCP - Lucky 4♥ make</strong></p>
                    <p>Score: <strong>420 points</strong></p>
                  </div>
                </div>
                <p className="scenario-conclusion">
                  <strong>Same score despite completely different skill requirements!</strong>
                </p>
              </div>
              
              <h3>Other Issues</h3>
              <ul>
                <li><strong>No Skill Recognition:</strong> Brilliant play gets same score as lucky cards</li>
                <li><strong>Defender Frustration:</strong> Great defense unrewarded if contract still makes</li>
                <li><strong>Predictable Outcomes:</strong> Best cards usually win</li>
                <li><strong>Limited Strategy:</strong> Less incentive for creative bidding or play</li>
              </ul>
            </div>
          )}
          
          {/* Comparison Tab */}
          {activeTab === 'comparison' && (
            <div className="comparison-tab">
              <h3>Party Bridge vs Bonus Bridge</h3>
              
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Aspect</th>
                    <th>Party Bridge</th>
                    <th>Bonus Bridge</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Hand Strength</td>
                    <td>❌ Ignored</td>
                    <td>✅ Evaluated</td>
                  </tr>
                  <tr>
                    <td>Skill Recognition</td>
                    <td>❌ None</td>
                    <td>✅ Rewarded</td>
                  </tr>
                  <tr>
                    <td>Defender Rewards</td>
                    <td>❌ Limited</td>
                    <td>✅ Fair share</td>
                  </tr>
                  <tr>
                    <td>Competitive Balance</td>
                    <td>❌ Card dependent</td>
                    <td>✅ Skill based</td>
                  </tr>
                  <tr>
                    <td>Learning Curve</td>
                    <td>✅ Simple</td>
                    <td>⚠️ More complex</td>
                  </tr>
                  <tr>
                    <td>Setup Time</td>
                    <td>✅ Instant</td>
                    <td>⚠️ Requires analysis</td>
                  </tr>
                </tbody>
              </table>
              
              <h3>When to Choose Each</h3>
              
              <div className="choice-guidance">
                <div className="choice-option">
                  <h4>Choose Party Bridge For:</h4>
                  <ul>
                    <li>Casual social games</li>
                    <li>Learning bridge basics</li>
                    <li>Quick games without analysis</li>
                    <li>Traditional bridge purists</li>
                  </ul>
                </div>
                
                <div className="choice-option">
                  <h4>Choose Bonus Bridge For:</h4>
                  <ul>
                    <li>Competitive play</li>
                    <li>Skill development focus</li>
                    <li>Fair recognition of ability</li>
                    <li>More engaging strategy</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartyBridgeExplanation;