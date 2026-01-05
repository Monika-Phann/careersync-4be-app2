import { useMemo, useState, useEffect } from 'react'
import { Container, Typography, CircularProgress, Box, Dialog, IconButton } from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom';
import { useAtom } from 'jotai'; // 1. Import useAtom
import { authAtom } from '../../store/authAtom'; // 2. Import authAtom
import axiosInstance from '../../api/axiosInstance'


import SectionHeading from '../../components/UI/SectionHeading/SectionHeading'
import Badge from '../../components/UI/Badge/Badge'
import Button from '../../components/UI/Button/Button'
import Card from '../../components/UI/Card/Card'

import {
  Section,
  FilterRow,
  FilterChip,
  ProgramGrid,
  ProgramCardContent,
  ProgramImage,
} from './Programs.styles'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
const API_URL = `${API_BASE}/api`;

function Programs({ defaultCategory = 'All Industries' }) {
  const [auth] = useAtom(authAtom); // 3. Initialize auth state
  const [activeCategory, setActiveCategory] = useState(defaultCategory)
  const [programs, setPrograms] = useState([])
  const [industries, setIndustries] = useState([])
  const [loading, setLoading] = useState(true)
  const [industriesLoading, setIndustriesLoading] = useState(true)
  const [error, setError] = useState(null)
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const navigate = useNavigate();

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl)
    setImageModalOpen(true)
  }

  const handleCloseImageModal = () => {
    setImageModalOpen(false)
    setSelectedImage(null)
  }

  // Fetch industries from admin section
  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        setIndustriesLoading(true)
        const response = await axiosInstance.get('/api/industries')
        const industryNames = response.data.map(industry => industry.industry_name)
        setIndustries(industryNames)
        
        // Ensure activeCategory is valid - if defaultCategory doesn't match any industry, reset to "All Industries"
        if (activeCategory !== 'All Industries' && !industryNames.includes(activeCategory)) {
          setActiveCategory('All Industries')
        }
      } catch (err) {
        console.error('Error fetching industries:', err)
        setIndustries([])
      } finally {
        setIndustriesLoading(false)
      }
    }

    fetchIndustries()
  }, [])

  useEffect(() => {
    const getPrograms = async () => {
      try {
        setLoading(true)
        // Fetch positions from backend API
        const response = await axiosInstance.get('/api/positions')
        const positionsData = response.data || []
        
        // Transform positions into program format
        const programsData = positionsData.map((position) => ({
          id: position.id,
          title: position.position_name,
          category: position.industry_name || 'General',
          description: position.description || 'Explore this career path with our expert mentors.',
          image: position.image_url || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
          positionId: position.id,
        }))
        
        setPrograms(programsData)
      } catch (err) {
        console.error('Error fetching programs:', err)
        setError('Failed to fetch programs')
        setPrograms([])
      } finally {
        setLoading(false)
      }
    }

    getPrograms()
  }, [])

  // Create categories array with "All Industries" first, then fetched industries
  const categories = useMemo(() => {
    return ['All Industries', ...industries]
  }, [industries])

  const filteredPrograms = useMemo(() => {
    // Wait for both industries and programs to load before filtering
    if (industriesLoading || loading) return []
    
    // If no industries are created, don't show any programs
    if (industries.length === 0) return []
    
    // Filter programs to only show those whose category matches an existing industry
    const availableCategories = new Set(industries)
    const validPrograms = programs.filter((item) => availableCategories.has(item.category))
    
    if (activeCategory === 'All Industries') return validPrograms
    return validPrograms.filter((item) => item.category === activeCategory)
  }, [programs, activeCategory, industries, industriesLoading, loading])

  if (loading || industriesLoading) {
    return (
      <Section sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Section>
    )
  }
  if (error) {
    return (
      <Section><Container><Typography color="error">{error}</Typography></Container></Section>
    )
  }

  return (
    <Section
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Container maxWidth="lg">
        <SectionHeading
          title="Shadowing Programs"
          subtitle="Experience real-world careers firsthand. Shadow professionals and find your perfect career path through immersive programs"
        />

        <FilterRow>
          {categories.length > 1 ? (
            categories.map((category) => (
              <FilterChip
                key={category}
                active={activeCategory === category}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </FilterChip>
            ))
          ) : (
            <Box sx={{ width: '100%', textAlign: 'center', py: 3 }}>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                No industry created yet
              </Typography>
            </Box>
          )}
        </FilterRow>

        <ProgramGrid>
          {filteredPrograms.length > 0 ? (
            filteredPrograms.map((item) => (
              <Card key={item.id}>
                <ProgramCardContent>
                  <Badge>{item.category}</Badge>
                  <ProgramImage 
                    src={item.image} 
                    alt={item.title}
                    onClick={() => handleImageClick(item.image)}
                  />
                  <Typography variant="h4" sx={{ mt: 2, fontWeight: 700 }}>
                    {item.title}
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: 'text.secondary', 
                      my: 2,
                      flexGrow: 1, // Allow description to grow and push button down
                      minHeight: '3em', // Minimum height for consistency
                    }}
                  >
                    {item.description}
                  </Typography>
                  <Button 
                    variant="secondary" 
                    fullWidth
                    onClick={() => {
                      // Navigate to mentors page filtered by category (industry)
                      if (auth.isAuthenticated) {
                        navigate(`/mentors?category=${encodeURIComponent(item.category)}`);
                      } else {
                        navigate('/signin');
                      }
                    }}
                  >
                    View Available Mentors
                  </Button>
                </ProgramCardContent>
              </Card>
            ))
          ) : (
            <Typography sx={{ gridColumn: '1/-1', textAlign: 'center', py: 5, color: 'text.secondary' }}>
              {industries.length === 0 ? 'No industry created yet' : 'No programs found in this category.'}
            </Typography>
          )}
        </ProgramGrid>
      </Container>

      {/* Image Modal */}
      <Dialog
        open={imageModalOpen}
        onClose={handleCloseImageModal}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'transparent',
            boxShadow: 'none',
            maxWidth: '90vw',
            maxHeight: '90vh',
          }
        }}
      >
        <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <IconButton
            onClick={handleCloseImageModal}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              zIndex: 1,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
          {selectedImage && (
            <Box
              component="img"
              src={selectedImage}
              alt="Full size position image"
              sx={{
                maxWidth: '100%',
                maxHeight: '90vh',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                borderRadius: 2,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              }}
            />
          )}
        </Box>
      </Dialog>
    </Section>
  )
}

export default Programs