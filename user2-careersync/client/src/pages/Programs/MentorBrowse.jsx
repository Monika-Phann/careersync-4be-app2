import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { 
  Search, 
  WorkOutline, 
  PersonOutline, 
  AttachMoney, 
  CheckCircle 
} from "@mui/icons-material";
import { InputAdornment, Box, Typography, CircularProgress } from "@mui/material";
import { getAllMentors } from "../../services/mentorService";
import { getAvailableSessions } from "../../services/sessionService";
import axiosInstance from "../../api/axiosInstance";

import {
  PageContainer,
  HeaderSection,
  Title,
  Subtitle,
  SearchWrapper,
  StyledInput,
  MentorGrid,
  MentorCard,
  CardTopSection,
  MentorImageContainer,
  MentorInfoColumn,
  MentorName,
  MentorRole,
  StatsStack,
  StatItem,
  DescriptionText,
  ButtonContainer,
  ViewProfileButton,
  RequestButton
} from "./MentorBrowse.styles";

export default function MentorBrowse() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const initialSearch = searchParams.get("search") || "";
  const initialCategory = searchParams.get("category") || "All";
  const [search, setSearch] = useState(initialSearch);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [mentors, setMentors] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingIndustries, setLoadingIndustries] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  // Update activeCategory when category URL parameter changes
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      const decodedCategory = decodeURIComponent(categoryParam);
      setActiveCategory(decodedCategory);
      // Scroll to top when category changes from URL (e.g., when coming from Programs page)
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setActiveCategory("All");
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        setLoadingIndustries(true);
        const response = await axiosInstance.get('/api/industries');
        const industryNames = response.data.map(industry => industry.industry_name);
        setIndustries(industryNames);
      } catch (err) {
        setIndustries([]);
      } finally {
        setLoadingIndustries(false);
      }
    };
    fetchIndustries();
  }, []);

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        setLoading(true);
        setError("");

        const [mentorsRes, sessionsRes] = await Promise.all([
          getAllMentors(),
          getAvailableSessions(),
        ]);

        if (!mentorsRes?.success) throw new Error(mentorsRes?.message);

        const rawMentors = Array.isArray(mentorsRes?.data) ? mentorsRes.data : (mentorsRes?.data?.mentors || []);
        
        const rawSessions = Array.isArray(sessionsRes?.data) ? sessionsRes.data : (sessionsRes?.data?.sessions || []);
        const mentorAvailability = new Map();

        rawSessions.forEach((s) => {
          const mentorId = s?.mentor_id || s?.Mentor?.id;
          if (!mentorId) return;
          const slots = s?.ScheduleTimeslots || s?.ScheduleTimeslot || [];
          const hasOpenSlot = Array.isArray(slots) && slots.some((t) => t && !t.is_booked);
          if (!hasOpenSlot) return;

          const price = Number(s?.price);
          const prev = mentorAvailability.get(mentorId) || { hasOpenSlot: false, minPrice: null };
          mentorAvailability.set(mentorId, {
            hasOpenSlot: true,
            minPrice: Number.isFinite(price) ? (prev.minPrice == null ? price : Math.min(prev.minPrice, price)) : prev.minPrice,
          });
        });

        const normalized = rawMentors.map((m) => {
          const id = m?.id;
          const firstName = m?.first_name || "";
          const lastName = m?.last_name || "";
          const name = `${firstName} ${lastName}`.trim() || "N/A";
          const jobTitle = m?.job_title || m?.Position?.position_name || "Mentor";
          const company = m?.company_name || "Freelance";
          const experienceYears = m?.experience_years || 0;
          const aboutMentor = m?.about_mentor || "No description available for this mentor.";
          const category = m?.Industry?.industry_name || "General";

          // ✅ FIX: Handle R2 URL correctly
          let profileImage = m?.profile_image;
          if (profileImage) {
            if (!profileImage.startsWith('http')) {
               const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
               const apiOrigin = apiBase.replace(/\/api\/?$/, '');
               // Legacy fallback
               profileImage = `${apiOrigin}/uploads/${profileImage}`;
            }
          } else {
             profileImage = m?.User?.avatar || m?.avatar || "https://via.placeholder.com/150";
          }

          const availabilityInfo = id ? mentorAvailability.get(id) : null;
          const availability = availabilityInfo?.hasOpenSlot ? "Available" : "Fully Booked";
          const defaultRate = Number(m?.session_rate);
          const price = availabilityInfo?.minPrice ?? (Number.isFinite(defaultRate) ? defaultRate : 0);

          return {
            id, name, role: jobTitle, company, category, avatar: profileImage,
            availability, price, experienceYears, aboutMentor,
            completedSessions: m?.completed_sessions || 0,
          };
        });

        setMentors(normalized);
      } catch (e) {
        setMentors([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMentors();
  }, []);

  const filteredMentors = useMemo(() => {
    const searchLower = (search || "").toLowerCase();
    return (mentors || []).filter((mentor) => {
      const matchesSearch =
        mentor.name?.toLowerCase().includes(searchLower) ||
        mentor.role?.toLowerCase().includes(searchLower) ||
        mentor.company?.toLowerCase().includes(searchLower);
      const matchesCategory = activeCategory === "All" || mentor.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [mentors, search, activeCategory]);

  return (
    <PageContainer>
      <HeaderSection>
        <Title>Browse Mentors</Title>
        <Subtitle>Find the perfect mentor to guide your career journey</Subtitle>
        
        <SearchWrapper>
          <StyledInput
            placeholder="Search by name, role, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: "#7A8699" }} />
                </InputAdornment>
              ),
            }}
          />
        </SearchWrapper>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mt: 3, flexWrap: 'wrap' }}>
          {loadingIndustries ? (
            <CircularProgress size={24} />
          ) : industries.length > 0 ? (
            <>
              <Box
                onClick={() => {
                  setActiveCategory("All");
                  // Update URL without category parameter
                  const newSearchParams = new URLSearchParams(searchParams);
                  newSearchParams.delete("category");
                  navigate(`/mentors?${newSearchParams.toString()}`, { replace: true });
                }}
                sx={{
                  px: 2, py: 1, borderRadius: 2, cursor: 'pointer', fontSize: 14, fontWeight: 600,
                  bgcolor: activeCategory === "All" ? '#06112E' : '#E9EEF3',
                  color: activeCategory === "All" ? '#fff' : '#06112E',
                  transition: 'all 0.2s',
                  '&:hover': { bgcolor: activeCategory === "All" ? '#06112E' : '#dfe6ec' }
                }}
              >
                All
              </Box>
              {industries.map((industry) => (
                <Box
                  key={industry}
                  onClick={() => {
                    setActiveCategory(industry);
                    // Update URL with selected category
                    const newSearchParams = new URLSearchParams(searchParams);
                    newSearchParams.set("category", encodeURIComponent(industry));
                    navigate(`/mentors?${newSearchParams.toString()}`, { replace: true });
                  }}
                  sx={{
                    px: 2, py: 1, borderRadius: 2, cursor: 'pointer', fontSize: 14, fontWeight: 600,
                    bgcolor: activeCategory === industry ? '#06112E' : '#E9EEF3',
                    color: activeCategory === industry ? '#fff' : '#06112E',
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: activeCategory === industry ? '#06112E' : '#dfe6ec' }
                  }}
                >
                  {industry}
                </Box>
              ))}
            </>
          ) : (
            <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>
              No industries found.
            </Typography>
          )}
        </Box>
      </HeaderSection>

      {loading && <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>}

      <MentorGrid>
        {!loading && !error && filteredMentors.length > 0 ? (
          filteredMentors.map((mentor) => (
            <MentorCard key={mentor.id}>
              
              <CardTopSection>
                <MentorImageContainer>
                  <img 
                    src={mentor.avatar} 
                    alt={mentor.name}
                    onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/150?text=User"; }} 
                  />
                </MentorImageContainer>

                <MentorInfoColumn>
                  <MentorName>{mentor.name}</MentorName>
                  <MentorRole>{mentor.role}</MentorRole>

                  <StatsStack>
                    <StatItem>
                      <WorkOutline sx={{ color: '#64748B' }} />
                      <span>{mentor.company}</span>
                    </StatItem>
                    <StatItem>
                      <PersonOutline sx={{ color: '#64748B' }} />
                      <span>{mentor.experienceYears} years experience</span>
                    </StatItem>
                    <StatItem>
                      <AttachMoney sx={{ color: '#059669' }} />
                      <span style={{ color: '#059669', fontWeight: 700 }}>${mentor.price}/session</span>
                    </StatItem>
                    <StatItem>
                      <CheckCircle sx={{ color: '#64748B' }} />
                      <span>{mentor.completedSessions} sessions completed</span>
                    </StatItem>
                  </StatsStack>
                </MentorInfoColumn>
              </CardTopSection>

              <DescriptionText>
                {mentor.aboutMentor}
              </DescriptionText>

              <ButtonContainer>
                <ViewProfileButton
                  onClick={() => navigate(`/mentor/${mentor.id}`)}
                >
                    View Mentor Profile
                </ViewProfileButton>
                
                <RequestButton
                  disabled={mentor.availability === "Fully Booked"}
                  onClick={() => navigate(`/mentor/${mentor.id}`)}
                >
                  Request Booking
                </RequestButton>
              </ButtonContainer>
            </MentorCard>
          ))
        ) : (
          !loading && (
            <Box sx={{ gridColumn: '1/-1', textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">No mentors found.</Typography>
              <Typography 
                color="primary" 
                sx={{ cursor: 'pointer', mt: 1, textDecoration: 'underline' }} 
                onClick={() => {setSearch(""); setActiveCategory("All");}}
              >
                Reset filters
              </Typography>
            </Box>
          )
        )}
      </MentorGrid>
    </PageContainer>
  );
}
