import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import LoginAnimation from '../../components/Animations/LoginAnimation';

const SSOHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    const handleLogin = async () => {
      // 1. Get token from URL
      const token = searchParams.get('token');

      if (!token) {
        console.log('CAREERSYNC PLATFORM CREATED BY 4BE AT ABOVE AND BEYOND');
        // If failed, send back to local login
        window.location.href = '/login';
        return;
      }

      console.log('CAREERSYNC PLATFORM CREATED BY 4BE AT ABOVE AND BEYOND');
      
      // 2. Save token to Local Storage
      localStorage.setItem('token', token);
      
      // 3. Show login animation
      setIsLoading(false);
      setShowAnimation(true);
    };

    handleLogin();
  }, [searchParams, navigate]);

  const handleAnimationComplete = () => {
    // Redirect to Dashboard after animation completes
    window.location.href = '/';
  };

  if (isLoading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        flexDirection: 'column',
        gap: '20px',
        backgroundColor: '#ffffff',
        color: '#030C2B'
      }}>
        <h2>Logging you in...</h2>
        <p>Please wait while we connect to your account.</p>
      </div>
    );
  }

  if (showAnimation) {
    return (
      <LoginAnimation 
        onComplete={handleAnimationComplete}
      />
    );
  }

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      flexDirection: 'column',
      gap: '20px',
      backgroundColor: '#ffffff',
      color: '#030C2B'
    }}>
      <h2>Logging you in...</h2>
      <p>Please wait while we connect to your account.</p>
    </div>
  );
};

export default SSOHandler;
