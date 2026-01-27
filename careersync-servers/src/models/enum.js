module.exports = {
  // 🔹 User
  UserRole: ["admin", "mentor", "acc_user"],
  // Added "pending" to align with default in User.status
  AccountStatus: ["pending", "unverified", "verified", "blocked"],
  // 🔹 Mentor
  Gender: ["male", "female", "other"],
  ApprovalStatus: ["pending", "approved", "rejected"],

  // 🔹 AccUser
  AccUserType: ["student", "professional", "institution"],

  // 🔹 Booking
  BookingStatus: ["pending", "confirmed", "completed", "cancelled"],

  // 🔹 Payment / Invoice
  PaymentStatus: ["pending", "paid", "failed", "refunded"],
  PaymentMethod: ["card", "bank_transfer", "cash"],

  // 🔹 Mentor Documents
  DocumentType: ["cv", "certificate", "portfolio"],
};
