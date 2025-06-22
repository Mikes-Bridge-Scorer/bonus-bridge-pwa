import React, { useState, useEffect } from 'react';
import './TrialPopup.css';

const TrialPopup = ({ trialManager, onClose, onExtended, onExtensionRequest, type }) => {
  const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', '', '']);
  const [extensionResult, setExtensionResult] = useState(null);
  const [showExtensionInput, setShowExtensionInput] = useState(false);

  useEffect(() => {
    if (type === 'extension') {
      setShowExtensionInput(false);
    }
  }, [type]);

  const handleDigitChange = (index, value) => {
    if (value.length > 1) return;
    
    const newDigits = [...codeDigits];
    newDigits[index] = value.toUpperCase();
    setCodeDigits(newDigits);

    if (value && index < 6) {
      const nextInput = document.getElementById(`digit-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      const prevInput = document.getElementById(`digit-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleExtensionSubmit = () => {
    const code = codeDigits.join('');
    if (code.length !== 7) return;

    setExtensionResult(null);
    
    try {
      const result = trialManager.extendTrial(code);
      setExtensionResult(result);

      if (result.success && !result.isTestMode) {
        setTimeout(() => {
          setCodeDigits(['', '', '', '', '', '', '']);
          setShowExtensionInput(false);
          setExtensionResult(null);
          onExtended();
        }, 3000);
      }
    } catch (error) {
      console.error('Error in extendTrial:', error);
      setExtensionResult({
        success: false,
        message: 'Error processing extension code: ' + error.message
      });
    }
  };

  const handleTestModeClose = () => {
    setCodeDigits(['', '', '', '', '', '', '']);
    setShowExtensionInput(false);
    setExtensionResult(null);
    onExtended();
  };

  const getTrialStats = () => {
    try {
      return trialManager.getStats() || {
        dealsPlayed: 0,
        maxDeals: 50,
        remainingDeals: 50,
        gamesCompleted: 0,
        daysUsed: 1
      };
    } catch (e) {
      return {
        dealsPlayed: 0,
        maxDeals: 50,
        remainingDeals: 50,
        gamesCompleted: 0,
        daysUsed: 1
      };
    }
  };

  const stats = getTrialStats();
  const canClose = type !== 'expired';
  const isCodeComplete = codeDigits.every(digit => digit !== '');

  return (
    <div className="trial-popup-overlay">
      <div className="trial-popup">
        <div className="trial-header">
          <h2>
            {type === 'expired' ? '🚫 Trial Period Expired' : 
             type === 'warning' ? '⚠️ Trial Nearly Complete' : 
             type === 'extension' ? '🎁 Get More Deals' :
             '🎯 Welcome to Bonus Bridge'}
          </h2>
          {canClose && (
            <button className="trial-close-btn" onClick={onClose}>×</button>
          )}
        </div>

        <div className="trial-content">
          {type === 'info' && (
            <>
              <div className="trial-icon">🎯</div>
              <div className="trial-message-box">
                <p className="main-message">
                  You have <span className="highlight-number">{stats.remainingDeals} deals</span> to evaluate the application.
                </p>
              </div>
              
              <div className="usage-section">
                <h3 className="usage-title">📊 Your Usage</h3>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-number">{stats.dealsPlayed}/{stats.maxDeals}</div>
                    <div className="stat-label">Deals Played</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{stats.remainingDeals}</div>
                    <div className="stat-label">Remaining</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{stats.gamesCompleted}</div>
                    <div className="stat-label">Games Completed</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{stats.daysUsed}</div>
                    <div className="stat-label">Days Used</div>
                  </div>
                </div>
              </div>

              <button className="start-evaluating-btn" onClick={onClose}>
                Continue Evaluating
              </button>

              <div className="get-more-deals-section">
                <div className="section-divider"></div>
                <p className="done-text">Done evaluating?</p>
                <button className="get-more-btn" onClick={() => onExtensionRequest && onExtensionRequest()}>
                  🎁 Get More Deals
                </button>
              </div>
            </>
          )}

          {type === 'extension' && (
            <>
              <div className="trial-icon">🎁</div>
              <div className="personalized-message">
                <p className="thank-you-message">
                  Thank you for playing Bonus Bridge! You have already played <span className="highlight-number">{stats.dealsPlayed} deals</span> and have <span className="highlight-number">{stats.remainingDeals} deals</span> left.
                </p>
                <p className="purchase-message">
                  To buy more deals, click on the request extension code button below to send an email:
                </p>
              </div>
              
              <div className="extension-info-box">
                <div className="pricing-section">
                  <h4>Available Packages:</h4>
                  <div className="pricing-list">
                    <div className="pricing-item">
                      <span>100 deals</span>
                      <span>$18 / £14 / €16 / $28 AUD</span>
                    </div>
                    <div className="pricing-item">
                      <span>200 deals</span>
                      <span>$34 / £26 / €30 / $53 AUD</span>
                    </div>
                    <div className="pricing-item">
                      <span>300 deals</span>
                      <span>$48 / £36 / €43 / $75 AUD</span>
                    </div>
                    <div className="pricing-item">
                      <span>...up to 900 deals</span>
                      <span>$99 / £74 / €88 / $154 AUD</span>
                    </div>
                  </div>
                </div>
              </div>

              {!showExtensionInput && (
                <div className="extension-buttons">
                  <button 
                    className="enter-code-btn" 
                    onClick={() => setShowExtensionInput(true)}
                  >
                    Enter Extension Code
                  </button>
                  
                  <button 
                    className="request-code-btn"
                    onClick={() => {
                      const emailData = trialManager.generateFeedbackEmail();
                      if (emailData) {
                        window.open(`mailto:mike@bonusbridge.com?subject=${emailData.subject}&body=${emailData.body}`, '_blank');
                      }
                    }}
                  >
                    📧 Request Extension Code
                  </button>
                  
                  <button 
                    className="back-btn" 
                    onClick={() => onExtensionRequest && onExtensionRequest('info')}
                  >
                    Back to Evaluation
                  </button>
                </div>
              )}

              {showExtensionInput && (
                <div className="extension-input-section">
                  <h3>Enter 7-Digit Extension Code</h3>
                  <p className="input-format">Enter the code you received from Mike Smith (e.g., ABC123X4)</p>
                  
                  <div className="code-input-grid">
                    {codeDigits.map((digit, index) => (
                      <input
                        key={index}
                        id={`digit-${index}`}
                        type="text"
                        value={digit}
                        onChange={(e) => handleDigitChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="digit-input"
                        maxLength="1"
                        placeholder=""
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                  
                  {extensionResult && (
                    <div className={`extension-result ${extensionResult.success ? 'success' : 'error'}`}>
                      <p>{extensionResult.message}</p>
                      {extensionResult.success && !extensionResult.isTestMode && (
                        <div className="success-details">
                          <p><strong>Deals Added:</strong> {extensionResult.dealsAdded}</p>
                          <p><strong>Total Deals:</strong> {extensionResult.totalDeals}</p>
                          <p><strong>Remaining:</strong> {extensionResult.remainingDeals}</p>
                        </div>
                      )}
                      
                      {extensionResult.success && extensionResult.isTestMode && (
                        <div className="test-mode-success">
                          <h3>🧪 Developer Test Mode Activated!</h3>
                          <div className="developer-tools">
                            <h4>🔧 Developer Tools Available:</h4>
                            <ul>
                              <li>✅ All localStorage data cleared</li>
                              <li>✅ Trial reset to fresh state</li>
                              <li>✅ {stats.maxDeals} deals now available</li>
                              <li>✅ Clean testing environment ready</li>
                            </ul>
                            
                            <div className="test-scenarios">
                              <h4>🎯 Test Scenarios:</h4>
                              <div className="scenario-buttons">
                                <button 
                                  className="scenario-btn new-user"
                                  onClick={() => {
                                    localStorage.clear();
                                    setTimeout(() => {
                                      window.location.reload();
                                    }, 100);
                                  }}
                                >
                                  👤 Test New User Flow
                                </button>
                                
                                <button 
                                  className="scenario-btn near-limit"
                                  onClick={() => {
                                    try {
                                      const data = trialManager.getTrialData();
                                      if (data) {
                                        data.dealsPlayed = 49;
                                        data.isExpired = false;
                                        trialManager.saveTrialData(data);
                                      }
                                      
                                      setTimeout(() => {
                                        window.location.reload();
                                      }, 100);
                                    } catch (error) {
                                      console.error('Error setting near limit:', error);
                                    }
                                  }}
                                >
                                  ⚠️ Test Near Limit (49/50)
                                </button>
                                
                                <button 
                                  className="scenario-btn expired"
                                  onClick={() => {
                                    try {
                                      const data = trialManager.getTrialData();
                                      if (data) {
                                        data.dealsPlayed = 50;
                                        data.isExpired = true;
                                        trialManager.saveTrialData(data);
                                      }
                                      
                                      setTimeout(() => {
                                        window.location.reload();
                                      }, 100);
                                    } catch (error) {
                                      console.error('Error setting expired:', error);
                                    }
                                  }}
                                >
                                  🚫 Test Expired State
                                </button>
                                
                                <button 
                                  className="scenario-btn warning"
                                  onClick={() => {
                                    try {
                                      const data = trialManager.getTrialData();
                                      if (data) {
                                        data.dealsPlayed = 30;
                                        data.isExpired = false;
                                        trialManager.saveTrialData(data);
                                      }
                                      
                                      setTimeout(() => {
                                        window.location.reload();
                                      }, 100);
                                    } catch (error) {
                                      console.error('Error setting warning:', error);
                                    }
                                  }}
                                >
                                  ⚠️ Test Warning State (30/50)
                                </button>
                              </div>
                            </div>
                            
                            <div className="test-mode-actions">
                              <button 
                                className="continue-testing-btn"
                                onClick={handleTestModeClose}
                              >
                                Continue Testing (Current State)
                              </button>
                              
                              <button 
                                className="generate-codes-btn"
                                onClick={() => {
                                  const testCodes = trialManager.generateTestCodes();
                                  console.log('Generated test codes:', testCodes);
                                  alert('Test codes generated - check console for details');
                                }}
                              >
                                Generate More Test Codes
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {!extensionResult?.isTestMode && (
                    <div className="code-input-actions">
                      <button 
                        className={`apply-code-btn ${isCodeComplete ? 'active' : 'disabled'}`}
                        onClick={handleExtensionSubmit}
                        disabled={!isCodeComplete}
                      >
                        Apply Extension Code
                      </button>
                      <button 
                        className="cancel-btn" 
                        onClick={() => {
                          setShowExtensionInput(false);
                          setCodeDigits(['', '', '', '', '', '', '']);
                          setExtensionResult(null);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {type === 'warning' && (
            <>
              <div className="trial-icon">⚠️</div>
              <div className="warning-message-box">
                <p className="trial-message">
                  You have {stats.remainingDeals} deals remaining in your evaluation period.
                </p>
              </div>
              
              <div className="usage-section">
                <h3 className="usage-title">📊 Your Usage</h3>
                <div className="stats-compact">
                  <div className="stat-row">
                    <span>Deals Played:</span>
                    <span>{stats.dealsPlayed}/{stats.maxDeals}</span>
                  </div>
                  <div className="stat-row">
                    <span>Remaining:</span>
                    <span>{stats.remainingDeals}</span>
                  </div>
                  <div className="stat-row">
                    <span>Games Completed:</span>
                    <span>{stats.gamesCompleted}</span>
                  </div>
                  <div className="stat-row">
                    <span>Days Used:</span>
                    <span>{stats.daysUsed}</span>
                  </div>
                </div>
              </div>

              <div className="warning-actions">
                <button 
                  className="request-code-btn"
                  onClick={() => {
                    const emailData = trialManager.generateFeedbackEmail();
                    if (emailData) {
                      window.open(`mailto:mike@bonusbridge.com?subject=${emailData.subject}&body=${emailData.body}`, '_blank');
                    }
                  }}
                >
                  📧 Request Extension Code
                </button>
                
                <button 
                  className="enter-code-btn" 
                  onClick={() => onExtensionRequest && onExtensionRequest()}
                >
                  ✏️ Enter 7-Digit Extension Code
                </button>
                
                <button className="continue-btn" onClick={onClose}>
                  Continue Playing
                </button>
              </div>
            </>
          )}

          {type === 'expired' && (
            <>
              <div className="trial-icon">🚫</div>
              <div className="expired-message-box">
                <p className="trial-message">
                  Your evaluation period has ended after {stats.dealsPlayed} deals.
                  Thank you for testing Bonus Bridge!
                </p>
              </div>
              
              <div className="usage-section">
                <h3 className="usage-title">📊 Your Usage</h3>
                <div className="stats-compact">
                  <div className="stat-row">
                    <span>Deals Played:</span>
                    <span>{stats.dealsPlayed}/{stats.maxDeals}</span>
                  </div>
                  <div className="stat-row">
                    <span>Remaining:</span>
                    <span>{stats.remainingDeals}</span>
                  </div>
                  <div className="stat-row">
                    <span>Games Completed:</span>
                    <span>{stats.gamesCompleted}</span>
                  </div>
                  <div className="stat-row">
                    <span>Days Used:</span>
                    <span>{stats.daysUsed}</span>
                  </div>
                </div>
              </div>

              <div className="expired-actions">
                <button 
                  className="request-code-btn"
                  onClick={() => {
                    const emailData = trialManager.generateFeedbackEmail();
                    if (emailData) {
                      window.open(`mailto:mike@bonusbridge.com?subject=${emailData.subject}&body=${emailData.body}`, '_blank');
                    }
                  }}
                >
                  📧 Request Extension Code
                </button>
                
                <button 
                  className="enter-code-btn" 
                  onClick={() => setShowExtensionInput(true)}
                >
                  ✏️ Enter 7-Digit Extension Code
                </button>
              </div>

              <div className="expired-note">
                <p>Note: You can still view previous games, but cannot start new deals without an extension code.</p>
              </div>

              {showExtensionInput && (
                <div className="extension-input-section">
                  <h3>Enter 7-Digit Extension Code</h3>
                  <p className="input-format">Enter the 7-digit code you received from Mike Smith.</p>
                  
                  <div className="code-input-grid">
                    {codeDigits.map((digit, index) => (
                      <input
                        key={index}
                        id={`digit-${index}`}
                        type="text"
                        value={digit}
                        onChange={(e) => handleDigitChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="digit-input"
                        maxLength="1"
                        placeholder=""
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                  
                  {extensionResult && (
                    <div className={`extension-result ${extensionResult.success ? 'success' : 'error'}`}>
                      <p>{extensionResult.message}</p>
                      {extensionResult.success && !extensionResult.isTestMode && (
                        <div className="success-details">
                          <p><strong>Deals Added:</strong> {extensionResult.dealsAdded}</p>
                          <p><strong>Remaining:</strong> {extensionResult.remainingDeals}</p>
                        </div>
                      )}
                      
                      {extensionResult.success && extensionResult.isTestMode && (
                        <div className="test-mode-success">
                          <h3>🧪 Developer Test Mode Activated!</h3>
                          <p>All data cleared and trial reset to fresh state.</p>
                          <button 
                            className="continue-testing-btn"
                            onClick={handleTestModeClose}
                          >
                            Continue Testing
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {!extensionResult?.isTestMode && (
                    <div className="code-input-actions">
                      <button 
                        className={`apply-code-btn ${isCodeComplete ? 'active' : 'disabled'}`}
                        onClick={handleExtensionSubmit}
                        disabled={!isCodeComplete}
                      >
                        Apply Code
                      </button>
                      <button 
                        className="cancel-btn" 
                        onClick={() => {
                          setShowExtensionInput(false);
                          setCodeDigits(['', '', '', '', '', '', '']);
                          setExtensionResult(null);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  <div className="how-it-works">
                    <h4>How it works:</h4>
                    <ul>
                      <li>Your 7-digit code grants additional deals</li>
                      <li>Each code can only be used once</li>
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrialPopup;