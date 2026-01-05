import { Routes, Route } from 'react-router-dom'

// Core Pages
import Home from '../pages/Home/Home'
import Programs from '../pages/Programs/Programs'
import About from '../pages/About/About'
import Contact from '../pages/Contact/Contact'

// Mentor Discovery & Details
import MentorBrowse from '../pages/Programs/MentorBrowse'
import MentorDetails from '../pages/Programs/MentorDetails'

// Auth Pages
import AuthSignIn from '../pages/Auth/AuthSignIn/AuthSignIn'
import ForgotPassword from '../pages/Auth/ForgotPassword/ForgotPassword'
import ResetPassword from '../pages/Auth/ResetPassword/ResetPassword'
import ResetSuccess from '../pages/Auth/ResetSuccess/ResetSuccess'
import Register from '../pages/Auth/StudentRegister/Register'
import MentorRegister from '../pages/MentorRegister/MentorRegister'
import VerifyEmail from '../pages/Auth/VerifyEmail/VerifyEmail'

// Account Pages
import ProfilePage from '../pages/Account/ProfilePage'
import AccountSecurity from '../pages/Account/Security/AccountSecurity'
import BookingHistory from '../pages/Account/Bookings/BookingHistory'
import CertificatesPage from '../pages/Account/Certificates/CertificatesPage'

// Admin Pages
import MentorList from '../pages/Admin/MentorList'
import MentorDetail from '../pages/Admin/MentorDetail'
import IndustryManagement from '../pages/Admin/IndustryManagement'
import PositionManagement from '../pages/Admin/PositionManagement'
import TermsAndConditions from '../pages/TermsAndConditions/TermsAndConditions'
import PrivacyPolicy from '../pages/PrivacyPolicy/PrivacyPolicy'
import NotFound from '../components/NotFound/NotFound'

function AppRoutes() {
  return (
    <Routes>
      {/* --- Public Informational Routes --- */}
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/terms" element={<TermsAndConditions />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />

      {/* --- Program & Mentor Discovery --- */}
      {/* Programs acts as your category high-level landing page */}
      <Route path="/programs" element={<Programs defaultCategory="All Industries" />} />
      
      {/* Mentors handles the searchable list and specific profiles */}
      <Route path="/mentors" element={<MentorBrowse />} />
      <Route path="/mentor/:id" element={<MentorDetails />} />

      {/* --- Authentication Flow --- */}
      <Route path="/signin" element={<AuthSignIn />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot" element={<ForgotPassword />} />
      <Route path="/reset/:resetToken?" element={<ResetPassword />} />
      <Route path="/reset-success" element={<ResetSuccess />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/mentor-register" element={<MentorRegister />} />
      <Route path="/mentor-login" element={<MentorRegister />} />

      {/* --- User Account & Dashboard --- */}
      <Route path="/student/dashboard" element={<ProfilePage />} /> {/* Alias for /account */}
      <Route path="/account" element={<ProfilePage />} />
      <Route path="/account/security" element={<AccountSecurity />} />
      <Route path="/account/bookings" element={<BookingHistory />} />
      <Route path="/account/certificates" element={<CertificatesPage />} />

      {/* --- Admin Routes --- */}
      <Route path="/admin/mentors" element={<MentorList />} />
      <Route path="/admin/mentors/:id" element={<MentorDetail />} />
      <Route path="/admin/industries" element={<IndustryManagement />} />
      <Route path="/admin/positions" element={<PositionManagement />} />

      {/* --- 404 Catch-All Route --- */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default AppRoutes