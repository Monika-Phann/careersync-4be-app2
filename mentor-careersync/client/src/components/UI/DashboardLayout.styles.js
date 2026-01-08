export const DashboardLayoutStyles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    position: 'relative',
    overflowX: 'hidden',
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    width: '100%',
    minHeight: '100vh',
    minWidth: 0,
    position: 'relative',
    zIndex: 1, // Ensure content stays below sidebar
  },
  content: {
    flexGrow: 1,
    padding: { xs: '16px', sm: '16px', md: '24px' },
    backgroundColor: '#f5f5f5',
    minWidth: 0,
    overflowX: 'hidden',
    // scope enter animations to just the page body components (not the whole page)
    '& .MuiCard-root, & .MuiTableContainer-root': {
      animation: 'csSlideUpFade 300ms ease both',
    },
  },
}

