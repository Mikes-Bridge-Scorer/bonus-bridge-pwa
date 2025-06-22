// TrialManager.js - Production version (debug code removed)
import CryptoJS from 'crypto-js';

class TrialManager {
  constructor() {
    this.maxDeals = 50;         
    this.storageKey = 'bonus_bridge_trial';
    this.hashKey = 'bb_secure_2025';
    this.browserFingerprint = this.generateFingerprint();
    this.initialize();
  }

  generateFingerprint() {
    const data = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      screen: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
    
    return CryptoJS.SHA256(JSON.stringify(data)).toString();
  }

  initialize() {
    const existing = this.getTrialData();
    
    if (!existing) {
      const trialData = {
        startDate: new Date().toISOString(),
        fingerprint: this.browserFingerprint,
        dealsPlayed: 0,
        maxDeals: this.maxDeals,
        gamesCompleted: 0,
        isExpired: false,
        warnings: 0,
        extensions: []
      };
      
      this.saveTrialData(trialData);
    } else {
      if (existing.fingerprint !== this.browserFingerprint) {
        console.warn('Browser fingerprint mismatch - trial reset');
        this.resetTrial();
      }
      
      this.maxDeals = existing.maxDeals || this.maxDeals;
    }
  }

  validateExtensionCode(code) {
    if (!code || typeof code !== 'string') return null;
    
    const cleanCode = code.replace(/\s/g, '').toUpperCase();
    if (cleanCode.length !== 7) return null;
    
    const formatRegex = /^[A-Z0-9]{6}[1-9]$/;
    if (!formatRegex.test(cleanCode)) return null;
    
    const firstSix = cleanCode.substring(0, 6);
    const lastDigit = parseInt(cleanCode.substring(6, 7));
    
    const sum = firstSix.split('').reduce((acc, char) => {
      if (char >= 'A' && char <= 'Z') {
        return acc + (char.charCodeAt(0) - 62);
      } else {
        return acc + parseInt(char);
      }
    }, 0);
    
    const isTestCode = sum === 99;
    const isRegularCode = sum === 100;
    
    if (!isTestCode && !isRegularCode) return null;
    
    const dealsGranted = lastDigit * 100;
    
    return {
      isValid: true,
      isTestCode: isTestCode,
      dealsGranted: dealsGranted,
      codeUsed: cleanCode,
      sum: sum,
      multiplier: lastDigit
    };
  }

  generateTestCode(dealPackage = 100) {
    const multiplier = dealPackage / 100;
    if (multiplier < 1 || multiplier > 9 || dealPackage % 100 !== 0) {
      throw new Error('Deal package must be 100, 200, 300, ... up to 900');
    }
    
    let values = [];
    let remainingSum = 99;
    
    for (let i = 0; i < 5; i++) {
      const maxForThis = Math.min(28, remainingSum - (5 - i) * 3);
      const minForThis = Math.max(3, remainingSum - (5 - i) * 28);
      const value = Math.floor(Math.random() * (maxForThis - minForThis + 1)) + minForThis;
      values.push(value);
      remainingSum -= value;
    }
    
    values.push(remainingSum);
    
    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }
    
    const letters = values.map(value => String.fromCharCode(62 + value));
    const code = letters.join('') + multiplier.toString();
    
