import React, { useState, useEffect, useRef } from 'react';
import TrialPopup from './TrialPopup'; // Add this import
import './GameScoreSheet.css';

/**
 * Game Score Sheet component - Redesigned for better mobile experience
 * @param {Object} props - Component props
 * @param {Object} props.gameState - Current game state
 * @param {Function} props.onNewGame - Function to start a new game
 * @param {Object} props.trialManager - Trial manager instance
 */
const GameScoreSheet = ({ gameState, onNewGame, trialManager }) => {
  // State for selected tab
  const [activeTab, setActiveTab] = useState('summary');
  // State for deal detail popup
  const [selectedDeal, setSelectedDeal] = useState(null);
  // State for player stats
  const [playerStats, setPlayerStats] = useState(null);
  // State for export menu
  const [showExportMenu, setShowExportMenu] = useState(false);
  // Ref for export button (for positioning the menu)
  const exportBtnRef = useRef(null);
  
  // NEW: State for new game confirmation popup
  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false);
  const [showTrialPopup, setShowTrialPopup] = useState(false);
  const [trialType, setTrialType] = useState('extension');
  
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    // Calculate player statistics
    calculatePlayerStats();
  }, []);
  
  // Calculate player statistics from game state
  const calculatePlayerStats = () => {
    if (!gameState.deals || gameState.deals.length === 0) {
      return;
    }
    
    // Initialize player stats
    const stats = {
      north: { totalHCP: 0, totalPoints: 0, deals: 0, madeBids: 0 },
      east: { totalHCP: 0, totalPoints: 0, deals: 0, madeBids: 0 },
      south: { totalHCP: 0, totalPoints: 0, deals: 0, madeBids: 0 },
      west: { totalHCP: 0, totalPoints: 0, deals: 0, madeBids: 0 }
    };
    
    // Process each deal
    gameState.deals.forEach(deal => {
      if (!deal.contract) return;
      
      // Extract declarer from contract
      const contractMatch = deal.contract.match(/(\d)([♣♦♥♠]|NT)\s+([NESW])(X{0,2})/);
      if (!contractMatch) return;
      
      const declarer = contractMatch[3].toLowerCase();
      const madeContract = deal.result >= 0;
      let player = '';
      
      // Map direction to player
      switch(declarer) {
        case 'n': player = 'north'; break;
        case 'e': player = 'east'; break;
        case 's': player = 'south'; break;
        case 'w': player = 'west'; break;
        default: return;
      }
      
      // Update player stats
      stats[player].deals++;
      if (madeContract) {
        stats[player].madeBids++;
      }
      
      // Add HCP if available
      if (deal.handAnalysis && deal.handAnalysis.totalHCP) {
        stats[player].totalHCP += deal.handAnalysis.totalHCP;
      }
      
      // Add bonus points based on declarer
      const isNS = declarer === 'n' || declarer === 's';
      if (isNS) {
        if (madeContract && deal.bonusNsPoints) {
          stats[player].totalPoints += deal.bonusNsPoints;
        }
      } else {
        if (madeContract && deal.bonusEwPoints) {
          stats[player].totalPoints += deal.bonusEwPoints;
        }
      }
    });
    
    // Set state
    setPlayerStats(stats);
  };

  // NEW: Handle new game button click - show confirmation
  const handleNewGameClick = () => {
    setShowNewGameConfirm(true);
  };

  // NEW: Handle confirmation choices
  const handleConfirmNewGame = () => {
    setShowNewGameConfirm(false);
    onNewGame(); // Start new game directly
  };

  const handleGetMoreDeals = () => {
    console.log('Get More Deals clicked - showing trial popup');
    setShowNewGameConfirm(false);
    
    // Small delay to ensure state updates properly
    setTimeout(() => {
      setTrialType('extension');
      setShowTrialPopup(true);
      console.log('Trial popup state set:', { trialType: 'extension', showTrialPopup: true });
    }, 100);
  };

  // NEW: Handle trial popup close
  const handleTrialPopupClose = () => {
    console.log('Trial popup closing');
    setShowTrialPopup(false);
  };

  // NEW: Handle trial extension (including test codes)
  const handleTrialExtended = () => {
    console.log('Trial extended successfully');
    setShowTrialPopup(false);
    // If it was a test code (sum=99), the TrialManager will handle the reset
    // For regular codes, just close the popup
  };

  // NEW: Handle extension request
  const handleExtensionRequest = () => {
    console.log('Extension request - keeping popup open');
    // Keep the popup open, it's already showing extension
  };

