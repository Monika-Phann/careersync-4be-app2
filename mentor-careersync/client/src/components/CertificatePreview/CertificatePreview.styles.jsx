import { styled } from "@mui/material/styles";
import { Box } from "@mui/material";

/* Overlay */
export const Overlay = styled(Box)({
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.35)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1400,
});

/* Certificate Wrapper */
export const CertificateWrapper = styled(Box)({
  width: 800,
  height: 560,
  backgroundColor: "#fff",
  display: "flex",
  borderRadius: 6,
  overflow: "hidden",
  boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
  position: "relative",
});

/* LEFT SECTION */
export const LeftSection = styled(Box)({
  flex: 1,
  padding: "40px 56px",
  paddingRight: "20px",
  paddingBottom: "20px",
  display: "flex",
  flexDirection: "column",
  position: "relative",
});

export const Header = styled(Box)({
  display: "flex",
  justifyContent: "center",
  marginBottom: 28,
});

export const DateText = styled(Box)({
  fontSize: 12,
  color: "#7A8699",
  marginBottom: 16,
});

export const Name = styled("h1")({
  fontSize: 36,
  fontWeight: 800,
  color: "#0B132B",
  margin: "0 0 12px",
  lineHeight: 1.2,
});

export const Description = styled(Box)({
  fontSize: 15,
  color: "#4F5D75",
  marginBottom: 22,
});

export const ProgramTitle = styled("h2")({
  fontSize: 22,
  fontWeight: 700,
  color: "#0B132B",
  margin: "0 0 16px",
  lineHeight: 1.35,
});

export const SmallText = styled(Box)({
  fontSize: 14,
  color: "#6B7A90",
});

export const Footer = styled(Box)({
  marginTop: "auto",
  paddingTop: 28,
  borderTop: "1px solid #E6EDF5",
  width: "55%",
});

export const Signature = styled(Box)({
  fontSize: 14,
  fontWeight: 600,
  color: "#0B132B",

  "& span": {
    display: "block",
    fontSize: 12,
    fontWeight: 400,
    color: "#7A8699",
    marginTop: 6,
  },
});

export const Verify = styled(Box)({
    color: "#7A8699",
  fontSize: 10,
  textAlign: "right",
  lineHeight: 1.4,

  "& a": {
    display: "block",
    color: "#1C6FA9",
    marginTop: 6,
    textDecoration: "none",
  },
});

/* RIGHT RIBBON */
export const RightRibbon = styled(Box)({
  width: 230,
  background: "linear-gradient(180deg, #2FA8DB 0%, #1C6FA9 100%)",
  color: "#000000ff",
  padding: "36px 20px 28px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 28,
  clipPath:
    "polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)",
});

export const RibbonTitle = styled(Box)({
  textAlign: "center",
  color: "white",
  fontSize: 12,
  letterSpacing: 2,
  lineHeight: 1.4,

  "& strong": {
    display: "block",
    fontSize: 18,
    letterSpacing: 1,
    marginTop: 6,
  },
});

export const Seal = styled(Box)({
  width: 140,
  height: 140,
  borderRadius: "50%",
  border: "3px solid #000000ff",
  backgroundColor: "white",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  textAlign: "center",
  padding: 12,
  fontSize: 10,

  "& strong": {
    color: "#2FA8DB",
    fontSize: 12,
    margin: "6px 0",
  },
});








