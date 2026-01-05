import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Box, Typography, Checkbox, FormControlLabel, Alert } from '@mui/material'
import Button from '../../../components/UI/Button/Button'
import Logo from '../../../components/UI/Logo/Logo'
import FormInput from '../../../components/UI/FormInput/FormInput'
import { AuthLayout, AuthCard, AuthForm, AuthFooter } from './AuthSignIn.styles'
import { login as loginUser } from '../../../services/authService'
import { useAuth } from '../../../context/AuthContext.jsx'

function AuthSignIn() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: '' }))
    if (error) setError('')
  }

  // ✅ Helper to clean "Double URLs" coming from backend
  const cleanImageUrl = (url) => {
    if (!url) return null;
    // If it looks like: "https://api.../uploads/https://pub..."
    // We split it and take the second part (the real R2 URL)
    if (url.includes('/uploads/https://')) {
      return 'https://' + url.split('/uploads/https://')[1];
    }
    if (url.includes('/uploads/http://')) {
      return 'http://' + url.split('/uploads/http://')[1];
    }
    return url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    const nextFieldErrors = {}
    if (!formData.email?.trim()) nextFieldErrors.email = 'Email is required'
    if (!formData.password) nextFieldErrors.password = 'Password is required'
    setFieldErrors(nextFieldErrors)
    if (Object.keys(nextFieldErrors).length > 0) return

    setLoading(true)

    try {
      // Normalize email
      const result = await loginUser({ email: formData.email.toLowerCase().trim(), password: formData.password })
      
      if (!result.success) {
        setError(result.message || 'Login failed. Please try again.')
        return
      }

      const { user, accessToken, token } = result.data || {}
      const finalToken = accessToken || token

      if (user && (user.emailVerified === false || user.email_verified === false)) {
        setError('Please verify your email before signing in.')
        return
      }

      if (!user || !finalToken) {
        setError('Login response was missing user or token.')
        return
      }

      // ✅ FIX: Clean the images using our helper function
      const rawAvatar = user.avatar || user.profileImage || user.Mentor?.profile_image;
      const cleanAvatar = cleanImageUrl(rawAvatar);

      // Ensure user object has all required fields for display
      const userData = {
        ...user,
        firstName: user.firstName || user.firstname || user.Mentor?.first_name || '',
        lastName: user.lastName || user.lastname || user.Mentor?.last_name || '',
        avatar: cleanAvatar,        // ✅ Uses cleaned URL
        profileImage: cleanAvatar,  // ✅ Uses cleaned URL
        email: user.email || '',
        phone: user.phone || user.Mentor?.phone || null,
        gender: user.gender || user.Mentor?.gender || null,
        dateOfBirth: user.dateOfBirth || user.dob || user.Mentor?.dob || null,
        status: user.status || user.types_user || null,
        institutionName: user.institutionName || user.institution_name || null,
        Mentor: user.Mentor || null
      }

      console.log('=== LOGIN SUCCESS ===');
      console.log('Cleaned Avatar URL:', userData.avatar);
      console.log('===================');
      
      // Role-based redirection
      const userRole = user.role || user.role_name || userData.role;
      
      if (userRole === 'mentor') {
        const mentorPlatformUrl = "https://mentor-4be.ptascloud.online";
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        const redirectUrl = `${mentorPlatformUrl}/auth/sso?token=${encodeURIComponent(finalToken)}`;
        window.location.href = redirectUrl;
        return; 
      }
      
      login(userData, finalToken);
      navigate('/mentors');
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <AuthCard>
        <Box sx={{ display: 'flex', justifyContent: 'center', marginBottom: 2.5 }}>
          <Logo style={{ color: '#0f172a' }} />
        </Box>
        <Typography variant="h3" sx={{ textAlign: 'center', mb: 1, fontWeight: 700 }}>
          Sign In
        </Typography>
        <Typography variant="body2" sx={{ textAlign: 'center', mb: 3, color: 'text.secondary' }}>
          Welcome back! Please enter your details.
        </Typography>

        <AuthForm onSubmit={handleSubmit}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <FormInput
            label="Email Address *"
            type="email"
            placeholder="Enter your email"
            icon="email"
            value={formData.email}
            onChange={handleChange('email')}
            disabled={loading}
            error={!!fieldErrors.email}
            helperText={fieldErrors.email}
          />
          <FormInput
            label="Password *"
            type="password"
            placeholder="••••••••"
            icon="password"
            value={formData.password}
            onChange={handleChange('password')}
            disabled={loading}
            error={!!fieldErrors.password}
            helperText={fieldErrors.password}
          />

          <AuthFooter>
            <FormControlLabel
              control={<Checkbox size="small" checked={formData.rememberMe} onChange={(e) => setFormData({...formData, rememberMe: e.target.checked})} />}
              label="Remember me"
            />
            <Link to="/forgot" style={{ fontSize: '14px', textDecoration: 'none', color: '#6b7280' }}>
              Forgot password?
            </Link>
          </AuthFooter>

          <Button full type="submit" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </Button>
        </AuthForm>

        <Typography variant="body2" sx={{ mt: 3, textAlign: 'center' }}>
          Don't have an account? <Link to="/register" style={{ color: '#0c3c82', fontWeight: 600 }}>Create Account</Link>
        </Typography>
      </AuthCard>
    </AuthLayout>
  )
}

export default AuthSignIn