// Format contract for display
  const formatContract = (deal) => {
    if (!deal || !deal.contract) return "No contract";
    
    const contractMatch = deal.contract.match(/(\d)([♣♦♥♠]|NT)\s+([NESW])(X{0,2})/);
    if (!contractMatch) return deal.contract;
    
    const level = contractMatch[1];
    const suit = contractMatch[2];
    const declarer = contractMatch[3];
    const doubled = contractMatch[4] || "";
    
    let doubledText = "";
    if (doubled === "X") {
      doubledText = "X";
    } else if (doubled === "XX") {
      doubledText = "XX";
    }
    
    return `${level}${suit} ${declarer}${doubledText}`;
  };
  
  // Format result for display
  const formatResult = (deal) => {
    if (!deal || deal.result === undefined) return "No result";
    
    if (deal.result >= 0) {
      return deal.result > 0 ? `+${deal.result}` : "=";
    } else {
      return deal.result; // Already negative
    }
  };
  
  // View deal details
  const viewDealDetails = (deal) => {
    setSelectedDeal(deal);
  };
  
  // Close deal details popup
  const closeDealDetails = () => {
    setSelectedDeal(null);
  };
  
  // Change active tab
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  // Toggle export menu
  const toggleExportMenu = () => {
    setShowExportMenu(!showExportMenu);
  };

  // Get final scores
  const getFinalScores = () => {
    return {
      partyNS: gameState.scores?.nsTotal || 0,
      partyEW: gameState.scores?.ewTotal || 0,
      bonusNS: gameState.scores?.bonusNsTotal || 0,
      bonusEW: gameState.scores?.bonusEwTotal || 0
    };
  };
  
  // Determine winners
  const getWinners = () => {
    const scores = getFinalScores();
    
    return {
      partyWinner: scores.partyNS > scores.partyEW ? "North-South" : (scores.partyEW > scores.partyNS ? "East-West" : "Tie"),
      bonusWinner: scores.bonusNS > scores.bonusEW ? "North-South" : (scores.bonusEW > scores.bonusNS ? "East-West" : "Tie")
    };
  };

