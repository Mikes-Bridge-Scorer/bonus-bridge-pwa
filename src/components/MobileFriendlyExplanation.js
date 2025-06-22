import React, { useState } from 'react';
import './MobileFriendlyExplanation.css';

/**
 * Component to explain Mobile-Friendly features - Mobile Optimized
 * @param {Object} props - Component props
 * @param {Function} props.onClose - Function to close the explanation
 */
const MobileFriendlyExplanation = ({ onClose }) => {
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
    <div className="mobile-friendly-explanation" onClick={handleOverlayClick}>
      <div className="explanation-content">
        <div className="explanation-header">
          <h2>Mobile-Friendly Features</h2>
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
            className={`tab-btn ${activeTab === 'design' ? 'active' : ''}`}
            onClick={() => handleTabChange('design')}
          >
            Design
          </button>
          <button 
            className={`tab-btn ${activeTab === 'features' ? 'active' : ''}`}
            onClick={() => handleTabChange('features')}
          >
            Features
          </button>
          <button 
            className={`tab-btn ${activeTab === 'offline' ? 'active' : ''}`}
            onClick={() => handleTabChange('offline')}
          >
            Offline Use
          </button>
        </div>
        
        <div className="explanation-body">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <h3>Perfect for Bridge on the Go</h3>
              <p>
                Bonus Bridge is designed specifically for mobile devices, making it perfect for bridge games anywhere - at home, at the club, or while traveling.
              </p>
              
              <h3>Why Mobile-First?</h3>
              <ul>
                <li>
                  <strong>Portability:</strong> Take your scoring system anywhere
                </li>
                <li>
                  <strong>Convenience:</strong> No need for paper scorecards
                </li>
                <li>
                  <strong>Accuracy:</strong> Automatic calculations eliminate errors
                </li>
                <li>
                  <strong>Speed:</strong> Faster than traditional scoring methods
                </li>
                <li>
                  <strong>Analysis:</strong> Instant insights and statistics
                </li>
              </ul>
              
              <h3>Device Compatibility</h3>
              <ul>
                <li>📱 Smartphones (iOS & Android)</li>
                <li>📲 Tablets (iPad, Android tablets)</li>
                <li>💻 Laptops and desktops</li>
                <li>🌐 Any device with a modern web browser</li>
              </ul>
              
              <h3>No App Store Required</h3>
              <p>
                Access directly through your web browser - no downloads, no app store restrictions, no updates to manage.
              </p>
            </div>
          )}
          
          {/* Design Tab */}
          {activeTab === 'design' && (
            <div className="design-tab">
              <h3>Touch-Optimized Interface</h3>
              <p>
                Every element is designed for easy touch interaction, even during intense bridge games.
              </p>
              
              <h3>Large Touch Targets</h3>
              <ul>
                <li><strong>Contract Input:</strong> Big, clear buttons for suits and levels</li>
                <li><strong>Result Entry:</strong> Easy-to-tap trick counters</li>
                <li><strong>Score Display:</strong> Large, readable numbers</li>
                <li><strong>Navigation:</strong> Thumb-friendly button placement</li>
              </ul>
              
              <h3>Responsive Layout</h3>
              <div className="layout-feature">
                <h4>📱 Portrait Mode</h4>
                <ul>
                  <li>Optimized for one-handed use</li>
                  <li>Vertical scrolling when needed</li>
                  <li>Critical info always visible</li>
                </ul>
              </div>
              
              <div className="layout-feature">
                <h4>📲 Landscape Mode</h4>
                <ul>
                  <li>Wider tables and score displays</li>
                  <li>Side-by-side comparisons</li>
                  <li>More information at once</li>
                </ul>
              </div>
              
              <h3>Visual Design</h3>
              <ul>
                <li><strong>High Contrast:</strong> Easy to read in various lighting</li>
                <li><strong>Clear Typography:</strong> Legible fonts at all sizes</li>
                <li><strong>Color Coding:</strong> Suits, vulnerability, scores</li>
                <li><strong>Minimal Clutter:</strong> Focus on essential information</li>
              </ul>
            </div>
          )}
          
          {/* Features Tab */}
          {activeTab === 'features' && (
            <div className="features-tab">
              <h3>Mobile-Specific Features</h3>
              <p>
                Special features designed to make mobile bridge scoring effortless.
              </p>
              
              <h3>Smart Input Methods</h3>
              <div className="feature-group">
                <h4>🎯 Contract Selection</h4>
                <ul>
                  <li>Visual suit symbols (♠ ♥ ♦ ♣)</li>
                  <li>Level buttons (1-7)</li>
                  <li>Declarer position wheel</li>
                  <li>Double/Redouble toggles</li>
                </ul>
              </div>
              
              <div className="feature-group">
                <h4>📊 Result Entry</h4>
                <ul>
                  <li>Trick counter with +/- buttons</li>
                  <li>Visual made/down indicators</li>
                  <li>Automatic calculation display</li>
                  <li>Quick correction options</li>
                </ul>
              </div>
              
              <h3>Battery & Performance</h3>
              <ul>
                <li><strong>Low Power Usage:</strong> Optimized for long sessions</li>
                <li><strong>Fast Loading:</strong> Quick startup times</li>
                <li><strong>Smooth Animations:</strong> Responsive interactions</li>
                <li><strong>Memory Efficient:</strong> Won't slow down your device</li>
              </ul>
              
              <h3>Screen Management</h3>
              <ul>
                <li><strong>Keep Awake:</strong> Optional screen-always-on mode</li>
                <li><strong>Auto-brightness:</strong> Adapts to ambient lighting</li>
                <li><strong>Orientation Lock:</strong> Prevents accidental rotation</li>
                <li><strong>Zoom Support:</strong> Pinch to zoom for better visibility</li>
              </ul>
            </div>
          )}
          
          {/* Offline Tab */}
          {activeTab === 'offline' && (
            <div className="offline-tab">
              <h3>Works Without Internet</h3>
              <p>
                Once loaded, Bonus Bridge works completely offline - perfect for remote locations or poor connectivity areas.
              </p>
              
              <h3>Offline Capabilities</h3>
              <ul>
                <li>
                  <strong>Full Functionality:</strong> All scoring features work offline
                </li>
                <li>
                  <strong>Data Storage:</strong> Games saved locally on your device
                </li>
                <li>
                  <strong>No Connection Required:</strong> Play anywhere, anytime
                </li>
                <li>
                  <strong>Instant Loading:</strong> No waiting for network requests
                </li>
              </ul>
              
              <h3>Perfect for Bridge Venues</h3>
              <div className="venue-example">
                <h4>🏠 Home Games</h4>
                <ul>
                  <li>No need to share WiFi passwords</li>
                  <li>Works on any device</li>
                  <li>Multiple people can use simultaneously</li>
                </ul>
              </div>
              
              <div className="venue-example">
                <h4>🏢 Bridge Clubs</h4>
                <ul>
                  <li>Reduce strain on club internet</li>
                  <li>Consistent performance</li>
                  <li>No connectivity issues during games</li>
                </ul>
              </div>
              
              <div className="venue-example">
                <h4>✈️ Travel & Tournaments</h4>
                <ul>
                  <li>Airplanes, trains, remote locations</li>
                  <li>Hotel WiFi independence</li>
                  <li>International roaming not required</li>
                </ul>
              </div>
              
              <h3>Data Sync (Future Feature)</h3>
              <div className="future-sync">
                <h4>🔄 Coming Soon</h4>
                <ul>
                  <li>Sync games across devices when online</li>
                  <li>Backup to cloud storage</li>
                  <li>Share games with partners</li>
                  <li>Multi-device continuation</li>
                </ul>
              </div>
              
              <h3>Installation Benefits</h3>
              <ul>
                <li><strong>"Add to Home Screen":</strong> Create app-like icon</li>
                <li><strong>Full Screen Mode:</strong> Hide browser interface</li>
                <li><strong>Quick Access:</strong> Launch like a native app</li>
                <li><strong>Always Available:</strong> No app store dependencies</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileFriendlyExplanation;