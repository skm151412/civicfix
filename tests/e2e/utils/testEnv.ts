export const testEnv = {
  citizen: {
    email: process.env.E2E_CITIZEN_EMAIL,
    password: process.env.E2E_CITIZEN_PASSWORD,
  },
  unverified: {
    email: process.env.E2E_UNVERIFIED_EMAIL,
    password: process.env.E2E_UNVERIFIED_PASSWORD,
  },
  phoneNumber: process.env.E2E_PHONE_NUMBER ?? '+15555550123',
  phoneOtp: process.env.E2E_PHONE_OTP ?? '000000',
  locationText: process.env.E2E_LOCATION_TEXT ?? 'Playwright Test Location',
  category: process.env.E2E_ISSUE_CATEGORY ?? 'Other',
};

export const hasCitizenCredentials = Boolean(testEnv.citizen.email && testEnv.citizen.password);
export const hasUnverifiedCredentials = Boolean(testEnv.unverified.email && testEnv.unverified.password);

export const randomTitle = (prefix = 'E2E Issue') => `${prefix} ${new Date().toISOString()}`;