// Calculate game statistics
  const getGameStats = () => {
    if (!gameState.deals || gameState.deals.length === 0) {
      return {
        totalDeals: 0,
        nsDeals: 0,
        ewDeals: 0,
        nsMade: 0,
        ewMade: 0,
        slams: 0,
        games: 0,
        partScores: 0
      };
    }
    
    let nsDeals = 0;
    let ewDeals = 0;
    let nsMade = 0;
    let ewMade = 0;
    let slams = 0;
    let games = 0;
    let partScores = 0;
    
    gameState.deals.forEach(deal => {
      if (!deal.contract) return;
      
      const contractMatch = deal.contract.match(/(\d)([♣♦♥♠]|NT)\s+([NESW])(X{0,2})/);
      if (!contractMatch) return;
      
      const level = parseInt(contractMatch[1]);
      const suit = contractMatch[2];
      const declarer = contractMatch[3];
      const madeContract = deal.result >= 0;
      
      // Count deals by declarer
      const isNS = declarer === 'N' || declarer === 'S';
      if (isNS) {
        nsDeals++;
        if (madeContract) nsMade++;
      } else {
        ewDeals++;
        if (madeContract) ewMade++;
      }
      
      // Categorize contract
      if (level >= 6) {
        slams++;
      } else if ((level === 3 && suit === 'NT') || 
                 (level === 4 && (suit === '♥' || suit === '♠')) || 
                 (level === 5 && (suit === '♣' || suit === '♦'))) {
        games++;
      } else {
        partScores++;
      }
    });
    
    return {
      totalDeals: gameState.deals.length,
      nsDeals,
      ewDeals,
      nsMade,
      ewMade,
      slams,
      games,
      partScores
    };
  };
  
  // Get HCP analysis
  const getHCPAnalysis = () => {
    if (!gameState.deals || gameState.deals.length === 0) {
      return {
        avgDeclarer: 0,
        avgDefender: 0,
        avgSuccess: 0
      };
    }
    
    let totalDeclarerHCP = 0;
    let totalDefenderHCP = 0;
    let dealsWithHCP = 0;
    let successfulDealsWithHCP = 0;
    let totalHCPSuccess = 0;
    
    gameState.deals.forEach(deal => {
      if (!deal.handAnalysis || !deal.handAnalysis.totalHCP) return;
      
      dealsWithHCP++;
      totalDeclarerHCP += deal.handAnalysis.totalHCP;
      
      // Calculate defender HCP as 40 - declarer HCP
      const defenderHCP = 40 - deal.handAnalysis.totalHCP;
      totalDefenderHCP += defenderHCP;
      
      // Calculate success rate based on HCP
      if (deal.result >= 0) {
        successfulDealsWithHCP++;
        totalHCPSuccess += deal.handAnalysis.totalHCP;
      }
    });
    
    return {
      avgDeclarer: dealsWithHCP > 0 ? (totalDeclarerHCP / dealsWithHCP).toFixed(1) : 0,
      avgDefender: dealsWithHCP > 0 ? (totalDefenderHCP / dealsWithHCP).toFixed(1) : 0,
      avgSuccess: successfulDealsWithHCP > 0 ? (totalHCPSuccess / successfulDealsWithHCP).toFixed(1) : 0
    };
  };
  
  // Get best player based on bonus points and success rate
  const getBestPlayer = () => {
    if (!playerStats) return { name: "None", points: 0 };
    
    const players = Object.keys(playerStats);
    let bestPlayer = { name: "None", points: 0, successRate: 0 };
    
    players.forEach(player => {
      const stats = playerStats[player];
      if (stats.deals === 0) return;
      
      const successRate = stats.madeBids / stats.deals;
      const avgPoints = stats.totalPoints / stats.deals;
      
      // Consider both points and success rate
      if (avgPoints > bestPlayer.points || 
          (avgPoints === bestPlayer.points && successRate > bestPlayer.successRate)) {
        bestPlayer = {
          name: player.charAt(0).toUpperCase() + player.slice(1),
          points: avgPoints,
          successRate
        };
      }
    });
    
    return bestPlayer;
  };

