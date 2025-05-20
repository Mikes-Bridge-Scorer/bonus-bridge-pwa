/**
 * Utility functions for managing wake lock
 * Wake Lock prevents the device from going to sleep while the app is in use
 */

// Store the wake lock reference
let wakeLock = null;

/**
 * Check if the Wake Lock API is supported by the browser
 * @returns {boolean} True if Wake Lock API is supported
 */
export const isWakeLockSupported = () => {
  return 'wakeLock' in navigator;
};

/**
 * Request a wake lock to keep the screen awake
 * @returns {Promise<boolean>} Promise resolving to success status
 */
export const requestWakeLock = async () => {
  // Check if Wake Lock API is supported
  if (!isWakeLockSupported()) {
    console.warn('Wake Lock API not supported in this browser');
    return false;
  }
  
  try {
    // Request a screen wake lock
    wakeLock = await navigator.wakeLock.request('screen');
    
    console.log('Wake Lock is active');
    
    // Listen for visibility changes to reacquire wake lock if needed
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return true;
  } catch (err) {
    // Handle wake lock request errors
    console.error(`Failed to request Wake Lock: ${err.message}`);
    return false;
  }
};

/**
 * Release the wake lock and allow the screen to sleep again
 * @returns {Promise<boolean>} Promise resolving to success status
 */
export const releaseWakeLock = async () => {
  // Check if there's an active wake lock
  if (!wakeLock) {
    console.warn('No active Wake Lock to release');
    return false;
  }
  
  try {
    // Release the wake lock
    await wakeLock.release();
    wakeLock = null;
    
    console.log('Wake Lock released');
    
    // Remove the visibilitychange event listener
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    
    return true;
  } catch (err) {
    // Handle release errors
    console.error(`Failed to release Wake Lock: ${err.message}`);
    return false;
  }
};

/**
 * Handle visibility change events to reacquire wake lock when tab becomes visible again
 */
const handleVisibilityChange = async () => {
  if (wakeLock !== null && document.visibilityState === 'visible') {
    // Page has become visible again, reacquire the wake lock
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      console.log('Wake Lock reacquired');
    } catch (err) {
      console.error(`Failed to reacquire Wake Lock: ${err.message}`);
    }
  }
};

/**
 * Get the current wake lock status
 * @returns {boolean} True if wake lock is currently active
 */
export const isWakeLockActive = () => {
  return wakeLock !== null;
};