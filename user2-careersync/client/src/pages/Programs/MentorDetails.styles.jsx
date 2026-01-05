import { styled } from "@mui/material/styles";
import { Box, Typography, Button } from "@mui/material";

export const Container = styled(Box)(({ theme }) => ({
  maxWidth: 1100,
  margin: "40px auto",
  padding: "0 24px",
  [theme.breakpoints.down("sm")]: {
    margin: "20px auto",
    padding: "0 16px",
  },
}));

// FIXED: Added BackButton
export const BackButton = styled(Button)({
  color: "#6B7A90",
  textTransform: "none",
  fontWeight: 600,
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 24,
  padding: 0,
  "&:hover": { background: "transparent", color: "#06112E" },
});

export const ContentLayout = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: 32,
  marginTop: 32,
  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
  },
}));

export const ProfileHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  background: "linear-gradient(135deg, #C6E5FA 0%, #E0F2FE 100%)",
  padding: "40px",
  borderRadius: 20,
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
    textAlign: "center",
    padding: "24px",
  },
}));

// Added for the text container inside the header
export const HeaderTextWrapper = styled(Box)(({ theme }) => ({
  marginLeft: 24,
  [theme.breakpoints.down("sm")]: {
    marginLeft: 0,
    marginTop: 16,
  },
}));

export const MainContent = styled(Box)({
  flex: 2,
});

export const Sidebar = styled(Box)(({ theme }) => ({
  flex: 1,
  [theme.breakpoints.down("md")]: {
    width: "100%",
  },
}));

export const BioSection = styled(Box)({
  background: "#fff",
  padding: 32,
  borderRadius: 16,
  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
});

export const ExpertiseTag = styled("span")({
  background: "#E9EEF3",
  color: "#06112E",
  padding: "8px 16px",
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 500,
  display: "inline-block",
  margin: "4px",
});

export const BookingCard = styled(Box)(({ theme }) => ({
  background: "#fff",
  padding: 32,
  borderRadius: 16,
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  position: "relative", // Normal flow - scrolls with content
}));

export const PriceTag = styled(Typography)({
  fontSize: 28,
  fontWeight: 800,
  color: "#06112E",
  marginBottom: 8,
  "& span": {
    fontSize: 16,
    color: "#6B7A90",
    fontWeight: 400,
  },
});