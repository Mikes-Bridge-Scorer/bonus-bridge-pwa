import React, { useState, useEffect } from 'react';
import './TrickInput.css';

const TrickInput = ({ onTrickChange, initialResult = null, contract = '', onChangeContract }) => {
  const [selectedTrick, setSelectedTrick] = useState(null);
  const [requiredTricks, setRequiredTricks] = useState(7);
  
  // Calculate required tricks when contract changes
  useEffect(() => {
    if (contract) {
      const contractMatch = contract.match(/(\d)([♣♦♥♠]|NT)\s+([NESW])(X{0,2})/);
      if (contractMatch) {
        const level = parseInt(contractMatch[1]);
        setRequiredTricks(level + 6);
      }
    }
  }, [contract]);
  
  // Set selected trick from initialResult if provided
  useEffect(() => {
    if (initialResult !== null && requiredTricks) {
      const actualTricks = requiredTricks + initialResult;
      setSelectedTrick(actualTricks);
    }
  }, [initialResult, requiredTricks]);
  
  // Handle trick button click
  const handleTrickClick = (numTricks) => {
    setSelectedTrick(numTricks);
    const result = numTricks - requiredTricks;
    onTrickChange(result, numTricks);
  };
  
  // Get result preview text and style
  const getResultPreview = () => {
    if (selectedTrick === null) return null;
    
    const result = selectedTrick - requiredTricks;
    let text = '';
    let className = 'result-preview';
    
    if (result === 0) {
      text = 'Made exactly';
      className += ' exact';
    } else if (result > 0) {
      text = `Made +${result}`;
      className += ' made';
    } else {
      text = `Down ${Math.abs(result)}`;
      className += ' down';
    }
    
    return (
      <div className={className}>
        {text} ({selectedTrick} tricks)
      </div>
    );
  };
  
  // Render trick buttons in a 5-column grid with better layout
  const renderTrickGrid = () => {
    // Create buttons for 0-13, but arrange them in a specific order
    const buttonOrder = [
      1, 2, 3, 4, 5,    // Row 1: 1-5
      6, 7, 8, 9, 10,   // Row 2: 6-10
      11, 12, 13, 0, '' // Row 3: 11, 12, 13, 0, empty
    ];
    
    return (
      <div className="trick-grid">
        {buttonOrder.map((num, index) => {
          // Skip empty cells
          if (num === '') {
            return <div key={`empty-${index}`} className="trick-grid-empty"></div>;
          }
          
          const isExact = num === requiredTricks;
          const isMade = num > requiredTricks;
          const isDown = num < requiredTricks;
          
          let buttonClass = "trick-btn";
          if (isDown) buttonClass += " trick-btn-down";
          else if (isExact) buttonClass += " trick-btn-exact";
          else if (isMade) buttonClass += " trick-btn-made";
          
          if (selectedTrick === num) buttonClass += " selected";
          
          return (
            <button
              key={`trick-${num}`}
              className={buttonClass}
              onClick={() => handleTrickClick(num)}
            >
              {num}
            </button>
          );
        })}
      </div>
    );
  };
  
  return (
    <div className="trick-input">
      <div className="required-tricks">
        Required tricks: {requiredTricks}
      </div>
      
      {/* Trick Grid */}
      {renderTrickGrid()}
      
      {/* Result Preview - shows immediately after selection */}
      {getResultPreview()}
      
      {/* Change Contract Button */}
      <button 
        className="change-contract-btn"
        onClick={onChangeContract}
      >
        Change Contract
      </button>
    </div>
  );
};

export default TrickInput;