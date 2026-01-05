import { styled, keyframes } from "@mui/material/styles";
import { Box, Typography, Card } from "@mui/material";

// --- 1. ANIMATIONS & KEYFRAMES ---

// For the swinging pendant light
const swingAction = keyframes`
  0% { transform: rotate(-15deg); }
  50% { transform: rotate(15deg); }
  100% { transform: rotate(-15deg); }
`;

// For the teardrop bulb and ring glow
export const reflectionGlow = keyframes`
  0%, 100% { box-shadow: 0 0 40px #3b82f6, 0 0 100px rgba(59, 130, 246, 0.4); }
  50% { box-shadow: 0 0 70px #3b82f6, 0 0 150px rgba(59, 130, 246, 0.8); }
`;

// For the pulse of the ceiling light panels in the background image
const lightPulse = keyframes`
  0%, 100% { opacity: 0.3; filter: blur(20px); }
  50% { opacity: 0.7; filter: blur(35px); }
`;

// --- 2. HERO & BACKGROUND COMPONENTS ---

export const MainWrapper = styled(Box)({
  backgroundColor: "#0b1220",
  color: "white",
  overflowX: "hidden",
  scrollBehavior: "smooth",
});

export const HeroWrapper = styled(Box)(({ theme }) => ({
  position: "relative",
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  backgroundImage: 'url("https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2000")',
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundAttachment: "fixed",
  paddingTop: "80px",
  marginTop: "-80px",
  zIndex: 1,
  overflow: "hidden",
  "&::before": {
    content: '""',
    position: "absolute",
    inset: 0,
    background: "linear-gradient(to right, #0b1220 25%, rgba(11, 18, 32, 0.5) 100%)",
    zIndex: 2,
  },
  [theme.breakpoints.down("md")]: {
    backgroundAttachment: "scroll",
    paddingTop: "60px",
  },
}));

// Animates the lights already present in the background image
export const CeilingGlowOverlay = styled(Box)({
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "50%",
  zIndex: 3,
  pointerEvents: "none",
  background: `
    radial-gradient(ellipse at 40% 10%, rgba(59, 130, 246, 0.5) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(59, 130, 246, 0.4) 0%, transparent 60%),
    radial-gradient(ellipse at 20% 5%, rgba(59, 130, 246, 0.3) 0%, transparent 40%)
  `,
  animation: `${lightPulse} 5s infinite ease-in-out`,
});

// --- 3. PENDANT LIGHT COMPONENTS ---

export const HangingFixture = styled(Box)({
  position: "absolute",
  top: "-100px", 
  right: "10%",   
  transformOrigin: "top center",
  animation: `${swingAction} 5s infinite ease-in-out`,
  zIndex: 10,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
});

export const Rope = styled(Box)({
  width: "2px",
  height: "300px", 
  background: "linear-gradient(to bottom, transparent, #3b82f6)",
  opacity: 0.6,
});

export const ModernBulb = styled(Box)({
  width: "60px",
  height: "85px", 
  background: "rgba(59, 130, 246, 0.15)", 
  backdropFilter: "blur(10px)",
  borderRadius: "50% 50% 40% 40% / 40% 40% 60% 60%", // Teardrop shape
  border: "2px solid #3b82f6",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  animation: `${reflectionGlow} 3s infinite ease-in-out`,
  "&::after": {
    content: '""',
    width: "4px",
    height: "25px",
    background: "#fff",
    borderRadius: "2px",
    boxShadow: "0 0 15px #fff, 0 0 30px #3b82f6",
  }
});

// --- 4. SECTION & CARD COMPONENTS ---

export const Section = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'light' && prop !== 'darkGrey' && prop !== 'dark',
})(({ theme, light, darkGrey, dark }) => ({
  padding: theme.spacing(12, 0),
  backgroundColor: light ? "#f8fafc" : darkGrey ? "#111827" : dark ? "#0b1220" : "#0b1220",
  color: light ? "#0f172a" : "white",
  position: "relative",
  zIndex: 2,
}));

export const GlassCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(5),
  borderRadius: "32px",
  background: "rgba(255, 255, 255, 0.03)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  color: "white",
  transition: "all 0.4s ease-in-out",
  "&:hover": {
    transform: "translateY(-12px)",
    background: "rgba(255, 255, 255, 0.06)",
  },
}));

export const StatNumber = styled(Typography)({
  color: "#3b82f6",
  fontWeight: 950,
  fontSize: "5rem",
  lineHeight: 1,
  textShadow: "0 0 20px rgba(59, 130, 246, 0.5)",
});

export const ImageContainer = styled(Box)({
  width: "100%",
  borderRadius: "40px",
  overflow: "hidden",
  "& img": { width: "100%", height: "380px", objectFit: "cover", display: "block" }
});

export const MentorProfileCard = styled(Box)({
  textAlign: 'center',
  padding: '40px',
  borderRadius: '32px',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(59, 130, 246, 0.5)',
});

export const VideoBackgroundWrapper = styled(Box)({
  position: "absolute",
  inset: 0,
  zIndex: 0,
  overflow: "hidden",
  "& video": { width: "100%", height: "100%", objectFit: "cover" },
  "&::after": { content: '""', position: "absolute", inset: 0, background: "rgba(255, 255, 255, 0.85)" }
});

// --- 5. MOTION VARIANTS ---

export const sentence = {
  hidden: { opacity: 1 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

export const letter = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1, y: 0,
    transition: { type: "spring", repeat: Infinity, repeatType: "reverse", repeatDelay: 2 }
  },
};