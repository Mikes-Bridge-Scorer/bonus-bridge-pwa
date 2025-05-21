// TrialManager.js - Completed version with 7-digit code system and one-time use
import CryptoJS from 'crypto-js';

class TrialManager {
  constructor() {
    // TEST SETTINGS - 50 deals total, warning at 60% 
    this.maxDeals = 50;         
    // Security settings
    this.storageKey = 'bonus_bridge_trial';
    this.hashKey = 'bb_secure_2025';
    
    // Generate unique identifier for this browser
    this.browserFingerprint = this.generateFingerprint();
    
    // Initialize the trial
    this.initialize();
  }

  // Create a unique identifier for this browser/device
  generateFingerprint() {
    const data = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      screen: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
    
    return CryptoJS.SHA256(JSON.stringify(data)).toString();
  }

  // Initialize trial data on first load
  initialize() {
    const existing = this.getTrialData();
    
    if (!existing) {
      // First time user - create new trial
      const trialData = {
        startDate: new Date().toISOString(),
        fingerprint: this.browserFingerprint,
        dealsPlayed: 0,
        maxDeals: this.maxDeals,
        gamesCompleted: 0,
        isExpired: false,
        warnings: 0,
        extensions: [] // Track all extensions applied (prevents reuse)
      };
      
      this.saveTrialData(trialData);
      console.log(`🎯 Trial initialized: ${this.maxDeals} deals available`);
    } else {
      // Existing user - check fingerprint
      if (existing.fingerprint !== this.browserFingerprint) {
        console.warn('🚫 Browser fingerprint mismatch - trial reset');
        this.resetTrial();
      }
      
      // Update maxDeals from stored data (in case it was extended)
      this.maxDeals = existing.maxDeals || this.maxDeals;
    }
  }

  // Validate 7-character extension code (6 letters/digits + 1 digit)  
  // Custom mapping: A=3, B=4, C=5, ..., Z=28, and 0=0, 1=1, ..., 9=9
  validateExtensionCode(code) {
    if (!code || typeof code !== 'string') return null;
    
    // Remove any spaces and convert to uppercase
    const cleanCode = code.replace(/\s/g, '').toUpperCase();
    if (cleanCode.length !== 7) return null;
    
    // Check format: 6 letters/digits + 1 digit (1-9)
    if (!/^[A-Z0-9]{6}[1-9]$/.test(cleanCode)) return null;
    
    // Extract first 6 characters and last digit
    const firstSix = cleanCode.substring(0, 6);
    const lastDigit = parseInt(cleanCode.substring(6, 7));
    
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
    
    // Check if sum equals 100
    if (sum !== 100) return null;
    
    // Calculate number of deals this code grants
    const dealsGranted = lastDigit * 100;
    
    return {
      isValid: true,
      dealsGranted: dealsGranted,
      codeUsed: cleanCode,
      sum: sum,
      multiplier: lastDigit
    };
  }

  // Generate a sample extension code (for testing/demonstration)
  // Using custom mapping: A=3, B=4, C=5, ..., Z=28
  generateSampleCode(dealPackage = 100) {
    // dealPackage should be 100, 200, 300, etc. up to 900
    const multiplier = dealPackage / 100;
    if (multiplier < 1 || multiplier > 9 || dealPackage % 100 !== 0) {
      throw new Error('Deal package must be 100, 200, 300, ... up to 900');
    }
    
    // Generate 6 random letter values that sum to 100
    // Letter values: A=3, B=4, ..., Z=28
    let values = [];
    let remainingSum = 100;
    
    // Generate first 5 letters (values 3-28 each)
    for (let i = 0; i < 5; i++) {
      const maxForThis = Math.min(28, remainingSum - (5 - i) * 3); // Ensure we can finish
      const minForThis = Math.max(3, remainingSum - (5 - i) * 28); // Ensure we don't exceed
      const value = Math.floor(Math.random() * (maxForThis - minForThis + 1)) + minForThis;
      values.push(value);
      remainingSum -= value;
    }
    
    // Last letter value is whatever makes the sum = 100
    values.push(remainingSum);
    
    // Shuffle the values to make them less predictable
    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }
    
    // Convert values to letters (3=A, 4=B, etc.)
    const letters = values.map(value => String.fromCharCode(62 + value));
    
