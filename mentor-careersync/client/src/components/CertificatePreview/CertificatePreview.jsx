import {
  Overlay,
  CertificateWrapper,
  LeftSection,
  RightRibbon,
  Header,
  DateText,
  Name,
  Description,
  ProgramTitle,
  SmallText,
  Footer,
  Signature,
  Verify,
  Seal,
  RibbonTitle,
} from "./CertificatePreview.styles";
import { IconButton, Button, Box } from "@mui/material";
import { Close as CloseIcon, DownloadOutlined as DownloadIcon } from "@mui/icons-material";
import jsPDF from "jspdf";

export default function CertificatePreview({ open, onClose, certificate }) {
  if (!open || !certificate) return null;

  const handleDownload = () => {
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [297, 210] // A4 landscape - matches 800x560px ratio better
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // White background
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      // Calculate dimensions to match 800x560 design
      // Left section: ~570px (71% of 800px)
      // Right ribbon: ~230px (29% of 800px)
      const leftSectionWidth = pageWidth * 0.71;
      const rightRibbonWidth = pageWidth * 0.29;
      const padding = 15; // mm

      // LEFT SECTION
      // Logo area (centered in left section)
      const logoX = leftSectionWidth / 2;
      let yPos = padding + 10;

      // Logo text (simplified - CareerSync)
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(28, 111, 169); // #1C6FA9
      doc.text('CAREERSYNC', logoX, yPos, { align: 'center' });
      yPos += 8;

      // Date
      yPos += 5;
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(122, 134, 153); // #7A8699
      doc.text(certificate.date || 'N/A', padding + 5, yPos);
      yPos += 8;

      // Student Name
      yPos += 8;
      doc.setFontSize(36);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(11, 19, 43); // #0B132B
      const studentName = certificate.name && certificate.name !== 'Student' ? certificate.name : 'Student';
      doc.text(studentName, logoX, yPos, { align: 'center', maxWidth: leftSectionWidth - 20 });
      yPos += 15;

      // Description
      doc.setFontSize(15);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(79, 93, 117); // #4F5D75
      doc.text('has successfully completed', logoX, yPos, { align: 'center' });
      yPos += 12;

      // Program Title
      doc.setFontSize(22);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(11, 19, 43); // #0B132B
      const programTitle = certificate.title && certificate.title !== 'Shadowing Program' ? certificate.title : 'Shadowing Program';
      doc.text(programTitle, logoX, yPos, { align: 'center', maxWidth: leftSectionWidth - 20 });
      yPos += 12;

      // Small Text
      doc.setFontSize(14);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(107, 122, 144); // #6B7A90
      const durationText = certificate.duration && certificate.duration !== 'N/A' ? ` (${certificate.duration})` : '';
      const smallText = `a job shadowing program from ${certificate.organization || 'CareerSync'}${durationText}`;
      doc.text(smallText, logoX, yPos, { align: 'center', maxWidth: leftSectionWidth - 20 });

      // Signature Section (at bottom of left section)
      const signatureY = pageHeight - 50;
      doc.setDrawColor(230, 237, 245); // #E6EDF5
      doc.setLineWidth(0.5);
      const signatureWidth = leftSectionWidth * 0.55;
      doc.line(padding + 5, signatureY, padding + 5 + signatureWidth, signatureY);
      
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(11, 19, 43); // #0B132B
      const mentorName = certificate.mentorName || 'Mentor';
      doc.text(mentorName, padding + 5 + signatureWidth / 2, signatureY + 6, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(122, 134, 153); // #7A8699
      doc.text('Mentor, CareerSync', padding + 5 + signatureWidth / 2, signatureY + 12, { align: 'center' });

      // Verification Section (right side of left section)
      const verifyY = pageHeight - 50;
      const verifyX = leftSectionWidth - 30;
      doc.setFontSize(10);
      doc.setTextColor(122, 134, 153); // #7A8699
      doc.text('Verify at:', verifyX, verifyY, { align: 'right' });
      
      const certNumber = certificate.verifyId || certificate.id || 'N/A';
      doc.setFontSize(10);
      doc.setTextColor(28, 111, 169); // #1C6FA9
      doc.text(`careersync.com/verify/${certNumber}`, verifyX, verifyY + 5, { align: 'right' });
      
      doc.setFontSize(10);
      doc.setTextColor(122, 134, 153); // #7A8699
      doc.text('CareerSync has confirmed the identity', verifyX, verifyY + 12, { align: 'right' });
      doc.text('of this individual and their participation', verifyX, verifyY + 17, { align: 'right' });
      doc.text('in the program.', verifyX, verifyY + 22, { align: 'right' });

      // RIGHT RIBBON
      const ribbonX = leftSectionWidth;
      const ribbonHeight = pageHeight;
      
      // Gradient effect (simulated with two colors)
      // Top part - lighter blue
      doc.setFillColor(47, 168, 219); // #2FA8DB
      doc.rect(ribbonX, 0, rightRibbonWidth, ribbonHeight / 2, 'F');
      
      // Bottom part - darker blue
      doc.setFillColor(28, 111, 169); // #1C6FA9
      doc.rect(ribbonX, ribbonHeight / 2, rightRibbonWidth, ribbonHeight / 2, 'F');
      
      // Create angled bottom effect - draw darker section at bottom
      // The gradient and angled bottom create the visual effect
      const clipY = ribbonHeight * 0.8;
      doc.setFillColor(28, 111, 169);
      // Draw bottom section (will appear as angled due to gradient transition)
      doc.rect(ribbonX, clipY, rightRibbonWidth, ribbonHeight - clipY, 'F');

      // Ribbon Title
      const ribbonCenterX = ribbonX + rightRibbonWidth / 2;
      let ribbonY = 40;
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('JOB SHADOWING', ribbonCenterX, ribbonY, { align: 'center' });
      ribbonY += 8;
      doc.setFontSize(18);
      doc.text('CERTIFICATE', ribbonCenterX, ribbonY, { align: 'center' });

      // Seal/Circle (centered in ribbon)
      const sealX = ribbonCenterX;
      const sealY = pageHeight - 80;
      const sealRadius = 20;
      
      // White circle with black border
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(3);
      doc.circle(sealX, sealY, sealRadius, 'FD');
      
      // Seal text
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text('EDUCATION', sealX, sealY - 8, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(47, 168, 219); // #2FA8DB
      doc.text('CAREERSYNC', sealX, sealY, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text('JOB SHADOWING', sealX, sealY + 8, { align: 'center' });
      doc.text('CERTIFICATE', sealX, sealY + 12, { align: 'center' });

      // Save the PDF
      const programName = certificate.title || 'Shadowing-Program';
      const fileName = `Certificate-${programName.replace(/\s+/g, '-')}-${certNumber.substring(0, 8)}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Error downloading certificate:", error);
      alert("Failed to download certificate. Please try again.");
    }
  };

  return (
    <Overlay onClick={onClose}>
      <CertificateWrapper onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 1500,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 1)',
            },
          }}
        >
          <CloseIcon />
        </IconButton>

        {/* Download Button */}
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
          sx={{
            position: 'absolute',
            top: 16,
            right: 70,
            zIndex: 1500,
            backgroundColor: '#1976d2',
            '&:hover': {
              backgroundColor: '#1565c0',
            },
          }}
        >
          Download
        </Button>

        {/* LEFT */}
        <LeftSection>
          <Header>
            <Box
              component="img"
              src="/logo/careersyncLogo.svg"
              alt="CareerSync"
              sx={{ height: 40 }}
            />
          </Header>

          <DateText>{certificate.date || 'N/A'}</DateText>

          <Name>{certificate.name && certificate.name !== 'Student' ? certificate.name : 'Student'}</Name>

          <Description>has successfully completed</Description>

          <ProgramTitle>{certificate.title && certificate.title !== 'Shadowing Program' ? certificate.title : 'Shadowing Program'}</ProgramTitle>

          <SmallText>
            a job shadowing program from {certificate.organization || 'CareerSync'}
            {certificate.duration && certificate.duration !== 'N/A' ? ` (${certificate.duration})` : ''}
          </SmallText>

          <Footer>
            <Signature>
              {certificate.mentorName || 'Mentor'}
              <span>Mentor, CareerSync</span>
            </Signature>
          </Footer>
          <Verify>
            Verify at:
            <a href={`#verify/${certificate.verifyId || certificate.id || ''}`}>
              careersync.com/verify/{certificate.verifyId || certificate.id || 'N/A'}
            </a>
            CareerSync has confirmed the identity of this individual and<br></br>their participation in the program.
          </Verify>
        </LeftSection>

        {/* RIGHT */}
        <RightRibbon>
          <RibbonTitle>
            JOB SHADOWING
            <strong>CERTIFICATE</strong>
          </RibbonTitle>

          <Seal>
            <span>EDUCATION FOR EVERYONE</span>
            <strong>CAREERSYNC</strong>
            <span>JOB SHADOWING CERTIFICATE</span>
          </Seal>
        </RightRibbon>
      </CertificateWrapper>
    </Overlay>
  );
}