    return {
      code: code,
      dealsGranted: dealPackage,
      sum: 99,
      multiplier: multiplier,
      letterValues: values,
      isTestCode: true
    };
  }

  generateSampleCode(dealPackage = 100) {
    const multiplier = dealPackage / 100;
    if (multiplier < 1 || multiplier > 9 || dealPackage % 100 !== 0) {
      throw new Error('Deal package must be 100, 200, 300, ... up to 900');
    }
    
    let values = [];
    let remainingSum = 100;
    
    for (let i = 0; i < 5; i++) {
      const maxForThis = Math.min(28, remainingSum - (5 - i) * 3);
      const minForThis = Math.max(3, remainingSum - (5 - i) * 28);
      const value = Math.floor(Math.random() * (maxForThis - minForThis + 1)) + minForThis;
      values.push(value);
      remainingSum -= value;
    }
    
    values.push(remainingSum);
    
    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }
    
    const letters = values.map(value => String.fromCharCode(62 + value));
    const code = letters.join('') + multiplier.toString();
    
    return {
      code: code,
      dealsGranted: dealPackage,
      sum: 100,
      multiplier: multiplier,
      letterValues: values
    };
  }

  activateTestMode() {
    const currentData = this.getTrialData();
    const usedTestCodes = currentData?.extensions?.filter(ext => ext.isTestCode) || [];
    
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('bonus') || key.startsWith('bonusBridge') || key === this.storageKey) {
        localStorage.removeItem(key);
      }
    });
    
    this.initialize();
    
    const newData = this.getTrialData();
    if (newData && usedTestCodes.length > 0) {
      newData.extensions = usedTestCodes;
      this.saveTrialData(newData);
    }
    
    return {
      success: true,
      message: '🧪 Test Mode Activated! All data cleared and trial reset to fresh state.',
      isTestMode: true,
      testModeActivated: true
    };
  }

  extendTrial(code) {
    const validation = this.validateExtensionCode(code);
    
    if (!validation || !validation.isValid) {
      return { 
        success: false, 
        message: 'Invalid extension code. Please check the 7-digit code and try again.' 
      };
    }
    
    if (validation.isTestCode) {
      const data = this.getTrialData();
      if (data && data.extensions && data.extensions.some(ext => ext.code === validation.codeUsed)) {
        return { 
          success: false, 
          message: 'This test code has already been used. Test codes can only be used once per session.' 
        };
      }
      
      if (data) {
        data.extensions = data.extensions || [];
        data.extensions.push({
          code: validation.codeUsed,
          dealsGranted: validation.dealsGranted,
          appliedDate: new Date().toISOString(),
          isTestCode: true
        });
        this.saveTrialData(data);
      }
      
      return this.activateTestMode();
    }
    
    const data = this.getTrialData();
    if (!data) {
      return { success: false, message: 'No trial data found' };
    }
    
    if (data.extensions && data.extensions.some(ext => ext.code === validation.codeUsed)) {
      return { 
        success: false, 
        message: 'This extension code has already been used.' 
      };
    }
    
    const newMaxDeals = data.maxDeals + validation.dealsGranted;
    const extensionRecord = {
      code: validation.codeUsed,
      dealsGranted: validation.dealsGranted,
      appliedDate: new Date().toISOString(),
      previousMaxDeals: data.maxDeals,
      newMaxDeals: newMaxDeals
    };
    
    data.maxDeals = newMaxDeals;
    data.isExpired = false;
    data.warnings = 0;
    data.extensions = data.extensions || [];
    data.extensions.push(extensionRecord);
    
    this.maxDeals = newMaxDeals;
    this.saveTrialData(data);
    
    return { 
      success: true, 
      message: `Trial extended successfully! You now have ${newMaxDeals - data.dealsPlayed} deals remaining.`,
      dealsAdded: validation.dealsGranted,
      totalDeals: newMaxDeals,
      remainingDeals: newMaxDeals - data.dealsPlayed
    };
  }

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

  saveTrialData(data) {
    try {
      const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), this.hashKey).toString();
      localStorage.setItem(this.storageKey, encrypted);
    } catch (error) {
      console.error('Failed to save trial data:', error);
    }
  }

  canPlayDeals() {
    const data = this.getTrialData();
    if (!data) return false;
    
    return !data.isExpired && data.dealsPlayed < data.maxDeals;
  }

  incrementDeals() {
    const data = this.getTrialData();
    if (!data) return false;

    data.dealsPlayed++;
    
    if (data.dealsPlayed >= data.maxDeals) {
      data.isExpired = true;
    }
    
    this.saveTrialData(data);
    return !data.isExpired;
  }

  getRemainingDeals() {
    const data = this.getTrialData();
    if (!data) return 0;
    
    return Math.max(0, data.maxDeals - data.dealsPlayed);
  }

  shouldShowWarning() {
    const data = this.getTrialData();
    if (!data) return false;
    
    const warningThreshold = Math.floor(data.maxDeals * 0.6);
    return data.dealsPlayed >= warningThreshold && !data.isExpired;
  }

  isExpired() {
    const data = this.getTrialData();
    if (!data) return false;
    
    if (data.dealsPlayed >= this.maxDeals) {
      data.isExpired = true;
      this.saveTrialData(data);
      return true;
    }
    
    return data.isExpired;
  }

  resetTrial() {
    localStorage.removeItem(this.storageKey);
    
    const expiredData = {
      startDate: new Date().toISOString(),
      fingerprint: this.browserFingerprint,
      dealsPlayed: this.maxDeals,
      maxDeals: this.maxDeals,
      isExpired: true,
      suspicious: true,
      extensions: []
    };
    
    this.saveTrialData(expiredData);
  }

  resetDealCount() {
    const data = this.getTrialData();
    if (!data) {
      this.initialize();
      return {
        dealCount: 0,
        startDate: new Date()
      };
    }
    
    data.dealsPlayed = 0;
    data.startDate = new Date().toISOString();
    data.isExpired = false;
    data.warnings = 0;
    
    this.saveTrialData(data);
    
    return {
      dealCount: 0,
      maxDeals: data.maxDeals,
      startDate: new Date(data.startDate)
    };
  }

  getStats() {
    const data = this.getTrialData();
    if (!data) return null;
    
    const startDate = new Date(data.startDate);
    const daysUsed = Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24));
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

  getUsedCodes() {
    const data = this.getTrialData();
    if (!data || !data.extensions) return [];
    
    return data.extensions.map(ext => ({
      code: ext.code,
      dealsGranted: ext.dealsGranted,
      appliedDate: ext.appliedDate
    }));
  }

  generateTestCodes() {
    const testCodes = [];
    for (let i = 1; i <= 9; i++) {
      const dealPackage = i * 100;
      const testCode = this.generateTestCode(dealPackage);
      testCodes.push({
        package: `${dealPackage} deals`,
        code: testCode.code,
        sum: testCode.sum,
        note: 'Test code (sum=99) - activates test mode'
      });
    }
    return testCodes;
  }

  resetTrialForTesting() {
    localStorage.removeItem(this.storageKey);
    this.initialize();
  }
}

export default TrialManager;