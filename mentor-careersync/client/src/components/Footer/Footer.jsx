import React from "react";
import { Box, Typography } from "@mui/material";
import { FooterStyles } from "./Footer.styles";

function Footer() {
  return (
    <Box component="footer" sx={FooterStyles.footer}>
      <Typography variant="body2" sx={FooterStyles.text}>
        © 2025 CAREERSYNC. All rights reserved.
      </Typography>
    </Box>
  );
}

export default Footer;
