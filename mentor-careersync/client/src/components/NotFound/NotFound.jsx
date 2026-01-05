import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Stack,
  keyframes,
  useTheme,
  alpha,
} from '@mui/material'
import { Button } from '@mui/material'
import { 
  Home as HomeIcon, 
  ArrowBack,
  MenuBook,
  School,
  AutoStories,
  EmojiObjects,
  Psychology,
  Science,
} from '@mui/icons-material'

// Platform detection: 'student' or 'mentor'
const PLATFORMS = {
  STUDENT: 'student',
  MENTOR: 'mentor',
}

// Detect platform based on current location path
const detectPlatform = (pathname) => {
  // If path contains mentor-specific routes or we're in mentor app, return mentor
  // Otherwise default to student
  if (pathname.includes('/mentor') && !pathname.includes('/mentor-register')) {
    return PLATFORMS.MENTOR
  }
  return PLATFORMS.MENTOR // Default to mentor since we're in mentor platform
}

// MUI Keyframe Animations
const floatAnimation = keyframes`
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  33% {
    transform: translateY(-20px) rotate(5deg);
  }
  66% {
    transform: translateY(-10px) rotate(-5deg);
  }
`

const pulseAnimation = keyframes`
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
`

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const slideInRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`

const gradientShift = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`

const floatSlow = keyframes`
  0%, 100% {
    transform: translateY(0px) translateX(0px) rotate(0deg);
  }
  25% {
    transform: translateY(-30px) translateX(10px) rotate(5deg);
  }
  50% {
    transform: translateY(-15px) translateX(-10px) rotate(-5deg);
  }
  75% {
    transform: translateY(-25px) translateX(5px) rotate(3deg);
  }
`

const floatFast = keyframes`
  0%, 100% {
    transform: translateY(0px) translateX(0px) rotate(0deg);
  }
  33% {
    transform: translateY(-40px) translateX(-15px) rotate(-8deg);
  }
  66% {
    transform: translateY(-20px) translateX(15px) rotate(8deg);
  }
`

const bounce = keyframes`
  0%, 100% {
    transform: translateY(0px) scale(1);
  }
  50% {
    transform: translateY(-20px) scale(1.1);
  }
`

const drift = keyframes`
  0% {
    transform: translate(0, 0) rotate(0deg);
  }
  33% {
    transform: translate(50px, -30px) rotate(120deg);
  }
  66% {
    transform: translate(-30px, -50px) rotate(240deg);
  }
  100% {
    transform: translate(0, 0) rotate(360deg);
  }
`

const pulse = keyframes`
  0%, 100% {
    opacity: 0.4;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.15);
  }
`

