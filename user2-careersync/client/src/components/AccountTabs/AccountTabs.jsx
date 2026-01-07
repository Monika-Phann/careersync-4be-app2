import { Box } from "@mui/material";
import {
  TabsStyled,
  TabStyled,
  PageWrapper,
  TopBar,
  LogoutButton,
} from "./AccountTabs.styles";
import {
  PersonOutline,
  LockOutlined,
  EventRepeat,
  WorkspacePremiumOutlined,
} from "@mui/icons-material";
import LogoutIcon from "@mui/icons-material/Logout";
import { useNavigate, useLocation } from "react-router-dom";

const tabs = [
  { label: "Profile", path: "/account", icon: <PersonOutline fontSize="small" /> },
  { label: "Security", path: "/account/security", icon: <LockOutlined fontSize="small" /> },
  { label: "Booking History", path: "/account/bookings", icon: <EventRepeat fontSize="small" /> },
  { label: "Certificates", path: "/account/certificates", icon: <WorkspacePremiumOutlined fontSize="small" /> },
];

export default function AccountTabs() {
  const navigate = useNavigate();
  const location = useLocation();

  const value = tabs.findIndex(tab => location.pathname === tab.path);

  const handleLogout = () => {
    console.log("User logged out");
    navigate("/signin");
  };

  return (
    <PageWrapper>

      {/* Centered Tabs */}
      <Box display="flex" justifyContent="center">
        <TabsStyled
          value={value}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          {tabs.map(tab => (
            <TabStyled
              key={tab.path}
              icon={tab.icon}
              iconPosition="start"
              label={tab.label}
              onClick={() => navigate(tab.path)}
            />
          ))}
        </TabsStyled>
      </Box>

    </PageWrapper>
  );
}
