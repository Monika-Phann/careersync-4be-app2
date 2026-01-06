// Polyfill for process.env (required for some libraries in browser environment)
// This must run before any other imports that might use process.env

if (typeof process === 'undefined') {
  const processPolyfill = {
    env: {
      NODE_ENV: import.meta.env?.MODE || 'development',
    },
  };
  // Make process available globally
  if (typeof window !== 'undefined') {
    window.process = processPolyfill;
  }
  // Also try to set it on globalThis for better compatibility
  if (typeof globalThis !== 'undefined') {
    globalThis.process = processPolyfill;
  }
  // For non-strict mode compatibility
  try {
    // @ts-ignore
    if (typeof global !== 'undefined') {
      global.process = processPolyfill;
    }
  } catch (e) {
    // Ignore if global is not available
  }
} else if (!process.env) {
  process.env = {
    NODE_ENV: import.meta.env?.MODE || 'development',
  };
}








