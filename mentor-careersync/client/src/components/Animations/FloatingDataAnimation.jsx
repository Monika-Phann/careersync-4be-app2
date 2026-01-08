import React, { useEffect, useState } from 'react';
import { Box, Typography, GlobalStyles } from '@mui/material';

const FloatingDataAnimation = ({ mentorData, onComplete }) => {
  const [visibleItems, setVisibleItems] = useState([]);

  // Extract mentor data for display
  const dataItems = [
    { label: 'Name', value: mentorData?.fullName || `${mentorData?.first_name || ''} ${mentorData?.last_name || ''}`.trim() || 'Mentor' },
    { label: 'Company', value: mentorData?.company_name || mentorData?.employmentType || 'Professional' },
    { label: 'Experience', value: mentorData?.experience_years ? `${mentorData.experience_years} years` : mentorData?.experience || 'Expert' },
    { label: 'Job Title', value: mentorData?.job_title || 'Mentor' },
    { label: 'Email', value: mentorData?.User?.email || mentorData?.email || '' },
  ].filter(item => item.value); // Filter out empty values

  useEffect(() => {
    // Show items one by one with delay (slower)
    dataItems.forEach((item, index) => {
      setTimeout(() => {
        setVisibleItems(prev => [...prev, index]);
      }, index * 600);
    });

    // Complete animation after all items are shown (longer display time)
    const totalDuration = dataItems.length * 600 + 3000; // Show all items + 3 seconds display
    const timer = setTimeout(() => {
      onComplete();
    }, totalDuration);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <GlobalStyles
        styles={{
          '@keyframes slideInFromLeft': {
            '0%': {
              opacity: 0,
              transform: 'translateX(-120px)',
            },
            '100%': {
              opacity: 1,
              transform: 'translateX(0)',
            },
          },
          '@keyframes fadeIn': {
            '0%': { opacity: 0 },
            '100%': { opacity: 1 },
          },
          '@keyframes pulse': {
            '0%, 100%': { opacity: 0.6 },
            '50%': { opacity: 1 },
          },
          '@keyframes drawLine': {
            '0%': {
              transform: 'translateX(-50%) scaleY(0)',
              opacity: 0,
            },
            '30%': {
              opacity: 1,
            },
            '100%': {
              transform: 'translateX(-50%) scaleY(1)',
              opacity: 1,
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
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          overflow: 'hidden',
        }}
      >
        {/* Center vertical line */}
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            top: '15%',
            bottom: '25%',
            width: '2px',
            backgroundColor: '#1976d2',
            transformOrigin: 'top center',
            animation: 'drawLine 2.5s ease-in-out forwards',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '-6px',
              left: '50%',
              width: '10px',
              height: '10px',
              backgroundColor: '#1976d2',
              borderRadius: '50%',
              transform: 'translateX(-50%)',
              boxShadow: '0 0 12px rgba(25, 118, 210, 0.5)',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: '-6px',
              left: '50%',
              width: '10px',
              height: '10px',
              backgroundColor: '#1976d2',
              borderRadius: '50%',
              transform: 'translateX(-50%)',
              boxShadow: '0 0 12px rgba(25, 118, 210, 0.5)',
            },
          }}
        />

        {/* Data items aligned along the line */}
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '32px',
          }}
        >
          {dataItems.map((item, itemIndex) => {
            const isVisible = visibleItems.includes(itemIndex);
            
            return (
              <Box
                key={itemIndex}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '24px',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible 
                    ? 'translateX(0)' 
                    : 'translateX(-120px)',
                  animation: isVisible 
                    ? `slideInFromLeft 1s ease-in-out forwards` 
                    : 'none',
                  animationDelay: `${itemIndex * 0.6}s`,
                  transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
                }}
              >
                {/* Data card */}
                <Box
                  sx={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '12px',
                    padding: '16px 28px',
                    minWidth: '220px',
                    textAlign: 'left',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                    transition: 'box-shadow 0.3s ease-in-out',
                    '&:hover': {
                      boxShadow: '0 6px 24px rgba(0, 0, 0, 0.12)',
                    },
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#666666',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: 500,
                    }}
                  >
                    {item.label}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: '#030C2B',
                      fontSize: '18px',
                      fontWeight: 600,
                    }}
                  >
                    {item.value}
                  </Typography>
                </Box>

                {/* Dot on the line */}
                <Box
                  sx={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    backgroundColor: '#1976d2',
                    boxShadow: '0 0 16px rgba(25, 118, 210, 0.4)',
                    flexShrink: 0,
                    transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                  }}
                />
              </Box>
            );
          })}
        </Box>

        {/* Loading text */}
        <Box
          sx={{
            position: 'absolute',
            bottom: '15%',
            textAlign: 'center',
            animation: 'fadeIn 1.5s ease-in-out forwards',
          }}
        >
          <Typography
            variant="h5"
            sx={{
              color: '#030C2B',
              fontWeight: 300,
              letterSpacing: '2px',
            }}
          >
            Welcome Back
          </Typography>
          <Box
            sx={{
              animation: 'pulse 2s ease-in-out infinite',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: '#666666',
                marginTop: '12px',
                fontWeight: 400,
              }}
            >
              Loading your dashboard...
            </Typography>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default FloatingDataAnimation;