const NotFound = ({ platform: propPlatform = null, dashboardPath = null }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const [mounted, setMounted] = useState(false)

  // Determine platform
  const platform = propPlatform || detectPlatform(location.pathname)

  // Determine dashboard path
  const getDashboardPath = () => {
    if (dashboardPath) return dashboardPath
    if (platform === PLATFORMS.STUDENT) {
      return '/student/dashboard' // Student dashboard route
    }
    return '/mentor/dashboard' // Mentor dashboard route (can be configured)
  }

  const dashboardRoute = getDashboardPath()
  const buttonText =
    platform === PLATFORMS.STUDENT
      ? 'Back to Student Dashboard'
      : 'Back to Mentor Dashboard'

  useEffect(() => {
    // Trigger fade-in animation after mount
    setMounted(true)
  }, [])

  const handleGoHome = () => {
    navigate(dashboardRoute)
  }

  const handleGoBack = () => {
    navigate(-1)
  }

  return (
    <Container
      maxWidth={false}
      sx={{
        minHeight: '100vh',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: '#ffffff',
        padding: 0,
        margin: 0,
      }}
    >
      {/* Animated Background Shapes */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary?.main || theme.palette.primary.light, 0.1)})`,
          animation: `${floatAnimation} 6s ease-in-out infinite`,
          filter: 'blur(40px)',
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '15%',
          right: '15%',
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${alpha(theme.palette.secondary?.main || theme.palette.primary.light, 0.1)}, ${alpha(theme.palette.primary.main, 0.1)})`,
          animation: `${floatAnimation} 8s ease-in-out infinite reverse`,
          filter: 'blur(40px)',
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          right: '20%',
          width: 100,
          height: 100,
          borderRadius: '30%',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.secondary?.main || theme.palette.primary.light, 0.08)})`,
          animation: `${rotate} 20s linear infinite`,
          filter: 'blur(30px)',
          zIndex: 0,
        }}
      />

      {/* Floating Educational Icons - Behind Content */}
      <MenuBook
        sx={{
          position: 'absolute',
          top: '8%',
          left: '5%',
          fontSize: { xs: '40px', sm: '60px', md: '80px' },
          color: alpha(theme.palette.primary.main, 0.15),
          animation: `${floatSlow} 8s ease-in-out infinite`,
          zIndex: 0,
        }}
      />
      <School
        sx={{
          position: 'absolute',
          top: '15%',
          right: '8%',
          fontSize: { xs: '50px', sm: '70px', md: '90px' },
          color: alpha(theme.palette.secondary?.main || theme.palette.primary.light, 0.12),
          animation: `${floatFast} 10s ease-in-out infinite`,
          zIndex: 0,
        }}
      />
      <AutoStories
        sx={{
          position: 'absolute',
          bottom: '20%',
          left: '8%',
          fontSize: { xs: '45px', sm: '65px', md: '85px' },
          color: alpha(theme.palette.primary.main, 0.13),
          animation: `${bounce} 6s ease-in-out infinite`,
          zIndex: 0,
        }}
      />
      <EmojiObjects
        sx={{
          position: 'absolute',
          top: '60%',
          right: '12%',
          fontSize: { xs: '35px', sm: '55px', md: '75px' },
          color: alpha(theme.palette.secondary?.main || theme.palette.primary.light, 0.14),
          animation: `${drift} 12s linear infinite`,
          zIndex: 0,
        }}
      />
      <Psychology
        sx={{
          position: 'absolute',
          top: '35%',
          left: '3%',
          fontSize: { xs: '40px', sm: '60px', md: '80px' },
          color: alpha(theme.palette.primary.main, 0.11),
          animation: `${floatSlow} 9s ease-in-out infinite reverse`,
          zIndex: 0,
        }}
      />
      <Science
        sx={{
          position: 'absolute',
          bottom: '30%',
          right: '5%',
          fontSize: { xs: '42px', sm: '62px', md: '82px' },
          color: alpha(theme.palette.secondary?.main || theme.palette.primary.light, 0.13),
          animation: `${pulse} 7s ease-in-out infinite`,
          zIndex: 0,
        }}
      />
      <MenuBook
        sx={{
          position: 'absolute',
          top: '45%',
          left: '12%',
          fontSize: { xs: '38px', sm: '58px', md: '78px' },
          color: alpha(theme.palette.primary.main, 0.1),
          animation: `${floatFast} 11s ease-in-out infinite reverse`,
          zIndex: 0,
          transform: 'rotate(-15deg)',
        }}
      />
      <School
        sx={{
          position: 'absolute',
          bottom: '12%',
          right: '18%',
          fontSize: { xs: '44px', sm: '64px', md: '84px' },
          color: alpha(theme.palette.secondary?.main || theme.palette.primary.light, 0.11),
          animation: `${bounce} 8s ease-in-out infinite`,
          zIndex: 0,
          transform: 'rotate(20deg)',
        }}
      />

      {/* Main Content */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          maxWidth: 700,
          px: 3,
          opacity: mounted ? 1 : 0,
          animation: mounted ? `${fadeInUp} 0.8s ease-out` : 'none',
        }}
      >
        {/* Animated 404 Heading */}
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '120px', sm: '160px', md: '200px' },
            fontWeight: 800,
            lineHeight: 1,
            mb: 2,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary?.main || theme.palette.primary.light})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: `${pulseAnimation} 2s ease-in-out infinite`,
            textShadow: `0 0 40px ${alpha(theme.palette.primary.main, 0.3)}`,
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '120%',
              height: '120%',
              background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 70%)`,
              borderRadius: '50%',
              zIndex: -1,
              animation: `${pulseAnimation} 2s ease-in-out infinite`,
            },
          }}
        >
          404
        </Typography>

        {/* Friendly Message */}
        <Typography
          variant="h4"
          sx={{
            fontSize: { xs: '24px', sm: '32px', md: '36px' },
            fontWeight: 600,
            mb: 2,
            color: theme.palette.text.primary,
            opacity: mounted ? 1 : 0,
            animation: mounted ? `${fadeInUp} 0.8s ease-out 0.2s both` : 'none',
          }}
        >
          Oops! The page you're looking for doesn't exist.
        </Typography>

        <Typography
          variant="body1"
          sx={{
            fontSize: { xs: '16px', sm: '18px' },
            color: theme.palette.text.secondary,
            mb: 4,
            maxWidth: 500,
            mx: 'auto',
            opacity: mounted ? 1 : 0,
            animation: mounted ? `${fadeInUp} 0.8s ease-out 0.4s both` : 'none',
          }}
        >
          The page you requested might have been moved, deleted, or doesn't exist.
          Let's get you back on track!
        </Typography>

        {/* Action Buttons */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          justifyContent="center"
          sx={{
            opacity: mounted ? 1 : 0,
            animation: mounted ? `${slideInRight} 0.8s ease-out 0.6s both` : 'none',
          }}
        >
          <Button
            variant="contained"
            size="large"
            startIcon={<HomeIcon />}
            onClick={handleGoHome}
            sx={{
              textTransform: 'none',
              borderRadius: '8px',
              backgroundColor: '#155DFC',
              color: '#ffffff',
              padding: '8px 24px',
              fontSize: '16px',
              fontWeight: 500,
              height: 'auto',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: '#1248d4',
                transform: 'translateY(-2px)',
              },
              '&:active': {
                transform: 'translateY(0)',
              },
            }}
          >
            {buttonText}
          </Button>

          <Button
            variant="contained"
            size="large"
            startIcon={<ArrowBack />}
            onClick={handleGoBack}
            sx={{
              textTransform: 'none',
              borderRadius: '8px',
              backgroundColor: '#155DFC',
              color: '#ffffff',
              padding: '8px 24px',
              fontSize: '16px',
              fontWeight: 500,
              height: 'auto',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: '#1248d4',
                transform: 'translateY(-2px)',
              },
              '&:active': {
                transform: 'translateY(0)',
              },
            }}
          >
            Go Back
          </Button>
        </Stack>
      </Box>
    </Container>
  )
}

export default NotFound

