import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';

type AuthView = 'login' | 'register' | 'forgot-password';

const AuthPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<AuthView>('login');

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
    </>
  );
};

export default AuthPage;
