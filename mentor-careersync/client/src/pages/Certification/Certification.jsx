import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Grid,
  Chip,
  IconButton,
} from "@mui/material";
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  FilterList as FilterListIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon,
  Share as ShareIcon,
  Person as PersonIcon,
  AccountCircle as AccountCircleIcon,
  ContentCopy as CopyIcon,
  AccessTime as AccessTimeIcon,
} from "@mui/icons-material";
import { CertificationStyles } from "./Certification.styles";
import { getMyCertificates } from "../../services/bookingApi";
import { CircularProgress, Alert } from "@mui/material";
import CertificatePreview from "../../components/CertificatePreview/CertificatePreview";

function Certification() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getMyCertificates();
        
        // Format certificates for display
        const formattedCertificates = data.map((cert) => {
          const booking = cert.Booking;
          const position = cert.Position;
          const student = cert.AccUser;
          const mentor = cert.Mentor;
          
          // Get position name from position or booking snapshot
          const programName = position?.position_name || booking?.position_name_snapshot || "Shadowing Program";
          
          // Get mentor name from the certificate's Mentor association
          const mentorName = mentor 
            ? `${mentor.first_name || ''} ${mentor.last_name || ''}`.trim()
            : "Mentor";
          
          // Get student name from AccUser or booking snapshot
          const studentName = student 
            ? `${student.first_name || ''} ${student.last_name || ''}`.trim()
            : booking?.acc_user_name_snapshot || "Student";
          
          // Generate student ID
          const studentId = student?.id 
            ? `U${student.id.substring(0, 4).toUpperCase()}`
            : "U0000";
          
          // Format dates
          const startDate = booking?.start_date_snapshot 
            ? new Date(booking.start_date_snapshot).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
            : cert.issue_date 
            ? new Date(cert.issue_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
            : "N/A";
          
          const endDate = booking?.end_date_snapshot
            ? new Date(booking.end_date_snapshot).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
            : cert.issue_date
            ? new Date(cert.issue_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
            : "N/A";
          
          // Calculate duration
          let duration = "N/A";
          if (booking?.start_date_snapshot && booking?.end_date_snapshot) {
            const start = new Date(booking.start_date_snapshot);
            const end = new Date(booking.end_date_snapshot);
            const durationMs = end - start;
            const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
            const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
            
            if (durationHours > 0) {
              duration = `${durationHours} hour${durationHours > 1 ? 's' : ''}`;
              if (durationMinutes > 0) {
                duration += ` ${durationMinutes} min${durationMinutes > 1 ? 's' : ''}`;
              }
            } else {
              duration = `${durationMinutes} min${durationMinutes > 1 ? 's' : ''}`;
            }
          }
          
          return {
            id: cert.id,
            certificateNumber: cert.certificate_number,
            programName,
            mentorName,
            studentName,
            studentId,
            startDate,
            endDate,
            duration,
            status: "Completed",
            issueDate: cert.issue_date ? new Date(cert.issue_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "N/A",
            rawCertificate: cert
          };
        });
        
        setCertificates(formattedCertificates);
      } catch (err) {
        console.error('Error fetching certificates:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load certificates');
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, []);

  // Format date for certificate display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  // Calculate hours from duration string
  const parseDuration = (durationStr) => {
    if (!durationStr || durationStr === 'N/A') return 'N/A';
    return durationStr;
  };

  const handleView = (certificate) => {
    // Format certificate data to match CertificatePreview component expectations
    const formattedCert = {
      date: formatDate(certificate.issueDate || certificate.rawCertificate?.issue_date),
      name: certificate.studentName,
      title: certificate.programName,
      organization: 'CareerSync',
      duration: parseDuration(certificate.duration),
      mentorName: certificate.mentorName,
      verifyId: certificate.certificateNumber || certificate.rawCertificate?.certificate_number || certificate.id
    };
    setSelectedCertificate(formattedCert);
    setPreviewOpen(true);
  };

  const handleDownload = (certificate) => {
    console.log("Download certificate:", certificate);
  };

  const handleShare = (certificate) => {
    console.log("Share certificate:", certificate);
  };

  return (
    <Box sx={CertificationStyles.container}>
      <Card sx={CertificationStyles.toolbarCard}>
        <CardContent sx={CertificationStyles.toolbarCardContent}>
          <Box sx={CertificationStyles.header}>
            <Typography variant="h6" sx={CertificationStyles.title}>
              All Certificates
            </Typography>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              sx={CertificationStyles.downloadAllButton}
            >
              Download All
            </Button>
          </Box>

          <Box sx={CertificationStyles.toolbar}>
            <TextField
              placeholder="Search users..."
              size="small"
              sx={CertificationStyles.searchField}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={CertificationStyles.searchIcon} />
                  </InputAdornment>
                ),
              }}
            />
            <Box sx={CertificationStyles.headerActions}>
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                sx={CertificationStyles.actionButton}
              >
                Export
              </Button>
              <Button
                variant="outlined"
                startIcon={<CalendarIcon />}
                sx={CertificationStyles.actionButton}
              >
                Date Range
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Box sx={CertificationStyles.stats}>
        <Typography variant="body1" sx={CertificationStyles.statsText}>
          Total {certificates.length} certificate{certificates.length !== 1 ? 's' : ''}
        </Typography>
        <Box sx={CertificationStyles.activityContainer}>
          <AccessTimeIcon sx={CertificationStyles.activityIcon} />
          <Typography variant="body2" sx={CertificationStyles.activityText}>
            Recent Activity
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : certificates.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <Typography variant="body1">No certificates issued yet</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Certificates will appear here when you complete bookings and mark them as completed.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {certificates.map((certificate) => (
          <Grid item xs={12} sm={6} key={certificate.id}>
            <Card sx={CertificationStyles.certificateCard}>
              <CardContent sx={CertificationStyles.cardContent}>
                <Box sx={CertificationStyles.cardTopRow}>
                  <Box sx={CertificationStyles.cardTopLeft}>
                    <Box sx={CertificationStyles.checkCircle}>
                      <CheckCircleIcon sx={CertificationStyles.checkIcon} />
                    </Box>
                    <Box>
                      <Typography
                        variant="body1"
                        sx={CertificationStyles.programName}
                      >
                        {certificate.programName}
                      </Typography>
                      <Box sx={CertificationStyles.mentorRow}>
                        <PersonIcon sx={CertificationStyles.mentorIcon} />
                        <Typography sx={CertificationStyles.mentorName}>
                          {certificate.mentorName}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Chip
                    label={certificate.status}
                    size="small"
                    sx={CertificationStyles.statusChip}
                  />
                </Box>

                <Box sx={CertificationStyles.studentRow}>
                  <Box sx={CertificationStyles.studentLeft}>
                    <Box sx={CertificationStyles.studentAvatar}>
                      <AccountCircleIcon
                        sx={CertificationStyles.studentAvatarIcon}
                      />
                    </Box>
                    <Box>
                      <Typography sx={CertificationStyles.studentLabel}>
                        Student
                      </Typography>
                      <Typography sx={CertificationStyles.studentName}>
                        {certificate.studentName}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={CertificationStyles.studentRight}>
                    <Typography sx={CertificationStyles.studentIdLabel}>
                      ID
                    </Typography>
                    <Typography sx={CertificationStyles.studentIdValue}>
                      {certificate.studentId}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={CertificationStyles.dateRow}>
                  <Box sx={CertificationStyles.dateItem}>
                    <CalendarIcon sx={CertificationStyles.dateIcon} />
                    <Box>
                      <Typography sx={CertificationStyles.dateLabel}>
                        Start
                      </Typography>
                      <Typography sx={CertificationStyles.dateValue}>
                        {certificate.startDate}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={CertificationStyles.dateItem}>
                    <CalendarIcon sx={CertificationStyles.dateIcon} />
                    <Box>
                      <Typography sx={CertificationStyles.dateLabel}>
                        End
                      </Typography>
                      <Typography sx={CertificationStyles.dateValue}>
                        {certificate.endDate}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={CertificationStyles.durationItem}>
                    <Typography sx={CertificationStyles.dateLabel}>
                      Duration
                    </Typography>
                    <Typography sx={CertificationStyles.dateValue}>
                      {certificate.duration}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={CertificationStyles.cardActions}>
                  <Button
                    variant="contained"
                    startIcon={<VisibilityIcon />}
                    onClick={() => handleView(certificate)}
                    sx={CertificationStyles.viewButton}
                  >
                    View
                  </Button>
                  <IconButton
                    onClick={() => handleDownload(certificate)}
                    sx={CertificationStyles.iconButton}
                  >
                    <DownloadIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleShare(certificate)}
                    sx={CertificationStyles.iconButton}
                  >
                    <ShareIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
        </Grid>
      )}

      <CertificatePreview
        open={previewOpen}
        certificate={selectedCertificate}
        onClose={() => {
          setPreviewOpen(false);
          setSelectedCertificate(null);
        }}
      />
    </Box>
  );
}

export default Certification;
