const drawerWidth = 260

export const SidebarStyles = {
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
    '& .MuiDrawer-paper': {
      width: drawerWidth,
      boxSizing: 'border-box',
    },
  },
  drawerPaper: {
    width: drawerWidth,
    backgroundColor: '#f8f9fa',
    borderRight: '1px solid #e0e0e0',
    height: '100vh',
    top: 0,
    left: 0,
    zIndex: 1200, // Ensure sidebar stays above content
    // subtle performance-friendly transition for mobile drawer
    transition: 'transform 200ms ease',
  },
  logoContainer: {
    padding: '24px 20px',
    borderBottom: '1px solid #e0e0e0',
  },
  logo: {
    fontWeight: 700,
    fontSize: '20px',
    color: '#1976d2',
    letterSpacing: '0.5px',
  },
  list: {
    padding: '8px',
  },
  listItemButton: {
    borderRadius: '8px',
    marginBottom: '4px',
    padding: '12px 16px',
    color: '#666666',
    '&:hover': {
      backgroundColor: '#e3f2fd',
      color: '#030C2B',
    },
  },
  activeItem: {
    backgroundColor: '#e3f2fd',
    color: '#030C2B',
    fontWeight: 600,
  },
  listItemIcon: {
    minWidth: 40,
    color: 'inherit',
  },
  activeIcon: {
    color: '#030C2B',
  },
  listItemText: {
    '& .MuiListItemText-primary': {
      fontSize: '14px',
      fontWeight: 500,
    },
  },
  activeText: {
    '& .MuiListItemText-primary': {
      color: '#030C2B',
      fontWeight: 600,
    },
  },
  subItemButton: {
    borderRadius: '8px',
    marginLeft: '24px',
    padding: '8px 16px',
    color: '#666666',
    '&:hover': {
      backgroundColor: '#e3f2fd',
      color: '#030C2B',
    },
  },
  activeSubItem: {
    backgroundColor: '#e3f2fd',
    color: '#030C2B',
    fontWeight: 600,
  },
  subItemIcon: {
    minWidth: 32,
    color: 'inherit',
    fontSize: '18px',
  },
  subItemText: {
    '& .MuiListItemText-primary': {
      fontSize: '13px',
    },
  },
}

export { drawerWidth }

