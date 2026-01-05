import React, { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Button,
  IconButton,
  Divider,
} from '@mui/material'
import {
  Business as BusinessIcon,
  Work as WorkIcon,
  People as PeopleIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationOnIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LinkedIn as LinkedInIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material'
import UpdateScheduleModal from '../../components/Modals/UpdateScheduleModal'
import UpdateContactModal from '../../components/Modals/UpdateContactModal'
import SessionAgendaModal from '../../components/Modals/SessionAgendaModal'
import { OverallScheduleStyles } from './OverallSchedule.styles'
import { getMySessions, formatSessionForDisplay } from '../../api/sessionApi'

const mentorData = {
  name: 'Sarah Chen',
  title: 'Senior Software Engineer',
  company: 'Google',
  experience: '12 years of experience',
  sessions: '127 mentoring sessions',
  image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
  about:
    'Passionate software engineer with over a decade of experience building scalable systems at Google. I specialize in distributed systems, cloud architecture, and machine learning applications. I love mentoring junior developers and helping them navigate their career paths in tech.',
  expertise: ['Software Architecture', 'Cloud Computing', 'AI/ML', 'System Design'],
  education: [
    {
      degree: 'M.S. Computer Science',
      year: '2012',
      university: 'Stanford University',
    },
    {
      degree: 'B.S. Computer Engineering',
      year: '2010',
      university: 'MIT',
    },
  ],
  sessionDetails: {
    rate: 10,
    duration: '60 min',
    availability: ['Tuesday: 2pm - 6pm', 'Thursday: 2pm - 6pm', 'Saturday: 10am - 2pm'],
    location: 'Starbucks Reserve Roastery, Seattle',
  },
  contact: {
    email: 'sarah.chen@techcorp.com',
    phone: '+1 (555) 123-4567',
    linkedin: 'LinkedIn',
    portfolio: 'CV / Portfolio',
  },
}

function OverallSchedule({ initialModal = null }) {
  const [scheduleModalOpen, setScheduleModalOpen] = useState(initialModal === 'schedule')
  const [contactModalOpen, setContactModalOpen] = useState(initialModal === 'contact')
  const [agendaModalOpen, setAgendaModalOpen] = useState(initialModal === 'agenda')
  const [agendaPdfUrl, setAgendaPdfUrl] = useState(null)

  // Fetch sessions to get agenda PDF
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const result = await getMySessions()
        if (result.success && result.data && result.data.length > 0) {
          // Find first session with agenda PDF
          const sessionWithAgenda = result.data.find(s => s.agenda_pdf)
          if (sessionWithAgenda) {
            const formattedSession = formatSessionForDisplay(sessionWithAgenda)
            setAgendaPdfUrl(formattedSession.agendaPdf || null)
          }
        }
      } catch (err) {
        // Silently handle error
      }
    }
    fetchSessions()
  }, [])

  return (
    <Box sx={OverallScheduleStyles.container}>
      <Grid container spacing={3}>
        {/* Main Content - Left Side */}
        <Grid item xs={12} md={8}>
          {/* Profile Card */}
          <Card sx={OverallScheduleStyles.card}>
            <CardContent>
              <Box sx={OverallScheduleStyles.profileHeader}>
                <Avatar
                  src={mentorData.image}
                  alt={mentorData.name}
                  sx={OverallScheduleStyles.avatar}
                />
                <Box sx={OverallScheduleStyles.profileInfo}>
                  <Typography variant="h4" sx={OverallScheduleStyles.name}>
                    {mentorData.name}
                  </Typography>
                  <Typography variant="h6" sx={OverallScheduleStyles.title}>
                    {mentorData.title}
                  </Typography>
                  <Box sx={OverallScheduleStyles.metaInfo}>
                    <Box sx={OverallScheduleStyles.metaItem}>
                      <BusinessIcon sx={OverallScheduleStyles.metaIcon} />
                      <Typography variant="body2">{mentorData.company}</Typography>
                    </Box>
                    <Box sx={OverallScheduleStyles.metaItem}>
                      <WorkIcon sx={OverallScheduleStyles.metaIcon} />
                      <Typography variant="body2">{mentorData.experience}</Typography>
                    </Box>
                    <Box sx={OverallScheduleStyles.metaItem}>
                      <PeopleIcon sx={OverallScheduleStyles.metaIcon} />
                      <Typography variant="body2">{mentorData.sessions}</Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* About Section */}
              <Box sx={OverallScheduleStyles.section}>
                <Typography variant="h6" sx={OverallScheduleStyles.sectionTitle}>
                  About
                </Typography>
                <Typography variant="body1" sx={OverallScheduleStyles.aboutText}>
                  {mentorData.about}
                </Typography>
              </Box>

              {/* Expertise Section */}
              <Box sx={OverallScheduleStyles.section}>
                <Typography variant="h6" sx={OverallScheduleStyles.sectionTitle}>
                  Expertise
                </Typography>
                <Box sx={OverallScheduleStyles.expertiseContainer}>
                  {mentorData.expertise.map((skill) => (
                    <Chip
                      key={skill}
                      label={skill}
                      sx={OverallScheduleStyles.expertiseChip}
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>

              {/* Education Section */}
              <Box sx={OverallScheduleStyles.section}>
                <Typography variant="h6" sx={OverallScheduleStyles.sectionTitle}>
                  Education
                </Typography>
                <Box sx={OverallScheduleStyles.educationTimeline}>
                  {mentorData.education.map((edu, index) => (
                    <Box key={index} sx={OverallScheduleStyles.educationItem}>
                      <Box sx={OverallScheduleStyles.timelineDot} />
                      <Box sx={OverallScheduleStyles.educationContent}>
                        <Typography variant="subtitle1" sx={OverallScheduleStyles.educationDegree}>
                          {edu.degree} • {edu.year}
                        </Typography>
                        <Typography variant="body2" sx={OverallScheduleStyles.educationUniversity}>
                          {edu.university}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Book a Session Card */}
          <Card sx={OverallScheduleStyles.card}>
            <CardContent>
              <Box sx={OverallScheduleStyles.cardHeader}>
                <Box sx={OverallScheduleStyles.cardHeaderLeft}>
                  <CalendarIcon sx={OverallScheduleStyles.cardIcon} />
                  <Typography variant="h6" sx={OverallScheduleStyles.cardTitle}>
                    Book a Session
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => setScheduleModalOpen(true)}
                  sx={OverallScheduleStyles.updateButton}
                >
                  Update
                </Button>
              </Box>

              <Box sx={OverallScheduleStyles.sessionInfo}>
                <Typography variant="body2" sx={OverallScheduleStyles.sessionLabel}>
                  Session Rate: <strong>${mentorData.sessionDetails.rate}</strong>
                </Typography>
                <Typography variant="body2" sx={OverallScheduleStyles.sessionLabel}>
                  Duration: <strong>{mentorData.sessionDetails.duration}</strong>
                </Typography>
              </Box>

              <Divider sx={OverallScheduleStyles.divider} />

              <Box sx={OverallScheduleStyles.availabilitySection}>
                <Typography variant="subtitle2" sx={OverallScheduleStyles.availabilityTitle}>
                  Availability:
                </Typography>
                {mentorData.sessionDetails.availability.map((time, index) => (
                  <Typography key={index} variant="body2" sx={OverallScheduleStyles.availabilityItem}>
                    {time}
                  </Typography>
                ))}
              </Box>

              <Box sx={OverallScheduleStyles.locationSection}>
                <LocationOnIcon sx={OverallScheduleStyles.locationIcon} />
                <Typography variant="body2" sx={OverallScheduleStyles.locationText}>
                  {mentorData.sessionDetails.location}
                </Typography>
              </Box>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => setAgendaModalOpen(true)}
                sx={OverallScheduleStyles.agendaButton}
              >
                View Session Agenda
              </Button>

              <Button
                fullWidth
                variant="contained"
                sx={OverallScheduleStyles.uploadButton}
              >
                Upload Session
              </Button>
            </CardContent>
          </Card>

          {/* Contact Card */}
          <Card sx={OverallScheduleStyles.card}>
            <CardContent>
              <Box sx={OverallScheduleStyles.cardHeader}>
                <Typography variant="h6" sx={OverallScheduleStyles.cardTitle}>
                  Contact
                </Typography>
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => setContactModalOpen(true)}
                  sx={OverallScheduleStyles.updateButton}
                >
                  Update
                </Button>
              </Box>

              <Box sx={OverallScheduleStyles.contactSection}>
                <Box sx={OverallScheduleStyles.contactItem}>
                  <EmailIcon sx={OverallScheduleStyles.contactIcon} />
                  <Typography variant="body2">{mentorData.contact.email}</Typography>
                </Box>
                <Box sx={OverallScheduleStyles.contactItem}>
                  <PhoneIcon sx={OverallScheduleStyles.contactIcon} />
                  <Typography variant="body2">{mentorData.contact.phone}</Typography>
                </Box>
                <Box sx={OverallScheduleStyles.contactItem}>
                  <LinkedInIcon sx={OverallScheduleStyles.contactIcon} />
                  <Typography
                    variant="body2"
                    component="a"
                    href="#"
                    sx={OverallScheduleStyles.contactLink}
                  >
                    {mentorData.contact.linkedin}
                  </Typography>
                </Box>
                <Box sx={OverallScheduleStyles.contactItem}>
                  <DescriptionIcon sx={OverallScheduleStyles.contactIcon} />
                  <Typography
                    variant="body2"
                    component="a"
                    href="#"
                    sx={OverallScheduleStyles.contactLink}
                  >
                    {mentorData.contact.portfolio}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Modals */}
      <UpdateScheduleModal
        open={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
      />
      <UpdateContactModal
        open={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
      />
      <SessionAgendaModal
        open={agendaModalOpen}
        onClose={() => setAgendaModalOpen(false)}
        agendaPdfUrl={agendaPdfUrl}
      />
    </Box>
  )
}

export default OverallSchedule