// Export results to PDF
  const exportToPDF = () => {
    const scores = getFinalScores();
    const winners = getWinners();
    const stats = getGameStats();
    
    // This would normally use jsPDF, but for simplicity we'll simulate it
    alert("PDF Export functionality would generate a PDF with game results");
    
    // Close export menu
    setShowExportMenu(false);
  };
  
  // Export results to CSV
  const exportToCSV = () => {
    const scores = getFinalScores();
    
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add header
    csvContent += "Deal,Contract,Result,NS Points,EW Points,Bonus NS,Bonus EW\n";
    
    // Add rows
    gameState.deals.forEach(deal => {
      csvContent += `${deal.dealNumber},`;
      csvContent += `"${formatContract(deal)}",`;
      csvContent += `${formatResult(deal)},`;
      csvContent += `${deal.nsPoints || 0},`;
      csvContent += `${deal.ewPoints || 0},`;
      csvContent += `${deal.bonusNsPoints || 0},`;
      csvContent += `${deal.bonusEwPoints || 0}\n`;
    });
    
    // Add total row
    csvContent += `Total,"","",${scores.partyNS},${scores.partyEW},${scores.bonusNS},${scores.bonusEW}\n`;
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BonusBridge_Game${gameState.gameNumber}_Results.csv`);
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    
    // Close export menu
    setShowExportMenu(false);
  };
  
  // Share results via email
  const shareViaEmail = () => {
    const scores = getFinalScores();
    const winners = getWinners();
    const stats = getGameStats();
    
    // Create email subject
    const subject = `Bonus Bridge Game ${gameState.gameNumber} Results`;
    
    // Create email body
    let body = `Bonus Bridge - Game #${gameState.gameNumber} Results\n\n`;
    
    body += "SUMMARY\n";
    body += "--------\n";
    body += `Party Bridge Scores:\n`;
    body += `North-South: ${scores.partyNS}\n`;
    body += `East-West: ${scores.partyEW}\n`;
    body += `Winner: ${winners.partyWinner}\n\n`;
    
    body += `Bonus Bridge Scores:\n`;
    body += `North-South: ${scores.bonusNS}\n`;
    body += `East-West: ${scores.bonusEW}\n`;
    body += `Winner: ${winners.bonusWinner}\n\n`;
    
    body += `Game Statistics:\n`;
    body += `Total Deals: ${stats.totalDeals}\n`;
    body += `North-South Contracts: ${stats.nsDeals} (${stats.nsDeals > 0 ? Math.round((stats.nsMade / stats.nsDeals) * 100) : 0}% made)\n`;
    body += `East-West Contracts: ${stats.ewDeals} (${stats.ewDeals > 0 ? Math.round((stats.ewMade / stats.ewDeals) * 100) : 0}% made)\n\n`;
    
    body += "DEAL HISTORY\n";
    body += "------------\n";
    body += "Deal | Contract | Result | NS | EW | Bonus NS | Bonus EW\n";
    
    // Add rows
    gameState.deals.forEach(deal => {
      body += `${deal.dealNumber} | ${formatContract(deal)} | ${formatResult(deal)} | ${deal.nsPoints || 0} | ${deal.ewPoints || 0} | ${deal.bonusNsPoints || 0} | ${deal.bonusEwPoints || 0}\n`;
    });
    
    // Add total row
    body += `Total | | | ${scores.partyNS} | ${scores.partyEW} | ${scores.bonusNS} | ${scores.bonusEW}\n\n`;
    
    body += "Generated by Bonus Bridge App";
    
    // Create mailto link
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Open email client
    window.open(mailtoLink);
    
    // Close export menu
    setShowExportMenu(false);
  };

