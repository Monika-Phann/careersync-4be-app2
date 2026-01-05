import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const SSOHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Get token from URL
    const token = searchParams.get('token');

    if (token) {
      console.log("SSO: Token found, logging in...");
      
      // 2. Save token to Local Storage
      localStorage.setItem('token', token);
      
      // 3. Redirect to Dashboard (Root)
      window.location.href = '/'; 
    } else {
      console.error("SSO: No token found");
      // If failed, send back to local login
      window.location.href = '/login';
    }
  }, [searchParams, navigate]);

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <h2>Logging you in...</h2>
      <p>Please wait while we connect to your account.</p>
    </div>
  );
};

export default SSOHandler;
