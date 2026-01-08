import { createContext, useContext, useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { authAtom } from '../store/authAtom';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useAtom(authAtom);
  const [initialized, setInitialized] = useState(false);

  // Restore session from localStorage on load
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        const userData = JSON.parse(storedUser);
        const userRole = userData.role || userData.role_name || 'student';
        
        // IMPORTANT: If user is a mentor, clear auth and log them out
        // Mentors should only be authenticated on the mentor platform, not the student platform
        if (userRole === 'mentor') {
          console.log('CAREERSYNC PLATFORM CREATED BY 4BE AT ABOVE AND BEYOND');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('accessToken');
          setAuth({
            user: null,
            token: null,
            isAuthenticated: false,
            role: null
          });
          setInitialized(true);
          return;
        }
        
        // For non-mentors (students), restore auth normally
        setAuth({
          user: userData,
          token: storedToken,
          isAuthenticated: true,
          role: userRole
        });
      }
    } catch (err) {
      console.log('CAREERSYNC PLATFORM CREATED BY 4BE AT ABOVE AND BEYOND');
    } finally {
      setInitialized(true);
    }
  }, [setAuth]);

  const login = (userData, accessToken) => {
    // Extract role from userData (could be role, role_name, or roleName)
    const userRole = userData.role || userData.role_name || userData.roleName || 'student';
    
    // This triggers the Navbar change immediately
    setAuth({
      user: userData,
      token: accessToken,
      isAuthenticated: true,
      role: userRole
    });

    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setAuth({
      user: null,
      token: null,
      isAuthenticated: false,
      role: null
    });
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateUser = (updatedUserData) => {
    // Merge updated data with existing user data
    // Handle case where auth.user might be null
    const mergedUserData = {
      ...(auth.user || {}),
      ...updatedUserData
    };
    
    setAuth({
      ...auth,
      user: mergedUserData
    });
    
    // Update localStorage
    localStorage.setItem('user', JSON.stringify(mergedUserData));
  };

  const value = {
    user: auth.user,
    token: auth.token,
    isAuthenticated: auth.isAuthenticated,
    role: auth.role,
    initialized,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}