// Rendering begins here
  const scores = getFinalScores();
  const winners = getWinners();
  const stats = getGameStats();
  const hcpAnalysis = getHCPAnalysis();
  const bestPlayer = getBestPlayer();
  
  return (
    <div className="game-score-sheet">
      <header className="score-sheet-header">
        <h2>Game #{gameState.gameNumber} Results</h2>
        <div className="header-actions">
          <button 
            className="export-btn" 
            onClick={toggleExportMenu}
            ref={exportBtnRef}
            aria-label="Export results"
          >
            <span className="icon">↓</span>
            <span className="text">Export</span>
          </button>
          {showExportMenu && (
            <div className="export-menu">
              <button onClick={exportToPDF}>
                <span className="icon">📄</span>
                <span>Export to PDF</span>
              </button>
              <button onClick={exportToCSV}>
                <span className="icon">📊</span>
                <span>Export to CSV</span>
              </button>
              <button onClick={shareViaEmail}>
                <span className="icon">📧</span>
                <span>Share via Email</span>
              </button>
            </div>
          )}
        </div>
      </header>
      
      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => handleTabChange('summary')}
        >
          Summary
        </button>
        <button 
          className={`tab-button ${activeTab === 'scoresheet' ? 'active' : ''}`}
          onClick={() => handleTabChange('scoresheet')}
        >
          Score Sheet
        </button>
        <button 
          className={`tab-button ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => handleTabChange('analysis')}
        >
          Analysis
        </button>
      </div>
      
      <div className="tab-content">
        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="summary-tab">
            {/* Score Cards */}
            <div className="score-cards">
              {/* Party Bridge Score Card */}
              <div className="score-card party-bridge-card">
                <div className="card-header">
                  <h3>Party Bridge</h3>
                </div>
                <div className="card-content">
                  <div className="team-scores">
                    <div className="team">
                      <span className="team-name">North-South</span>
                      <span className="team-score">{scores.partyNS}</span>
                    </div>
                    <div className="team">
                      <span className="team-name">East-West</span>
                      <span className="team-score">{scores.partyEW}</span>
                    </div>
                  </div>
                  <div className="winner-banner">
                    <span>Winner: </span>
                    <span className="winner-name">{winners.partyWinner}</span>
                  </div>
                </div>
              </div>
              
              {/* Bonus Bridge Score Card */}
              <div className="score-card bonus-bridge-card">
                <div className="card-header">
                  <h3>Bonus Bridge</h3>
                </div>
                <div className="card-content">
                  <div className="team-scores">
                    <div className="team">
                      <span className="team-name">North-South</span>
                      <span className="team-score">{scores.bonusNS}</span>
                    </div>
                    <div className="team">
                      <span className="team-name">East-West</span>
                      <span className="team-score">{scores.bonusEW}</span>
                    </div>
                  </div>
                  <div className="winner-banner">
                    <span>Winner: </span>
                    <span className="winner-name">{winners.bonusWinner}</span>
                  </div>
                  <button className="info-button" onClick={() => alert("Bonus Bridge scoring rewards both declarers and defenders based on high card points, distribution, and performance relative to expectations.")}>
                    How Bonus Scoring Works
                  </button>
                </div>
              </div>
            </div>
            
            {/* Game Statistics */}
            <div className="stats-section">
              <h3>Game Statistics</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-label">Total Deals</div>
                  <div className="stat-value">{stats.totalDeals}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">NS Contracts</div>
                  <div className="stat-value">
                    {stats.nsDeals}
                    <span className="stat-detail">
                      {stats.nsDeals > 0 ? Math.round((stats.nsMade / stats.nsDeals) * 100) : 0}% made
                    </span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">EW Contracts</div>
                  <div className="stat-value">
                    {stats.ewDeals}
                    <span className="stat-detail">
                      {stats.ewDeals > 0 ? Math.round((stats.ewMade / stats.ewDeals) * 100) : 0}% made
                    </span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Slam Contracts</div>
                  <div className="stat-value">{stats.slams}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Game Contracts</div>
                  <div className="stat-value">{stats.games}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Part Score Contracts</div>
                  <div className="stat-value">{stats.partScores}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Avg Declarer HCP</div>
                  <div className="stat-value">{hcpAnalysis.avgDeclarer}</div>
                </div>
                <div className="stat-card highlight">
                  <div className="stat-label">Best Player</div>
                  <div className="stat-value">
                    {bestPlayer.name} 
                    <span className="stat-detail">
                      {bestPlayer.points.toFixed(1)} avg points
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="action-row">
              <button className="new-game-button" onClick={handleNewGameClick}>
                Start New Game
              </button>
            </div>
          </div>
        )}

{/* Score Sheet Tab */}
        {activeTab === 'scoresheet' && (
          <div className="scoresheet-tab">
            <h3>Deal History</h3>
            
            {/* Mobile-friendly deal cards */}
            <div className="deal-cards">
              {gameState.deals.map((deal, index) => (
                <div key={index} className="deal-card">
                  <div className="deal-header">
                    <span className="deal-number">Deal #{deal.dealNumber}</span>
                    <span className="deal-contract">{formatContract(deal)}</span>
                    <span className={`deal-result ${deal.result >= 0 ? 'made' : 'down'}`}>
                      {formatResult(deal)}
                    </span>
                  </div>
                  <div className="deal-scores">
                    <div className="score-row">
                      <div className="score-label">NS:</div>
                      <div className="score-values">
                        <span className="regular-score">{deal.nsPoints || 0}</span>
                        <span className="bonus-score">+{deal.bonusNsPoints || 0}</span>
                      </div>
                    </div>
                    <div className="score-row">
                      <div className="score-label">EW:</div>
                      <div className="score-values">
                        <span className="regular-score">{deal.ewPoints || 0}</span>
                        <span className="bonus-score">+{deal.bonusEwPoints || 0}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    className="details-button"
                    onClick={() => viewDealDetails(deal)}
                  >
                    View Details
                  </button>
                </div>
              ))}
              
              {/* Total card */}
              <div className="deal-card total-card">
                <div className="deal-header">
                  <span className="deal-number">Final Score</span>
                </div>
                <div className="deal-scores">
                  <div className="score-row">
                    <div className="score-label">NS:</div>
                    <div className="score-values">
                      <span className="regular-score">{scores.partyNS}</span>
                      <span className="bonus-score">{scores.bonusNS}</span>
                    </div>
                  </div>
                  <div className="score-row">
                    <div className="score-label">EW:</div>
                    <div className="score-values">
                      <span className="regular-score">{scores.partyEW}</span>
                      <span className="bonus-score">{scores.bonusEW}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
           {/* Desktop table view (hidden on mobile) - CORRECTED VERSION */}
            <div className="desktop-table-container">
              <table className="deals-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Contract</th>
                    <th>Result</th>
                    <th>NS</th>
                    <th>EW</th>
                    <th>Bonus NS</th>
                    <th>Bonus EW</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {gameState.deals.map((deal, index) => (
                    <tr key={index}>
                      <td>{deal.dealNumber}</td>
                      <td>{formatContract(deal)}</td>
                      <td className={deal.result >= 0 ? 'made' : 'down'}>
                        {formatResult(deal)}
                      </td>
                      <td>{deal.nsPoints || 0}</td>
                      <td>{deal.ewPoints || 0}</td>
                      <td>{deal.bonusNsPoints || 0}</td>
                      <td>{deal.bonusEwPoints || 0}</td>
                      <td>
                        <button 
                          className="detail-button"
                          onClick={() => viewDealDetails(deal)}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3">Total:</td>
                    <td>{scores.partyNS}</td>
                    <td>{scores.partyEW}</td>
                    <td>{scores.bonusNS}</td>
                    <td>{scores.bonusEW}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <div className="action-row">
              <button className="new-game-button" onClick={handleNewGameClick}>
                Start New Game
              </button>
            </div>
          </div>
        )}

{/* Analysis Tab */}
        {activeTab === 'analysis' && (
          <div className="analysis-tab">
            {/* Contract Distribution */}
            <div className="analysis-section">
              <h3>Contract Distribution</h3>
              <div className="category-grid">
                <div className="category-card">
                  <div className="category-title">Slams</div>
                  <div className="category-value">{stats.slams}</div>
                  <div className="category-percent">
                    {stats.totalDeals > 0 ? Math.round((stats.slams / stats.totalDeals) * 100) : 0}%
                  </div>
                </div>
                <div className="category-card">
                  <div className="category-title">Games</div>
                  <div className="category-value">{stats.games}</div>
                  <div className="category-percent">
                    {stats.totalDeals > 0 ? Math.round((stats.games / stats.totalDeals) * 100) : 0}%
                  </div>
                </div>
                <div className="category-card">
                  <div className="category-title">Part Scores</div>
                  <div className="category-value">{stats.partScores}</div>
                  <div className="category-percent">
                    {stats.totalDeals > 0 ? Math.round((stats.partScores / stats.totalDeals) * 100) : 0}%
                  </div>
                </div>
              </div>
            </div>
            
            {/* HCP Analysis */}
            <div className="analysis-section">
              <h3>HCP Analysis</h3>
              <div className="hcp-grid">
                <div className="hcp-card">
                  <div className="hcp-title">Avg Declarer HCP</div>
                  <div className="hcp-value">{hcpAnalysis.avgDeclarer}</div>
                </div>
                <div className="hcp-card">
                  <div className="hcp-title">Avg Defender HCP</div>
                  <div className="hcp-value">{hcpAnalysis.avgDefender}</div>
                </div>
                <div className="hcp-card">
                  <div className="hcp-title">Avg Successful Bid HCP</div>
                  <div className="hcp-value">{hcpAnalysis.avgSuccess}</div>
                </div>
              </div>
            </div>
            
            {/* Player Performance */}
            <div className="analysis-section">
              <h3>Player Performance</h3>
              <div className="player-teams">
                {/* North-South Players */}
                <div className="team-column">
                  <h4>North-South Players</h4>
                  <div className="player-card">
                    <div className="player-name">North</div>
                    <div className="player-stats">
                      <div className="stat-item">
                        <span className="stat-label">Contracts:</span>
                        <span className="stat-value">{playerStats?.north.deals || 0}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Made:</span>
                        <span className="stat-value">
                          {playerStats?.north.madeBids || 0} 
                          ({playerStats?.north.deals > 0 ? 
                            Math.round((playerStats.north.madeBids / playerStats.north.deals) * 100) : 0}%)
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Avg. Points:</span>
                        <span className="stat-value">
                          {playerStats?.north.deals > 0 ? 
                            (playerStats.north.totalPoints / playerStats.north.deals).toFixed(1) : 0}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="player-card">
                    <div className="player-name">South</div>
                    <div className="player-stats">
                      <div className="stat-item">
                        <span className="stat-label">Contracts:</span>
                        <span className="stat-value">{playerStats?.south.deals || 0}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Made:</span>
                        <span className="stat-value">
                          {playerStats?.south.madeBids || 0} 
                          ({playerStats?.south.deals > 0 ? 
                            Math.round((playerStats.south.madeBids / playerStats.south.deals) * 100) : 0}%)
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Avg. Points:</span>
                        <span className="stat-value">
                          {playerStats?.south.deals > 0 ? 
                            (playerStats.south.totalPoints / playerStats.south.deals).toFixed(1) : 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* East-West Players */}
                <div className="team-column">
                  <h4>East-West Players</h4>
                  <div className="player-card">
                    <div className="player-name">East</div>
                    <div className="player-stats">
                      <div className="stat-item">
                        <span className="stat-label">Contracts:</span>
                        <span className="stat-value">{playerStats?.east.deals || 0}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Made:</span>
                        <span className="stat-value">
                          {playerStats?.east.madeBids || 0} 
                          ({playerStats?.east.deals > 0 ? 
                            Math.round((playerStats.east.madeBids / playerStats.east.deals) * 100) : 0}%)
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Avg. Points:</span>
                        <span className="stat-value">
                          {playerStats?.east.deals > 0 ? 
                            (playerStats.east.totalPoints / playerStats.east.deals).toFixed(1) : 0}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="player-card">
                    <div className="player-name">West</div>
                    <div className="player-stats">
                      <div className="stat-item">
                        <span className="stat-label">Contracts:</span>
                        <span className="stat-value">{playerStats?.west.deals || 0}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Made:</span>
                        <span className="stat-value">
                          {playerStats?.west.madeBids || 0} 
                          ({playerStats?.west.deals > 0 ? 
                            Math.round((playerStats.west.madeBids / playerStats.west.deals) * 100) : 0}%)
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Avg. Points:</span>
                        <span className="stat-value">
                          {playerStats?.west.deals > 0 ? 
                            (playerStats.west.totalPoints / playerStats.west.deals).toFixed(1) : 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="action-row">
              <button className="new-game-button" onClick={handleNewGameClick}>
                Start New Game
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Deal Detail Popup */}
      {selectedDeal && (
        <div className="popup-overlay">
          <div className="deal-detail-popup">
            <button className="close-button" onClick={closeDealDetails}>×</button>
            <h3>Deal #{selectedDeal.dealNumber} Details</h3>
            
            <div className="detail-section">
              <h4>Contract Information</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Contract:</span>
                  <span className="detail-value">{formatContract(selectedDeal)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Result:</span>
                  <span className="detail-value">{formatResult(selectedDeal)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Vulnerability:</span>
                  <span className="detail-value">
                    {selectedDeal.vulnerable?.ns ? 'NS Vul' : 'NS Not Vul'}, 
                    {selectedDeal.vulnerable?.ew ? ' EW Vul' : ' EW Not Vul'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="detail-section">
              <h4>Score Information</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Party Bridge:</span>
                  <span className="detail-value">
                    NS: {selectedDeal.nsPoints || 0}, 
                    EW: {selectedDeal.ewPoints || 0}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Bonus Bridge:</span>
                  <span className="detail-value">
                    NS: {selectedDeal.bonusNsPoints || 0}, 
                    EW: {selectedDeal.bonusEwPoints || 0}
                  </span>
                </div>
              </div>
            </div>
            
            {selectedDeal.handAnalysis && (
              <div className="detail-section">
                <h4>Hand Analysis</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Total HCP:</span>
                    <span className="detail-value">{selectedDeal.handAnalysis.totalHCP || 0}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">HCP Advantage:</span>
                    <span className="detail-value">
                      {selectedDeal.handAnalysis.hcpAdvantage || 0}% to {selectedDeal.handAnalysis.advantageSide || 'None'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Distribution:</span>
                    <span className="detail-value">
                      {selectedDeal.handAnalysis.singletons || 0} singletons, 
                      {selectedDeal.handAnalysis.voids || 0} voids,
                      {selectedDeal.handAnalysis.longSuits || 0} long suits
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Expected HCP:</span>
                    <span className="detail-value">{selectedDeal.handAnalysis.expectedHCP || 0}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Expected Tricks:</span>
                    <span className="detail-value">{selectedDeal.handAnalysis.handExpectedTricks || 0}</span>
                  </div>
                </div>
                
                <h4>Bonus Score Calculation</h4>
                <ul className="calculation-steps">
                  {selectedDeal.result >= 0 ? (
                    // For made contracts
                    <>
                      <li>
                        Raw Score / 20: {((selectedDeal.handAnalysis.rawScore || 0) / 20).toFixed(1)} points
                      </li>
                      <li>
                        HCP Adjustment: {(selectedDeal.handAnalysis.hcpAdjustment || 0).toFixed(2)} points
                      </li>
                      <li>
                        Performance Variance: {(selectedDeal.handAnalysis.performanceVariance || 0)} tricks
                      </li>
                      <li>
                        Contract Type: {selectedDeal.handAnalysis.contractTypeDescription || ''}
                      </li>
                      <li>
                        Distribution Adjustment: {(selectedDeal.handAnalysis.distributionAdjustment || 0).toFixed(1)} points
                      </li>
                    </>
                  ) : (
                    // For defeated contracts
                    <>
                      <li>
                        Base Penalty: {(selectedDeal.handAnalysis.basePenalty || 0).toFixed(1)} points
                      </li>
                      <li>
                        Level Penalties: {(selectedDeal.handAnalysis.levelPenalties || 0).toFixed(1)} points
                      </li>
                      <li>
                        Performance Bonus: {(selectedDeal.handAnalysis.performanceBonus || 0).toFixed(1)} points
                      </li>
                      <li>
                        Declarer Consolation: {(selectedDeal.handAnalysis.consolationPoints || 0).toFixed(1)} points
                      </li>
                    </>
                  )}
                  <li>
                    Final NS Bonus: {selectedDeal.bonusNsPoints || 0} points
                  </li>
                  <li>
                    Final EW Bonus: {selectedDeal.bonusEwPoints || 0} points
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NEW: New Game Confirmation Popup */}
      {showNewGameConfirm && (
        <div className="popup-overlay">
          <div className="new-game-confirm-popup">
            <h3>Confirm Start New Game</h3>
            <p>What would you like to do?</p>
            
            <div className="confirm-actions">
              <button 
                className="confirm-new-game-btn" 
                onClick={handleConfirmNewGame}
              >
                Start New Game
              </button>
              
              <button 
                className="get-more-deals-btn" 
                onClick={handleGetMoreDeals}
              >
                🎁 Get More Deals
              </button>
              
              <button 
                className="cancel-confirm-btn" 
                onClick={() => setShowNewGameConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Trial Popup for extension codes */}
      {showTrialPopup && trialManager && (
        <div style={{ zIndex: 2000 }}>
          {console.log('Rendering TrialPopup with:', { showTrialPopup, trialType, trialManager: !!trialManager })}
          <TrialPopup
            trialManager={trialManager}
            onClose={handleTrialPopupClose}
            onExtended={handleTrialExtended}
            onExtensionRequest={handleExtensionRequest}
            type={trialType}
          />
        </div>
      )}

      {/* DEBUG: Show current state */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          position: 'fixed', 
          top: 10, 
          right: 10, 
          background: 'rgba(0,0,0,0.8)', 
          color: 'white', 
          padding: '10px', 
          fontSize: '12px',
          zIndex: 3000 
        }}>
          <div>showTrialPopup: {showTrialPopup.toString()}</div>
          <div>trialType: {trialType}</div>
          <div>showNewGameConfirm: {showNewGameConfirm.toString()}</div>
          <div>trialManager: {trialManager ? 'exists' : 'null'}</div>
        </div>
      )}
    </div>
  );
};

export default GameScoreSheet;