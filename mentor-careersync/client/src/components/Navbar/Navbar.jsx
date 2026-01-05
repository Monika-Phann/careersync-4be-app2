import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Box,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
} from "@mui/icons-material";
import { NavbarStyles } from "./Navbar.styles";
import { getUserData, clearAuth, getStudentPlatformUrl } from "../../utils/auth";
import axiosInstance from "../../api/axiosInstance";

function Navbar({ pageTitle, pageSubtitle, actionButtons, isMobile, onOpenMobileMenu }) {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [mentorName, setMentorName] = React.useState('Mentor');
  const [mentorAvatar, setMentorAvatar] = React.useState(null);
  const open = Boolean(anchorEl);

  const getBaseUrl = () => {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
    const baseURL = axiosInstance.defaults.baseURL || `${API_BASE}/api`;
    return baseURL.replace('/api', '');
  };

  const loadMentorData = () => {
    // Get mentor data from localStorage or fetch from API
    const userData = getUserData();
    if (userData) {
      if (userData.Mentor) {
        const mentor = userData.Mentor;
        const fullName = `${mentor.first_name || ''} ${mentor.last_name || ''}`.trim();
        setMentorName(fullName || 'Mentor');
        if (mentor.profile_image) {
          // Check if it's already a full URL (R2 URL or other external URL)
          const avatarUrl = mentor.profile_image.startsWith('http') 
            ? mentor.profile_image 
            : `${getBaseUrl()}/uploads/${mentor.profile_image}`;
          setMentorAvatar(avatarUrl);
        } else {
          setMentorAvatar(null);
        }
      } else if (userData.firstName || userData.first_name) {
        const name = userData.firstName || userData.first_name || 'Mentor';
        setMentorName(name);
        if (userData.avatar || userData.profileImage || userData.profile_image) {
          const avatarUrl = userData.avatar || userData.profileImage || userData.profile_image;
          // Check if it's already a full URL
          const finalUrl = avatarUrl.startsWith('http') 
            ? avatarUrl 
            : avatarUrl;
          setMentorAvatar(finalUrl);
        } else {
          setMentorAvatar(null);
        }
      }
    }
  };

  useEffect(() => {
    loadMentorData();
    
    // Listen for storage changes (when profile is updated in Settings)
    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        loadMentorData();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom event that can be dispatched when profile is updated
    const handleProfileUpdate = () => {
      loadMentorData();
    };
    
    window.addEventListener('profileUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    clearAuth();
    // Redirect to student platform homepage using utility function
    const studentPlatformUrl = getStudentPlatformUrl();
    window.location.href = studentPlatformUrl;
  };

  return (
    <AppBar position="static" elevation={0} sx={NavbarStyles.appBar}>
      <Toolbar sx={NavbarStyles.toolbar}>
        <Box sx={NavbarStyles.leftSection}>
          {isMobile && (
            <IconButton
              onClick={onOpenMobileMenu}
              aria-label="Open menu"
              sx={NavbarStyles.menuButton}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Box sx={NavbarStyles.mobileLogoWrap}>
            <Box
              component="img"
              src="/logo/careersyncLogo.svg"
              alt="CareerSync"
              sx={NavbarStyles.mobileLogo}
            />
          </Box>

          <Box sx={NavbarStyles.titleContainer}>
            <Typography variant="h6" sx={NavbarStyles.title}>
              {pageTitle || "Dashboard"}
            </Typography>
            {pageSubtitle && (
              <Typography variant="body2" sx={NavbarStyles.subtitle}>
                {pageSubtitle}
              </Typography>
            )}
          </Box>
        </Box>
        <Box sx={NavbarStyles.rightSection}>
          <IconButton color="inherit" sx={NavbarStyles.iconButton}>
            <NotificationsIcon />
          </IconButton>
          {actionButtons && (
            <Box sx={NavbarStyles.actionButtonsContainer}>
              {actionButtons}
            </Box>
          )}
          <Box
            sx={NavbarStyles.profileSection}
            onClick={handleClick}
            aria-controls={open ? "profile-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={open ? "true" : undefined}
          >
            <Avatar 
              sx={NavbarStyles.avatar}
              src={mentorAvatar}
            >
              {mentorName.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={NavbarStyles.profileInfo}>
              <Typography variant="body2" sx={NavbarStyles.profileName}>
                {mentorName}
              </Typography>
              <Typography variant="caption" sx={NavbarStyles.profileRole}>
                Mentor
              </Typography>
            </Box>
            {!isMobile && <KeyboardArrowDownIcon sx={NavbarStyles.dropdownIcon} />}
          </Box>
          <Menu
            id="profile-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            MenuListProps={{
              "aria-labelledby": "profile-button",
            }}
          >
            <MenuItem onClick={() => { handleClose(); navigate('/session-profile'); }}>
              Profile
            </MenuItem>
            <MenuItem onClick={() => { handleClose(); navigate('/settings'); }}>
              Settings
            </MenuItem>
            <MenuItem onClick={() => { handleClose(); handleLogout(); }}>
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
