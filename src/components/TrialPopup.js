import React, { useState } from 'react';
import './TrialPopup.css';

const COLORS = {
  primary: '#1e5c8b',
  primaryDark: '#18476b',
  secondary: '#468bbf',
  success: '#27ae60',
  warning: '#f39c12',
  danger: '#e74c3c',
  lightBg: '#f8f9fa',
  border: '#dee2e6'
};

const TrialPopup = ({ trialManager, onClose, onExtended, onExtensionRequest, type }) => {
  const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', '']);
  const [extensionResult, setExtensionResult] = useState(null);
  const [showCodeInput, setShowCodeInput] = useState(false);

  const handleDigitChange = (index, value) => {
    if (value.length > 1) return;
    if (value && !/^\d$/.test(value)) return; // digits only

    const newDigits = [...codeDigits];
    newDigits[index] = value;
    setCodeDigits(newDigits);

    if (value && index < 5) {
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

  const handleCodeSubmit = () => {
    const code = codeDigits.join('');
    if (code.length !== 6) return;

    setExtensionResult(null);

    try {
      const result = trialManager.extendTrial(code);
      setExtensionResult(result);

      if (result.success) {
        setTimeout(() => {
          setCodeDigits(['', '', '', '', '', '']);
          setShowCodeInput(false);
          setExtensionResult(null);
          onExtended();
        }, 2000);
      }
    } catch (error) {
      console.error('Error in extendTrial:', error);
      setExtensionResult({
        success: false,
        message: 'Error processing code: ' + error.message
      });
    }
  };

  const getStatus = () => {
    try {
      return trialManager.checkStatus();
    } catch (e) {
      return { status: 'trial', daysLeft: 60, warning: false };
    }
  };

  const status = getStatus();
  const canClose = type !== 'expired';
  const isCodeComplete = codeDigits.every(digit => digit !== '');
  const annualUrl = trialManager.annualBuyUrl;
  const lifetimeUrl = trialManager.lifetimeBuyUrl;

  const daysLeftText = status.daysLeft === null
    ? ''
    : `${status.daysLeft} day${status.daysLeft !== 1 ? 's' : ''}`;

  // ---- Inline style objects (self-contained, doesn't rely on CSS classes) ----
  const s = {
    messageBox: {
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      borderRadius: '12px',
      padding: '15px',
      margin: '15px 0',
      border: `1px solid ${COLORS.border}`,
      textAlign: 'center'
    },
    messageText: { margin: 0, fontSize: '16px', color: '#495057', lineHeight: 1.4 },
    highlight: { fontWeight: 'bold', color: COLORS.primary },
    pricingBox: {
      background: COLORS.lightBg,
      borderRadius: '10px',
      padding: '15px',
      margin: '15px 0'
    },
    pricingTitle: { color: COLORS.primary, margin: '0 0 10px 0', fontSize: '15px', fontWeight: 'bold' },
    pricingRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 0',
      fontSize: '14px',
      borderBottom: '1px solid #eee'
    },
    buyBtn: {
      display: 'block',
      textAlign: 'center',
      textDecoration: 'none',
      padding: '13px 20px',
      borderRadius: '25px',
      fontWeight: 'bold',
      fontSize: '15px',
      marginBottom: '10px',
      color: 'white',
      cursor: 'pointer',
      border: 'none'
    },
    annualBtn: { background: `linear-gradient(135deg, ${COLORS.secondary}, ${COLORS.primary})` },
    lifetimeBtn: { background: `linear-gradient(135deg, ${COLORS.success}, #2ecc71)` },
    enterCodeBtn: {
      display: 'block',
      width: '100%',
      textAlign: 'center',
      padding: '12px 20px',
      borderRadius: '25px',
      fontWeight: 'bold',
      fontSize: '14px',
      background: 'linear-gradient(135deg, #ffc107, #e0a800)',
      color: '#212529',
      border: 'none',
      cursor: 'pointer'
    },
    codeSection: { marginTop: '20px', paddingTop: '20px', borderTop: `1px solid ${COLORS.border}` },
    codeSectionTitle: { color: COLORS.primary, margin: '0 0 10px 0', fontSize: '16px', textAlign: 'center' },
    inputHelp: { textAlign: 'center', fontSize: '13px', color: '#666', marginBottom: '15px' },
    digitGrid: { display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '15px' },
    digitInput: {
      width: '42px',
      height: '50px',
      textAlign: 'center',
      fontSize: '20px',
      fontWeight: 'bold',
      border: `2px solid ${COLORS.border}`,
      borderRadius: '8px',
      boxSizing: 'border-box'
    },
    resultBox: (ok) => ({
      margin: '15px 0',
      padding: '12px',
      borderRadius: '8px',
      textAlign: 'center',
      background: ok ? '#d4edda' : '#f8d7da',
      border: `1px solid ${ok ? '#c3e6cb' : '#f5c6cb'}`,
      color: ok ? '#155724' : '#721c24'
    }),
    codeActions: { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' },
    applyBtn: (enabled) => ({
      padding: '12px 20px',
      borderRadius: '25px',
      fontWeight: 'bold',
      fontSize: '15px',
      border: 'none',
      cursor: enabled ? 'pointer' : 'not-allowed',
      background: enabled ? 'linear-gradient(135deg, #27ae60, #2ecc71)' : '#ccc',
      color: 'white'
    }),
    cancelBtn: {
      padding: '10px 20px',
      borderRadius: '25px',
      fontSize: '14px',
      border: 'none',
      cursor: 'pointer',
      background: '#6c757d',
      color: 'white'
    },
    continueBtn: {
      display: 'block',
      width: '100%',
      padding: '12px 24px',
      borderRadius: '25px',
      fontWeight: 'bold',
      fontSize: '16px',
      border: 'none',
      cursor: 'pointer',
      background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
      color: 'white',
      marginTop: '15px'
    },
    startBtn: {
      display: 'block',
      width: '100%',
      padding: '14px 30px',
      borderRadius: '25px',
      fontWeight: 'bold',
      fontSize: '16px',
      border: 'none',
      cursor: 'pointer',
      background: 'linear-gradient(135deg, #28a745, #20c997)',
      color: 'white',
      marginTop: '20px'
    },
    unlockNowBtn: {
      display: 'block',
      width: '100%',
      padding: '12px 24px',
      borderRadius: '25px',
      fontWeight: 'bold',
      fontSize: '14px',
      border: 'none',
      cursor: 'pointer',
      background: 'linear-gradient(135deg, #3498db, #2980b9)',
      color: 'white'
    },
    divider: { height: '1px', background: '#dee2e6', margin: '20px 0 15px' },
    doneText: { fontSize: '14px', color: '#6c757d', textAlign: 'center', margin: '0 0 10px 0', fontStyle: 'italic' },
    note: {
      background: '#ffebee',
      border: '1px solid #ffcdd2',
      borderRadius: '8px',
      padding: '12px',
      marginTop: '15px'
    },
    noteText: { margin: 0, color: '#d32f2f', fontSize: '12px', textAlign: 'center' }
  };

  const BuyLinksAndCodeEntry = () => (
    <>
      <div style={s.pricingBox}>
        <p style={s.pricingTitle}>Unlock Bonus Bridge Pro:</p>
        <div style={s.pricingRow}>
          <span>Annual</span>
          <span style={s.highlight}>£10/year</span>
        </div>
        <div style={{ ...s.pricingRow, borderBottom: 'none' }}>
          <span>Lifetime</span>
          <span style={s.highlight}>£25 one-off</span>
        </div>
      </div>

      <a href={annualUrl} target="_blank" rel="noopener noreferrer" style={{ ...s.buyBtn, ...s.annualBtn }}>
        Get Annual — £10/year
      </a>
      <a href={lifetimeUrl} target="_blank" rel="noopener noreferrer" style={{ ...s.buyBtn, ...s.lifetimeBtn }}>
        Get Lifetime — £25
      </a>

      {!showCodeInput && (
        <button style={s.enterCodeBtn} onClick={() => setShowCodeInput(true)}>
          Enter 6-Digit Code
        </button>
      )}

      {showCodeInput && (
        <div style={s.codeSection}>
          <h3 style={s.codeSectionTitle}>Enter Your 6-Digit Code</h3>
          <p style={s.inputHelp}>You'll have received this by download after purchase.</p>

          <div style={s.digitGrid}>
            {codeDigits.map((digit, index) => (
              <input
                key={index}
                id={`digit-${index}`}
                type="text"
                inputMode="numeric"
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                style={s.digitInput}
                maxLength="1"
                placeholder=""
                autoFocus={index === 0}
              />
            ))}
          </div>

          {extensionResult && (
            <div style={s.resultBox(extensionResult.success)}>
              <p style={{ margin: 0 }}>{extensionResult.message}</p>
            </div>
          )}

          <div style={s.codeActions}>
            <button
              style={s.applyBtn(isCodeComplete)}
              onClick={handleCodeSubmit}
              disabled={!isCodeComplete}
            >
              Activate Code
            </button>
            <button
              style={s.cancelBtn}
              onClick={() => {
                setShowCodeInput(false);
                setCodeDigits(['', '', '', '', '', '']);
                setExtensionResult(null);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="trial-popup-overlay">
      <div className="trial-popup">
        <div className="trial-header">
          <h2>
            {type === 'expired' ? '🚫 Trial Period Expired' :
             type === 'warning' ? '⚠️ Trial Nearly Complete' :
             type === 'extension' ? '🔓 Unlock Bonus Bridge Pro' :
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
              <div style={s.messageBox}>
                <p style={s.messageText}>
                  You have a <span style={s.highlight}>2-month free trial</span> — {daysLeftText} left.
                </p>
              </div>

              <button style={s.startBtn} onClick={onClose}>
                Start Playing
              </button>

              <div>
                <div style={s.divider}></div>
                <p style={s.doneText}>Already know you want the full version?</p>
                <button style={s.unlockNowBtn} onClick={() => onExtensionRequest && onExtensionRequest()}>
                  🔓 Unlock Now
                </button>
              </div>
            </>
          )}

          {type === 'extension' && (
            <>
              <div className="trial-icon">🔓</div>
              <div style={s.messageBox}>
                <p style={s.messageText}>Thank you for playing Bonus Bridge!</p>
              </div>
              <BuyLinksAndCodeEntry />
            </>
          )}

          {type === 'warning' && (
            <>
              <div className="trial-icon">⚠️</div>
              <div style={s.messageBox}>
                <p style={s.messageText}>Your free trial ends in {daysLeftText}.</p>
              </div>
              <BuyLinksAndCodeEntry />
              <button style={s.continueBtn} onClick={onClose}>
                Continue Playing
              </button>
            </>
          )}

          {type === 'expired' && (
            <>
              <div className="trial-icon">🚫</div>
              <div style={s.messageBox}>
                <p style={s.messageText}>Your 2-month free trial has ended. Thank you for trying Bonus Bridge!</p>
              </div>
              <BuyLinksAndCodeEntry />
              <div style={s.note}>
                <p style={s.noteText}>Enter your unlock code above to continue playing.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrialPopup;
