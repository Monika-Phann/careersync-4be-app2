import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowBack, Star, SchoolOutlined, PlayArrow, CalendarToday, AccessTime, LocationOn, Description, Business, WorkspacePremium, CheckCircle, Email, Phone, LinkedIn, InsertDriveFile } from "@mui/icons-material";
import { Avatar, Button, Typography, Divider, Box, Alert, CircularProgress, TextField, MenuItem, Select, FormControl, Dialog, DialogTitle, DialogContent, IconButton } from "@mui/material";
import { Close as CloseIcon, OpenInNew as OpenInNewIcon } from "@mui/icons-material";
import { getMentorById } from "../../services/mentorService";
import { getAvailableSessions } from "../../services/sessionService";

import { 
  Container, 
  BackButton, 
  ProfileHeader, 
  HeaderTextWrapper,
  ContentLayout,
  MainContent, 
  Sidebar, 
  BioSection, 
  ExpertiseTag, 
  BookingCard,
  PriceTag
} from "./MentorDetails.styles";
import RequestBookingModal from "./RequestBookingModal";

export default function MentorDetails() {
  const { id } = useParams(); // mentorId (UUID in DB)
  const navigate = useNavigate();
  const [bookingOpen, setBookingOpen] = useState(false);

  const [mentor, setMentor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [sessions, setSessions] = useState([]); // Store sessions for agenda
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [selectedSlotMeetingLocation, setSelectedSlotMeetingLocation] = useState("");
  const [selectedSlotDuration, setSelectedSlotDuration] = useState("");
  const [agendaModalOpen, setAgendaModalOpen] = useState(false);

  useEffect(() => {
    const fetchMentor = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await getMentorById(id);
        if (!res?.success) throw new Error(res?.message || "Failed to load mentor");

        setMentor(res.data);
      } catch (e) {
        console.error("Failed to load mentor:", e);
        setError(e?.message || "Failed to load mentor.");
        setMentor(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchMentor();
  }, [id]);

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        if (!id) return;
        const res = await getAvailableSessions();
        if (!res?.success) throw new Error(res?.message || "Failed to load sessions");

        const sessions = Array.isArray(res.data) ? res.data : [];
        const mySessions = sessions.filter((s) => (s?.mentor_id || s?.Mentor?.id) === id);
        
        // Store sessions for agenda PDF access
        setSessions(mySessions);

        const nextSlots = [];

        const formatSlot = (timeslot, session) => {
          const start = new Date(timeslot.start_time);
          const end = new Date(timeslot.end_time);

          const day = start.toLocaleDateString(undefined, { weekday: "long" });
          const date = start.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" });
          const time = start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

          // Calculate duration in minutes
          const durationMinutes = Math.round((end - start) / (1000 * 60));
          
          // Convert minutes to hours and minutes format
          const hours = Math.floor(durationMinutes / 60);
          const minutes = durationMinutes % 60;
          let durationText = "";
          if (hours > 0 && minutes > 0) {
            durationText = `${hours}hr ${minutes}mins`;
          } else if (hours > 0) {
            durationText = `${hours}hr`;
          } else {
            durationText = `${minutes}mins`;
          }

          return {
            id: timeslot.id,
            schedule_timeslot_id: timeslot.id,
            start_time: timeslot.start_time,
            end_time: timeslot.end_time,
            // needed for booking POST /api/bookings
            mentor_id: session?.mentor_id || session?.Mentor?.id,
            session_id: session?.id,
            position_id: session?.position_id || session?.Position?.id,
            // used by modal UI
            day,
            date,
            time,
            // meeting location from session
            meeting_location: session?.location_name || "TBD",
            // duration in minutes and formatted text
            durationMinutes,
            durationText,
          };
        };

        mySessions.forEach((s) => {
          const ts = s?.ScheduleTimeslots;
          if (!Array.isArray(ts)) return;
          ts.forEach((t) => {
            if (t?.is_booked === false) {
              nextSlots.push(formatSlot(t, s));
            }
          });
        });

        // sort by start time ascending
        nextSlots.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
        setSlots(nextSlots);
      } catch (e) {
        console.error("Failed to load mentor slots:", e);
        setSlots([]);
      }
    };

    fetchSlots();
  }, [id]);

  const mentorDisplay = useMemo(() => {
    if (!mentor) return null;
    const firstName = mentor.first_name || "";
    const lastName = mentor.last_name || "";
    const name = `${firstName} ${lastName}`.trim() || "Mentor";

    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
    const apiOrigin = apiBase.replace(/\/api\/?$/, '');
    const avatar = mentor.profile_image ? `${apiOrigin}/uploads/${mentor.profile_image}` : null;
    const role = mentor.job_title || mentor.Position?.position_name || "Mentor";
    const company = mentor.company_name || "CareerSync";
    const bio = mentor.about_mentor || "No bio available.";

    const expertise = (() => {
      const val = mentor.expertise_areas;
      if (!val) return [];
      if (Array.isArray(val)) return val;
      if (typeof val === "string") {
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
        return val.split(",").map((s) => s.trim()).filter(Boolean);
      }
      return [];
    })();

    const educationText = Array.isArray(mentor.MentorEducations) && mentor.MentorEducations.length > 0
      ? mentor.MentorEducations
          .map((e) => `${e.degree_name || ""}${e.university_name ? ` • ${e.university_name}` : ""}${e.year_graduated ? ` • ${e.year_graduated}` : ""}`.trim())
          .filter(Boolean)
          .join(" | ")
      : "N/A";

    // Use mentor.session_rate as display price fallback (actual booking uses session price snapshot)
    const price = Number(mentor.session_rate) || 0;
    const experienceYears = mentor.experience_years || 0;
    const completedSessions = mentor.completed_sessions || 0;
    const email = mentor.User?.email || "";
    const phone = mentor.phone || "";
    const linkedIn = mentor.social_media || "";
    const portfolioPdf = mentor.portfolio_pdf || "";

    return { id: mentor.id, name, avatar, role, company, bio, expertise, educationText, price, experienceYears, completedSessions, email, phone, linkedIn, portfolioPdf };
  }, [mentor]);

  // Get the first available agenda PDF from mentor's sessions
  const mentorAgendaPdfUrl = useMemo(() => {
    if (!sessions || sessions.length === 0) return null;
    
    // Find first session with agenda_pdf
    const sessionWithAgenda = sessions.find(s => {
      const agendaPdf = s.agenda_pdf || s.Session?.agenda_pdf;
      return agendaPdf && agendaPdf.trim() !== '';
    });
    
    if (!sessionWithAgenda) return null;
    
    const agendaPdf = sessionWithAgenda.agenda_pdf || sessionWithAgenda.Session?.agenda_pdf;
    if (!agendaPdf) return null;
    
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
    const apiOrigin = apiBase.replace(/\/api\/?$/, '');
    
    // Handle both full URLs and filenames
    if (agendaPdf.startsWith('http')) {
      return agendaPdf;
    }
    
    return `${apiOrigin}/uploads/${agendaPdf}`;
  }, [sessions]);

  const isFullyBooked = (slots || []).length === 0;

  return (
    <Container>
      <BackButton onClick={() => navigate(-1)}>
        <ArrowBack fontSize="small" /> Back to Mentors
      </BackButton>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      )}
      {!loading && error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && mentorDisplay && (
        <>
          <ContentLayout>
        <MainContent>
          <BioSection sx={{ bgcolor: '#fff', p: 4, borderRadius: 3, mb: 3 }}>
            <Box display="flex" gap={3} mb={3}>
              <Avatar 
                src={mentorDisplay.avatar} 
                sx={{ 
                  width: 120, 
                  height: 120, 
                  borderRadius: 2,
                  flexShrink: 0
                }} 
              />
              <Box flex={1}>
                <Typography variant="h4" fontWeight={700} mb={0.5} color="#06112E">
                  {mentorDisplay.name}
                </Typography>
                <Typography variant="h6" color="text.secondary" mb={2}>
                  {mentorDisplay.role}
                </Typography>
                
                <Box display="flex" flexDirection="column" gap={1.5}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Business sx={{ fontSize: 20, color: '#6B7A90' }} />
                    <Typography variant="body2" color="text.secondary">
                      {mentorDisplay.company}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <WorkspacePremium sx={{ fontSize: 20, color: '#6B7A90' }} />
                    <Typography variant="body2" color="text.secondary">
                      {mentorDisplay.experienceYears || 0} years of experience
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CheckCircle sx={{ fontSize: 20, color: '#6B7A90' }} />
                    <Typography variant="body2" color="text.secondary">
                      {mentorDisplay.completedSessions || 0} mentoring sessions completed
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            <Box mb={3}>
              <Typography variant="h6" fontWeight={700} mb={1.5} color="#06112E">
                About
              </Typography>
              <Typography variant="body1" color="text.secondary" lineHeight={1.7}>
                {mentorDisplay.bio}
              </Typography>
            </Box>

            <Box>
              <Typography variant="h6" fontWeight={700} mb={1.5} color="#06112E">
                Expertise
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {(mentorDisplay.expertise || []).length > 0
                  ? (mentorDisplay.expertise || []).map(item => <ExpertiseTag key={item}>{item}</ExpertiseTag>)
                  : <Typography fontSize={14} color="text.secondary">No expertise listed.</Typography>
                }
              </Box>
            </Box>
          </BioSection>

          <BioSection sx={{ bgcolor: '#fff', p: 4, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={3} color="#06112E">
              Education
            </Typography>
            {Array.isArray(mentor?.MentorEducations) && mentor.MentorEducations.length > 0 ? (
              <Box sx={{ 
                position: 'relative',
                paddingLeft: '32px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: '8px',
                  top: '0',
                  bottom: '0',
                  width: '2px',
                  backgroundColor: '#030C2B',
                }
              }}>
                {/* Sort education: Bachelor's first, then Master's, then higher degrees */}
                {(() => {
                  const sortedEducation = [...mentor.MentorEducations].sort((a, b) => {
                    const getDegreeLevel = (degreeName) => {
                      if (!degreeName) return 999;
                      const degree = degreeName.toLowerCase();
                      if (degree.includes('bachelor') || degree.includes('b.s') || degree.includes('b.a') || degree.includes('b.eng') || degree.includes('bsc') || degree.includes('ba')) return 1;
                      if (degree.includes('master') || degree.includes('m.s') || degree.includes('m.a') || degree.includes('m.eng') || degree.includes('msc') || degree.includes('ma') || degree.includes('mba')) return 2;
                      if (degree.includes('phd') || degree.includes('doctorate') || degree.includes('d.phil')) return 3;
                      if (degree.includes('associate') || degree.includes('a.s') || degree.includes('aa')) return 0;
                      return 999;
                    };
                    return getDegreeLevel(a.degree_name) - getDegreeLevel(b.degree_name);
                  });
                  
                  return sortedEducation.map((edu, index) => (
                    <Box 
                      key={edu.id || index} 
                      sx={{ 
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'flex-start',
                        padding: 0,
                        marginBottom: 0,
                        minHeight: '48px',
                        width: '100%',
                      }}
                    >
                      {/* Timeline dot - matching mentor platform style */}
                      <Box
                        sx={{
                          position: 'absolute',
                          left: '-32px',
                          top: '0.35em',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          backgroundColor: '#E0E0E0',
                          border: 'none',
                          zIndex: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transform: 'translateY(-50%)',
                          '&::after': {
                            content: '""',
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: '#030C2B',
                          },
                        }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          variant="subtitle1" 
                          sx={{ 
                            fontWeight: 400,
                            color: '#666666',
                            fontSize: '14px',
                            lineHeight: 1.6,
                            marginBottom: '4px',
                          }}
                        >
                          {edu.degree_name || 'Degree'} • {edu.year_graduated || 'Year'}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#999999',
                            fontSize: '14px',
                            fontWeight: 400,
                          }}
                        >
                          {edu.university_name || 'Institution'}
                        </Typography>
                      </Box>
                    </Box>
                  ));
                })()}
              </Box>
            ) : (
              <Typography variant="body2" sx={{ color: '#6B7A90' }}>
                No education details available
              </Typography>
            )}
          </BioSection>
        </MainContent>

        <Sidebar>
          <BookingCard sx={{ bgcolor: '#E8F4FD', p: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={3}>
              <CalendarToday sx={{ color: '#06112E' }} />
              <Typography variant="h6" fontWeight={700} color="#06112E">Book a Session</Typography>
            </Box>

            <Box display="flex" justifyContent="space-between" mb={3}>
              <Box>
                <Typography variant="body2" color="text.secondary" mb={0.5}>Session Rate</Typography>
                <Typography variant="h4" fontWeight={700} sx={{ color: '#10b981' }}>
                  ${mentorDisplay.price}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" mb={0.5}>Duration</Typography>
                <Typography variant="body1" fontWeight={600} color="text.secondary">
                  {selectedSlotDuration || "Select time"}
                </Typography>
              </Box>
            </Box>

            <Box mb={3}>
              <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                <AccessTime sx={{ color: '#06112E', fontSize: 20 }} />
                <Typography variant="body2" fontWeight={600} color="#06112E">
                  Select Available Date & Time
                </Typography>
              </Box>
              <FormControl fullWidth>
                <Select
                  displayEmpty
                  value={selectedSlotId}
                  disabled={isFullyBooked}
                  onChange={(e) => {
                    const slotId = e.target.value;
                    setSelectedSlotId(slotId);
                    // Update meeting location and duration based on selected slot
                    if (slotId) {
                      const selectedSlot = slots.find(s => s.id === slotId);
                      setSelectedSlotMeetingLocation(selectedSlot?.meeting_location || "TBD");
                      setSelectedSlotDuration(selectedSlot?.durationText || "");
                    } else {
                      setSelectedSlotMeetingLocation("");
                      setSelectedSlotDuration("");
                    }
                  }}
                  sx={{
                    bgcolor: '#fff',
                    borderRadius: 2,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#E2E8F0'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#CBD5E0'
                    },
                    cursor: isFullyBooked ? 'default' : 'pointer'
                  }}
                  renderValue={(selected) => {
                    if (!selected) {
                      return <Typography color="text.secondary">Choose a date and time</Typography>;
                    }
                    const slot = slots.find(s => s.id === selected);
                    if (slot) {
                      return (
                        <Typography>
                          {slot.day}, {slot.date} at {slot.time}
                        </Typography>
                      );
                    }
                    return <Typography color="text.secondary">Choose a date and time</Typography>;
                  }}
                >
                  <MenuItem value="" disabled>
                    <Typography color="text.secondary">Choose a date and time</Typography>
                  </MenuItem>
                  {slots.map((slot) => (
                    <MenuItem key={slot.id} value={slot.id}>
                      <Typography>
                        {slot.day}, {slot.date} at {slot.time}
                      </Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box 
              sx={{ 
                bgcolor: '#fff', 
                borderRadius: 2, 
                p: 2, 
                mb: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
              }}
            >
              <LocationOn sx={{ color: '#33A5F6', fontSize: 24 }} />
              <Box>
                <Typography variant="body2" sx={{ color: '#33A5F6', mb: 0.5 }}>
                  Meeting Location
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedSlotMeetingLocation || "Please select a date and time"}
                </Typography>
              </Box>
            </Box>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<Description sx={{ color: '#33A5F6' }} />}
              onClick={() => setAgendaModalOpen(true)}
              disabled={!mentorAgendaPdfUrl}
              sx={{
                borderColor: '#33A5F6',
                color: '#33A5F6',
                bgcolor: '#fff',
                mb: 3,
                textTransform: 'none',
                py: 1.2,
                '&:hover': {
                  borderColor: '#2980C7',
                  bgcolor: '#E8F4FD'
                },
                '& .MuiButton-startIcon': {
                  color: '#33A5F6'
                },
                '&.Mui-disabled': {
                  borderColor: '#e0e0e0',
                  color: '#9e9e9e'
                }
              }}
            >
              {mentorAgendaPdfUrl ? 'View Session Agenda' : 'No Agenda Available'}
            </Button>

            <Button 
              fullWidth 
              variant="contained" 
              size="large"
              disabled={isFullyBooked || !selectedSlotId} 
              onClick={() => {
                if (selectedSlotId) {
                  setBookingOpen(true);
                }
              }}
              sx={{ 
                bgcolor: '#030C2B', 
                color: '#fff',
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 700,
                '&:hover': { bgcolor: '#020A1F' },
                '&.Mui-disabled': { bgcolor: '#e0e0e0', color: '#9e9e9e' }
              }}
            >
              Request Booking
            </Button>
          </BookingCard>

          <Box sx={{ bgcolor: '#fff', p: 3, borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.03)', mt: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={3} color="#06112E">
              Contact
            </Typography>
            <Box display="flex" flexDirection="column" gap={2.5}>
              {mentorDisplay.email && (
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Email sx={{ fontSize: 20, color: '#6B7A90' }} />
                  <Typography variant="body2" color="#06112E">
                    {mentorDisplay.email}
                  </Typography>
                </Box>
              )}
              {mentorDisplay.phone && (
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Phone sx={{ fontSize: 20, color: '#6B7A90' }} />
                  <Typography variant="body2" color="#06112E">
                    {mentorDisplay.phone}
                  </Typography>
                </Box>
              )}
              {mentorDisplay.linkedIn && (
                <Box display="flex" alignItems="center" gap={1.5}>
                  <LinkedIn sx={{ fontSize: 20, color: '#0077B5' }} />
                  <Typography 
                    variant="body2" 
                    component="a"
                    href={mentorDisplay.linkedIn.startsWith('http') ? mentorDisplay.linkedIn : `https://${mentorDisplay.linkedIn}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      color: '#4F46E5',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    LinkedIn
                  </Typography>
                </Box>
              )}
              {mentorDisplay.portfolioPdf && (
                <Box display="flex" alignItems="center" gap={1.5}>
                  <InsertDriveFile sx={{ fontSize: 20, color: '#6B7A90' }} />
                  <Typography 
                    variant="body2" 
                    component="a"
                    href={`${apiOrigin}/uploads/${mentorDisplay.portfolioPdf}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      color: '#4F46E5',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    CV / Portfolio
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Sidebar>
      </ContentLayout>

          {/* Passing real slots to the booking modal */}
          <RequestBookingModal
            open={bookingOpen}
            onClose={() => {
              setBookingOpen(false);
              // Reset selected slot when modal closes
              setTimeout(() => {
                setSelectedSlotId("");
                setSelectedSlotMeetingLocation("");
                setSelectedSlotDuration("");
              }, 300);
            }}
            mentor={{
              id: mentorDisplay.id,
              name: mentorDisplay.name,
              price: mentorDisplay.price,
              slots,
              preselectedSlotId: selectedSlotId, // Pass preselected slot if any
            }}
          />
        </>
      )}

      {/* Session Agenda Modal */}
      <Dialog
        open={agendaModalOpen}
        onClose={() => setAgendaModalOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2 }}>
          <Typography variant="h5" fontWeight={700}>
            Session Agenda
          </Typography>
          <IconButton onClick={() => setAgendaModalOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          {mentorAgendaPdfUrl ? (
            <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  {mentorDisplay?.name}'s Session Agenda
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<OpenInNewIcon />}
                  onClick={() => window.open(mentorAgendaPdfUrl, '_blank')}
                >
                  Open in New Tab
                </Button>
              </Box>
              <Box
                component="iframe"
                src={`${mentorAgendaPdfUrl}#toolbar=1`}
                sx={{
                  width: '100%',
                  height: '100%',
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  flex: 1,
                  minHeight: 0,
                  backgroundColor: '#f5f5f5',
                }}
                title="Session Agenda PDF"
              />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, py: 4 }}>
              <Description sx={{ fontSize: 80, color: 'text.disabled' }} />
              <Typography variant="h6" sx={{ textAlign: 'center' }}>
                No Session Agenda Available
              </Typography>
              <Alert severity="info" sx={{ width: '100%', maxWidth: 500 }}>
                This mentor hasn't uploaded a session agenda yet. Please check back later or contact the mentor directly.
              </Alert>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
}