import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import ForgotPasswordForm from './ForgotPasswordForm';

const AuthScreen: React.FC = () => {
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgotPassword'>('login');
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    // Redirect to main application without full page reload
    navigate('/calendar', { replace: true });
  };

  const handleSignupSuccess = () => {
    // After signup, switch to login mode
    setAuthMode('login');
  };

  const handleEmailSent = () => {
    // After email sent for password reset, switch to login mode
    setAuthMode('login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {authMode === 'login' && (
        <LoginForm
          onLoginSuccess={handleLoginSuccess}
          onSwitchToSignup={() => setAuthMode('signup')}
          onForgotPassword={() => setAuthMode('forgotPassword')}
        />
      )}
      {authMode === 'signup' && (
        <SignupForm
          onSignupSuccess={handleSignupSuccess}
          onSwitchToLogin={() => setAuthMode('login')}
        />
      )}
      {authMode === 'forgotPassword' && (
        <ForgotPasswordForm
          onBackToLogin={() => setAuthMode('login')}
          onEmailSent={handleEmailSent}
        />
      )}
    </div>
  );
};

export default AuthScreen;