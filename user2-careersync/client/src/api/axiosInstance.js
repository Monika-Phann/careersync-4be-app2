import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Automatically attach the token to every request if it exists
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  // If data is FormData, remove Content-Type header so browser can set it with boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  
  return config
}, (error) => {
  return Promise.reject(error)
})

// Handle response errors (like 401 Unauthorized) in one place
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Auto-logout on expired/invalid token
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      // Let the app clear any in-memory auth state
      window.dispatchEvent(new Event('auth:logout'))

      // Redirect to /signin (avoid infinite redirect loop)
      if (window.location?.pathname !== '/signin') {
        window.location.assign('/signin')
      }
    }
    return Promise.reject(error)
  }
)

export default axiosInstance