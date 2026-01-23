import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export function AuthRedirectHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for hash parameters that Supabase Auth sends
    const hash = window.location.hash;
    
    // Recovery flow specific params
    const isRecovery = hash.includes('type=recovery');
    const isRecoveryError = hash.includes('error_code=otp_expired') && hash.includes('error=access_denied');
    
    // Only redirect if we are at root (or prevent loops if already at target)
    if (location.pathname === '/') {
        if (isRecovery || isRecoveryError) {
             console.log('Detected recovery flow, redirecting to reset-passcode...');
             navigate('/reset-passcode' + hash); // Preserve hash for the target page to read
        }
    }
  }, [location, navigate]);

  return null;
}
