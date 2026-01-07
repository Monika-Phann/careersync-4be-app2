import { styled } from '@mui/material/styles'
import { AppBar, Toolbar, Box, IconButton } from '@mui/material'
import { Link } from 'react-router-dom'

export const StyledAppBar = styled(AppBar)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  zIndex: 1100,
  backgroundColor: '#0b1220 !important',
  background: 'rgba(11, 18, 32, 0.95)',
  backdropFilter: 'blur(12px)',
  color: '#fff',
  padding: '8px 0',
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  transition: 'all 0.3s ease',
}))

export const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '16px',
  maxWidth: 1400,
  width: '100%',
  margin: '0 auto',
  padding: '0 24px',
  minHeight: '64px',

  [theme.breakpoints.down('md')]: {
    padding: '0 16px',
    minHeight: '56px',
  },
}))

export const BrandLink = styled(Link)({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontWeight: 800,
  letterSpacing: '0.5px',
  textDecoration: 'none',
  color: 'inherit',
  flexShrink: 0,
  transition: 'transform 0.2s ease',
  '&:hover': {
    transform: 'scale(1.02)',
  },
})

export const NavLinks = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '32px',
  flex: 1,
  justifyContent: 'center',

  [theme.breakpoints.down('md')]: {
    display: 'none',
  },
}))

export const NavLink = styled(Link)(({ active, theme }) => ({
  color: active === 'true' ? '#fff' : '#dce7ff',
  fontWeight: active === 'true' ? 700 : 500,
  textDecoration: 'none',
  fontSize: '18px',
  position: 'relative',
  padding: '10px 0',
  width: 'fit-content', // Only as wide as the text
  transition: 'all 0.2s ease',

  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 5,
    left: 0,
    width: active === 'true' ? '100%' : '0%', // Fits the text length
    height: '2px',
    background: '#3b82f6',
    transition: 'width 0.3s ease',
  },

  '&:hover': {
    color: '#fff',
  }
}));
export const NavActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  flexShrink: 0,

  [theme.breakpoints.down('md')]: {
    display: 'none',
  },
}))

export const CircleIconButton = styled(IconButton)(({ theme }) => ({
  height: 40,
  width: 40,
  borderRadius: '50%',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  color: '#fff',
  transition: 'all 0.3s ease',

  '&:hover': {
    background: '#3b82f6',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
  },

  '& svg': {
    fontSize: '20px',
  },
}))

export const FlagButton = styled(CircleIconButton)({
  fontSize: '18px',
})

export const MobileMenuButton = styled(IconButton)(({ theme }) => ({
  display: 'none',
  height: 40,
  width: 40,
  color: '#fff',
  borderRadius: '8px',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.15)',

  '&:hover': {
    background: 'rgba(255, 255, 255, 0.1)',
  },

  '& svg': {
    fontSize: '24px',
  },

  [theme.breakpoints.down('md')]: {
    display: 'flex',
  },
}))

// src/components/Navbar/Navbar.styles.js

export const MobileDrawer = styled(Box)(({ theme, open }) => ({
  position: 'fixed',
  top: 0,
  right: 0,
  width: '300px', // Slightly wider for better text fit
  height: '100vh',
  background: '#0b1220', // Solid dark background for consistency
  boxShadow: open ? '-10px 0 30px rgba(0,0,0,0.5)' : 'none',
  transform: open ? 'translateX(0)' : 'translateX(100%)',
  transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  zIndex: 2000,
  display: 'flex',
  flexDirection: 'column',

  [theme.breakpoints.up('md')]: {
    display: 'none',
  },
}));

export const MobileNavLinks = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  padding: '80px 32px 120px', // Ample padding for a clean look
  gap: '12px',
  flex: 1,
  overflowY: 'auto',
  alignItems: 'flex-start', // Force everything to align to the left
});

