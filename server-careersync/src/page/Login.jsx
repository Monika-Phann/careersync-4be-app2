  // import React, { useState } from 'react';
  // import { useAuth } from '../hooks/useAuth';
  // import { Navigate } from 'react-router-dom';
  // import 'bootstrap-icons/font/bootstrap-icons.css';

  // const AdminLogin = () => {
  //   const [email, setEmail] = useState('');
  //   const [password, setPassword] = useState('');
  //   const [remember, setRemember] = useState(false);
  //   const [error, setError] = useState(null);
  //   const [submitting, setSubmitting] = useState(false);
  //   const [showPassword, setShowPassword] = useState(false); // 👈 EYE TOGGLE

  //   const { login, isAuthenticated, role, loading } = useAuth();

  //   if (!loading && isAuthenticated && role === 'admin') {
  //     return <Navigate to="/" replace />;
  //   }

  //   const handleSubmit = async (e) => {
  //     e.preventDefault();
  //     setError(null);

  //     if (!email.trim() || !password.trim()) {
  //       setError('Email and password are required.');
  //       return;
  //     }

  //     setSubmitting(true);

  //     try {
  //       const user = await login(email, password, remember);
  //       if (user.role_name !== 'admin') {
  //         setError('You do not have admin access.');
  //       }
  //     } catch (err) {
  //       const message =
  //         err.response?.data?.message || err.message || 'Login failed.';
  //       setError(message);
  //     } finally {
  //       setSubmitting(false);
  //     }
  //   };

  // return (
  //   <div
  //     className="min-vh-100 d-flex align-items-center justify-content-center"
  //     style={{
  //       background:
  //         "linear-gradient(135deg, #667eea, #764ba2, #4facfe, #38f9d7)",
  //       backgroundSize: "400% 400%",
  //       animation: "gradientBG 8s ease infinite",
  //     }}
  //   >
  //     <style>
  //       {`
  //         @keyframes gradientBG {
  //           0% { background-position: 0% 50%; }
  //           50% { background-position: 100% 50%; }
  //           100% { background-position: 0% 50%; }
  //         }

  //         .glass-card {
  //           backdrop-filter: blur(15px);
  //           background: rgba(255,255,255,0.9);
  //           transition: transform .3s ease, box-shadow .3s ease;
  //         }

  //         .glass-card:hover {
  //           transform: translateY(-5px);
  //           box-shadow: 0 30px 50px rgba(0,0,0,0.15);
  //         }

  //         .gradient-btn {
  //           background: linear-gradient(90deg,#4F46E5,#7C3AED);
  //           border: none;
  //         }

  //         .gradient-btn:hover {
  //           opacity: .95;
  //         }
  //       `}
  //     </style>

  //     <div
  //       className="card p-4 shadow-lg border-0 rounded-4 glass-card"
  //       style={{ width: "440px" }}
  //     >
  //       {/* LOGO */}
  //       <div className="text-center mb-3">
  //         <img
  //           src="/logo.svg"
  //           alt="Logo"
  //           style={{ width: "85px", height: "85px" }}
  //         />
  //       </div>

  //       <h3 className="text-center fw-bold mb-1">Admin Portal</h3>
  //       <p className="text-center text-muted mb-4">
  //         Sign in to manage CareerSync dashboard
  //       </p>

  //       {error && (
  //         <div className="alert alert-danger" role="alert">
  //           {error}
  //         </div>
  //       )}

  //       <form onSubmit={handleSubmit}>
  //         {/* EMAIL */}
  //         <div className="mb-3">
  //           <label className="form-label fw-semibold">Email Address</label>
  //           <div className="input-group input-group-lg">
  //             <span className="input-group-text">
  //               <i className="bi bi-envelope"></i>
  //             </span>
  //             <input
  //               type="email"
  //               className="form-control"
  //               placeholder="admin@example.com"
  //               value={email}
  //               onChange={(e) => setEmail(e.target.value)}
  //               required
  //             />
  //           </div>
  //         </div>

  //         {/* PASSWORD */}
  //         <div className="mb-3">
  //           <label className="form-label fw-semibold">Password</label>
  //           <div className="input-group input-group-lg">
  //             <span className="input-group-text">
  //               <i className="bi bi-lock"></i>
  //             </span>

  //             <input
  //               type={showPassword ? "text" : "password"}
  //               className="form-control"
  //               placeholder="••••••••"
  //               value={password}
  //               onChange={(e) => setPassword(e.target.value)}
  //               required
  //             />

  //             <span
  //               className="input-group-text"
  //               style={{ cursor: "pointer" }}
  //               onClick={() => setShowPassword(!showPassword)}
  //             >
  //               {showPassword ? (
  //                 <i className="bi bi-eye-slash"></i>
  //               ) : (
  //                 <i className="bi bi-eye"></i>
  //               )}
  //             </span>
  //           </div>
  //         </div>

  //         {/* REMEMBER + FORGOT */}
  //         <div className="d-flex justify-content-between align-items-center mb-3">
  //           <div className="form-check">
  //             <input
  //               className="form-check-input"
  //               type="checkbox"
  //               id="remember"
  //               checked={remember}
  //               onChange={(e) => setRemember(e.target.checked)}
  //             />
  //             <label className="form-check-label" htmlFor="remember">
  //               Remember me
  //             </label>
  //           </div>

  //           <a href="#" className="small text-primary text-decoration-none">
  //             Forgot password?
  //           </a>
  //         </div>

  //         {/* BUTTON */}
  //         <button
  //           type="submit"
  //           disabled={submitting}
  //           className="btn gradient-btn text-white w-100 btn-lg rounded-3 shadow-sm"
  //         >
  //           {submitting ? "Signing in…" : "Sign In"}
  //         </button>
  //       </form>

  //       <p className="text-center text-muted mt-4 small mb-0">
  //         © 2025 CareerSync — Admin Panel
  //       </p>
  //     </div>
  //   </div>
  // );

  // };

  // export default AdminLogin;




  import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Swal from 'sweetalert2'; // ✅ 1. Import SweetAlert2

