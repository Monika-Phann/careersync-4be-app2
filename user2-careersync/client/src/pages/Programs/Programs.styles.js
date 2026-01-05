import { styled } from '@mui/material/styles'
import { Box, Container } from '@mui/material'

export const Section = styled(Box)({
  padding: '72px 0',
  '@media (max-width: 900px)': {
    padding: '48px 0',
  },
})

export const FilterRow = styled(Box)({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '10px',
  justifyContent: 'center',
  marginBottom: '24px',
})

export const FilterChip = styled(Box)(({ theme, active }) => ({
  borderRadius: 10,
  border: `1px solid ${theme.palette.grey[200]}`,
  padding: '10px 14px',
  background: active ? '#d9ebff' : theme.palette.background.default,
  color: active ? theme.palette.primary.main : theme.palette.text.primary,
  cursor: 'pointer',
  fontWeight: 600,
  borderColor: active ? '#b9d7ff' : theme.palette.grey[200],
  transition: 'all 0.2s',
  '&:hover': {
    background: active ? '#d9ebff' : '#e5e7eb',
  },
}))

export const ProgramGrid = styled(Box)({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '16px',
  alignItems: 'stretch', // Ensure all cards stretch to equal height
})

export const ProgramCardContent = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  gap: '10px',
  '& > *:last-child': {
    marginTop: 'auto', // Push button to bottom
  },
})

export const ProgramImage = styled('img')({
  width: '100%',
  height: 'auto',
  minHeight: 280,
  maxHeight: 350,
  objectFit: 'cover',
  objectPosition: 'center',
  borderRadius: 8,
  display: 'block',
  aspectRatio: '16/9',
  cursor: 'pointer',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  '&:hover': {
    transform: 'scale(1.02)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  '@media (max-width: 900px)': {
    minHeight: 240,
    maxHeight: 300,
  },
  '@media (max-width: 600px)': {
    minHeight: 200,
    maxHeight: 250,
  },
})

