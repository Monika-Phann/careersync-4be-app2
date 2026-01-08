import React, { useState, createContext } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import { DashboardLayoutStyles } from "./DashboardLayout.styles";

export const ActionButtonsContext = createContext({
  setActionButtons: () => {},
});

const pageTitles = {
  "/": {
    title: "Dashboard",
    subtitle: "Overview of your business",
  },
  "/about": {
    title: "About",
    subtitle: "Learn more about our platform",
  },
  "/services": {
    title: "Services",
    subtitle: "Explore our mentoring services",
  },
  "/contact": {
    title: "Contact",
    subtitle: "Get in touch with us",
  },
  "/schedule": {
    title: "Schedule & Location Management",
    subtitle: "Manage and view all your schedules and location.",
  },
  "/schedule/create": {
    title: "Schedule & Location Management",
    subtitle: "Manage and view all your schedules and location.",
  },
  "/bookings": {
    title: "Total Bookings",
    subtitle: "View all your bookings and booking details",
  },
  "/booking-requests": {
    title: "Booking Management",
    subtitle: "Manage all your bookings, appointments, and reservations.",
  },
  "/users": {
    title: "User Management",
    subtitle: "Manage and track student",
  },
  "/certification": {
    title: "Certification",
    subtitle: "View and manage certificates",
  },
  "/earnings": {
    title: "Earning Summary",
    subtitle: "View your earnings and payment history",
  },
  "/invoices": {
    title: "Total Invoice",
    subtitle: "View and manage all your invoices",
  },
  "/settings": {
    title: "Settings",
    subtitle: "Account Information & Security",
  },
  "/session-profile": {
    title: "Session Profile",
    subtitle: "View your session profile",
  },
  "/session-schedule": {
    title: "Session Schedule",
    subtitle: "View and manage all your available and booked sessions",
  },
  "/session-schedule/available-times": {
    title: "Session Schedule",
    subtitle: "View and manage all your available and booked sessions",
  },
};

function DashboardLayout() {
  const location = useLocation();
  const [actionButtons, setActionButtons] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const pageInfo = pageTitles[location.pathname] || {
    title: "Dashboard",
    subtitle: "",
  };

  // Reset action buttons when route changes
  React.useEffect(() => {
    setActionButtons(null);
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  return (
    <ActionButtonsContext.Provider value={{ setActionButtons }}>
      <Box sx={DashboardLayoutStyles.container}>
        <Sidebar
          variant={isMobile ? "temporary" : "permanent"}
          open={isMobile ? mobileSidebarOpen : true}
          onClose={() => setMobileSidebarOpen(false)}
          onNavigate={() => setMobileSidebarOpen(false)}
          transitionDuration={200}
        />
        <Box sx={DashboardLayoutStyles.mainContent}>
          <Navbar 
            pageTitle={pageInfo.title} 
            pageSubtitle={pageInfo.subtitle}
            actionButtons={actionButtons}
            isMobile={isMobile}
            onOpenMobileMenu={() => setMobileSidebarOpen(true)}
          />
          <Box sx={DashboardLayoutStyles.content}>
            <Outlet />
          </Box>
          <Footer />
        </Box>
      </Box>
    </ActionButtonsContext.Provider>
  );
}

export default DashboardLayout;
