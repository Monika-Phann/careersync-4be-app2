// src/pages/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axiosConfig';
import '../assets/css/components/settings.css';
import Swal from 'sweetalert2'; // ✅ ប្រើ SweetAlert2 ឱ្យដូច Page ផ្សេងៗ

const SettingsPage = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  
  // ✅ FIX: ប្រើ Environment Variable ជំនួស localhost
// ទាញយក Link ពី .env (ឧ. ...:3000/api/v1)
// const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// // ✂️ កាត់ '/api/v1' ចេញ ដើម្បីបាន Link សម្រាប់រូបភាព (ឧ. ...:3000)
// const API_IMG_URL = API_BASE.replace('/api/v1', '');
// Get API URL with proper fallback
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  
  // List of placeholder patterns to reject
  const placeholderPatterns = [
    'your-api-domain.com',
    'your-api-domain',
    'example.com',
    'localhost:3000',
  ];
  
  // Check if URL contains any placeholder patterns
  const isPlaceholder = envUrl && placeholderPatterns.some(pattern => 
    envUrl.toLowerCase().includes(pattern.toLowerCase())
  );
  
  // Use environment URL if it's valid and not a placeholder
  if (envUrl && !isPlaceholder && envUrl.startsWith('http')) {
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
  }
  
  // Check if we're in production mode
  if (import.meta.env.PROD || window.location.hostname !== 'localhost') {
    if (isPlaceholder || !envUrl) {
      console.error('⚠️ VITE_API_URL contains placeholder or is missing. Using fallback API URL.');
    }
    return 'https://api.careersync-4be.ptascloud.online/api'; // Update with your actual API domain
  }
  
  // Development fallback
  return 'http://localhost:5001/api';
};

