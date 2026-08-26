import { TenantLicense, LicenseBillingType, LicenseStatus } from '../types';

export interface LicenseCheckResult {
  status: LicenseStatus;
  isLocked: boolean;
  isWarning: boolean;
  daysRemaining: number;
  daysOverdue: number;
  formattedExpirationDate: string;
  inGracePeriod: boolean;
}

export function checkLicenseStatus(
  license?: TenantLicense,
  simulatedDate?: string
): LicenseCheckResult {
  if (!license) {
    // Default fallback to active trial if not set
    return {
      status: 'ACTIVE',
      isLocked: false,
      isWarning: false,
      daysRemaining: 30,
      daysOverdue: 0,
      formattedExpirationDate: 'Vigente',
      inGracePeriod: false,
    };
  }

  if (license.status === 'SUSPENDED' || license.status === 'EXPIRED_LOCKED') {
    return {
      status: 'EXPIRED_LOCKED',
      isLocked: true,
      isWarning: false,
      daysRemaining: -1,
      daysOverdue: 1,
      formattedExpirationDate: license.expirationDate,
      inGracePeriod: false,
    };
  }

  const now = simulatedDate ? new Date(simulatedDate) : new Date();
  const expDate = new Date(license.expirationDate + 'T23:59:59');

  const diffTime = expDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const graceDays = license.gracePeriodDays ?? 5;

  if (daysRemaining < 0) {
    const daysOverdue = Math.abs(daysRemaining);
    if (daysOverdue <= graceDays) {
      // Within grace period -> Warning banner
      return {
        status: 'WARNING_EXPIRING',
        isLocked: false,
        isWarning: true,
        daysRemaining,
        daysOverdue,
        formattedExpirationDate: license.expirationDate,
        inGracePeriod: true,
      };
    } else {
      // Exceeded grace period -> HARD LOCK
      return {
        status: 'EXPIRED_LOCKED',
        isLocked: true,
        isWarning: false,
        daysRemaining,
        daysOverdue,
        formattedExpirationDate: license.expirationDate,
        inGracePeriod: false,
      };
    }
  }

  if (daysRemaining <= 7) {
    return {
      status: 'WARNING_EXPIRING',
      isLocked: false,
      isWarning: true,
      daysRemaining,
      daysOverdue: 0,
      formattedExpirationDate: license.expirationDate,
      inGracePeriod: false,
    };
  }

  return {
    status: 'ACTIVE',
    isLocked: false,
    isWarning: false,
    daysRemaining,
    daysOverdue: 0,
    formattedExpirationDate: license.expirationDate,
    inGracePeriod: false,
  };
}

export function generateLicenseKey(
  slug: string = 'IMAGIS',
  billingType: LicenseBillingType = 'MONTHLY',
  year: number = new Date().getFullYear()
): string {
  const prefix = slug.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'IMAGIS';
  const typeCode = billingType === 'ANNUAL' ? 'ANUAL' : billingType === 'PERPETUAL' ? 'PERP' : 'MENS';
  const randomHex1 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const randomHex2 = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${typeCode}-${year}-${randomHex1}-${randomHex2}`;
}

export function activateLicenseKey(
  inputKey: string,
  currentLicense?: TenantLicense
): { success: boolean; newLicense?: TenantLicense; error?: string } {
  const key = inputKey.trim().toUpperCase();

  if (!key) {
    return { success: false, error: 'Por favor ingrese una clave de activación válida.' };
  }

  // Predefined emergency/demo keys
  const now = new Date();
  let addedDays = 30;
  let billingType: LicenseBillingType = 'MONTHLY';

  if (key.includes('ANUAL') || key.includes('YEAR') || key.includes('365')) {
    addedDays = 365;
    billingType = 'ANNUAL';
  } else if (key.includes('PERP') || key.includes('LIFETIME')) {
    addedDays = 3650; // 10 years
    billingType = 'PERPETUAL';
  } else if (key.includes('DEMO') || key.includes('PROMO') || key.includes('TEST') || key.length >= 10) {
    addedDays = 30;
    billingType = 'MONTHLY';
  } else {
    return {
      success: false,
      error: 'Formato de clave de activación no reconocido o expirado. Contacte a soporte.',
    };
  }

  const newExpDate = new Date(now.getTime() + addedDays * 24 * 60 * 60 * 1000);
  const formattedExpDate = newExpDate.toISOString().split('T')[0];

  const updatedLicense: TenantLicense = {
    key: key.startsWith('IMAGIS-') ? key : `IMAGIS-ACT-${key}`,
    billingType: billingType,
    issuedDate: now.toISOString().split('T')[0],
    expirationDate: formattedExpDate,
    gracePeriodDays: 5,
    status: 'ACTIVE',
    currency: currentLicense?.currency || 'USD',
    monthlyRate: currentLicense?.monthlyRate || 59,
    annualRate: currentLicense?.annualRate || 590,
    contactBillingEmail: currentLicense?.contactBillingEmail || 'licencias@imagis-radiologia.com',
    contactBillingPhone: currentLicense?.contactBillingPhone || '+51 987 654 321',
    lastPaymentDate: now.toISOString().split('T')[0],
    autoRenewNotice: true,
  };

  return { success: true, newLicense: updatedLicense };
}

export function createDefaultTenantLicense(
  billingType: LicenseBillingType = 'MONTHLY',
  monthsDuration: number = 1
): TenantLicense {
  const now = new Date();
  const exp = new Date(now.getTime() + monthsDuration * 30 * 24 * 60 * 60 * 1000);

  return {
    key: generateLicenseKey('IMAGIS', billingType, exp.getFullYear()),
    billingType,
    issuedDate: now.toISOString().split('T')[0],
    expirationDate: exp.toISOString().split('T')[0],
    gracePeriodDays: 5,
    status: 'ACTIVE',
    monthlyRate: 59,
    annualRate: 590,
    currency: 'USD',
    contactBillingEmail: 'licencias@imagis-radiologia.com',
    contactBillingPhone: '+51 987 654 321',
    lastPaymentDate: now.toISOString().split('T')[0],
    autoRenewNotice: true,
  };
}