    // Create the 7-character code
    const code = letters.join('') + multiplier.toString();
    
    return {
      code: code,
      dealsGranted: dealPackage,
      sum: 100,
      multiplier: multiplier,
      letterValues: values
    };
  }

  // Extend trial with 7-digit code (ONE-TIME USE ONLY)
  extendTrial(code) {
    const validation = this.validateExtensionCode(code);
    
    if (!validation || !validation.isValid) {
      return { 
        success: false, 
        message: 'Invalid extension code. Please check the 7-digit code and try again.' 
      };
    }
    
    const data = this.getTrialData();
    if (!data) {
      return { success: false, message: 'No trial data found' };
    }
    
    // CRITICAL: Check if this code has already been used (prevents reuse)
    if (data.extensions && data.extensions.some(ext => ext.code === validation.codeUsed)) {
      return { 
        success: false, 
        message: 'This extension code has already been used.' 
      };
    }
    
    // Apply the extension
    const newMaxDeals = data.maxDeals + validation.dealsGranted;
    const extensionRecord = {
      code: validation.codeUsed,
      dealsGranted: validation.dealsGranted,
      appliedDate: new Date().toISOString(),
      previousMaxDeals: data.maxDeals,
      newMaxDeals: newMaxDeals
    };
    
    // Update trial data
    data.maxDeals = newMaxDeals;
    data.isExpired = false; // Remove expiry status
    data.warnings = 0; // Reset warnings
    data.extensions = data.extensions || [];
    data.extensions.push(extensionRecord); // STORE USED CODE PERMANENTLY
    
    // Update instance variable
    this.maxDeals = newMaxDeals;
    
    this.saveTrialData(data);
    
    console.log(`🎉 Trial extended! +${validation.dealsGranted} deals (Total: ${newMaxDeals})`);
    console.log(`🔒 Code ${validation.codeUsed} marked as used and cannot be reused`);
    
    return { 
      success: true, 
      message: `Trial extended successfully! You now have ${newMaxDeals - data.dealsPlayed} deals remaining.`,
      dealsAdded: validation.dealsGranted,
      totalDeals: newMaxDeals,
      remainingDeals: newMaxDeals - data.dealsPlayed
    };
  }

  // Get trial data from storage (decrypted)
  getTrialData() {
    try {
      const encrypted = localStorage.getItem(this.storageKey);
      if (!encrypted) return null;
      
      const decrypted = CryptoJS.AES.decrypt(encrypted, this.hashKey).toString(CryptoJS.enc.Utf8);
      return JSON.parse(decrypted);
    } catch (error) {
      console.warn('Trial data corrupted, resetting...');
      return null;
    }
  }

  // Save trial data to storage (encrypted)
  saveTrialData(data) {
    try {
      const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), this.hashKey).toString();
      localStorage.setItem(this.storageKey, encrypted);
    } catch (error) {
      console.error('Failed to save trial data:', error);
    }
  }

  // Check if more deals are allowed
  canPlayDeals() {
    const data = this.getTrialData();
    if (!data) return false;
    
    return !data.isExpired && data.dealsPlayed < data.maxDeals;
  }

  // Increment the deal counter
  incrementDeals() {
    const data = this.getTrialData();
    if (!data) return false;

    data.dealsPlayed++;
    
    // Check if limit reached
    if (data.dealsPlayed >= data.maxDeals) {
      data.isExpired = true;
    }
    
    this.saveTrialData(data);
    
    console.log(`📊 Deal ${data.dealsPlayed}/${data.maxDeals} completed`);
    return !data.isExpired;
  }

  // Get remaining deals
  getRemainingDeals() {
    const data = this.getTrialData();
    if (!data) return 0;
    
    return Math.max(0, data.maxDeals - data.dealsPlayed);
  }

  // Check if warning should be shown
  shouldShowWarning() {
    const data = this.getTrialData();
    if (!data) return false;
    
    // Calculate 60% threshold dynamically
    const warningThreshold = Math.floor(data.maxDeals * 0.6);
    
    // Show warning at 60% of max deals, but not if expired
    return data.dealsPlayed >= warningThreshold && !data.isExpired;
  }

  // Check if trial is expired
  isExpired() {
    const data = this.getTrialData();
    return data ? data.isExpired : false;
  }

  // Reset trial (for suspicious activity)
  resetTrial() {
    localStorage.removeItem(this.storageKey);
    
    const expiredData = {
      startDate: new Date().toISOString(),
      fingerprint: this.browserFingerprint,
      dealsPlayed: this.maxDeals,
      maxDeals: this.maxDeals,
      isExpired: true,
      suspicious: true,
      extensions: [] // Reset extensions list
    };
    
    this.saveTrialData(expiredData);
  }

  /**
   * Reset the deal count when app is updated
   * This allows genuine app updates to reset the trial count
   * without affecting extension codes or other data
   */
  resetDealCount() {
    const data = this.getTrialData();
    if (!data) {
      // If no data, initialize a new trial
      this.initialize();
      return {
        dealCount: 0,
        startDate: new Date()
      };
    }
    
    // Reset deal count to 0
    data.dealsPlayed = 0;
    
    // Update the start date to now
    data.startDate = new Date().toISOString();
    
    // Remove expired status
    data.isExpired = false;
    
    // Reset warnings
    data.warnings = 0;
    
    // Keep extensions history and max deals
    
    // Save updated data
    this.saveTrialData(data);
    
    console.log('🔄 Deal count reset due to app update');
    console.log(`🎯 ${data.maxDeals} deals now available`);
    
    return {
      dealCount: 0,
      maxDeals: data.maxDeals,
      startDate: new Date(data.startDate)
    };
  }

  // Get trial statistics for display
  getStats() {
    const data = this.getTrialData();
    if (!data) return null;
    
    const startDate = new Date(data.startDate);
    const daysUsed = Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24));
    
    // Ensure extensions array exists
    const extensions = data.extensions || [];
    
    return {
      dealsPlayed: data.dealsPlayed || 0,
      maxDeals: data.maxDeals || this.maxDeals,
      remainingDeals: Math.max(0, (data.maxDeals || this.maxDeals) - (data.dealsPlayed || 0)),
      gamesCompleted: data.gamesCompleted || 0,
      daysUsed: Math.max(1, daysUsed),
      startDate: startDate.toLocaleDateString(),
      extensions: extensions,
      totalDealsEverGranted: extensions.reduce((sum, ext) => sum + (ext.dealsGranted || 0), data.maxDeals || this.maxDeals)
    };
  }

  // Generate feedback email with extension request
  generateFeedbackEmail() {
    const stats = this.getStats();
    if (!stats) return null;
    
    const subject = 'Bonus Bridge - Trial Complete - Extension Request';
    const body = `Dear Mike,

I have completed my evaluation of the Bonus Bridge app and would like to request an extension to continue using it.

TRIAL SUMMARY:
• Deals Played: ${stats.dealsPlayed}/${stats.maxDeals}
• Games Completed: ${stats.gamesCompleted}
• Days Used: ${stats.daysUsed}
• Started: ${stats.startDate}
${stats.extensions.length > 0 ? `• Previous Extensions: ${stats.extensions.length}` : ''}

MY FEEDBACK:
[Please share your thoughts about the app here]

EXTENSION REQUEST:
I would like to purchase additional deals:

PRICING TABLE:
Deals   US$    GB£    EU€    Aus$
100     $18    £14    €16    $28
200     $34    £26    €30    $53
300     $48    £36    €43    $75
400     $60    £45    €53    $94
500     $70    £53    €62    $109
600     $78    £59    €69    $122
700     $84    £63    €75    $131
800     $92    £69    €82    $144
900     $99    £74    €88    $154

Selected package: _____ deals

OVERALL RATING: ___/10

Please send me a 7-digit extension code for my chosen package.

Best regards,
[Your name]
[Your email]`;

    return {
      subject: encodeURIComponent(subject),
      body: encodeURIComponent(body)
    };
  }

  // Get list of all used extension codes (for admin/debugging)
  getUsedCodes() {
    const data = this.getTrialData();
    if (!data || !data.extensions) return [];
    
    return data.extensions.map(ext => ({
      code: ext.code,
      dealsGranted: ext.dealsGranted,
      appliedDate: ext.appliedDate
    }));
  }

  // Reset trial for testing (REMOVE IN PRODUCTION)
  resetTrialForTesting() {
    localStorage.removeItem(this.storageKey);
    this.initialize();
    console.log('🔄 Trial reset for testing - 5 deals available');
  }
}

export default TrialManager;