const API_BASE_URL = getApiBaseUrl();
const API_IMG_URL = API_BASE_URL.replace('/api', '');
  
  // State for Password Visibility Toggle (✨ Feature ថ្មី)
  const [showPassword, setShowPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    profile_image: null,
    previewImage: null,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      const data = res.data;
      
      setProfileData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone: data.phone || '',
        // Handle image preview correctly
        previewImage: data.profile_image 
          ? `${API_IMG_URL}/uploads/profiles/${data.profile_image}` 
          : null,
      });
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileData({
        ...profileData,
        profile_image: file,
        previewImage: URL.createObjectURL(file),
      });
    }
  };

  // ✅ UPDATE: ថែម Validation ដូច CreateUser (ការពារលេខ/អក្សរខុស)
  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;

    // ការពារ Phone (ឱ្យវាយតែលេខ)
    if (name === 'phone') {
        if (value && !/^[0-9]*$/.test(value)) return;
    }

    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('first_name', profileData.first_name);
    formData.append('last_name', profileData.last_name);
    formData.append('phone', profileData.phone);
    if (profileData.profile_image) formData.append('profile_image', profileData.profile_image);

    try {
      await api.put('/admin/profile/update', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // ✅ ប្រើ SweetAlert ជំនួស Text ធម្មតា
      Swal.fire({
        icon: 'success',
        title: 'Profile Updated',
        text: 'Your information has been updated successfully!',
        timer: 2000,
        showConfirmButton: false
      });
      // Refresh user context if needed or refetch profile
      fetchProfile();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: err.response?.data?.message || 'Something went wrong.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Swal.fire('Warning', 'Passwords do not match!', 'warning');
      return;
    }
    if (passwordData.newPassword.length < 8) {
        Swal.fire('Warning', 'New password must be at least 8 characters.', 'warning');
        return;
    }

    setLoading(true);
    try {
      await api.post('/auth/update-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      Swal.fire('Success', 'Password changed successfully!', 'success');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: user?.email });
      Swal.fire('Sent!', 'Reset link sent! Check your email.', 'success');
    } catch (err) {
      Swal.fire('Error', 'Failed to send reset link', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Swal.fire({
        title: 'Are you sure?',
        text: "You will be logged out from all devices.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Yes, logout!'
    }).then((result) => {
        if (result.isConfirmed) {
            logout();
        }
    })
  };

  return (
    <div className="settings-page container py-4">
      <div className="settings-header mb-5">
        <h2 className="fw-bold">Settings</h2>
        <p className="text-muted">Manage your account, security, and preferences</p>
      </div>

      {/* Tabs */}
      <ul className="nav nav-pills mb-5 justify-content-center">
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
            <i className="bi bi-person-circle me-2"></i> Profile
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
            <i className="bi bi-shield-lock me-2"></i> Security
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'preferences' ? 'active' : ''}`} onClick={() => setActiveTab('preferences')}>
            <i className="bi bi-sliders me-2"></i> Preferences
          </button>
        </li>
      </ul>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-5">
            <h5 className="card-title mb-4">Profile Information</h5>
            <p className="text-muted mb-5">Update your personal details and profile picture</p>

            <div className="text-center mb-5">
              <div className="profile-pic-wrapper mx-auto position-relative d-inline-block">
                <img
                  src={
                    profileData.previewImage || 
                    `https://ui-avatars.com/api/?name=${profileData.first_name}+${profileData.last_name}&background=random&color=fff&size=150`
                  }
                  alt="Profile"
                  className="profile-pic rounded-circle shadow-sm"
                  style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                  onError={(e) => {
                    // 1. បញ្ឈប់ Loop (សំខាន់បំផុត!)
                    e.target.onerror = null; 
                    
                    // 2. បើ Load រូបផ្ទាល់ខ្លួនមិនចេញ ឱ្យវាយកឈ្មោះទៅបង្កើតជារូបអក្សរជំនួសវិញ
                    e.target.src = `https://ui-avatars.com/api/?name=${profileData.first_name || 'User'}+${profileData.last_name || ''}&background=random&color=fff&size=150`;
                  }}
                />
                <label htmlFor="upload" className="upload-overlay">
                  <i className="bi bi-camera-fill"></i>
                </label>
                <input type="file" id="upload" accept="image/*" onChange={handleImageChange} hidden />
              </div>
              <p className="text-muted small mt-2">Click icon to change picture</p>
            </div>

            <form onSubmit={handleProfileUpdate}>
              <div className="row g-4">
                <div className="col-md-6">
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="first_name"
                    value={profileData.first_name}
                    onChange={handleProfileInputChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="last_name"
                    value={profileData.last_name}
                    onChange={handleProfileInputChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Phone Number</label>
                  {/* ✨ Feature: Phone with regex validation via handleProfileInputChange */}
                  <input
                    type="tel"
                    className="form-control"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileInputChange}
                    maxLength="15"
                    placeholder="012 345 678"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Email (ReadOnly)</label>
                  <input type="email" className="form-control bg-light" value={user?.email || ''} disabled />
                </div>
              </div>

              <div className="text-end mt-5">
                <button type="submit" className="btn btn-primary px-5" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="card-title mb-0">Change Password</h5>
                {/* ✨ Feature: Toggle Show/Hide Password */}
                <button 
                    type="button" 
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setShowPassword(!showPassword)}
                >
                    {showPassword ? <><i className="bi bi-eye-slash"></i> Hide</> : <><i className="bi bi-eye"></i> Show</>}
                </button>
            </div>
            
            <p className="text-muted mb-5">Keep your account secure with a strong password.</p>

            <form onSubmit={handlePasswordUpdate} className="max-w-500">
              <div className="mb-4">
                <label className="form-label">Current Password</label>
                <div className="input-group">
                    <input 
                        type={showPassword ? "text" : "password"} 
                        className="form-control" 
                        value={passwordData.currentPassword} 
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} 
                        required 
                    />
                </div>
              </div>
              <div className="mb-4">
                <label className="form-label">New Password</label>
                <input 
                    type={showPassword ? "text" : "password"} 
                    className="form-control" 
                    value={passwordData.newPassword} 
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} 
                    required 
                    minLength="8"
                />
              </div>
              <div className="mb-5">
                <label className="form-label">Confirm New Password</label>
                <input 
                    type={showPassword ? "text" : "password"} 
                    className="form-control" 
                    value={passwordData.confirmPassword} 
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} 
                    required 
                />
              </div>

              <div className="d-flex justify-content-between align-items-center">
                <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Password'}
                </button>

                <button type="button" className="btn btn-link text-decoration-none text-muted" onClick={handleForgotPassword} disabled={loading}>
                    Forgot password?
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-5">
            <h5 className="card-title mb-4">Preferences</h5>

            <div className="setting-row d-flex justify-content-between align-items-center mb-4">
              <div>
                <h6 className="mb-1">Dark Mode</h6>
                <p className="text-muted small mb-0">Switch to dark theme (coming soon)</p>
              </div>
              <div className="form-check form-switch">
                <input className="form-check-input" style={{width: '3em', height: '1.5em'}} type="checkbox" checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
              </div>
            </div>

            <div className="setting-row d-flex justify-content-between align-items-center mb-4">
              <div>
                <h6 className="mb-1">Email Notifications</h6>
                <p className="text-muted small mb-0">Get updates on new mentors, bookings, etc.</p>
              </div>
              <div className="form-check form-switch">
                <input className="form-check-input" style={{width: '3em', height: '1.5em'}} type="checkbox" checked={emailNotifications} onChange={() => setEmailNotifications(!emailNotifications)} />
              </div>
            </div>

            <hr className="my-5" />

            <div>
              <h6 className="text-danger fw-bold">Danger Zone</h6>
              <p className="text-muted small mb-3">This will log you out from all devices</p>
              <button className="btn btn-outline-danger" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right me-2"></i> Logout All Devices
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;