import React, { useState, useEffect } from 'react';
import './ContractInput.css';

const ContractInput = ({ onContractChange, initialContract = '', onComplete }) => {
  // State for levels (1-7)
  const [level, setLevel] = useState('');
  // State for suits (♣, ♦, ♥, ♠, NT)
  const [suit, setSuit] = useState('');
  // State for declarer (N, E, S, W)
  const [declarer, setDeclarer] = useState('');
  // State for doubled status (none, X, XX)
  const [doubled, setDoubled] = useState(''); // Default is not doubled
  // State for tracking if contract is complete
  const [isComplete, setIsComplete] = useState(false);
  // Local contract state to prevent automatic transitions
  const [localContract, setLocalContract] = useState('');
  
  // Parse initialContract if provided
  useEffect(() => {
    if (initialContract) {
      const contractMatch = initialContract.match(/(\d)([♣♦♥♠]|NT)\s+([NESW])(X{0,2})/);
      if (contractMatch) {
        setLevel(contractMatch[1]);
        setSuit(contractMatch[2]);
        setDeclarer(contractMatch[3]);
        setDoubled(contractMatch[4] || '');
        
        // Set local contract to match initial contract
        setLocalContract(initialContract);
        
        // Check if contract is complete
        setIsComplete(true);
      }
    } else {
      // Reset states when initialContract is empty
      setLevel('');
      setSuit('');
      setDeclarer('');
      setDoubled('');
      setLocalContract('');
      setIsComplete(false);
    }
  }, [initialContract]);
  
  // Update local contract when components change, but don't call onContractChange yet
  useEffect(() => {
    if (level && suit && declarer) {
      // Update local contract
      const newContract = `${level}${suit} ${declarer}${doubled}`;
      setLocalContract(newContract);
      
      // Check if all required components are selected
      setIsComplete(true);
    } else {
      setIsComplete(false);
    }
  }, [level, suit, declarer, doubled]);
  
  // Handle level selection
  const handleLevelClick = (selectedLevel) => {
    setLevel(selectedLevel);
  };
  
  // Handle suit selection
  const handleSuitClick = (selectedSuit) => {
    setSuit(selectedSuit);
  };
  
  // Handle declarer selection
  const handleDeclarerClick = (selectedDeclarer) => {
    setDeclarer(selectedDeclarer);
  };
  
  // Handle doubled selection
  const handleDoubledClick = (selectedDoubled) => {
    // Toggle the doubled state if clicking the same button
    if (doubled === selectedDoubled) {
      setDoubled('');
    } else {
      setDoubled(selectedDoubled);
    }
  };
  
  // Handle confirm button click
  const handleConfirmClick = () => {
    // Only proceed if contract is complete
    if (isComplete) {
      // Update parent component with the contract
      onContractChange(localContract);
      
      // Call onComplete callback if provided
      if (onComplete && typeof onComplete === 'function') {
        onComplete();
      }
    }
  };
  
  return (
    <div className="contract-input-container">
      {/* Bid Level Section */}
      <div className="input-section">
        <div className="section-heading">Bid Level</div>
        <div className="level-buttons-row">
          {[1, 2, 3, 4, 5, 6, 7].map((num) => (
            <button
              key={`level-${num}`}
              className={`level-btn ${level === num.toString() ? 'selected' : ''}`}
              onClick={() => handleLevelClick(num.toString())}
              data-level={num}
            >
              {num}
            </button>
          ))}
        </div>
      </div>
      
      {/* Suit Section */}
      <div className="input-section">
        <div className="section-heading">Suit</div>
        <div className="suit-buttons">
          {['♣', '♦', '♥', '♠', 'NT'].map((s) => (
            <button
              key={`suit-${s}`}
              className={`suit-btn ${suit === s ? 'selected' : ''}`}
              onClick={() => handleSuitClick(s)}
              data-suit={s}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      
      {/* Declarer Section */}
      <div className="input-section">
        <div className="section-heading">Declarer</div>
        <div className="declarer-buttons">
          {['N', 'S', 'E', 'W'].map((d) => (
            <button
              key={`declarer-${d}`}
              className={`declarer-btn ${declarer === d ? 'selected' : ''}`}
              onClick={() => handleDeclarerClick(d)}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
      
      {/* Doubled Section */}
      <div className="input-section">
        <div className="section-heading">Doubled</div>
        <div className="doubled-buttons">
          <button
            className={`doubled-btn ${doubled === '' ? 'selected' : ''}`}
            onClick={() => handleDoubledClick('')}
          >
            None
          </button>
          <button
            className={`doubled-btn ${doubled === 'X' ? 'selected' : ''}`}
            onClick={() => handleDoubledClick('X')}
          >
            Doubled
          </button>
          <button
            className={`doubled-btn ${doubled === 'XX' ? 'selected' : ''}`}
            onClick={() => handleDoubledClick('XX')}
          >
            Redoubled
          </button>
        </div>
      </div>
      
      {/* Confirm button */}
      <div className="center-button-container">
        <button
          className="confirm-contract-btn"
          onClick={handleConfirmClick}
          disabled={!isComplete}
        >
          Confirm Contract
        </button>
      </div>
      
      {/* Preview of current contract */}
      {level && suit && declarer && (
        <div className="contract-preview">
          Contract: {level}{suit} {declarer}{doubled}
        </div>
      )}
    </div>
  );
};

export default ContractInput;