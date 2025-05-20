import React, { useEffect } from 'react';

/**
 * Game Summary component to display the final scores and statistics at the end of a Bridge game
 * @param {Object} props - Component props
 * @param {Object} props.gameStats - Game statistics
 * @param {Array} props.dealHistory - History of deals played
 * @param {Function} props.onNewGame - Function to start a new game
 * @param {Function} props.onReviewGame - Function to review the current game
 */
const GameSummary = ({ gameStats, dealHistory, onNewGame, onReviewGame }) => {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  // Get total scores for each team
  const getTotalScores = () => {
    if (!gameStats || !gameStats.finalScores) {
      return { ns: 0, ew: 0 };
    }
    return {
      ns: gameStats.finalScores.nsTotal || 0,
      ew: gameStats.finalScores.ewTotal || 0
    };
  };

  // Determine the winning team
  const getWinner = () => {
    const totals = getTotalScores();
    if (totals.ns > totals.ew) {
      return "North-South";
    } else if (totals.ew > totals.ns) {
      return "East-West";
    } else {
      return "Tie";
    }
  };

  // Format a contract for display
  const formatContract = (deal) => {
    if (!deal || !deal.contract) return "No contract";
    
    const contractMatch = deal.contract.match(/(\d)([♣♦♥♠]|NT)\s+([NESW])(X{0,2})/);
    if (!contractMatch) return deal.contract;
    
    const level = contractMatch[1];
    const suit = contractMatch[2];
    const declarer = contractMatch[3];
    const doubled = contractMatch[4] || "";
    
    return `${level}${suit} by ${declarer}${doubled}`;
  };

  // Format a result for display
  const formatResult = (deal) => {
    if (!deal || deal.result === null || deal.result === undefined) return "No result";
    
    const result = deal.result;
    if (result >= 0) {
      return result > 0 ? `Made +${result}` : "Made";
    } else {
      return `Down ${Math.abs(result)}`;
    }
  };

  // Get game statistics
  const getGameStats = () => {
    if (!gameStats || !dealHistory || dealHistory.length === 0) {
      return {
        totalDeals: 0,
        nsDeals: 0,
        ewDeals: 0,
        nsMadeContracts: 0,
        ewMadeContracts: 0,
        highestScore: { team: "None", score: 0, contract: "None" }
      };
    }

    let nsDeals = 0;
    let ewDeals = 0;
    let nsMadeContracts = 0;
    let ewMadeContracts = 0;
    let highestScore = { team: "None", score: 0, contract: "None", result: "None" };

    dealHistory.forEach(deal => {
      if (!deal.contract) return;
      
      const contractMatch = deal.contract.match(/(\d)([♣♦♥♠]|NT)\s+([NESW])(X{0,2})/);
      if (!contractMatch) return;
      
      const declarer = contractMatch[3];
      const isNS = declarer === 'N' || declarer === 'S';
      const madeContract = deal.result >= 0;
      
      // Count deals by team
      if (isNS) {
        nsDeals++;
        if (madeContract) nsMadeContracts++;
      } else {
        ewDeals++;
        if (madeContract) ewMadeContracts++;
      }
      
      // Check for highest score
      const score = Math.max(deal.nsPoints || 0, deal.ewPoints || 0);
      if (score > highestScore.score) {
        highestScore = {
          team: deal.nsPoints > deal.ewPoints ? "North-South" : "East-West",
          score: score,
          contract: formatContract(deal),
          result: formatResult(deal)
        };
      }
    });

    return {
      totalDeals: dealHistory.length,
      nsDeals,
      ewDeals,
      nsMadeContracts,
      ewMadeContracts,
      highestScore
    };
  };

  const totals = getTotalScores();
  const winner = getWinner();
  const stats = getGameStats();
  
  // Style definitions
  const styles = {
    container: {
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f5f7fa',
      borderRadius: '10px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
      fontFamily: 'Arial, sans-serif'
    },
    header: {
      textAlign: 'center',
      marginBottom: '30px',
      color: '#1e5c8b'
    },
    title: {
      fontSize: '28px',
      marginBottom: '10px'
    },
    subtitle: {
      fontSize: '18px',
      fontWeight: 'normal',
      color: '#666'
    },
    winnerSection: {
      backgroundColor: '#e8f4ff',
      padding: '20px',
      borderRadius: '8px',
      marginBottom: '30px',
      textAlign: 'center'
    },
    winnerTitle: {
      fontSize: '22px',
      marginBottom: '15px',
      color: '#1e5c8b'
    },
    winnerName: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#3c8c5c'
    },
    scoreBox: {
      display: 'flex',
      justifyContent: 'center',
      marginTop: '15px'
    },
    scoreItem: {
      padding: '10px 30px',
      margin: '0 15px',
      backgroundColor: 'white',
      borderRadius: '5px',
      boxShadow: '0 1px 5px rgba(0, 0, 0, 0.1)',
      textAlign: 'center'
    },
    scoreLabel: {
      fontSize: '16px',
      color: '#666',
      marginBottom: '5px'
    },
    scoreValue: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#1e5c8b'
    },
    statsSection: {
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '8px',
      marginBottom: '30px'
    },
    sectionTitle: {
      fontSize: '20px',
      marginBottom: '15px',
      color: '#1e5c8b',
      borderBottom: '1px solid #eee',
      paddingBottom: '10px'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '15px',
      marginBottom: '20px'
    },
    statItem: {
      padding: '15px',
      backgroundColor: '#f9f9f9',
      borderRadius: '5px',
      textAlign: 'center'
    },
    statLabel: {
      fontSize: '14px',
      color: '#666',
      marginBottom: '5px'
    },
    statValue: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#1e5c8b'
    },
    highlight: {
      padding: '15px',
      backgroundColor: '#f9f9f9',
      borderRadius: '5px',
      marginBottom: '15px'
    },
    highlightLabel: {
      fontSize: '16px',
      color: '#666',
      marginBottom: '5px'
    },
    highlightValue: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#1e5c8b'
    },
    buttonContainer: {
      display: 'flex',
      justifyContent: 'center',
      gap: '20px',
      marginTop: '30px'
    },
    newGameBtn: {
      padding: '12px 30px',
      backgroundColor: '#3c8c5c',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      fontSize: '16px',
      fontWeight: 'bold',
      cursor: 'pointer'
    },
    reviewGameBtn: {
      padding: '12px 30px',
      backgroundColor: '#1e5c8b',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      fontSize: '16px',
      fontWeight: 'bold',
      cursor: 'pointer'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Game Summary</h1>
        <h2 style={styles.subtitle}>Bonus Bridge Game #{gameStats?.gameNumber || 1}</h2>
      </div>
      
      <div style={styles.winnerSection}>
        <h3 style={styles.winnerTitle}>Winner</h3>
        <div style={styles.winnerName}>{winner}</div>
        <div style={styles.scoreBox}>
          <div style={styles.scoreItem}>
            <div style={styles.scoreLabel}>North-South</div>
            <div style={styles.scoreValue}>{totals.ns}</div>
          </div>
          <div style={styles.scoreItem}>
            <div style={styles.scoreLabel}>East-West</div>
            <div style={styles.scoreValue}>{totals.ew}</div>
          </div>
        </div>
      </div>
      
      <div style={styles.statsSection}>
        <h3 style={styles.sectionTitle}>Game Statistics</h3>
        <div style={styles.statsGrid}>
          <div style={styles.statItem}>
            <div style={styles.statLabel}>Total Deals</div>
            <div style={styles.statValue}>{stats.totalDeals}</div>
          </div>
          <div style={styles.statItem}>
            <div style={styles.statLabel}>NS Deals</div>
            <div style={styles.statValue}>{stats.nsDeals}</div>
          </div>
          <div style={styles.statItem}>
            <div style={styles.statLabel}>EW Deals</div>
            <div style={styles.statValue}>{stats.ewDeals}</div>
          </div>
          <div style={styles.statItem}>
            <div style={styles.statLabel}>NS Made Contracts</div>
            <div style={styles.statValue}>{stats.nsMadeContracts}</div>
          </div>
          <div style={styles.statItem}>
            <div style={styles.statLabel}>EW Made Contracts</div>
            <div style={styles.statValue}>{stats.ewMadeContracts}</div>
          </div>
        </div>
        
        <div style={styles.highlight}>
          <div style={styles.highlightLabel}>Highest Score</div>
          <div style={styles.highlightValue}>
            {stats.highestScore.team}: {stats.highestScore.score} points 
            ({stats.highestScore.contract} {stats.highestScore.result})
          </div>
        </div>
      </div>
      
      <div style={styles.buttonContainer}>
        <button 
          style={styles.newGameBtn}
          onClick={onNewGame}
        >
          Play New Game
        </button>
        <button 
          style={styles.reviewGameBtn}
          onClick={onReviewGame}
        >
          Review Game Details
        </button>
      </div>
    </div>
  );
};

export default GameSummary;