const AdminLogin = () => {
  // Load remembered email from localStorage on mount
  const [email, setEmail] = useState(() => {
    return localStorage.getItem('rememberedEmail') || '';
  });
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(() => {
    return !!localStorage.getItem('rememberedEmail');
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, isAuthenticated, role, loading } = useAuth();

  // Redirect if already logged in
  if (!loading && isAuthenticated && role === 'admin') {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    setSubmitting(true);

    try {
      const user = await login(email, password, remember);
      
      if (user.role_name !== 'admin') {
        setError('You do not have admin access.');
      } else {
        // ✅ 2. បង្ហាញ Alert Success ពេល Login ជោគជ័យ
        // វាល្អបំផុតសម្រាប់តេស្ត CI/CD ដើម្បីដឹងថា Deployment ថ្មីដើរ
        Swal.fire({
          icon: 'success',
          title: 'Login Success!',
          text: 'Welcome to Admin Portal 🚀',
          timer: 2000,
          showConfirmButton: false,
          background: '#fff',
          iconColor: '#4F46E5'
        });
      }

    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Login failed.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{
        background:
          "linear-gradient(135deg, #667eea, #764ba2, #4facfe, #38f9d7)",
        backgroundSize: "400% 400%",
        animation: "gradientBG 8s ease infinite",
      }}
    >
      <style>
        {`
          @keyframes gradientBG {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }

          .glass-card {
            backdrop-filter: blur(15px);
            background: rgba(255,255,255,0.9);
            transition: transform .3s ease, box-shadow .3s ease;
          }

          .glass-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 30px 50px rgba(0,0,0,0.15);
          }

          .gradient-btn {
            background: linear-gradient(90deg,#4F46E5,#7C3AED);
            border: none;
          }

          .gradient-btn:hover {
            opacity: .95;
          }
        `}
      </style>

      <div
        className="card p-4 shadow-lg border-0 rounded-4 glass-card"
        style={{ width: "440px" }}
      >
        {/* LOGO */}
        <div className="text-center mb-3">
          <img
            src="/logo.svg"
            alt="Logo"
            style={{ width: "85px", height: "85px" }}
          />
        </div>

        <h3 className="text-center fw-bold mb-1">Admin Portal</h3>
        <p className="text-center text-muted mb-4">
          Sign in to manage CareerSync dashboard
        </p>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* EMAIL */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Email Address</label>
            <div className="input-group input-group-lg">
              <span className="input-group-text">
                <i className="bi bi-envelope"></i>
              </span>
              <input
                type="email"
                className="form-control"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Password</label>
            <div className="input-group input-group-lg">
              <span className="input-group-text">
                <i className="bi bi-lock"></i>
              </span>

              <input
                type={showPassword ? "text" : "password"}
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <span
                className="input-group-text"
                style={{ cursor: "pointer" }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <i className="bi bi-eye-slash"></i>
                ) : (
                  <i className="bi bi-eye"></i>
                )}
              </span>
            </div>
          </div>

          {/* REMEMBER + FORGOT */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="remember"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="remember">
                Remember me
              </label>
            </div>

            {/* <a href="#" className="small text-primary text-decoration-none">
              Forgot password?
            </a> */}
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={submitting}
            className="btn gradient-btn text-white w-100 btn-lg rounded-3 shadow-sm"
          >
            {submitting ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-muted mt-4 small mb-0">
          © 2025 CareerSync — Admin Panel
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;