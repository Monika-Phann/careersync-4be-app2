// src/components/Navbar/Navbar.jsx

import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MdNotificationsNone, MdMenu, MdClose, MdKeyboardArrowDown } from 'react-icons/md'
import { useAtom } from 'jotai'
import { Menu, MenuItem, Avatar, Divider, Box, Typography, Stack, IconButton } from '@mui/material'

import {
  StyledAppBar,
  StyledToolbar,
  BrandLink,
  NavLinks,
  NavLink,
  NavActions,
  CircleIconButton,
  MobileMenuButton,
  MobileDrawer,
  MobileNavLinks,
} from './Navbar.styles'

import Button from '../UI/Button/Button'
import Logo from '../UI/Logo/Logo'
import { authAtom } from '../../store/authAtom'

const guestLinks = [
  { to: '/', label: 'Home' },
  { to: '/programs', label: 'Programs' }, 
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' }, 
  { to: '/mentor-register', label: 'Become Mentor'},

];

const authenticatedLinks = [
  { to: '/', label: 'Home' },
  { to: '/programs', label: 'Programs' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
  { to: '/mentor-register', label: 'Become Mentor'},
];

function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [auth, setAuth] = useAtom(authAtom)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const isMenuOpen = Boolean(anchorEl)

  // Debug: Log user data to see what's available
  useEffect(() => {
    if (auth.isAuthenticated && auth.user) {
      console.log('CAREERSYNC PLATFORM CREATED BY 4BE AT ABOVE AND BEYOND');
      console.log('CAREERSYNC PLATFORM CREATED BY 4BE AT ABOVE AND BEYOND');
      console.log('CAREERSYNC PLATFORM CREATED BY 4BE AT ABOVE AND BEYOND');
    }
  }, [auth.user, auth.isAuthenticated]);

  const handleProfileClick = (event) => setAnchorEl(event.currentTarget)
  const handleMenuClose = () => setAnchorEl(null)
  const navLinks = auth.isAuthenticated ? authenticatedLinks : guestLinks

  const handleLogout = () => {
    setAuth({ user: null, token: null, role: null, isAuthenticated: false })
    localStorage.clear()
    navigate('/signin')
    handleMenuClose()
    setMobileMenuOpen(false)
  }

  return (
    <>
      <StyledAppBar position="fixed">
        <StyledToolbar>
          <BrandLink to="/" aria-label="CareerSync home">
            <Logo style={{ color: '#dce7ff' }} />
          </BrandLink>

          <NavLinks component="nav">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                active={location.pathname === link.to ? 'true' : undefined}
              >
                {link.label}
              </NavLink>
            ))}
          </NavLinks>

          <NavActions>
            {!auth.isAuthenticated ? (
              <Button to="/signin" variant="secondary">Sign In</Button>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CircleIconButton title="Notifications"><MdNotificationsNone /></CircleIconButton>
                <Box 
                  onClick={handleProfileClick}
                  sx={{ 
                    display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer',
                    bgcolor: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '20px',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                  }}
                >
                  <Avatar 
                    src={auth.user?.avatar || auth.user?.profileImage || null} 
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      border: '1px solid #fff',
                      '& img': {
                        objectFit: 'cover'
                      }
                    }}
                    onError={(e) => {
                      const imageUrl = auth.user?.avatar || auth.user?.profileImage;
                      console.log('CAREERSYNC PLATFORM CREATED BY 4BE AT ABOVE AND BEYOND');
                      console.log('CAREERSYNC PLATFORM CREATED BY 4BE AT ABOVE AND BEYOND');
                      // Try to reload if it's an HTTP URL
                      if (imageUrl && imageUrl.startsWith('http')) {
                        setTimeout(() => {
                          e.target.src = imageUrl + '?t=' + Date.now(); // Add cache buster
                        }, 1000);
                      }
                    }}
                    onLoad={() => {
                      console.log('CAREERSYNC PLATFORM CREATED BY 4BE AT ABOVE AND BEYOND');
                    }}
                  >
                    {(!auth.user?.avatar && !auth.user?.profileImage) && (auth.user?.firstName?.[0]?.toUpperCase() || auth.user?.email?.[0]?.toUpperCase() || 'U')}
                  </Avatar>
                  <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, display: { xs: 'none', sm: 'block' } }}>
                    {auth.user?.firstName || 'User'}
                  </Typography>
                  <MdKeyboardArrowDown color="#fff" />
                </Box>
              </Box>
            )}
          </NavActions>

          <MobileMenuButton onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <MdClose /> : <MdMenu />}
          </MobileMenuButton>
        </StyledToolbar>
      </StyledAppBar>

      {/* --- DESKTOP DROPDOWN --- */}
      <Menu
        anchorEl={anchorEl} open={isMenuOpen} onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{ sx: { mt: 1.5, minWidth: 200, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={700}>{auth.user?.firstName} {auth.user?.lastName}</Typography>
          <Typography variant="caption" color="text.secondary">{auth.user?.email}</Typography>
        </Box>
        <Divider />
        <MenuItem onClick={() => { navigate('/account'); handleMenuClose(); }}>My Profile</MenuItem>
        <MenuItem onClick={() => { navigate('/account/bookings'); handleMenuClose(); }}>My Bookings</MenuItem>
        <MenuItem onClick={() => { navigate('/account/security'); handleMenuClose(); }}>Security</MenuItem>
        <MenuItem onClick={() => { navigate('/account/certificates'); handleMenuClose(); }}>Certificates</MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>Logout</MenuItem>
      </Menu>

      {/* --- SIDEBAR DRAWER --- */}
      <MobileDrawer open={mobileMenuOpen}>
        <IconButton 
          onClick={() => setMobileMenuOpen(false)}
          sx={{ position: 'absolute', top: 16, right: 16, color: '#fff' }}
        >
          <MdClose size={28} />
        </IconButton>

        <MobileNavLinks>
          {/* Main Navigation - Alignment fixed in styles */}
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              active={location.pathname === link.to ? 'true' : undefined}
            >
              {link.label}
            </NavLink>
          ))}

          <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)', width: '100%' }} />

          {!auth.isAuthenticated ? (
            <Button 
              to="/signin" variant="secondary" 
              onClick={() => setMobileMenuOpen(false)} sx={{ mt: 1, width: 'fit-content', px: 4 }}
            >
              Sign In
            </Button>
          ) : (
            <Stack spacing={2} sx={{ width: '100%', alignItems: 'flex-start' }}>
              {/* User Identity Section */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Avatar 
                  src={auth.user?.avatar || auth.user?.profileImage} 
                  sx={{ width: 48, height: 48, border: '2px solid #3b82f6' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                >
                  {!auth.user?.avatar && !auth.user?.profileImage && (auth.user?.firstName?.[0] || auth.user?.email?.[0] || 'U')}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} color="#fff">
                    {auth.user?.firstName} {auth.user?.lastName}
                  </Typography>
                  <Typography variant="caption" color="rgba(255,255,255,0.5)">
                    {auth.user?.email}
                  </Typography>
                </Box>
              </Box>

              {/* Account Links - Alignment fixed to match styles */}
              <NavLink to="/account" onClick={() => setMobileMenuOpen(false)} active={location.pathname === '/account' ? 'true' : undefined}>
                My Profile
              </NavLink>
              <NavLink to="/account/bookings" onClick={() => setMobileMenuOpen(false)} active={location.pathname === '/account/bookings' ? 'true' : undefined}>
                My Bookings
              </NavLink>
              <NavLink to="/account/security" onClick={() => setMobileMenuOpen(false)} active={location.pathname === '/account/security' ? 'true' : undefined}>
                Security
              </NavLink>
              <NavLink to="/account/certificates" onClick={() => setMobileMenuOpen(false)} active={location.pathname === '/account/certificates' ? 'true' : undefined}>
                Certificates
              </NavLink>
              
              <Box sx={{ pt: 2 }}>
                <Button 
                  onClick={handleLogout}
                  sx={{ 
                    color: '#ff4d4d', 
                    border: '1px solid #ff4d4d', 
                    borderRadius: '8px',
                    px: 3, py: 1,
                    textTransform: 'none',
                    fontWeight: 700,
                    '&:hover': { bgcolor: 'rgba(255, 77, 77, 0.1)' }
                  }}
                >
                  Logout
                </Button>
              </Box>
            </Stack>
          )}
        </MobileNavLinks>
      </MobileDrawer>
      
      {/* Background Overlay */}
      {mobileMenuOpen && (
        <Box 
          onClick={() => setMobileMenuOpen(false)}
          sx={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            bgcolor: 'rgba(0,0,0,0.4)', zIndex: 1900, backdropFilter: 'blur(4px)'
          }}
        />
      )}
    </>
  )
}

export default Navbar
