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
                A skill-based scoring system that rewards both declarers and defenders based on the strength of their cards relative to what the contract needed — not just whether the contract was made.
              </p>

              <h3>Core Principles</h3>
              <ul>
                <li><strong>Strong hand makes contract:</strong> Unimpressive — penalised</li>
                <li><strong>Weak hand makes contract:</strong> Skilful — rewarded handsomely</li>
                <li><strong>Strong hand goes down:</strong> Punished heavily</li>
                <li><strong>Weak hand goes down:</strong> Defenders rewarded, but not excessively</li>
              </ul>

              <h3>Key Features</h3>
              <ul>
                <li><strong>Vulnerability matters for games:</strong> Making a vulnerable game earns a bonus — you took a real risk</li>
                <li><strong>Both sides score:</strong> Defenders earn points on every deal</li>
                <li><strong>Contract level rewarded:</strong> Bidding and making slams scores highest</li>
                <li><strong>Base score 30:</strong> All scores start at 30 and adjust from there</li>
              </ul>

              <h3>How It Works</h3>
              <p>
                After each deal, count the combined HCP for Declarer and Dummy, plus any distribution points. The app calculates how strong or weak the hand was relative to the contract bid, and adjusts scores accordingly.
              </p>
            </div>
          )}

          {/* HCP Tab */}
          {activeTab === 'hcp' && (
            <div className="hcp-tab">
              <h3>High Card Points</h3>
              <p>Standard valuation: A=4, K=3, Q=2, J=1 (maximum 40 in the deck)</p>

              <h3>Expected HCP by Contract</h3>
              <p>Each contract has an expected HCP — the amount you'd typically need to make it:</p>
              <table className="expected-hcp-table">
                <thead>
                  <tr>
                    <th>Contract</th>
                    <th>Expected HCP</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Part score (1–2 level)</td><td>21</td></tr>
                  <tr><td>3 major (♥/♠)</td><td>23</td></tr>
                  <tr><td>3NT</td><td>25</td></tr>
                  <tr><td>4 major game (♥/♠)</td><td>24</td></tr>
                  <tr><td>5 minor game (♣/♦)</td><td>27</td></tr>
                  <tr><td>Small slam (6 level)</td><td>30</td></tr>
                  <tr><td>Grand slam (7 level)</td><td>32</td></tr>
                </tbody>
              </table>

              <h3>Surplus and Deficit</h3>
              <ul>
                <li><strong>Surplus</strong> = you had more HCP than expected → penalty of 1.5 pts per surplus point</li>
                <li><strong>Deficit</strong> = you had fewer HCP than expected → bonus of 1.5 pts per deficit point</li>
              </ul>

              <h3>Distribution Points</h3>
              <ul>
                <li>Void: 3 points</li>
                <li>Singleton: 2 points</li>
                <li>Long suit (6+ cards): 1 point</li>
              </ul>
              <p>High distribution reduces your declarer score slightly — shapely hands make contracts easier.</p>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="performance-tab">
              <h3>Made Contracts — Declarer Score</h3>
              <ul>
                <li><strong>Base:</strong> 30 points</li>
                <li><strong>Strong hand (surplus):</strong> −1.5 pts per HCP above expected</li>
                <li><strong>Weak hand (deficit):</strong> +1.5 pts per HCP below expected</li>
                <li><strong>Game bonus:</strong> +3 pts</li>
                <li><strong>Vulnerable game bonus:</strong> +3 pts extra (rewards the risk taken)</li>
                <li><strong>Small slam bonus:</strong> +8 pts</li>
                <li><strong>Grand slam bonus:</strong> +15 pts</li>
                <li><strong>Weak hand part score bonus:</strong> +3 pts (if deficit &gt; 3)</li>
                <li><strong>Overtricks:</strong> +1 pt each (max +3)</li>
                <li><strong>Distribution penalty:</strong> −1 to −3 pts for shapely hands</li>
              </ul>

              <h3>Made Contracts — Defender Score</h3>
              <ul>
                <li>1.0 pt per HCP surplus point declarer held</li>
                <li>+1 pt per overtrick if declarer had surplus &gt; 3</li>
                <li>Cannot exceed declarer score on a made contract</li>
              </ul>

              <h3>Defeated Contracts — Defender Score</h3>
              <ul>
                <li><strong>Base:</strong> 30 points</li>
                <li><strong>Strong declarer went down:</strong> +1.5 pts per surplus point</li>
                <li><strong>Weak declarer went down:</strong> −0.75 pts per deficit point</li>
                <li><strong>Down 1:</strong> +2 pts | <strong>Down 2:</strong> +5 pts</li>
                <li><strong>Down 3:</strong> +8 pts | <strong>Down 4+:</strong> +10 pts (capped)</li>
                <li><strong>Defeated game:</strong> +3 pts</li>
                <li><strong>Defeated slam:</strong> +6 pts</li>
                <li><strong>Vulnerable declarer went down:</strong> +2 pts per undertrick (all contracts)</li>
                <li><strong>Doubled contracts:</strong> defeat margin bonus halved</li>
                <li><strong>Redoubled contracts:</strong> defeat margin bonus quartered</li>
              </ul>

              <h3>Defeated Contracts — Declarer Consolation</h3>
              <ul>
                <li>Only awarded if declarer HCP was below expected</li>
                <li>0.5 pts per deficit point (maximum 5 pts)</li>
              </ul>
            </div>
          )}

          {/* Examples Tab */}
          {activeTab === 'examples' && (
            <div className="examples-tab">
              <h3>Vulnerable Game Makes</h3>
              <div className="example-scenario">
                <p><strong>4♥ by S, 24 HCP (exactly expected), Vulnerable</strong></p>
                <p>Made exactly (10 tricks)</p>
              </div>
              <div className="example-calculation">
                <p>Base 30 + Game 3 + Vul bonus 3 = <strong>Declarer: 36 pts</strong></p>
                <p>vs Non-vulnerable same contract: <strong>33 pts</strong></p>
                <p>The extra 3 points reward the courage to bid game when vulnerable.</p>
              </div>

              <h3>Vulnerable Contract Goes Down</h3>
              <div className="example-scenario">
                <p><strong>2♥ by S, 21 HCP, Vulnerable, Down 2</strong></p>
              </div>
              <div className="example-calculation">
                <p>Base 30 + Down 2 (5) + Vul penalty (2×2=4) = <strong>Defenders: 39 pts</strong></p>
                <p>vs Non-vulnerable same result: <strong>35 pts</strong></p>
                <p>Defenders earn more for defeating a vulnerable contract.</p>
              </div>

              <h3>Strong Hand Makes Game</h3>
              <div className="example-scenario">
                <p><strong>4♥ by S, 28 HCP (surplus 4)</strong></p>
                <p>Made exactly (10 tricks)</p>
              </div>
              <div className="example-calculation">
                <p>Base 30 − HCP penalty 6 + Game 3 = <strong>Declarer: 27 pts</strong></p>
                <p>Defenders: 4 surplus × 1.0 = <strong>4 pts</strong></p>
              </div>

              <h3>Weak Hand Makes Game</h3>
              <div className="example-scenario">
                <p><strong>4♥ by S, 20 HCP (deficit 4)</strong></p>
                <p>Made exactly (10 tricks)</p>
              </div>
              <div className="example-calculation">
                <p>Base 30 + HCP bonus 6 + Game 3 = <strong>Declarer: 39 pts</strong></p>
                <p>Defenders: <strong>0 pts</strong></p>
              </div>

              <h3>Weak Hand Makes Part Score</h3>
              <div className="example-scenario">
                <p><strong>2♥ by S, 16 HCP (deficit 5)</strong></p>
                <p>Made exactly (8 tricks)</p>
              </div>
              <div className="example-calculation">
                <p>Base 30 + HCP bonus 7.5 + Weak bonus 3 = <strong>Declarer: 40 pts</strong></p>
                <p>A weak hand making a part score beats a strong hand making game!</p>
              </div>

              <h3>Weak Slam — Highest Score</h3>
              <div className="example-scenario">
                <p><strong>7♠ by N, 28 HCP (deficit 4)</strong></p>
                <p>Made exactly (13 tricks)</p>
              </div>
              <div className="example-calculation">
                <p>Base 30 + HCP bonus 6 + Grand Slam 15 = <strong>Declarer: 51 pts</strong></p>
                <p>A weak hand making a grand slam is the highest scoring outcome.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BonusBridgeExplanation;