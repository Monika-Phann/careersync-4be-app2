import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button as MuiButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  IconButton,
  TextField,
  Grid,
} from "@mui/material";
import { Add as AddIcon, Close as CloseIcon } from "@mui/icons-material";
import { useNavigate, useLocation, Link as RouterLink } from "react-router-dom";
import * as yup from "yup";
import Button from "../../components/UI/Button/Button";
import FormInput from "../../components/UI/FormInput/FormInput";
import PasswordField from "../../components/Registration/PasswordField";
import { useAuth } from "../../context/AuthContext";
import { registerMentor, applyAsMentor } from "../../services/mentorService";
import { login as loginUser } from "../../services/authService";
import axios from "axios";
import { motion } from "framer-motion";
import { getMentorPlatformUrl } from "../../utils/platformUrls";
import {
  Section,
  Layout,
  CardBox,
  ProfileCircle,
  UploadHint,
  WarningBox,
  FormCard,
  InputGrid,
  TextArea,
  CheckboxRow,
} from "./MentorRegister.styles";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";
const API_URL = `${API_BASE}/api`;

// Yup validation schema for mentor registration
const mentorRegisterSchema = yup.object({
  profilePicture: yup.mixed().nullable().notRequired(),
  email: yup
    .string()
    .trim()
    .email("Please enter a valid email address")
    .required("Email is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/[0-9]/, "Password must contain at least one number")
    .matches(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character"
    )
    .required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Please confirm your password"),
  firstName: yup
    .string()
    .trim()
    .required("First name is required")
    .min(2, "First name must be at least 2 characters"),
  lastName: yup
    .string()
    .trim()
    .required("Last name is required")
    .min(2, "Last name must be at least 2 characters"),
  phone: yup
    .string()
    .trim()
    .matches(/^(?:0\d{8,9}|\+855\d{8,9})$/, "Phone must start with 0 or +855")
    .required("Phone number is required"),
  dateOfBirth: yup.string().required("Date of birth is required"),
  gender: yup.string().required("Gender is required"),
  industry: yup.string().trim().required("Industry is required"),
  position: yup.string().trim().required("Position is required"),
  jobTitle: yup
    .string()
    .trim()
    .required("Job title is required")
    .min(2, "Job title must be at least 2 characters"),
  yearsOfExperience: yup
    .string()
    .trim()
    .required("Years of experience is required"),
  cvLink: yup
    .string()
    .trim()
    .url("Please enter a valid URL")
    .required("CV/LinkedIn link is required"),
  termsAccepted: yup
    .boolean()
    .oneOf([true], "You must accept the Terms and Conditions"),
});

function MentorRegister() {
  const { isAuthenticated, user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're in login mode based on route
  const isLoginMode =
    location.pathname === "/mentor-login" ||
    location.pathname === "/mentor/signin";
  const [profilePreview, setProfilePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [formData, setFormData] = useState({
    profilePicture: null,
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    industry: "",
    position: "",
    jobTitle: "",
    expertiseAreas: "",
    yearsOfExperience: "",
    cvLink: "",
    company: "",
    linkedIn: "",
    education: [], // Array of education entries: [{ degree: "", year: "", institution: "" }]
    about: "",
    mentorDocuments: [], // Array of File objects for document uploads
    termsAccepted: false,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // ✅ NEW: State for industries and positions from admin
  const [industries, setIndustries] = useState([]);
  const [positions, setPositions] = useState([]);
  const [filteredPositions, setFilteredPositions] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // ✅ NEW: Fetch industries and positions on component mount
  useEffect(() => {
    const fetchIndustriesAndPositions = async () => {
      try {
        setLoadingData(true);
        console.log("Fetching industries and positions...");

        const [industriesRes, positionsRes] = await Promise.all([
          axios.get(`${API_URL}/industries`),
          axios.get(`${API_URL}/positions`),
        ]);

        console.log("Industries response:", industriesRes.data);
        console.log("Positions response:", positionsRes.data);

        setIndustries(industriesRes.data || []);
        setPositions(positionsRes.data || []);
      } catch (error) {
        console.error("Error fetching industries/positions:", error);
        console.error("Error response:", error.response?.data);
        setSubmitError(
          "Failed to load industries and positions. Please refresh the page."
        );
      } finally {
        setLoadingData(false);
      }
    };

    fetchIndustriesAndPositions();
  }, []);

  // ✅ NEW: Filter positions when industry changes
  useEffect(() => {
    if (formData.industry) {
      const filtered = positions.filter(
        (pos) => pos.industry_id === formData.industry
      );
      setFilteredPositions(filtered);

      // Clear position if it doesn't match the selected industry
      if (
        formData.position &&
        !filtered.find((p) => p.id === formData.position)
      ) {
        setFormData((prev) => ({ ...prev, position: "" }));
      }
    } else {
      setFilteredPositions([]);
      setFormData((prev) => ({ ...prev, position: "" }));
    }
  }, [formData.industry, positions]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password)
    );
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[\d\s()+-]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 10;
  };

  const validateURL = (url) => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleInputChange = async (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Validate using Yup if field is touched
    if (touched[field]) {
      try {
        await mentorRegisterSchema.validateAt(field, {
          ...formData,
          [field]: value,
        });
        // Clear error if validation passes
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      } catch (err) {
        setErrors((prev) => ({
          ...prev,
          [field]: err.message,
        }));
      }
    }
  };

  const handleBlur = async (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    // Validate using Yup
    try {
      await mentorRegisterSchema.validateAt(field, formData);
      // Clear error if validation passes
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        [field]: err.message,
      }));
    }
  };

  const validateField = (field, value) => {
    const newErrors = { ...errors };

    switch (field) {
      case "profilePicture":
        if (!value) {
          newErrors.profilePicture = "Profile picture is required";
        } else {
          delete newErrors.profilePicture;
        }
        break;
      case "email":
        if (!value) {
          newErrors.email = "Email is required";
        } else if (!validateEmail(value)) {
          newErrors.email = "Please enter a valid email address";
        } else {
          delete newErrors.email;
        }
        break;
      case "password":
        if (!value) {
          newErrors.password = "Password is required";
        } else if (!validatePassword(value)) {
          newErrors.password =
            "Password must be at least 8 characters with uppercase, lowercase, and numbers";
        } else {
          delete newErrors.password;
        }
        if (touched.confirmPassword && formData.confirmPassword !== value) {
          newErrors.confirmPassword = "Passwords do not match";
        } else if (touched.confirmPassword) {
          delete newErrors.confirmPassword;
        }
        break;
      case "confirmPassword":
        if (!value) {
          newErrors.confirmPassword = "Please confirm your password";
        } else if (value !== formData.password) {
          newErrors.confirmPassword = "Passwords do not match";
        } else {
          delete newErrors.confirmPassword;
        }
        break;
      case "firstName":
      case "lastName":
        if (!value.trim()) {
          newErrors[field] = `${
            field === "firstName" ? "First" : "Last"
          } name is required`;
        } else {
          delete newErrors[field];
        }
        break;
      case "phone":
        if (!value) {
          newErrors.phone = "Phone number is required";
        } else if (!validatePhone(value)) {
          newErrors.phone = "Please enter a valid phone number";
        } else {
          delete newErrors.phone;
        }
        break;
      case "dateOfBirth":
        if (!value) {
          newErrors.dateOfBirth = "Date of birth is required";
        } else {
          delete newErrors.dateOfBirth;
        }
        break;
      case "gender":
        if (!value) {
          newErrors.gender = "Gender is required";
        } else {
          delete newErrors.gender;
        }
        break;
      case "industry":
      case "position":
        if (!value || !value.trim()) {
          newErrors[field] = `${
            field === "industry" ? "Industry" : "Position"
          } is required`;
        } else {
          delete newErrors[field];
        }
        break;
      case "jobTitle":
      case "yearsOfExperience":
      case "cvLink":
        if (!value.trim()) {
          newErrors[field] = "This field is required";
        } else {
          delete newErrors[field];
        }
        if (field === "cvLink" && value && !validateURL(value)) {
          newErrors.cvLink = "Please enter a valid URL";
        }
        break;
      case "termsAccepted":
        if (!value) {
          newErrors.termsAccepted =
            "You must agree to the terms and conditions";
        } else {
          delete newErrors.termsAccepted;
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
  };

  const handleProfileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setProfilePreview(url);
    setFormData((prev) => ({ ...prev, profilePicture: file }));
    setTouched((prev) => ({ ...prev, profilePicture: true }));
    validateField("profilePicture", file);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitError("");
    setSubmitSuccess(false);

    // Validate login fields
    if (!formData.email?.trim()) {
      setSubmitError("Email is required");
      setLoading(false);
      return;
    }
    if (!formData.password) {
      setSubmitError("Password is required");
      setLoading(false);
      return;
    }

    try {
      const result = await loginUser({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (!result.success) {
        setSubmitError(result.message || "Login failed. Please try again.");
        return;
      }

      const { user: userData, accessToken, token } = result.data || {};
      const finalToken = accessToken || token;

      // Check email verification
      if (
        userData &&
        (userData.emailVerified === false || userData.email_verified === false)
      ) {
        setSubmitError("Please verify your email before signing in.");
        return;
      }

      if (!userData || !finalToken) {
        setSubmitError("Login response was missing user or token.");
        return;
      }

      // Check if user is a mentor
      const userRole = userData.role || userData.role_name;
      if (userRole === "mentor") {
        // Redirect mentors to the mentor platform
        const mentorPlatformUrl = getMentorPlatformUrl();

        // IMPORTANT: Clear student platform auth state before redirecting
        // This ensures mentors are NOT logged in on the student platform when they return
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");

        // Note: We don't call login() for mentors - just clear localStorage and redirect
        const redirectUrl = `${mentorPlatformUrl}?token=${encodeURIComponent(
          finalToken
        )}`;
        window.location.href = redirectUrl;
        return; // Exit early
      }

      // For non-mentors, process user data and login normally
      const processedUser = {
        ...userData,
        firstName: userData.firstName || userData.firstname || "",
        lastName: userData.lastName || userData.lastname || "",
        avatar: userData.avatar || userData.profileImage || null,
        profileImage: userData.profileImage || userData.avatar || null,
      };

      login(processedUser, finalToken);
      setSubmitSuccess(true);

      // Redirect to mentor dashboard or mentors page
      setTimeout(() => {
        navigate("/mentors");
      }, 1000);
    } catch (error) {
      console.error("Login error:", error);
      setSubmitError(
        error.message || "An unexpected error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // If in login mode, handle login instead
    if (isLoginMode) {
      handleLogin(e);
      return;
    }

    // Mark all required fields as touched
    const requiredFields = [
      "profilePicture",
      "email",
      "password",
      "confirmPassword",
      "firstName",
      "lastName",
      "phone",
      "dateOfBirth",
      "gender",
      "industry",
      "position",
      "jobTitle",
      "yearsOfExperience",
      "cvLink",
      "termsAccepted",
    ];
    const newTouched = {};
    requiredFields.forEach((field) => {
      newTouched[field] = true;
    });
    setTouched(newTouched);

    // Validate using Yup
    try {
      await mentorRegisterSchema.validate(formData, { abortEarly: false });
      // Clear all errors if validation passes
      const finalErrors = {};
      // Check profile picture separately (not in schema)
      if (!formData.profilePicture) {
        finalErrors.profilePicture = "Profile picture is required";
      }
      setErrors(finalErrors);

      // If no errors, submit the form
      if (Object.keys(finalErrors).length === 0) {
        handleSubmitForm();
      }
    } catch (validationError) {
      const formattedErrors = {};
      if (validationError.inner) {
        validationError.inner.forEach((err) => {
          if (err.path) {
            formattedErrors[err.path] = err.message;
          }
        });
      }
      // Check profile picture separately (not in schema)
      if (!formData.profilePicture) {
        formattedErrors.profilePicture = "Profile picture is required";
      }
      setErrors(formattedErrors);
    }
  };

  const handleSubmitForm = async () => {
    setLoading(true);
    setSubmitError("");
    setSubmitSuccess(false);

    try {
      // Prepare documents metadata from cvLink
      const documents = [];
      if (formData.cvLink) {
        documents.push({
          document_type: "cv",
          document_url: formData.cvLink,
          is_primary_cv: true,
        });
      }

      // Prepare education metadata from education array
      const education = (formData.education || [])
        .map((edu) => ({
          university_name: edu.institution || "",
          degree_name: edu.degree || "",
          year_graduated: edu.year ? parseInt(edu.year) : null,
          grade_gpa: null,
          activities: null,
        }))
        .filter((edu) => edu.university_name || edu.degree_name); // Only include entries with at least one field

      // Prepare registration data
      const registrationData = {
        profilePicture: formData.profilePicture,
        mentorDocuments: formData.mentorDocuments,
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        industry: formData.industry, // ID from dropdown
        position: formData.position, // ID from dropdown
        jobTitle: formData.jobTitle,
        expertiseAreas: formData.expertiseAreas,
        yearsOfExperience: formData.yearsOfExperience,
        company: formData.company,
        linkedIn: formData.linkedIn,
        about: formData.about,
        documents: documents,
        education: education,
      };

      // Validate that industry and position are provided (IDs from dropdown)
      if (!formData.industry) {
        setSubmitError("Industry is required");
        setLoading(false);
        return;
      }

      if (!formData.position) {
        setSubmitError("Position is required");
        setLoading(false);
        return;
      }

      console.log("Submitting mentor registration:", {
        ...registrationData,
        password: "***",
        profilePicture: formData.profilePicture
          ? `[File: ${formData.profilePicture.name}]`
          : null,
        mentorDocuments: formData.mentorDocuments.map(
          (f) => `[File: ${f.name}]`
        ),
        isAuthenticated,
        industry: formData.industry,
        position: formData.position,
      });

      // Use applyAsMentor for logged-in users, registerMentor for guests
      // Note: Email can be edited, but backend will validate that email doesn't already exist
      const result = isAuthenticated
        ? await applyAsMentor(registrationData)
        : await registerMentor(registrationData);

      if (result.success) {
        setSubmitSuccess(true);
        setSubmitError("");
        setShowApprovalModal(true);
        // Don't redirect - show modal instead
      } else {
        setSubmitError(
          result.message || "Registration failed. Please try again."
        );
        setSubmitSuccess(false);
      }
    } catch (error) {
      console.error("Mentor registration error:", error);
      setSubmitError(
        error.message || "An unexpected error occurred. Please try again."
      );
      setSubmitSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setFormData((prev) => ({
        ...prev,
        mentorDocuments: [...(prev.mentorDocuments || []), ...files],
      }));
    }
  };

  return (
    <Section
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <form onSubmit={handleSubmit}>
        <Layout>
          <CardBox>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, textAlign: "center", color: "#111827" }}
            >
              Become a Mentor
            </Typography>
            <Typography
              variant="body2"
              sx={{ textAlign: "center", color: "#6b7280", marginBottom: 1 }}
            >
              Guide the next generation
            </Typography>
            <Box
              sx={{
                position: "relative",
                display: "grid",
                placeItems: "center",
              }}
            >
              <ProfileCircle
                component="label"
                htmlFor="mentor-profile-upload"
                sx={{
                  cursor: "pointer",
                  backgroundImage: profilePreview
                    ? `url(${profilePreview})`
                    : "none",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  border:
                    touched.profilePicture && errors.profilePicture
                      ? "2px solid #ef4444"
                      : "1px solid #d5d7db",
                }}
              >
                {!formData.profilePicture && "👤"}
              </ProfileCircle>
              <input
                id="mentor-profile-upload"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleProfileUpload}
              />
            </Box>
            <UploadHint>Upload your profile picture *</UploadHint>
            {touched.profilePicture && errors.profilePicture && (
              <WarningBox sx={{ mt: 1, mb: 0 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: "#92400e",
                    fontSize: "12px",
                    textAlign: "center",
                  }}
                >
                  {errors.profilePicture}
                </Typography>
              </WarningBox>
            )}

            <Box sx={{ marginTop: 3 }}>
              <Box sx={{ display: "grid", gap: 1.4 }}>
                <FormInput
                  label="Email Address *"
                  type="email"
                  placeholder="your.email@example.com"
                  icon="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  onBlur={() => handleBlur("email")}
                  error={touched.email && !!errors.email}
                  helperText={touched.email && errors.email ? errors.email : ""}
                />
                <PasswordField
                  label="Password *"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  onBlur={() => handleBlur("password")}
                  error={touched.password && !!errors.password}
                  helperText={touched.password && errors.password}
                  required
                />
                <PasswordField
                  label="Re-enter Password *"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  onBlur={() => handleBlur("confirmPassword")}
                  error={touched.confirmPassword && !!errors.confirmPassword}
                  helperText={touched.confirmPassword && errors.confirmPassword}
                  required
                />
              </Box>
            </Box>
          </CardBox>

          <Box sx={{ display: "grid", gap: 2 }}>
            <WarningBox>
              <strong>Important:</strong> As a mentor, you&apos;ll help guide
              mentee through their career journey. Your profile will be reviewed
              to ensure quality mentorship experiences.
            </WarningBox>
            <Typography
              variant="h5"
              sx={{ textAlign: "center", fontWeight: 700, color: "#111827" }}
            >
              Mentor Registration
            </Typography>

            <FormCard>
              <InputGrid>
                <FormInput
                  label="First Name *"
                  placeholder="John"
                  icon="user"
                  value={formData.firstName}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  onBlur={() => handleBlur("firstName")}
                  error={touched.firstName && !!errors.firstName}
                  helperText={touched.firstName && errors.firstName}
                />
                <FormInput
                  label="Last Name *"
                  placeholder="Doe"
                  icon="user"
                  value={formData.lastName}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value)
                  }
                  onBlur={() => handleBlur("lastName")}
                  error={touched.lastName && !!errors.lastName}
                  helperText={touched.lastName && errors.lastName}
                />
              </InputGrid>
              <InputGrid>
                <FormInput
                  label="Phone Number *"
                  placeholder="+1 (555) 000-0000"
                  icon="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  onBlur={() => handleBlur("phone")}
                  error={touched.phone && !!errors.phone}
                  helperText={touched.phone && errors.phone}
                />
                <FormInput
                  label="Date of Birth *"
                  placeholder="MM/DD/YYYY"
                  icon="date"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) =>
                    handleInputChange("dateOfBirth", e.target.value)
                  }
                  onBlur={() => handleBlur("dateOfBirth")}
                  error={touched.dateOfBirth && !!errors.dateOfBirth}
                  helperText={touched.dateOfBirth && errors.dateOfBirth}
                  InputLabelProps={{ shrink: true }}
                />
              </InputGrid>

              <Box sx={{ marginBottom: "14px" }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: "#111827", marginBottom: 0.5 }}
                >
                  Gender *
                </Typography>
                <RadioGroup
                  row
                  name="gender"
                  value={formData.gender}
                  onChange={(e) => {
                    handleInputChange("gender", e.target.value);
                    handleBlur("gender");
                  }}
                >
                  <FormControlLabel
                    control={<Radio size="small" />}
                    label="Male"
                    value="Male"
                  />
                  <FormControlLabel
                    control={<Radio size="small" />}
                    label="Female"
                    value="Female"
                  />
                </RadioGroup>
                {touched.gender && errors.gender && (
                  <Typography
                    variant="caption"
                    sx={{ color: "#ef4444", mt: 0.5, display: "block" }}
                  >
                    {errors.gender}
                  </Typography>
                )}
              </Box>

              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700, color: "#111827", margin: "10px 0 8px" }}
              >
                Professional Information
              </Typography>
              <InputGrid>
                {/* ✅ Industry Dropdown */}
                <FormControl
                  fullWidth
                  error={touched.industry && !!errors.industry}
                  sx={{
                    mb: 2,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "12px",
                      backgroundColor: "#f9fafb",
                    },
                  }}
                >
                  <InputLabel>Industry *</InputLabel>
                  <Select
                    value={formData.industry}
                    onChange={(e) =>
                      handleInputChange("industry", e.target.value)
                    }
                    onBlur={() => handleBlur("industry")}
                    label="Industry *"
                    disabled={loadingData}
                  >
                    {industries.map((industry) => (
                      <MenuItem key={industry.id} value={industry.id}>
                        {industry.industry_name}
                      </MenuItem>
                    ))}
                  </Select>
                  {touched.industry && errors.industry && (
                    <FormHelperText>{errors.industry}</FormHelperText>
                  )}
                </FormControl>

                {/* ✅ Position Dropdown (filtered by industry) */}
                <FormControl
                  fullWidth
                  error={touched.position && !!errors.position}
                  sx={{
                    mb: 2,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "12px",
                      backgroundColor: "#f9fafb",
                    },
                  }}
                >
                  <InputLabel>Position *</InputLabel>
                  <Select
                    value={formData.position}
                    onChange={(e) =>
                      handleInputChange("position", e.target.value)
                    }
                    onBlur={() => handleBlur("position")}
                    label="Position *"
                    disabled={!formData.industry || loadingData}
                  >
                    {filteredPositions.length === 0 && formData.industry && (
                      <MenuItem disabled>
                        No positions available for this industry
                      </MenuItem>
                    )}
                    {filteredPositions.map((position) => (
                      <MenuItem key={position.id} value={position.id}>
                        {position.position_name}
                      </MenuItem>
                    ))}
                  </Select>
                  {touched.position && errors.position && (
                    <FormHelperText>{errors.position}</FormHelperText>
                  )}
                  {!formData.industry && (
                    <FormHelperText>
                      Please select an industry first
                    </FormHelperText>
                  )}
                </FormControl>
              </InputGrid>
              <InputGrid>
                <FormInput
                  label="Job Title *"
                  placeholder="e.g., Senior Software Developer"
                  icon="briefcase"
                  value={formData.jobTitle}
                  onChange={(e) =>
                    handleInputChange("jobTitle", e.target.value)
                  }
                  onBlur={() => handleBlur("jobTitle")}
                  error={touched.jobTitle && !!errors.jobTitle}
                  helperText={touched.jobTitle && errors.jobTitle}
                />
                <FormInput
                  label="Expertise Areas"
                  placeholder="e.g., Software Development, AI"
                  icon="briefcase"
                  value={formData.expertiseAreas}
                  onChange={(e) =>
                    handleInputChange("expertiseAreas", e.target.value)
                  }
                />
              </InputGrid>
              <InputGrid>
                <FormInput
                  label="Years of Experience *"
                  placeholder="e.g., 5"
                  icon="briefcase"
                  value={formData.yearsOfExperience}
                  onChange={(e) =>
                    handleInputChange("yearsOfExperience", e.target.value)
                  }
                  onBlur={() => handleBlur("yearsOfExperience")}
                  error={
                    touched.yearsOfExperience && !!errors.yearsOfExperience
                  }
                  helperText={
                    touched.yearsOfExperience && errors.yearsOfExperience
                  }
                />
                <FormInput
                  label="Link to CV or Portfolio *"
                  placeholder="e.g., https://drive.google.com/your-cv"
                  icon="briefcase"
                  value={formData.cvLink}
                  onChange={(e) => handleInputChange("cvLink", e.target.value)}
                  onBlur={() => handleBlur("cvLink")}
                  error={touched.cvLink && !!errors.cvLink}
                  helperText={touched.cvLink && errors.cvLink}
                />
              </InputGrid>
              <InputGrid>
                <FormInput
                  label="Company"
                  placeholder="e.g., Google, Freelance"
                  icon="briefcase"
                  value={formData.company}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                />
                <FormInput
                  label="LinkedIn Profile (Optional)"
                  placeholder="linkedin.com/in/yourprofile"
                  icon="briefcase"
                  value={formData.linkedIn}
                  onChange={(e) =>
                    handleInputChange("linkedIn", e.target.value)
                  }
                />
              </InputGrid>

              <Box sx={{ margin: "16px 0" }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 700,
                      color: "#06112E",
                      fontSize: "1.1rem",
                    }}
                  >
                    Education
                  </Typography>
                  <Button
                    variant="secondary"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        education: [
                          ...(prev.education || []),
                          { degree: "", year: "", institution: "" },
                        ],
                      }));
                    }}
                  >
                    Add Education
                  </Button>
                </Box>

                {formData.education && formData.education.length > 0 ? (
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    {formData.education.map((edu, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: "flex",
                          gap: 1,
                          alignItems: "flex-start",
                        }}
                      >
                        <Grid container spacing={1} sx={{ flex: 1 }}>
                          <Grid item xs={12} sm={4}>
                            <TextField
                              fullWidth
                              placeholder="Degree"
                              value={edu.degree || ""}
                              onChange={(e) => {
                                const newEducation = [...formData.education];
                                newEducation[index] = {
                                  ...newEducation[index],
                                  degree: e.target.value,
                                };
                                setFormData((prev) => ({
                                  ...prev,
                                  education: newEducation,
                                }));
                              }}
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: 1,
                                },
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <TextField
                              fullWidth
                              placeholder="Year"
                              value={edu.year || ""}
                              onChange={(e) => {
                                const newEducation = [...formData.education];
                                newEducation[index] = {
                                  ...newEducation[index],
                                  year: e.target.value,
                                };
                                setFormData((prev) => ({
                                  ...prev,
                                  education: newEducation,
                                }));
                              }}
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: 1,
                                },
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <TextField
                              fullWidth
                              placeholder="Institution"
                              value={edu.institution || ""}
                              onChange={(e) => {
                                const newEducation = [...formData.education];
                                newEducation[index] = {
                                  ...newEducation[index],
                                  institution: e.target.value,
                                };
                                setFormData((prev) => ({
                                  ...prev,
                                  education: newEducation,
                                }));
                              }}
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: 1,
                                },
                              }}
                            />
                          </Grid>
                        </Grid>
                        <IconButton
                          onClick={() => {
                            const newEducation = formData.education.filter(
                              (_, i) => i !== index
                            );
                            setFormData((prev) => ({
                              ...prev,
                              education: newEducation,
                            }));
                          }}
                          sx={{
                            color: "#d32f2f",
                            mt: 1,
                            p: 0.5,
                            "&:hover": {
                              bgcolor: "#ffebee",
                            },
                          }}
                          size="small"
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography
                    variant="body2"
                    sx={{ color: "#666", fontStyle: "italic", py: 2 }}
                  >
                    No education entries. Click "Add Education" to add your
                    educational background.
                  </Typography>
                )}
              </Box>

              <Box sx={{ margin: "16px 0" }}>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 700, color: "#111827", marginBottom: 0.5 }}
                >
                  About You
                </Typography>
                <TextArea
                  placeholder="Tell mentees about your background, experience, and what you can help them with..."
                  value={formData.about}
                  onChange={(e) => handleInputChange("about", e.target.value)}
                />
              </Box>

              <CheckboxRow>
                <Checkbox
                  size="small"
                  checked={formData.termsAccepted}
                  onChange={(e) => {
                    const newValue = e.target.checked;
                    setFormData((prev) => ({
                      ...prev,
                      termsAccepted: newValue,
                    }));
                    setTouched((prev) => ({ ...prev, termsAccepted: true }));
                    validateField("termsAccepted", newValue);
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  I agree to the{" "}
                  <RouterLink
                    to="/terms"
                    style={{ color: "#1976d2", textDecoration: "underline" }}
                  >
                    Terms and Conditions
                  </RouterLink>{" "}
                  and{" "}
                  <RouterLink
                    to="/privacy"
                    style={{ color: "#1976d2", textDecoration: "underline" }}
                  >
                    Privacy Policy
                  </RouterLink>
                  .
                </Typography>
              </CheckboxRow>
              {touched.termsAccepted && errors.termsAccepted && (
                <Typography
                  variant="caption"
                  sx={{ color: "#ef4444", mt: -2, mb: 2, display: "block" }}
                >
                  {errors.termsAccepted}
                </Typography>
              )}

              {submitError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {submitError}
                </Alert>
              )}

              {submitSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Your application has been submitted successfully!
                </Alert>
              )}

              <Button
                full
                variant="secondary"
                type="submit"
                disabled={loading}
                startIcon={
                  loading ? (
                    <CircularProgress size={20} sx={{ color: "inherit" }} />
                  ) : null
                }
              >
                {loading ? "Submitting..." : "Submit Mentor Application"}
              </Button>
            </FormCard>
          </Box>
        </Layout>
      </form>

      {/* Admin Approval Modal */}
      <Dialog
        open={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            Application Submitted Successfully! 🎉
          </Typography>
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            <Typography variant="body1" paragraph>
              Thank you for submitting your mentor application!
            </Typography>
            <Typography variant="body1" paragraph>
              <strong>Step 1: Verify Your Email</strong>
            </Typography>
            <Typography variant="body2" paragraph sx={{ pl: 2 }}>
              We've sent a verification email to your inbox. Please check your
              email and click the verification link to activate your account.
            </Typography>
            <Typography variant="body1" paragraph sx={{ mt: 2 }}>
              <strong>Step 2: Admin Review</strong>
            </Typography>
            <Typography variant="body2" paragraph sx={{ pl: 2 }}>
              After you verify your email, your application will be reviewed by
              our admin team. You will receive an email notification once a
              decision has been made.
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 2, fontStyle: "italic" }}
            >
              Note: You cannot log in until both email verification and admin
              approval are complete.
            </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <MuiButton
            onClick={() => {
              setShowApprovalModal(false);
              navigate("/");
            }}
            variant="contained"
            fullWidth
            sx={{ py: 1.5 }}
          >
            Return to Home
          </MuiButton>
        </DialogActions>
      </Dialog>
    </Section>
  );
}

export default MentorRegister;
