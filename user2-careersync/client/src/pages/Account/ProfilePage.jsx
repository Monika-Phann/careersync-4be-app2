import { useState, useRef, useEffect } from "react";
import { useAtom, useSetAtom } from "jotai";
import * as Yup from "yup";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import { CloudUploadOutlined } from "@mui/icons-material";
import AccountTabs from "../../components/AccountTabs/AccountTabs";
import { useAuth } from "../../context/AuthContext";
import { CircularProgress, Alert, Snackbar } from "@mui/material";
import {
  userProfileAtom,
  profileLoadingAtom,
  profileErrorAtom,
  fetchProfileAtom,
  updateProfileAtom,
} from "../../atoms/userAtoms";
import {
  PageWrapper,
  TopBar,
  Card,
  Title,
  Subtitle,
  Row,
  FieldGroup,
  OneColumnFieldGroup,
  Label,
  StyledInput,
  EditButton,
  HelperText,
  ButtonRow,
} from "./ProfilePage.styles";
import {
  RadioGroup,
  FormControlLabel,
  Radio,
  IconButton,
  Avatar,
} from "@mui/material";

export default function ProfilePage() {
  const fileRef = useRef(null);
  const { updateUser } = useAuth();

  // Jotai atoms
  const [profile, setProfile] = useAtom(userProfileAtom);
  const [loading] = useAtom(profileLoadingAtom);
  const [error, setError] = useAtom(profileErrorAtom);
  const fetchProfile = useSetAtom(fetchProfileAtom);
  const updateProfile = useSetAtom(updateProfileAtom);

  // Local UI state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    dob: "",
    gender: "",
    status: "",
    institution: "",
    avatar: null,
    profileImage: null,
  });
  const [backupData, setBackupData] = useState(formData);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileData = await fetchProfile();
        if (profileData) {
          const imageUrl =
            profileData.avatar || profileData.profileImage || null;
          setFormData({
            firstName: profileData.firstName || "",
            lastName: profileData.lastName || "",
            phone: profileData.phone || "",
            dob: profileData.dob || "",
            gender: profileData.gender || "",
            status: profileData.status || "",
            institution: profileData.institution || "",
            avatar: imageUrl,
            profileImage: imageUrl,
          });
          setBackupData({
            firstName: profileData.firstName || "",
            lastName: profileData.lastName || "",
            phone: profileData.phone || "",
            dob: profileData.dob || "",
            gender: profileData.gender || "",
            status: profileData.status || "",
            institution: profileData.institution || "",
            avatar: imageUrl,
          });

          // Update auth context
          if (updateUser && imageUrl) {
            updateUser({
              firstName: profileData.firstName,
              lastName: profileData.lastName,
              avatar: imageUrl,
              profileImage: imageUrl,
            });
          }
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    };

    if (!profile) {
      loadProfile();
    } else {
      // If profile already exists, populate form
      const imageUrl = profile.avatar || profile.profileImage || null;
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        phone: profile.phone || "",
        dob: profile.dob || "",
        gender: profile.gender || "",
        status: profile.status || "",
        institution: profile.institution || "",
        avatar: imageUrl,
        profileImage: imageUrl,
      });
    }
  }, [profile, fetchProfile, updateUser]);

  // Sync formData when profile updates (but don't overwrite if user is editing)
  useEffect(() => {
    if (profile && !isEditing) {
      const imageUrl = profile.avatar || profile.profileImage || null;
      
      // Only update image if we have a server URL (not a blob preview from upload)
      const shouldUpdateImage = imageUrl && !imageUrl.startsWith("blob:");
      
      setFormData((prev) => {
        // Don't update if user is currently editing
        if (isEditing) return prev;
        
        return {
          ...prev,
          firstName: profile.firstName || prev.firstName,
          lastName: profile.lastName || prev.lastName,
          phone: profile.phone || prev.phone,
          dob: profile.dob || prev.dob,
          gender: profile.gender || prev.gender,
          status: profile.status || prev.status,
          institution: profile.institution || prev.institution,
          // Only update image if we have a server URL (not a blob preview)
          avatar: shouldUpdateImage ? imageUrl : prev.avatar,
          profileImage: shouldUpdateImage ? imageUrl : prev.profileImage,
        };
      });
    }
  }, [profile, isEditing]);

  const schema = Yup.object({
    profilePicture: Yup.mixed().nullable().notRequired(),
    firstName: Yup.string().trim().required("First name is required"),
    lastName: Yup.string().trim().required("Last name is required"),
    phone: Yup.string()
      .matches(/^(?:0\d{8,9}|\+855\d{8,9})$/, "Phone must start with 0 or +855")
      .required("Phone number is required"),
    dob: Yup.string().required("Date of birth is required"),
    gender: Yup.string().required("Please select gender"),
    status: Yup.string().required("Please select status"),
    institution: Yup.string().trim().required("Institution is required"),
  });

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleEditSave = async () => {
    if (!isEditing) {
      setBackupData(formData);
      setIsEditing(true);
      return;
    }

    try {
      await schema.validate(formData, { abortEarly: false });
      setErrors({});
      setError(null);

      // Clean up old blob URL if it exists
      if (formData.avatar && formData.avatar.startsWith("blob:")) {
        URL.revokeObjectURL(formData.avatar);
      }

      // Ensure all required fields are included in the update
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        dob: formData.dob,
        gender: formData.gender,
        status: formData.status,
        institution: formData.institution,
        profileImage: formData.profileImage, // File object or null
        avatar: formData.avatar, // Preview URL (blob) or existing URL
      };

      const updatedProfile = await updateProfile(updateData);

      if (updatedProfile) {
        // Refresh profile from server to get latest data
        await fetchProfile();
        
        // Update formData with the response from server
        const imageUrl = updatedProfile.avatar || updatedProfile.profileImage;
        setFormData({
          firstName: updatedProfile.firstName || formData.firstName,
          lastName: updatedProfile.lastName || formData.lastName,
          phone: updatedProfile.phone || formData.phone,
          dob: updatedProfile.dob || formData.dob,
          gender: updatedProfile.gender || formData.gender,
          status: updatedProfile.status || formData.status,
          institution: updatedProfile.institution || formData.institution,
          avatar: imageUrl,
          profileImage: imageUrl,
        });

        // Update backup data
        setBackupData({
          firstName: updatedProfile.firstName || formData.firstName,
          lastName: updatedProfile.lastName || formData.lastName,
          phone: updatedProfile.phone || formData.phone,
          dob: updatedProfile.dob || formData.dob,
          gender: updatedProfile.gender || formData.gender,
          status: updatedProfile.status || formData.status,
          institution: updatedProfile.institution || formData.institution,
          avatar: imageUrl,
          profileImage: imageUrl,
        });

        setIsEditing(false);
        setSuccessMessage("Profile updated successfully!");

        // Update auth context immediately
        if (updateUser) {
          updateUser({
            firstName: updatedProfile.firstName,
            lastName: updatedProfile.lastName,
            phone: updatedProfile.phone,
            dob: updatedProfile.dob,
            gender: updatedProfile.gender,
            status: updatedProfile.status,
            institution: updatedProfile.institution,
            avatar: imageUrl,
            profileImage: imageUrl,
          });
        }
      }
    } catch (err) {
      const formattedErrors = {};
      if (err.inner) {
        err.inner.forEach((e) => {
          formattedErrors[e.path] = e.message;
        });
      } else if (err.message) {
        setError(err.message);
      }
      setErrors(formattedErrors);
    }
  };

  const handleCancel = () => {
    setFormData(backupData);
    setErrors({});
    setIsEditing(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }

      // Clean up previous blob URL if it exists
      if (formData.avatar && formData.avatar.startsWith("blob:")) {
        URL.revokeObjectURL(formData.avatar);
      }

      // Create preview URL for immediate display
      const previewUrl = URL.createObjectURL(file);
      setFormData({
        ...formData,
        avatar: previewUrl,
        profileImage: file,
      });
      
      // Clear any previous errors
      setError(null);
    }
  };

  if (loading && !profile) {
    return (
      <PageWrapper>
        <TopBar />
        <AccountTabs />
        <Card>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "40px",
            }}
          >
            <CircularProgress />
          </div>
        </Card>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <TopBar />
      <AccountTabs />

      <Card>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Snackbar
          open={!!successMessage}
          autoHideDuration={6000}
          onClose={() => setSuccessMessage("")}
          message={successMessage}
        />

        <Title>Profile Information</Title>
        <Subtitle>Update your personal details and profile picture</Subtitle>

        {/* PROFILE IMAGE */}
        <Row>
          <div style={{ position: "relative" }}>
            <Avatar
              key={formData.avatar || formData.profileImage || "default"}
              src={formData.avatar || formData.profileImage || null}
              alt={`${formData.firstName} ${formData.lastName}`}
              onError={(e) => {
                console.error(
                  "Avatar image failed to load:",
                  formData.avatar || formData.profileImage
                );
              }}
              sx={{
                width: 176,
                height: 176,
                objectFit: "cover",
                cursor: "pointer",
                border: "2px solid #e0e0e0",
                "& img": {
                  objectFit: "cover",
                  width: "100%",
                  height: "100%",
                },
              }}
            >
              {!formData.avatar &&
                !formData.profileImage &&
                (formData.firstName?.[0]?.toUpperCase() ||
                  formData.lastName?.[0]?.toUpperCase() ||
                  "U")}
            </Avatar>

            {isEditing && (
              <>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => fileRef.current.click()}
                  sx={{
                    position: "absolute",
                    bottom: -6,
                    right: -6,
                    bgcolor: "#b3daf7",
                    border: "3px solid #fff",
                    "&:hover": { bgcolor: "#9bcaed" },
                  }}
                  aria-label="Upload avatar"
                >
                  <CloudUploadOutlined fontSize="small" />
                </IconButton>

                <input
                  ref={fileRef}
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </>
            )}
          </div>

          <div>
            {isEditing ? (
              <>
                <Label>Upload Profile Picture</Label>
                <HelperText>
                  Click the cloud upload icon to upload a new photo <br />
                  JPG, PNG or GIF. Max size 5MB
                </HelperText>
              </>
            ) : (
              <>
                <Label>Profile Picture</Label>
                <HelperText>Your profile picture</HelperText>
              </>
            )}
          </div>
        </Row>

        {/* NAME */}
        <Row>
          <FieldGroup>
            <Label>First Name *</Label>
            <StyledInput
              value={formData.firstName}
              onChange={handleChange("firstName")}
              disabled={!isEditing}
              error={!!errors.firstName}
              helperText={errors.firstName}
            />
          </FieldGroup>

          <FieldGroup>
            <Label>Last Name *</Label>
            <StyledInput
              value={formData.lastName}
              onChange={handleChange("lastName")}
              disabled={!isEditing}
              error={!!errors.lastName}
              helperText={errors.lastName}
            />
          </FieldGroup>
        </Row>

        {/* PHONE + DOB */}
        <Row>
          <FieldGroup>
            <Label>Phone *</Label>
            <StyledInput
              value={formData.phone}
              onChange={handleChange("phone")}
              disabled={!isEditing}
              error={!!errors.phone}
              helperText={errors.phone}
            />
          </FieldGroup>

          <FieldGroup>
            <Label>Date of Birth *</Label>
            <StyledInput
              type="date"
              value={formData.dob}
              onChange={handleChange("dob")}
              disabled={!isEditing}
              error={!!errors.dob}
              helperText={errors.dob}
            />
          </FieldGroup>
        </Row>

        {/* GENDER */}
        <Row>
          <OneColumnFieldGroup>
            <Label>Gender *</Label>
            <RadioGroup
              row
              value={formData.gender}
              onChange={handleChange("gender")}
            >
              <FormControlLabel
                value="Male"
                control={<Radio disabled={!isEditing} />}
                label="Male"
              />
              <FormControlLabel
                value="Female"
                control={<Radio disabled={!isEditing} />}
                label="Female"
              />
            </RadioGroup>

            {errors.gender && (
              <HelperText style={{ color: "#d32f2f" }}>
                {errors.gender}
              </HelperText>
            )}
          </OneColumnFieldGroup>
        </Row>

        {/* EDUCATION */}
        {/* <Subtitle>Education & Employment</Subtitle>
        <HelperText>Your current status and institution information</HelperText> */}

        <Row>
          <OneColumnFieldGroup>
            <Label>Status *</Label>
            <RadioGroup
              row
              value={formData.status}
              onChange={handleChange("status")}
            >
              <FormControlLabel
                value="Student"
                control={<Radio disabled={!isEditing} />}
                label="Student"
              />
              <FormControlLabel
                value="Working"
                control={<Radio disabled={!isEditing} />}
                label="Working"
              />
            </RadioGroup>

            {errors.status && (
              <HelperText style={{ color: "#d32f2f" }}>
                {errors.status}
              </HelperText>
            )}
          </OneColumnFieldGroup>

          <FieldGroup>
            <Label>Institution *</Label>
            <StyledInput
              value={formData.institution}
              onChange={handleChange("institution")}
              disabled={!isEditing}
              error={!!errors.institution}
              helperText={errors.institution}
            />
          </FieldGroup>
        </Row>

        {/* BUTTONS */}
        <ButtonRow>
          <EditButton
            startIcon={isEditing ? <SaveIcon /> : <EditIcon />}
            onClick={handleEditSave}
            disabled={loading}
          >
            {loading
              ? "Saving..."
              : isEditing
              ? "Save Changes"
              : "Edit Profile"}
          </EditButton>

          {isEditing && (
            <EditButton
              onClick={handleCancel}
              style={{ background: "#E0E0E0", color: "#333" }}
            >
              Cancel
            </EditButton>
          )}
        </ButtonRow>
      </Card>
    </PageWrapper>
  );
}
