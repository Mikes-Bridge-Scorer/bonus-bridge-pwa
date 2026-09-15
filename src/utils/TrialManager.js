// TrialManager.js — v2: time-based trial + Annual/Lifetime codes
// Replaces the old deal-package / encrypted-fingerprint system.
// Public method names are kept the same as before so App.js does not
// need to change how it calls this class — only handleStartGame()
// needed its internal logic updated (see App.js).

class TrialManager {
  constructor() {
    this.storageKey = 'bonus_bridge_license';
    this.firstUseKey = 'bonus_bridge_first_use';

    this.trialDays = 60;              // 2 months
    this.expiryWarningDays = 7;       // start warning this many days before expiry
    this.annualDays = 365;

    this.annualCode = '401025';
    this.lifetimeCode = '402510';
    this.annualBuyUrl = 'https://ko-fi.com/s/c2fd4816a9';
    this.lifetimeBuyUrl = 'https://ko-fi.com/s/5e37dfef28';

    this.initialize();
  }

  initialize() {
    // Make sure a first-use timestamp exists — this starts the trial clock
    this.getFirstUseDate();
  }

  // ---- First-use / trial tracking ----

  getFirstUseDate() {
    let stored = localStorage.getItem(this.firstUseKey);
    if (!stored) {
      stored = Date.now().toString();
      localStorage.setItem(this.firstUseKey, stored);
    }
    return parseInt(stored, 10);
  }

  getTrialDaysLeft() {
    const firstUse = this.getFirstUseDate();
    const daysElapsed = Math.floor((Date.now() - firstUse) / (1000 * 60 * 60 * 24));
    return Math.max(0, this.trialDays - daysElapsed);
  }

  // ---- License storage ----

  getLicenseData() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('License data corrupted, ignoring');
      return null;
    }
  }

  storeLicense(type, code) {
    const licenseData = {
      type,
      code,
      activatedAt: Date.now(),
      activatedDate: new Date().toISOString()
    };
    localStorage.setItem(this.storageKey, JSON.stringify(licenseData));
  }

  checkAnnualExpiry(license) {
    const now = Date.now();
    const expiryDate = license.activatedAt + this.annualDays * 24 * 60 * 60 * 1000;
    const daysLeft = Math.max(0, Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24)));

    if (daysLeft <= 0) {
      return { status: 'annual_expired', locked: true, daysLeft: 0, warning: false };
    }
    return {
      status: 'annual',
      locked: false,
      daysLeft,
      warning: daysLeft <= this.expiryWarningDays
    };
  }

  // ---- Main status check ----

  checkStatus() {
    const license = this.getLicenseData();

    if (license) {
      if (license.type === 'LIFETIME') {
        return { status: 'lifetime', locked: false, daysLeft: null, warning: false };
      }
      if (license.type === 'ANNUAL') {
        return this.checkAnnualExpiry(license);
      }
    }

    const daysLeft = this.getTrialDaysLeft();
    if (daysLeft > 0) {
      return { status: 'trial', locked: false, daysLeft, warning: daysLeft <= this.expiryWarningDays };
    }

    return { status: 'trial_expired', locked: true, daysLeft: 0, warning: false };
  }

  // ---- Public methods kept for compatibility with App.js ----

  isExpired() {
    return this.checkStatus().locked === true;
  }

  canPlayDeals() {
    return !this.isExpired();
  }

  incrementDeals() {
    // No deal counting under the new time-based system — just report
    // whether play is still allowed, same shape as before (boolean).
    return this.canPlayDeals();
  }

  getRemainingDeals() {
    // Repurposed to mean "days left" rather than "deals left".
    // Nothing currently displays this value, but kept for safety.
    const status = this.checkStatus();
    return status.daysLeft === null ? 9999 : status.daysLeft;
  }

  shouldShowWarning() {
    return this.checkStatus().warning === true;
  }

  getStats() {
    const status = this.checkStatus();
    return {
      status: status.status,
      daysLeft: status.daysLeft,
      remainingDeals: status.daysLeft // kept for any legacy reads
    };
  }

  // ---- Code entry — replaces the old extension-code / deal-package system ----

  extendTrial(code) {
    const clean = (code || '').trim();

    if (!/^\d{6}$/.test(clean)) {
      return { success: false, message: 'Code must be exactly 6 digits.' };
    }

    if (clean === this.annualCode) {
      this.storeLicense('ANNUAL', clean);
      return {
        success: true,
        type: 'ANNUAL',
        message: '🎉 Annual licence activated! Enjoy a full year of Bonus Bridge Pro.'
      };
    }

    if (clean === this.lifetimeCode) {
      this.storeLicense('LIFETIME', clean);
      return {
        success: true,
        type: 'LIFETIME',
        message: '🎉 Lifetime licence activated! Thank you for supporting Bonus Bridge Pro.'
      };
    }

    return { success: false, message: "That code isn't recognised. Please check it and try again." };
  }
}

export default TrialManager;
