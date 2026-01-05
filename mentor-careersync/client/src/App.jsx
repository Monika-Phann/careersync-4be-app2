import React, { useEffect, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import AppRoutes from "./routes/AppRoutes";
import {
  getAuthToken,
  getUserData,
  setUserData,
  clearAuth,
  getStudentPlatformUrl,
} from "./utils/auth";
import { getMyMentorProfile } from "./api/mentorApi";
import axiosInstance from "./api/axiosInstance";

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = getAuthToken();
      
      // ✅ FIX: Get current path
      const path = window.location.pathname;

      // ✅ FIX: List of pages that do NOT require login
      const isPublicPage = 
        path === "/login" || 
        path.startsWith("/verify-email") || 
        path.startsWith("/verify") ||
        path.startsWith("/set-password");

      if (!token) {
        // If we are on a public page, stop loading and let the router handle it
        if (isPublicPage) {
          setIsLoading(false);
          return;
        }

        // Otherwise, redirect to login
        window.location.href = "/login";
        return;
      }

      // If we have a token, stop loading immediately so the app feels fast
      setIsLoading(false);

      // Fetch user data in the background (non-blocking)
      try {
        let userData = getUserData();

        if (!userData || !userData.Mentor) {
          try {
            const userResponse = await axiosInstance.get("/auth/me");
            if (userResponse.data) {
              setUserData(userResponse.data);
              userData = userResponse.data;
            }
          } catch (userError) {
            // If token is invalid, clear it
            if (userError.response?.status === 401) {
                clearAuth();
                // Redirect to student platform homepage
                const studentPlatformUrl = getStudentPlatformUrl();
                window.location.href = studentPlatformUrl;
                return;
            }
          }

          if (userData && !userData.Mentor) {
            const profileResponse = await getMyMentorProfile();
            if (profileResponse?.mentor) {
              const updatedUserData = {
                ...userData,
                Mentor: profileResponse.mentor,
              };
              setUserData(updatedUserData);
              // Dispatch event to notify Navbar
              window.dispatchEvent(new CustomEvent('profileUpdated'));
            }
          }
        }
      } catch (error) {
        if (
          error.response?.status === 401 ||
          error.response?.status === 403
        ) {
          clearAuth();
          // Redirect to student platform homepage
          const studentPlatformUrl = getStudentPlatformUrl();
          window.location.href = studentPlatformUrl;
          return;
        }
      }
    };

    initializeAuth();
  }, []);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <CircularProgress />
        <Typography>Loading mentor platform...</Typography>
      </Box>
    );
  }

  return <AppRoutes />;
}

export default App;
