import React from 'react'
import { Routes, Route } from 'react-router-dom'
import DashboardLayout from '../components/UI/DashboardLayout'
import VerifyEmail from '../pages/Auth/VerifyEmail'
import SSOHandler from '../pages/Auth/SSOHandler' // <--- The new import
import Home from '../pages/Home/Home'
import About from '../pages/About/About'
import Services from '../pages/Services/Services'
import Contact from '../pages/Contact/Contact'
import OverallSchedule from '../pages/Schedule/OverallSchedule'
import CreateUpdateSchedule from '../pages/Schedule/CreateUpdateSchedule'
import TotalBookings from '../pages/Bookings/TotalBookings'
import TotalBookingRequests from '../pages/Bookings/TotalBookingRequests'
import UserManagement from '../pages/Users/UserManagement'
import Certification from '../pages/Certification/Certification'
import EarningSummary from '../pages/Payments/EarningSummary'
import TotalInvoice from '../pages/Payments/TotalInvoice'
import Settings from '../pages/Settings/Settings'
import SessionProfile from '../pages/SessionProfile/SessionProfile'
import SessionSchedule from '../pages/SessionSchedule/SessionSchedule'
import AllAvailableTimes from '../pages/SessionSchedule/AllAvailableTimes'
import MentorProfile from '../pages/MentorProfile/MentorProfile'
import NotFound from '../components/NotFound/NotFound'

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/verify-email" element={<VerifyEmail />} />
      
      {/* SSO Bridge Route */}
      <Route path="/auth/sso" element={<SSOHandler />} />

      {/* Protected Dashboard Routes */}
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<Home />} />
        <Route path="mentor/dashboard" element={<Home />} /> {/* Alias for home dashboard */}
        <Route path="about" element={<About />} />
        <Route path="services" element={<Services />} />
        <Route path="contact" element={<Contact />} />
        <Route path="schedule" element={<OverallSchedule />} />
        <Route path="schedule/create" element={<CreateUpdateSchedule />} />
        <Route path="bookings" element={<TotalBookings />} />
        <Route path="booking-requests" element={<TotalBookingRequests />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="certification" element={<Certification />} />
        <Route path="earnings" element={<EarningSummary />} />
        <Route path="invoices" element={<TotalInvoice />} />
        <Route path="settings" element={<Settings />} />
        <Route path="session-profile" element={<SessionProfile />} />
        <Route path="mentor-profile" element={<MentorProfile />} />
        <Route path="session-schedule" element={<SessionSchedule />} />
        <Route path="session-schedule/available-times" element={<AllAvailableTimes />} />
      </Route>

      {/* --- 404 Catch-All Route --- */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default AppRoutes
