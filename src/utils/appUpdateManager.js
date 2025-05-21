/**
 * App Update Manager for Bonus Bridge
 * Integrates with Trial Manager to handle version updates properly
 * Place the file in your utils folder
 */

// IMPORTANT: Update this version number when releasing updates
export const APP_VERSION = '1.0.1';

// Storage keys for update tracking
export const StorageKeys = {
  VERSION: 'bonusBridge_version',
  LAST_UPDATE: 'bonusBridge_lastUpdate',
  UPDATED_FLAG: 'bonusBridge_hasUpdated',
  INSTALL_DATE: 'bonusBridge_installDate'
};

/**
 * Check if the app is being launched after an update
 * @returns {boolean} True if this is an update
 */
export const checkForUpdate = () => {
  const storedVersion = localStorage.getItem(StorageKeys.VERSION);
  
  // If no version stored or version is different, this is an update
  return !storedVersion || storedVersion !== APP_VERSION;
};

/**
 * Process app version update
 * This resets appropriate counters but preserves user data
 * @param {TrialManager} trialManager - The Trial Manager instance
 * @returns {boolean} True if this was an update
 */
export const processUpdate = (trialManager) => {
  const isUpdate = checkForUpdate();
  
  if (isUpdate) {
    console.log(`Updating from ${localStorage.getItem(StorageKeys.VERSION) || 'initial'} to ${APP_VERSION}`);
    
    // Store the new version
    localStorage.setItem(StorageKeys.VERSION, APP_VERSION);
    localStorage.setItem(StorageKeys.LAST_UPDATE, new Date().toISOString());
    localStorage.setItem(StorageKeys.UPDATED_FLAG, 'true');
    
    // If this is a new installation, record install date
    if (!localStorage.getItem(StorageKeys.INSTALL_DATE)) {
      localStorage.setItem(StorageKeys.INSTALL_DATE, new Date().toISOString());
    }
    
    // Reset the trial count if we have a Trial Manager
    if (trialManager && typeof trialManager.resetDealCount === 'function') {
      trialManager.resetDealCount();
      console.log('Trial deal count has been reset due to app update');
    }
    
    return true;
  }
  
  return false;
};

/**
 * Check if the service worker is registered
 * @returns {Promise<boolean>} True if registered
 */
export const checkServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    return false;
  }
  
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    return !!registration;
  } catch (error) {
    console.error('Error checking service worker:', error);
    return false;
  }
};

/**
 * Register the service worker
 * @returns {Promise<ServiceWorkerRegistration|null>} The registration or null if failed
 */
export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers are not supported in this browser');
    return null;
  }
  
  try {
    const registration = await navigator.serviceWorker.register('/serviceWorker.js');
    console.log('Service worker registered successfully:', registration);
    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return null;
  }
};

/**
 * Listen for service worker updates
 * @param {TrialManager} trialManager - The Trial Manager instance
 */
export const setupUpdateListener = (trialManager) => {
  if (!('serviceWorker' in navigator)) {
    return;
  }
  
  // Listen for messages from service worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'APP_UPDATED') {
      console.log('Received app update notification:', event.data);
      
      // Reset the trial count when we receive an update message
      if (trialManager && typeof trialManager.resetDealCount === 'function') {
        trialManager.resetDealCount();
      }
      
      // Mark as updated
      localStorage.setItem(StorageKeys.UPDATED_FLAG, 'true');
      localStorage.setItem(StorageKeys.VERSION, event.data.version);
      localStorage.setItem(StorageKeys.LAST_UPDATE, new Date().toISOString());
    }
  });
  
  // Also listen for controller changes (new service worker activation)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('New service worker controlling the page');
  });
};

/**
 * Initialize the update manager
 * @param {TrialManager} trialManager - The Trial Manager instance
 */
export const initUpdateManager = (trialManager) => {
  // Check if this is the first run or an update
  if (checkForUpdate()) {
    processUpdate(trialManager);
  }
  
  // Register service worker if needed
  registerServiceWorker().then(registration => {
    if (registration) {
      setupUpdateListener(trialManager);
    }
  });
};

export default {
  APP_VERSION,
  checkForUpdate,
  processUpdate,
  checkServiceWorker,
  registerServiceWorker,
  setupUpdateListener,
  initUpdateManager
};