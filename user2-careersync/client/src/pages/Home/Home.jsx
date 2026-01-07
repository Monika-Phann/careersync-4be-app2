import { Container, Grid, Typography, Button, Stack, Box, Divider, Avatar } from "@mui/material";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { useNavigate } from "react-router-dom"; // IMPORT HOOK
import {useAuth} from '../../context/AuthContext';

import { 
  MainWrapper, 
  HeroWrapper, 
  Section, 
  GlassCard, 
  StatNumber, 
  ImageContainer, 
  MentorProfileCard,
  VideoBackgroundWrapper,
  sentence,
  letter,
  HangingFixture, 
  CeilingGlowOverlay
} from "./Home.styles";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

function HomePage() {
  const navigate = useNavigate(); // INITIALIZE NAVIGATE

  const mentors = [
    { name: "Dr. Aris Thorne", role: "Surgical Lead", img: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400", co: "General Hospital" },
    { name: "Marcus Chen", role: "Software Architect", img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400", co: "Google" },
    { name: "Elena Rodriguez", role: "Civil Engineer", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400", co: "Bechtel" },
    { name: "Samuel Green", role: "Agri-Tech Founder", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400", co: "GreenField Co." }
  ];

  const { isAuthenticated } = useAuth();

 const handleJoinClick = () => {
    if (isAuthenticated) {
      navigate('/programs'); // If logged in, go to programs
    } else {
      navigate('/register'); // If NOT logged in, go to register
    }
  };

  return (
    <MainWrapper>
      {/* 1. HERO SECTION */}
      <HeroWrapper>
        <CeilingGlowOverlay />
        <HangingFixture />

        <Container sx={{ position: "relative", zIndex: 2 }}>
          <motion.div initial="hidden" animate="show" variants={fadeUp}>
            <Typography variant="overline" sx={{ color: "#3b82f6", fontWeight: 800, letterSpacing: 3 }}>
              WELCOME TO THE NEW REALITY
            </Typography>
            
            <Typography variant="h1" sx={{ fontWeight: 950, fontSize: { xs: "3rem", md: "6rem" }, mb: 3, mt: 1, lineHeight: 1.1 }}>
              Real Careers. <br />
              <motion.span
                variants={sentence}
                style={{ 
                  display: "inline-block", 
                  color: "#3b82f6", 
                  whiteSpace: "nowrap",
                  textShadow: "0 0 30px rgba(59, 130, 246, 0.4)" 
                }}
              >
                {"Real Experience.".split("").map((char, index) => (
                  <motion.span key={index} variants={letter} style={{ display: "inline-block" }}>
                    {char === " " ? "\u00A0" : char}
                  </motion.span>
                ))}
              </motion.span>
            </Typography>

            <Typography sx={{ mb: 6, maxWidth: 600, fontSize: "1.25rem", opacity: 0.8, lineHeight: 1.8 }}>
              Break free from theoretical learning. Step directly into the world's most innovative 
              workspaces and shadow the leaders who are defining the future.
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
              <Button 
                variant="contained" 
                size="large" 
                sx={{ px: 6, py: 2, borderRadius: "16px", fontWeight: 700 }}
                onClick={() => navigate('/programs')} // REDIRECTS TO Program
              >
                Explore Programs
              </Button>
              <Button 
                variant="outlined" 
                size="large" 
                sx={{ px: 6, py: 2, borderRadius: "16px", color: "white", borderColor: "white" }}
                onClick={() => navigate('/mentor-register')} // REDIRECTS TO MENTOR REGISTRATION
              >
                Become a Mentor
              </Button>
            </Stack>
          </motion.div>
        </Container>
      </HeroWrapper>

      {/* 2. STATS SECTION */}
      <Section darkGrey>
        <Container>
          <Grid container spacing={6} textAlign="center">
            {[
              { label: "Elite Mentors", val: 250 },
              { label: "Successful Matches", val: 5000 },
              { label: "Career Paths", val: 45 }
            ].map((item, i) => (
              <Grid item xs={12} md={4} key={i}>
                <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
                  <StatNumber><CountUp end={item.val} enableScrollSpy />+</StatNumber>
                  <Typography variant="h6" sx={{ color: "white", opacity: 0.9, textTransform: "uppercase", letterSpacing: 2, fontWeight: 700 }}>{item.label}</Typography>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Section>

      {/* 3. CONTENT BANNER 1 (With Video Background) */}
      <Section light sx={{ position: 'relative', overflow: 'hidden' }}>
        <VideoBackgroundWrapper sx={{ "&::after": { background: "rgba(255, 255, 255, 0.85)" } }}>
          <video autoPlay muted loop playsInline>
            <source src="/video.mp4" type="video/mp4" />
          </video>
        </VideoBackgroundWrapper>

        <Container sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={10} alignItems="center">
            <Grid item xs={12} md={6}>
              <ImageContainer>
                <img src="https://i.pinimg.com/1200x/b7/b4/93/b7b493fd425274d62ccc6d92ea4247b6.jpg" alt="Civil Engineering" />
              </ImageContainer>
            </Grid>
            <Grid item xs={12} md={6}>
              <motion.div initial="hidden" whileInView="show" variants={fadeUp} viewport={{ once: true }}>
                <Typography variant="h2" fontWeight={900} gutterBottom color="#0b1220" sx={{ fontSize: {xs: '2.5rem', md: '3.5rem'}}}>
                  Observe with <Box component="span" sx={{ color: "#3b82f6" }}>Purpose.</Box>
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontSize: "1.1rem", lineHeight: 2, mb: 4, fontWeight: 500 }}>
                  Textbooks can explain "what" a job is, but only shadowing shows you "how" it's done. 
                  Witness the daily pressure, creative breakthroughs, and the collaborative 
                  spirit of top-tier professional environments.
                </Typography>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Section>

      {/* 4. INDUSTRY DEEP DIVE */}
      <Section>
        <Container>
          <Box sx={{ textAlign: 'center', mb: 12 }}>
            <Typography variant="h3" fontWeight={900} gutterBottom>
              Step Into <Box component="span" sx={{ color: "#3b82f6" }}>The Real World</Box>
            </Typography>
            <Typography sx={{ opacity: 0.7 }}>Experience these high-impact professions firsthand.</Typography>
          </Box>
          <Grid container spacing={8}>
            {[
              { title: "Healthcare", img: "https://i.pinimg.com/1200x/db/cd/1d/dbcd1dd88f1f3b4a2f391921c82a77e2.jpg", desc: "Shadow surgeons during clinical rounds and diagnostic sessions in modern hospitals." },
              { title: "Tech Architecture", img: "https://i.pinimg.com/1200x/9d/f8/88/9df888369a06a3a34abc7edd24e15055.jpg", desc: "Join sprint planning and system design sessions at global technology firms." },
              { title: "Civil Engineering", img: "https://i.pinimg.com/736x/88/dc/49/88dc49dbcfc2ebc7837c72510e1f36ce.jpg", desc: "Visit construction sites and shadow lead engineers on multi-million dollar projects." },
              { title: "Modern Farming", img: "https://i.pinimg.com/1200x/55/b9/15/55b91574a93ff1f147037f7d8e47e6c7.jpg", desc: "Learn sustainable farming through precision agri-tech and automated systems." }
            ].map((path, i) => (
              <Grid item xs={12} md={6} key={i}>
                <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
                  <ImageContainer sx={{ mb: 4 }}>
                    <img src={path.img} alt={path.title} />
                  </ImageContainer>
                  <Typography variant="h4" fontWeight={800} gutterBottom>{path.title}</Typography>
                  <Typography sx={{ opacity: 0.7, fontSize: '1.1rem', lineHeight: 1.7 }}>{path.desc}</Typography>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Section>

      {/* 5. MENTOR GALLERY */}
      <Section sx={{ position: 'relative', overflow: 'hidden' }}>
        <VideoBackgroundWrapper sx={{ "&::after": { background: "rgba(11, 18, 32, 0.85)" } }}>
          <video autoPlay muted loop playsInline>
            <source src="/video2.mp4" type="video/mp4" />
          </video>
        </VideoBackgroundWrapper>
        
        <Container sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center', mb: 12 }}>
            <Typography variant="h3" fontWeight={900} gutterBottom>
              Meet Your <Box component="span" sx={{ color: "#3b82f6" }}>Industry Guides</Box>
            </Typography>
            <Typography sx={{ opacity: 0.8 }}>
              Learn from those already leading the way.
            </Typography>
          </Box>
          
          <Grid container spacing={4}>
            {mentors.map((m, i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
                  <MentorProfileCard sx={{ background: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(59, 130, 246, 0.5)' }}>
                    <Avatar 
                      src={m.img} 
                      sx={{ width: 120, height: 120, mx: 'auto', mb: 3, border: '4px solid #3b82f6' }} 
                    />
                    <Typography variant="h6" fontWeight={800} sx={{ color: "#fff" }}>
                      {m.name}
                    </Typography>
                    <Typography sx={{ color: "#3b82f6", fontWeight: 950, mb: 1, textTransform: "uppercase", fontSize: "0.85rem" }}>
                      {m.role}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#fff", opacity: 0.7 }}>
                      {m.co}
                    </Typography>
                  </MentorProfileCard>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Section>

      {/* 6. THE EDGE CARDS */}
      <Section>
        <Container>
          <Typography variant="h3" align="center" fontWeight={900} mb={10}>The CareerSync Edge</Typography>
          <Grid container spacing={4}>
            {[
              { title: "One-on-One", desc: "Direct access to mentors who actively shape the industry today." },
              { title: "Verified", desc: "Official certificates for every hour of shadowing exposure." },
              { title: "Zero Pressure", desc: "Focus entirely on observation without fear of evaluation." },
              { title: "Global Network", desc: "Connect with leaders across 45+ unique career paths." }
            ].map((item, i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <GlassCard>
                  <Typography variant="h5" fontWeight={800} mb={3} color="#3b82f6">{item.title}</Typography>
                  <Typography variant="body1" sx={{ opacity: 0.7, lineHeight: 1.8 }}>{item.desc}</Typography>
                </GlassCard>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Section>

      {/* 7. CONTENT BANNER 2 */}
      <Section light>
        <Container>
          <Grid container spacing={10} alignItems="center" direction={{ xs: "column-reverse", md: "row" }}>
            <Grid item xs={12} md={6}>
              <motion.div initial="hidden" whileInView="show" variants={fadeUp} viewport={{ once: true }}>
                <Typography variant="h2" fontWeight={900} gutterBottom color="#0b1220">
                  Bridge the <Box component="span" sx={{ color: "#3b82f6" }}>Gap.</Box>
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontSize: "1.1rem", lineHeight: 2, mb: 4 }}>
                  The transition from student to professional is the hardest step. We make it 
                  seamless by providing a window into workplace culture and technical dynamism.
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Avatar src="https://i.pravatar.cc/150?img=1" />
                  <Box>
                    <Typography fontWeight={700}>"The best decision for my career."</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.6 }}>Sarah J., Software Student</Typography>
                  </Box>
                </Stack>
              </motion.div>
            </Grid>
            <Grid item xs={12} md={6}>
              <ImageContainer>
                <img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200" alt="Success" />
              </ImageContainer>
            </Grid>
          </Grid>
        </Container>
      </Section>

      {/* 8. FINAL CALL TO ACTION */}
      <Section dark sx={{ py: 25, textAlign: "center", backgroundImage: 'url("https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=2000")', backgroundSize: 'cover', backgroundAttachment: 'fixed' }}>
        <Box sx={{ position: "absolute", inset: 0, background: "rgba(11, 18, 32, 0.85)", zIndex: -1 }} />
        <Container maxWidth="md">
          <Typography variant="h2" fontWeight={950} mb={4}>Master Your Next Chapter</Typography>
          <Typography variant="h6" mb={6} sx={{ opacity: 0.8 }}>Join the next generation of career-ready leaders today.</Typography>
          <Button 
            variant="contained" 
            size="large" 
            sx={{ px: 8, py: 2.5, borderRadius: "50px", fontSize: "1.2rem", fontWeight: 800 }}
            onClick={handleJoinClick} // REDIRECTS TO STUDENT REGISTER
          >
            Join Now
          </Button>
        </Container>
      </Section>
    </MainWrapper>
  );
}

export default HomePage;
