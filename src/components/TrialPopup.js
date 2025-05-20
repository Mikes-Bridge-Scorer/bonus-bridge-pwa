// TrialPopup.js - Complete version with 7-character code input and validation
import React, { useState } from 'react';
import './TrialPopup.css';

const TrialPopup = ({ 
  trialManager, 
  onClose,
  onExtended,
  type = 'warning' // 'warning', 'expired', or 'info'
}) => {
  const [showExtensionForm, setShowExtensionForm] = useState(false);
  const [extensionCode, setExtensionCode] = useState(['', '', '', '', '', '', '']); // Array for 7 characters
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [codeError, setCodeError] = useState('');

  // Get trial statistics with safety checks
  const stats = trialManager ? trialManager.getStats() : null;
  const remainingDeals = trialManager ? trialManager.getRemainingDeals() : 0;

  // Handle sending feedback email
  const handleSendFeedback = () => {
    const emailData = trialManager.generateFeedbackEmail();
    if (emailData) {
      const mailtoLink = `mailto:mike.chris.smith@gmail.com?subject=${emailData.subject}&body=${emailData.body}`;
      window.open(mailtoLink);
    }
  };

  // Handle individual character input (letters A-Z or digits 0-9 for first 6, digit 1-9 for last)
  const handleDigitChange = (index, event) => {
    let value = event.target.value.toUpperCase();
    
    if (index < 6) {
      // First 6 positions: allow letters A-Z or digits 0-9
      if (value && !/^[A-Z0-9]$/.test(value)) {
        event.target.value = extensionCode[index]; // Restore previous value
        return;
      }
    } else {
      // Last position: only allow digits 1-9
      if (value && !/^[1-9]$/.test(value)) {
        event.target.value = extensionCode[index]; // Restore previous value
        return;
      }
    }
    
    // Update the code array
    const newCode = [...extensionCode];
    newCode[index] = value;
    setExtensionCode(newCode);
    setCodeError('');
    
    // Move to next box if character entered
    if (value && index < 6) {
      setTimeout(() => {
        const nextInput = document.getElementById(`digit-${index + 1}`);
        if (nextInput) {
          nextInput.focus();
          nextInput.select();
        }
      }, 10);
    }
  };

  // Handle backspace in digit inputs - SIMPLIFIED
  const handleDigitKeyDown = (index, event) => {
    if (event.key === 'Backspace') {
      if (!extensionCode[index] && index > 0) {
        // Move to previous box if current is empty
        const prevInput = document.getElementById(`digit-${index - 1}`);
        if (prevInput) {
          prevInput.focus();
          prevInput.select();
        }
      } else {
        // Clear current box
        const newCode = [...extensionCode];
        newCode[index] = '';
        setExtensionCode(newCode);
      }
    }
  };

  // Validate code format in real-time (letters/digits + digit)
  // Custom mapping: A=3, B=4, C=5, ..., Z=28, and 0=0, 1=1, ..., 9=9
  const validateCode = (codeArray) => {
    const codeString = codeArray.join('');
    if (codeString.length !== 7) return 'Code must be exactly 7 characters';
    
    // Check first 6 are letters A-Z or digits 0-9
    const firstSix = codeString.substring(0, 6);
    if (!/^[A-Z0-9]{6}$/.test(firstSix)) return 'First 6 must be letters A-Z or digits 0-9';
    
    // Check last is digit 1-9
    const lastChar = codeString.substring(6, 7);
    if (!/^[1-9]$/.test(lastChar)) return 'Last character must be digit 1-9';
    
    // Calculate sum of first 6 characters
    const sum = firstSix.split('').reduce((acc, char) => {
      if (char >= 'A' && char <= 'Z') {
        // Letters: A=3, B=4, etc.
        return acc + (char.charCodeAt(0) - 62); // A=65, so 65-62=3
      } else {
        // Digits: 0=0, 1=1, etc.
        return acc + parseInt(char);
      }
    }, 0);
    
    if (sum !== 100) return 'Invalid code format';
    
    return null;
  };

  // Handle extension code submission
  const handleExtensionSubmit = async (e) => {
    e.preventDefault();
    
    // Validate format first
    const validationError = validateCode(extensionCode);
    if (validationError) {
      setCodeError(validationError);
      return;
    }
    
    setIsSubmitting(true);
    setCodeError('');

    try {
      // Convert array to string and submit to trial manager
      const codeString = extensionCode.join('');
      const result = trialManager.extendTrial(codeString);
      
      if (result.success) {
        // Success message with details
        const message = `Success! ${result.message}\n\nDeals added: ${result.dealsAdded}\nTotal deals: ${result.totalDeals}\nRemaining: ${result.remainingDeals}`;
        alert(message);
        onExtended && onExtended();
        setShowExtensionForm(false);
        setExtensionCode(['', '', '', '', '', '', '']);
        // If it's not just a warning, close the popup completely
        if (type !== 'warning') onClose();
      } else {
        // Show error from trial manager (includes "already used" message)
        setCodeError(result.message);
      }
    } catch (error) {
      setCodeError('An error occurred while processing the extension code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get popup content based on type
  const getContent = () => {
    if (type === 'expired') {
      return {
        title: '⏰ Trial Period Expired',
        message: `Your evaluation period has ended after ${stats ? stats.dealsPlayed : 0} deals. Thank you for testing Bonus Bridge!`,
        emoji: '🚫',
        color: 'red'
      };
    } else if (type === 'warning') {
      return {
        title: '⚠️ Trial Nearly Complete',
        message: `You have ${remainingDeals} deal${remainingDeals === 1 ? '' : 's'} remaining in your evaluation period.`,
        emoji: '⚠️',
        color: 'orange'
      };
    } else {
      return {
        title: '🎯 Welcome to Bonus Bridge',
        message: `You have ${remainingDeals} deals to evaluate the application.`,
        emoji: '🎯',
        color: 'blue'
      };
    }
  };

  const content = getContent();

  return (
    <div className="trial-popup-overlay">
      <div className={`trial-popup trial-popup-${content.color}`}>
        {/* Header */}
        <div className="trial-popup-header">
          <h2>{content.title}</h2>
          {type !== 'expired' && (
            <button className="close-btn" onClick={onClose}>×</button>
          )}
        </div>

        {/* Content */}
        <div className="trial-popup-content">
          <div className="trial-message">
            <span className="trial-emoji">{content.emoji}</span>
            <p>{content.message}</p>
          </div>

          {/* Usage Statistics */}
          {stats && (
            <div className="trial-stats">
              <h3>📊 Your Usage</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Deals Played:</span>
                  <span className="stat-value">{stats.dealsPlayed}/{stats.maxDeals}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Remaining:</span>
                  <span className="stat-value">{stats.remainingDeals}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Games Completed:</span>
                  <span className="stat-value">{stats.gamesCompleted}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Days Used:</span>
                  <span className="stat-value">{stats.daysUsed}</span>
                </div>
                {(stats && stats.extensions && stats.extensions.length > 0) && (
                  <div className="stat-item">
                    <span className="stat-label">Extensions Used:</span>
                    <span className="stat-value">{stats.extensions.length}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="trial-actions">
            {(type === 'warning' || type === 'expired') && (
              <>
                <button 
                  className="feedback-btn primary"
                  onClick={handleSendFeedback}
                >
                  📧 Request Extension Code
                </button>

                <button 
                  className="extension-btn secondary"
                  onClick={() => setShowExtensionForm(!showExtensionForm)}
                >
                  🔑 Enter 7-Character Extension Code
                </button>
              </>
            )}

            {type === 'info' && (
              <button className="continue-btn primary" onClick={onClose}>
                Start Evaluating
              </button>
            )}

            {type === 'warning' && (
              <button className="continue-btn secondary" onClick={onClose}>
                Continue Playing
              </button>
            )}
          </div>

          {/* Extension Form */}
          {showExtensionForm && (
            <div className="extension-form">
              <h3>🔑 Enter 7-Character Extension Code</h3>
              <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>
                Enter the 7-character code you received from Mike Smith.
              </p>
              
              <form onSubmit={handleExtensionSubmit}>
                <div className="form-group">
                  <label>Extension Code:</label>
                  <div style={{ 
                    display: 'flex', 
                    gap: '8px', 
                    justifyContent: 'center',
                    marginTop: '10px'
                  }}>
                    {extensionCode.map((digit, index) => (
                      <input
                        key={index}
                        id={`digit-${index}`}
                        type="text"
                        value={digit}
                        onChange={(e) => handleDigitChange(index, e)}
                        onKeyDown={(e) => handleDigitKeyDown(index, e)}
                        onFocus={(e) => e.target.select()}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
                          if (pastedData.length === 7) {
                            setExtensionCode(pastedData.split(''));
                          }
                        }}
                        maxLength="1"
                        autoComplete="off"
                        style={{
                          width: '40px',
                          height: '40px',
                          textAlign: 'center',
                          fontSize: '1.5rem',
                          fontWeight: 'bold',
                          border: `2px solid ${digit ? '#1e5c8b' : '#ddd'}`,
                          borderRadius: '8px',
                          fontFamily: 'monospace',
                          backgroundColor: digit ? '#f0f8ff' : 'white',
                          outline: 'none'
                        }}
                      />
                    ))}
                  </div>
                  {codeError && (
                    <div style={{ color: '#f44336', fontSize: '0.9rem', marginTop: '10px', textAlign: 'center' }}>
                      {codeError}
                    </div>
                  )}
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={() => {
                      setShowExtensionForm(false);
                      setExtensionCode(['', '', '', '', '', '', '']);
                      setCodeError('');
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="submit-btn"
                    disabled={isSubmitting || !!validateCode(extensionCode)}
                  >
                    {isSubmitting ? 'Validating...' : 'Apply Code'}
                  </button>
                </div>
              </form>
              
              {/* Code format help */}
              <div style={{ 
                marginTop: '15px', 
                padding: '10px', 
                backgroundColor: '#f0f8ff', 
                borderRadius: '6px',
                fontSize: '0.85rem',
                color: '#1e5c8b'
              }}>
                <strong>How it works:</strong><br/>
                • Your 7-character code grants additional deals<br/>
                • First 6 characters are letters A-Z or digits 0-9<br/>
                • Last character is a digit 1-9<br/>
                • Each code can only be used once
              </div>
            </div>
          )}

          {/* Extension History (if any) */}
          {stats && stats.extensions && stats.extensions.length > 0 && (
            <div style={{ 
              marginTop: '15px', 
              padding: '10px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '6px',
              fontSize: '0.85rem'
            }}>
              <strong>Previous Extensions:</strong>
              {stats.extensions.map((ext, index) => (
                <div key={index} style={{ marginTop: '5px' }}>
                  • {ext.dealsGranted} deals added on {new Date(ext.appliedDate).toLocaleDateString()}
                </div>
              ))}
            </div>
          )}

          {/* Expired Message */}
          {type === 'expired' && (
            <div className="expired-note">
              <p><strong>Note:</strong> You can still view previous games, but cannot start new deals without an extension code.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { TrialPopup as default };