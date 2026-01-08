import { useState, useEffect } from "react";
import { useAtom, useSetAtom, useAtomValue } from "jotai";
import {
  certificatesAtom,
  certificatesLoadingAtom,
  certificatesErrorAtom,
  fetchCertificatesAtom,
} from "../../../atoms/userAtoms";
import {
  PageContainer,
  Title,
  Subtitle,
  CardsGrid,
} from "./CertificatesPage.styles";
import { CircularProgress, Alert, Box } from "@mui/material";
import AccountTabs from "../../../components/AccountTabs/AccountTabs";
import CertificateCard from "../../../components/CertificateCard/CertificateCard";
import CertificatePreview from "../../../components/CertificatePreview/CertificatePreview";
import jsPDF from "jspdf";

export default function CertificatesPage() {
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  // Jotai atoms
  const [certificates] = useAtom(certificatesAtom);
  const loading = useAtomValue(certificatesLoadingAtom);
  const error = useAtomValue(certificatesErrorAtom);
  const fetchCertificates = useSetAtom(fetchCertificatesAtom);

  // Fetch certificates on mount
  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Calculate hours completed from booking start/end times
  const calculateHours = (certificate) => {
    if (!certificate) return 'N/A';
    
    const booking = certificate.Booking || certificate.booking;
    if (!booking) return 'N/A';
    
    // Handle both snake_case and camelCase
    const startTime = booking.start_date_snapshot || booking.startDateSnapshot;
    const endTime = booking.end_date_snapshot || booking.endDateSnapshot;
    
    if (!startTime || !endTime) return 'N/A';
    
    try {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const diffMs = end - start;
      const diffHours = diffMs / (1000 * 60 * 60);
      
      if (diffHours < 1) {
        const minutes = Math.floor(diffMs / (1000 * 60));
        return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
      } else {
        const hours = Math.floor(diffHours);
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        if (minutes > 0) {
          return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
        }
        return `${hours} hour${hours !== 1 ? 's' : ''}`;
      }
    } catch {
      return 'N/A';
    }
  };

  // Get student name from certificate data
  const getStudentName = (certificate) => {
    if (!certificate) return 'Student';
    
    const booking = certificate.Booking || certificate.booking;
    
    // Try booking snapshot first (handle both snake_case and camelCase)
    if (booking) {
      const name = booking.acc_user_name_snapshot || booking.accUserNameSnapshot;
      if (name) return name;
    }
    
    // Try AccUser association (handle both snake_case and camelCase)
    const accUser = certificate.AccUser || certificate.accUser;
    if (accUser) {
      const firstName = accUser.first_name || accUser.firstName || '';
      const lastName = accUser.last_name || accUser.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();
      if (fullName) return fullName;
    }
    
    return 'Student';
  };

  // Get program name from certificate data
  const getProgramName = (certificate) => {
    if (!certificate) return 'Shadowing Program';
    
    const booking = certificate.Booking || certificate.booking;
    
    // Try booking snapshot first (handle both snake_case and camelCase)
    if (booking) {
      const name = booking.position_name_snapshot || booking.positionNameSnapshot;
      if (name) return name;
    }
    
    // Try Position association (handle both snake_case and camelCase)
    const position = certificate.Position || certificate.position;
    if (position) {
      const name = position.position_name || position.positionName;
      if (name) return name;
    }
    
    return 'Shadowing Program';
  };

  // Get mentor name from certificate data
  const getMentorName = (certificate) => {
    if (!certificate) return 'Mentor';
    
    // Try Mentor association first (handle both snake_case and camelCase)
    const mentor = certificate.Mentor || certificate.mentor || certificate.Issuer || certificate.issuer;
    if (mentor) {
      const firstName = mentor.first_name || mentor.firstName || '';
      const lastName = mentor.last_name || mentor.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();
      if (fullName) return fullName;
    }
    
    // Try booking snapshot (handle both snake_case and camelCase)
    const booking = certificate.Booking || certificate.booking;
    if (booking) {
      const name = booking.mentor_name_snapshot || booking.mentorNameSnapshot;
      if (name) return name;
    }
    
    return 'Mentor';
  };

  // Download certificate as PDF
  const handleDownloadCertificate = (certificate) => {
    try {
      const studentName = getStudentName(certificate);
      const programName = getProgramName(certificate);
      const hours = calculateHours(certificate);
      const mentorName = getMentorName(certificate);
      const issueDate = formatDate(certificate.issue_date || certificate.issueDate || certificate.createdAt);
      const certificateNumber = certificate.certificate_number || certificate.certificateNumber || certificate.id;
      const verifyId = certificateNumber;

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
      const leftSectionWidth = pageWidth * 0.71;
      const rightRibbonWidth = pageWidth * 0.29;
      const padding = 15;

      // LEFT SECTION
      const logoX = leftSectionWidth / 2;
      let yPos = padding + 10;

      // Logo text
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
      doc.text(issueDate, padding + 5, yPos);
      yPos += 8;

      // Student Name
      yPos += 8;
      doc.setFontSize(36);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(11, 19, 43); // #0B132B
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
      doc.text(programName, logoX, yPos, { align: 'center', maxWidth: leftSectionWidth - 20 });
      yPos += 12;

      // Small Text
      doc.setFontSize(14);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(107, 122, 144); // #6B7A90
      const durationText = hours && hours !== 'N/A' ? ` (${hours})` : '';
      const smallText = `a job shadowing program from CareerSync${durationText}`;
      doc.text(smallText, logoX, yPos, { align: 'center', maxWidth: leftSectionWidth - 20 });

      // Signature Section
      const signatureY = pageHeight - 50;
      doc.setDrawColor(230, 237, 245); // #E6EDF5
      doc.setLineWidth(0.5);
      const signatureWidth = leftSectionWidth * 0.55;
      doc.line(padding + 5, signatureY, padding + 5 + signatureWidth, signatureY);
      
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(11, 19, 43); // #0B132B
      doc.text(mentorName, padding + 5 + signatureWidth / 2, signatureY + 6, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(122, 134, 153); // #7A8699
      doc.text('Mentor, CareerSync', padding + 5 + signatureWidth / 2, signatureY + 12, { align: 'center' });

      // Verification Section
      const verifyY = pageHeight - 50;
      const verifyX = leftSectionWidth - 30;
      doc.setFontSize(10);
      doc.setTextColor(122, 134, 153); // #7A8699
      doc.text('Verify at:', verifyX, verifyY, { align: 'right' });
      
      doc.setFontSize(10);
      doc.setTextColor(28, 111, 169); // #1C6FA9
      doc.text(`careersync.com/verify/${verifyId}`, verifyX, verifyY + 5, { align: 'right' });
      
      doc.setFontSize(10);
      doc.setTextColor(122, 134, 153); // #7A8699
      doc.text('CareerSync has confirmed the identity', verifyX, verifyY + 12, { align: 'right' });
      doc.text('of this individual and their participation', verifyX, verifyY + 17, { align: 'right' });
      doc.text('in the program.', verifyX, verifyY + 22, { align: 'right' });

      // RIGHT RIBBON
      const ribbonX = leftSectionWidth;
      const ribbonHeight = pageHeight;
      
      // Gradient effect
      doc.setFillColor(47, 168, 219); // #2FA8DB
      doc.rect(ribbonX, 0, rightRibbonWidth, ribbonHeight / 2, 'F');
      
      doc.setFillColor(28, 111, 169); // #1C6FA9
      doc.rect(ribbonX, ribbonHeight / 2, rightRibbonWidth, ribbonHeight / 2, 'F');
      
      // Angled bottom effect - draw darker section at bottom
      const clipY = ribbonHeight * 0.8;
      doc.setFillColor(28, 111, 169);
      // Draw bottom section
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

      // Seal/Circle
      const sealX = ribbonCenterX;
      const sealY = pageHeight - 80;
      const sealRadius = 20;
      
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(3);
      doc.circle(sealX, sealY, sealRadius, 'FD');
      
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
      const fileName = `Certificate-${programName.replace(/\s+/g, '-')}-${certificateNumber.substring(0, 8)}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Error downloading certificate:", error);
      alert("Failed to download certificate. Please try again.");
    }
  };

  if (loading && certificates.length === 0) {
    return (
      <PageContainer>
        <AccountTabs />
        <Box sx={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <AccountTabs />

      <Title>Your Certificates</Title>
      <Subtitle>
        Certificates earned from completed shadowing sessions
      </Subtitle>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {certificates.length === 0 ? (
        <Box sx={{ padding: 3, textAlign: 'center', color: '#666' }}>
          No certificates yet. Complete shadowing sessions to earn certificates.
        </Box>
      ) : (
        <CardsGrid>
          {certificates.map((certificate) => (
            <CertificateCard
              key={certificate.id}
              title={getProgramName(certificate)}
              mentor={getMentorName(certificate)}
              date={formatDate(certificate.issue_date || certificate.createdAt)}
              onView={() => setSelectedCertificate(certificate)}
              onDownload={() => handleDownloadCertificate(certificate)}
            />
          ))}
        </CardsGrid>
      )}

      <CertificatePreview
        open={!!selectedCertificate}
        certificate={selectedCertificate ? (() => {
          // Extract all data
          const studentName = getStudentName(selectedCertificate);
          const programName = getProgramName(selectedCertificate);
          const hours = calculateHours(selectedCertificate);
          const mentorName = getMentorName(selectedCertificate);
          const issueDate = selectedCertificate.issue_date || selectedCertificate.issueDate || selectedCertificate.createdAt;
          
          // Debug log (can be removed later)
          if (studentName === 'Student' || programName === 'Shadowing Program') {
            console.log('CAREERSYNC PLATFORM CREATING BY 4BE AT ABOVE AND BEYONG SCHOOL');
            console.log('CAREERSYNC PLATFORM CREATING BY 4BE AT ABOVE AND BEYONG SCHOOL');
            console.log('CAREERSYNC PLATFORM CREATING BY 4BE AT ABOVE AND BEYONG SCHOOL');
            console.log('CAREERSYNC PLATFORM CREATING BY 4BE AT ABOVE AND BEYONG SCHOOL');
          }
          
          return {
            date: formatDate(issueDate),
            name: studentName,
            title: programName,
            organization: 'CareerSync',
            duration: hours,
            mentorName: mentorName,
            verifyId: selectedCertificate.certificate_number || selectedCertificate.certificateNumber || selectedCertificate.id
          };
        })() : null}
        onClose={() => setSelectedCertificate(null)}
      />
    </PageContainer>
  );
}
