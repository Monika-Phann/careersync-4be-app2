import { BrowserRouter as Router, useLocation } from 'react-router-dom'
import { Box } from '@mui/material'
import { useEffect } from 'react'
import { AnimatePresence } from 'framer-motion' // Required for exit animations
import Navbar from './components/Navbar/Navbar'
import Footer from './components/Footer/Footer'
import AppRoutes from './routes/AppRoutes'
import PageTransition from './components/UI/PageTransition' // Import your new component

function AppContent() {
  const location = useLocation();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#f5f7fb',
        position: 'relative',
      }}
    >
      <Navbar />
      
      <Box
        component="main"
        sx={{
          flex: 1,
          marginTop: '72px',
          paddingBottom: location.pathname === '/' ? '0' : '40px',
          width: '100%',
          '@media (max-width: 900px)': {
            marginTop: '64px',
          },
        }}
      >
        {/* AnimatePresence allows the PageTransition to detect route changes */}
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <AppRoutes />
          </PageTransition>
        </AnimatePresence>
      </Box>
      
      <Footer />
    </Box>
  );
}

function App() {
  useEffect(() => {
    const handleResize = () => {
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App