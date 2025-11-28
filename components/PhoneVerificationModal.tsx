import React, { useCallback, useEffect, useRef, useState } from 'react';
import { linkWithPhoneNumber, ConfirmationResult, RecaptchaVerifier, UserCredential } from 'firebase/auth';
import Card from './Card';
import Button from './Button';
import { auth } from '../services/firebase';
import { updateUserProfile } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { useModalAccessibility } from '../hooks/useModalAccessibility';
import { trackEvent } from '../services/telemetry';

interface PhoneVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified?: () => void;
}

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

const extractCountryCode = (value: string) => {
  const match = value.match(/^(\+\d{1,4})/);
  return match ? match[1] : 'unknown';
};

const bypassOtpFlow = import.meta.env.VITE_E2E_BYPASS_PHONE === 'true';

const buildBypassConfirmation = (): ConfirmationResult | null => {
  if (!auth.currentUser) {
    return null;
  }
  return {
    verificationId: 'civicfix-test-bypass',
    confirm: async () => ({ user: auth.currentUser } as UserCredential),
  } as ConfirmationResult;
};

const PhoneVerificationModal: React.FC<PhoneVerificationModalProps> = ({ isOpen, onClose, onVerified }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = 'phone-verification-title';
  const descriptionId = 'phone-verification-desc';

  const closeModal = useCallback(() => {
    window.recaptchaVerifier = undefined;
    window.confirmationResult = undefined;
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      setPhoneNumber(profile?.phoneNumber ?? '');
      setOtp('');
      setStep(1);
      setLoading(false);
      setError(null);
    }
  }, [isOpen, profile?.phoneNumber]);

  useModalAccessibility(isOpen, modalRef, { onClose: closeModal });

  if (!isOpen) {
    return null;
  }

  const validatePhone = () => {
    if (!phoneNumber.startsWith('+') || phoneNumber.length < 10) {
      setError('Enter a valid phone number including country code (e.g., +91XXXXXXXXXX).');
      return false;
    }
    return true;
  };

  const sendOTP = async () => {
    if (!validatePhone()) {
      return;
    }

    if (!auth.currentUser) {
      setError('You must be logged in.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      if (bypassOtpFlow) {
        window.confirmationResult = buildBypassConfirmation() ?? undefined;
        setStep(2);
        return;
      }

      // ✅ reCAPTCHA Enterprise with site key - enables OTP for Indian numbers
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          'recaptcha-container',
          {
            size: 'invisible',
            // Use reCAPTCHA Enterprise site key from Firebase Console
            callback: (response: string) => {
              console.log('✅ reCAPTCHA solved:', response);
            },
            'expired-callback': () => {
              console.warn('⚠️ reCAPTCHA expired, need to retry');
              window.recaptchaVerifier = undefined;
            },
          }
        );
      }
      
      await window.recaptchaVerifier.render();
      console.log('✅ reCAPTCHA Enterprise initialized on:', window.location.hostname);

      const appVerifier = window.recaptchaVerifier;
      console.log('📲 OTP request sent to:', phoneNumber);
      const confirmation = await linkWithPhoneNumber(auth.currentUser, phoneNumber, appVerifier);
      window.confirmationResult = confirmation;
      setStep(2);
    } catch (err) {
      const firebaseError = err as { code?: string; message?: string };
      console.error('❌ OTP ERROR (send):', firebaseError?.code, firebaseError?.message);
      setError(firebaseError?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length < 6) {
      setError('Enter the 6-digit OTP.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      let confirmationResult = window.confirmationResult;

      if (!confirmationResult && bypassOtpFlow) {
        confirmationResult = buildBypassConfirmation() ?? undefined;
      }

      if (!confirmationResult) {
        setError('Please request a new OTP.');
        return;
      }

      const result = await confirmationResult.confirm(otp);
      const user = result.user;

      await updateUserProfile(user.uid, {
        phoneNumber,
        phoneVerified: true,
      });

      trackEvent('user_verified', {
        method: 'link_with_phone_number',
        country_code: extractCountryCode(phoneNumber),
      });

      window.confirmationResult = undefined;
      onVerified?.();
      closeModal();
    } catch (err) {
      const firebaseError = err as { code?: string; message?: string };
      console.error('OTP ERROR (verify):', firebaseError?.code, firebaseError?.message);
      setError(firebaseError?.message || 'Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur">
      <Card
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-full max-w-md bg-slate-900/90 border-white/10"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Secure CivicFix</p>
            <h2 id={titleId} className="text-2xl font-semibold text-white">Verify your phone</h2>
          </div>
          <button
            type="button"
            onClick={closeModal}
            className="text-slate-400 hover:text-white"
            aria-label="Close phone verification modal"
          >
            &times;
          </button>
        </div>

        <p id={descriptionId} className="text-sm text-slate-400 mb-6">
          We use phone verification to keep reports trustworthy. Your number stays private.
        </p>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {step === 1 ? (
          <div className="space-y-4">
              <label className="text-sm text-slate-300" htmlFor="phone-input">
              Phone number
            </label>
            <input
              id="phone-input"
              type="tel"
              placeholder="+91XXXXXXXXXX"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button onClick={sendOTP} disabled={loading} className="w-full">
              {loading ? 'Sending…' : 'Send OTP'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="text-sm text-slate-300" htmlFor="otp-input">
              Enter OTP
            </label>
            <input
              id="otp-input"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/[^0-9]/g, ''))}
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-[0.5em] text-center"
            />
            <Button onClick={verifyOTP} disabled={loading} className="w-full">
              {loading ? 'Verifying…' : 'Verify & Link'}
            </Button>
          </div>
        )}
      </Card>
      <div id="recaptcha-container"></div>
    </div>
  );
};

export default PhoneVerificationModal;
