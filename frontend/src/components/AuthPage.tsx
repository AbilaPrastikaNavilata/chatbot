import React, { useState, useEffect } from 'react';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';

type AuthView = 'login' | 'register' | 'forgot-password' | 'reset-password';

const AuthPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<AuthView>('login');
  const [resetToken, setResetToken] = useState<string>('');

  // Check URL for reset-password token on mount
  useEffect(() => {
    const checkResetToken = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const path = window.location.pathname;

      if (path === '/reset-password' && token) {
        setResetToken(token);
        setCurrentView('reset-password');
      }
    };

    checkResetToken();

    // Listen for URL changes
    window.addEventListener('popstate', checkResetToken);
    return () => window.removeEventListener('popstate', checkResetToken);
  }, []);

  const handleResetSuccess = () => {
    // Clear URL params and go to login
    window.history.pushState({}, '', '/');
    setResetToken('');
    setCurrentView('login');
  };

  const handleSwitchToLogin = () => {
    window.history.pushState({}, '', '/');
    setResetToken('');
    setCurrentView('login');
  };

  return (
    <>
      {currentView === 'login' && (
        <Login
          onSwitchToRegister={() => setCurrentView('register')}
          onSwitchToForgotPassword={() => setCurrentView('forgot-password')}
        />
      )}
      {currentView === 'register' && (
        <Register onSwitchToLogin={() => setCurrentView('login')} />
      )}
      {currentView === 'forgot-password' && (
        <ForgotPassword onSwitchToLogin={() => setCurrentView('login')} />
      )}
      {currentView === 'reset-password' && (
        <ResetPassword
          token={resetToken}
          onSuccess={handleResetSuccess}
          onSwitchToLogin={handleSwitchToLogin}
        />
      )}
    </>
  );
};

export default AuthPage;
