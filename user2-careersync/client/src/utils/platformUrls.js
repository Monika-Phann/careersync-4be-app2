/**
 * Platform URL utilities for student platform
 * Centralized functions to get platform URLs from environment variables
 */

/**
 * Get the mentor platform URL from environment variables
 * This ensures consistent URL usage across the student platform
 */
export const getMentorPlatformUrl = () => {
  // Try multiple environment variable names for flexibility
  const url = 
    import.meta.env.VITE_CLIENT_BASE_URL_MENTOR ||
    import.meta.env.VITE_MENTOR_PLATFORM_URL ||
    import.meta.env.VITE_MENTOR_URL ||
    // Fallback: localhost in development, production URL in production
    (import.meta.env.DEV ? 'http://localhost:5175' : 'https://mentor-4be.ptascloud.online');
  
  // Remove trailing slash if present
  return url.replace(/\/$/, '');
};

/**
 * Get the student platform URL from environment variables
 * Useful for self-referencing or redirects
 */
export const getStudentPlatformUrl = () => {
  const url = 
    import.meta.env.VITE_CLIENT_BASE_URL_STUDENT ||
    import.meta.env.VITE_STUDENT_PLATFORM_URL ||
    import.meta.env.VITE_STUDENT_URL ||
    // Fallback: localhost in development, production URL in production
    (import.meta.env.DEV ? 'http://localhost:5174' : 'https://careersync-4be.ptascloud.online');
  
  // Remove trailing slash if present
  return url.replace(/\/$/, '');
};






