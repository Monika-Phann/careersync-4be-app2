// // src/components/Header.jsx
// import React, { useState, useEffect } from 'react';
// import { useAuth } from '../contexts/AuthContext';

// const Header = () => {
//   const { user } = useAuth();
  
//   // 1. Logic បង្កើត Base URL (ដូចក្នុង SettingsPage ដែរ)
//   // វានឹងដំណើរការទាំង Local (localhost:3000) និង Server (13.53...)
//   const getBaseUrl = () => {
//     const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
//     return apiUrl.replace('/api/v1', '');
//   };
//   const API_URL = getBaseUrl();

//   // 2. បង្កើត Link រូបភាព
//   const profileImageUrl = user?.profile_image
//     ? `${API_URL}/uploads/profiles/${user.profile_image}`
//     : null;

//   // 3. State សម្រាប់គ្រប់គ្រងថាគួរបង្ហាញរូប ឬ Icon (ដោះស្រាយបញ្ហារូបបែក)
//   const [imgError, setImgError] = useState(false);

//   // Reset error state ពេល user ប្តូរ (ឧ. ពេល login ថ្មី)
//   useEffect(() => {
//     setImgError(false);
//   }, [user]);

//   const fullName = user?.first_name
//     ? `${user.first_name} ${user.last_name || ''}`.trim()
//     : user?.email?.split('@')[0] || 'Admin';

//   return (
//     <header className="admin-header">
//       <div className="header-title">
//         Welcome, <strong>{fullName}</strong>
//       </div>
      
//       <div className="header-controls">
//         <button className="btn-icon" title="Notifications">
//           🔔
//         </button>

//         <div className="profile-badge" title="Profile" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          
//           {/* LOGIC: បើមានរូប ហើយមិនទាន់ Error -> បង្ហាញរូប */}
//           {profileImageUrl && !imgError ? (
//             <img 
//               src={profileImageUrl} 
//               alt="Profile" 
//               className="profile-avatar"
//               style={{
//                 width: '40px',
//                 height: '40px',
//                 borderRadius: '50%',
//                 objectFit: 'cover',
//                 border: '2px solid #fff',
//                 boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
//               }}
//               onError={() => setImgError(true)} 
//             />
//           ) : (
//             // LOGIC: បើអត់រូប ឬ រូបបែក -> បង្ហាញ Icon
//             <div 
//               className="profile-fallback-icon"
//               style={{ 
//                 width: '40px', 
//                 height: '40px', 
//                 borderRadius: '50%', 
//                 background: '#667eea', 
//                 color: 'white',
//                 display: 'flex',
//                 alignItems: 'center', 
//                 justifyContent: 'center',
//                 fontSize: '20px',
//                 fontWeight: 'bold'
//               }}
//             >
//               {fullName.charAt(0).toUpperCase()}
//             </div>
//           )}

//           <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
//             <span style={{ fontSize: '14px', fontWeight: '500' }}>{fullName}</span>
//             <span className="role-badge" style={{ fontSize: '11px', color: '#666', textTransform: 'capitalize' }}>
//                 {user?.role_name || 'Admin'}
//             </span>
//           </div>
//         </div>
//       </div>
//     </header>
//   );
// };

// export default Header;


import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
// ✅ IMPORT YOUR NEW COMPONENT
import NotificationBell from './NotificationBell'; 

const Header = () => {
  const { user } = useAuth();
  
  const getBaseUrl = () => {
    const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
    
    // Don't use placeholder values
    if (envUrl && !envUrl.includes('your-api-domain.com')) {
      return envUrl.replace(/\/api(\/v1)?$/, '');
    }
    
    // Production fallback
    if (import.meta.env.PROD) {
      return 'https://api.careersync-4be.ptascloud.online'; // Update with your actual API domain
    }
    
    // Development fallback
    return 'http://localhost:5001';
  };
  const API_URL = getBaseUrl();

  const profileImageUrl = user?.profile_image
    ? `${API_URL}/uploads/profiles/${user.profile_image}`
    : null;

  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [user]);

  const fullName = user?.first_name
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : user?.email?.split('@')[0] || 'Admin';

  return (
    <header className="admin-header">
      <div className="header-title">
        Welcome, <strong>{fullName}</strong>
      </div>
      
      <div className="header-controls">
        
        {/* ✅ REPLACED STATIC BUTTON WITH NOTIFICATION COMPONENT */}
        <NotificationBell />

        <div className="profile-badge" title="Profile" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          
          {profileImageUrl && !imgError ? (
            <img 
              src={profileImageUrl} 
              alt="Profile" 
              className="profile-avatar"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid #fff',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
              }}
              onError={() => setImgError(true)} 
            />
          ) : (
            <div 
              className="profile-fallback-icon"
              style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                background: '#667eea', 
                color: 'white',
                display: 'flex',
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: 'bold'
              }}
            >
              {fullName.charAt(0).toUpperCase()}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>{fullName}</span>
            <span className="role-badge" style={{ fontSize: '11px', color: '#666', textTransform: 'capitalize' }}>
                {user?.role_name || 'Admin'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;