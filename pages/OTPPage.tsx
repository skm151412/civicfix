import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import PageWrapper from '../components/PageWrapper';
import { useAuth } from '../context/AuthContext';

const OTPPage: React.FC = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return false;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Focus next input
    if (element.value && element.nextSibling) {
      (element.nextSibling as HTMLInputElement).focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`) as HTMLInputElement;
      prevInput?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) return;

    setLoading(true);
    // Simulate API call
    setTimeout(async () => {
      // In a real app, verify with Firebase Phone Auth here
      // For now, we'll just mark the user as verified in our local state/context if possible
      // or just redirect to dashboard
      
      setLoading(false);
      navigate('/citizen/dashboard');
    }, 1500);
  };

  return (
    <PageWrapper>
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-slate-950 to-slate-950" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md relative z-10"
        >
          <Card className="bg-slate-900/80 border-white/10 backdrop-blur-xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-6 text-blue-400">
              <ShieldCheck size={32} />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">Verify your phone</h2>
            <p className="text-slate-400 mb-8">
              We've sent a 6-digit code to your phone number ending in ****88.
            </p>

            <div className="flex justify-center gap-2 mb-8">
              {otp.map((data, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength={1}
                  value={data}
                  onChange={(e) => handleChange(e.target, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="w-12 h-14 rounded-xl bg-slate-800 border border-slate-700 text-center text-2xl font-bold text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              ))}
            </div>

            <Button 
              onClick={handleVerify} 
              className="w-full justify-center py-3 text-lg mb-4"
              disabled={otp.join('').length !== 6 || loading}
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </Button>

            <p className="text-sm text-slate-500">
              Didn't receive the code? <button className="text-blue-400 hover:text-blue-300 font-medium">Resend</button>
            </p>
          </Card>
        </motion.div>
      </div>
    </PageWrapper>
  );
};

export default OTPPage;
