import React, { useEffect, useState } from 'react';
import { Box, Typography, GlobalStyles, CircularProgress, LinearProgress } from '@mui/material';
import { getMyMentorProfile } from '../../api/mentorApi';

const LoginAnimation = ({ onComplete }) => {
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [mentorData, setMentorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showMentorData, setShowMentorData] = useState(false);
  const [visibleMentors, setVisibleMentors] = useState([]);

  // Format mentor data for display
  const formatMentorData = (mentor) => {
    if (!mentor) return null;

    // Parse expertise areas
    let expertiseArray = [];
    if (mentor.expertise_areas) {
      try {
        if (typeof mentor.expertise_areas === 'string') {
          try {
            const parsed = JSON.parse(mentor.expertise_areas);
            expertiseArray = Array.isArray(parsed) ? parsed : [];
          } catch {
            expertiseArray = mentor.expertise_areas.split(',').map(s => s.trim()).filter(s => s);
          }
        } else if (Array.isArray(mentor.expertise_areas)) {
          expertiseArray = mentor.expertise_areas;
        }
      } catch (e) {
        expertiseArray = [];
      }
    }

    const expertise = expertiseArray.length > 0 
      ? expertiseArray.slice(0, 3).join(', ') 
      : 'General Mentoring';

    return {
      name: `${mentor.first_name || ''} ${mentor.last_name || ''}`.trim() || 'Mentor',
      role: mentor.job_title || 'Professional Mentor',
      expertise: expertise,
      experience: mentor.experience_years 
        ? `${mentor.experience_years} ${mentor.experience_years === 1 ? 'year' : 'years'}`
        : 'Experienced',
    };
  };

  useEffect(() => {
    const checkFirstLogin = () => {
      const hasLoggedInBefore = localStorage.getItem('mentor_has_logged_in');
      const firstTime = !hasLoggedInBefore;
      setIsFirstLogin(firstTime);
      if (firstTime) {
        localStorage.setItem('mentor_has_logged_in', 'true');
      }
      return firstTime;
    };

    const fetchMentorData = async (isFirstTime) => {
      try {
        setLoading(true);
        const response = await getMyMentorProfile();
        const mentor = response.mentor || response;
        setMentorData(mentor);
        
        // Show welcome message after a short delay
        setTimeout(() => {
          setShowWelcome(true);
        }, 300);

        // Show loading animation
        setTimeout(() => {
          setLoading(false);
        }, isFirstTime ? 2000 : 800);

        // Show mentor data after loading
        setTimeout(() => {
          setShowMentorData(true);
        }, isFirstTime ? 2500 : 1200);
      } catch (error) {
        console.log('CAREERSYNC PLATFORM CREATED BY 4BE AT ABOVE AND BEYOND');
        // On error, redirect after short delay
        setTimeout(() => {
          onComplete();
        }, 1000);
      }
    };

    const isFirstTime = checkFirstLogin();
    fetchMentorData(isFirstTime);
  }, []);

  // Animate mentors when data is ready
  useEffect(() => {
    if (showMentorData && mentorData) {
      const formattedMentor = formatMentorData(mentorData);
      const mentors = formattedMentor ? [formattedMentor] : [];
      
      mentors.forEach((_, index) => {
        setTimeout(() => {
          setVisibleMentors(prev => [...prev, index]);
        }, index * 300);
      });

      // Complete animation after all mentors are shown
      const totalDuration = mentors.length * 300 + (isFirstLogin ? 3000 : 1500);
      const timer = setTimeout(() => {
        onComplete();
      }, totalDuration);

      return () => clearTimeout(timer);
    }
  }, [showMentorData, mentorData, isFirstLogin, onComplete]);

  const formattedMentor = formatMentorData(mentorData);
  const mentors = formattedMentor ? [formattedMentor] : [];

  return (
    <>
      <GlobalStyles
        styles={{
          '@keyframes fadeIn': {
            '0%': { opacity: 0 },
            '100%': { opacity: 1 },
          },
          '@keyframes slideUp': {
            '0%': {
              opacity: 0,
              transform: 'translateY(30px)',
            },
            '100%': {
              opacity: 1,
              transform: 'translateY(0)',
            },
          },
          '@keyframes scaleIn': {
            '0%': {
              opacity: 0,
              transform: 'scale(0.9)',
            },
            '100%': {
              opacity: 1,
              transform: 'scale(1)',
            },
          },
        }}
      />
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          overflow: 'hidden',
        }}
      >
        {/* Welcome Message */}
        {showWelcome && (
          <Box
            sx={{
              position: 'absolute',
              top: '20%',
              textAlign: 'center',
              animation: 'fadeIn 1s ease-in-out',
            }}
          >
            <Typography
              variant="h3"
              sx={{
                color: '#030C2B',
                fontWeight: 300,
                letterSpacing: '3px',
                fontSize: { xs: '2rem', md: '3rem' },
                marginBottom: '16px',
              }}
            >
              {isFirstLogin ? 'Welcome' : 'Welcome Back'}
            </Typography>
            {isFirstLogin && (
              <Typography
                variant="body1"
                sx={{
                  color: '#666666',
                  fontSize: '18px',
                  fontWeight: 300,
                  animation: 'fadeIn 1.5s ease-in-out',
                }}
              >
                We're setting up your dashboard...
              </Typography>
            )}
          </Box>
        )}

        {/* Loading Animation */}
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '24px',
              animation: 'fadeIn 0.5s ease-in',
            }}
          >
            <CircularProgress 
              size={isFirstLogin ? 60 : 40}
              sx={{
                color: '#1976d2',
              }}
            />
            {isFirstLogin && (
              <Box sx={{ width: '300px' }}>
                <LinearProgress 
                  sx={{
                    height: '4px',
                    borderRadius: '2px',
                    backgroundColor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#1976d2',
                    },
                  }}
                />
              </Box>
            )}
          </Box>
        )}

        {/* Mentor Data Display */}
        {showMentorData && mentors.length > 0 && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '90%',
              maxWidth: '800px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0',
            }}
          >
            {mentors.map((mentor, index) => {
              const isVisible = visibleMentors.includes(index);
              
              return (
                <React.Fragment key={index}>
                  {/* Mentor Card */}
                  <Box
                    sx={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e0e0e0',
                      borderRadius: '12px',
                      padding: '24px 32px',
                      marginBottom: '16px',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                      opacity: isVisible ? 1 : 0,
                      transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                      animation: isVisible 
                        ? `slideUp 0.8s ease-out forwards` 
                        : 'none',
                      animationDelay: `${index * 0.3}s`,
                      transition: 'box-shadow 0.3s ease-in-out',
                      '&:hover': {
                        boxShadow: '0 6px 24px rgba(0, 0, 0, 0.12)',
                      },
                    }}
                  >
                    {/* Line 1: Name + Role */}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '12px',
                        flexWrap: 'wrap',
                        gap: '12px',
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          color: '#030C2B',
                          fontSize: '22px',
                          fontWeight: 600,
                        }}
                      >
                        {mentor.name}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          color: '#1976d2',
                          fontSize: '16px',
                          fontWeight: 500,
                          backgroundColor: '#e3f2fd',
                          padding: '4px 12px',
                          borderRadius: '20px',
                        }}
                      >
                        {mentor.role}
                      </Typography>
                    </Box>

                    {/* Line 2: Expertise + Experience */}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px',
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#666666',
                          fontSize: '15px',
                          fontWeight: 400,
                        }}
                      >
                        <strong>Expertise:</strong> {mentor.expertise}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#666666',
                          fontSize: '15px',
                          fontWeight: 400,
                        }}
                      >
                        <strong>Experience:</strong> {mentor.experience}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Horizontal Divider */}
                  {index < mentors.length - 1 && (
                    <Box
                      sx={{
                        width: '100%',
                        height: '1px',
                        backgroundColor: '#e0e0e0',
                        marginBottom: '16px',
                        opacity: isVisible ? 1 : 0,
                        animation: isVisible 
                          ? `fadeIn 0.5s ease-in forwards` 
                          : 'none',
                        animationDelay: `${index * 0.3 + 0.4}s`,
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </Box>
        )}

        {/* Loading Text */}
        {showMentorData && (
          <Box
            sx={{
              position: 'absolute',
              bottom: '10%',
              textAlign: 'center',
              animation: 'fadeIn 1s ease-in-out',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: '#666666',
                fontSize: '14px',
                fontWeight: 400,
              }}
            >
              Loading your dashboard...
            </Typography>
          </Box>
        )}
      </Box>
    </>
  );
};

export default LoginAnimation;
