import React, { useState, useEffect } from "react";
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CForm,
  CFormInput,
  CFormLabel,
  CFormTextarea,
  CButton,
  CSpinner,
  CAlert,
  CFormFeedback,
  CInputGroup,
  CInputGroupText,
  CFormCheck,
  CCardFooter,
} from "@coreui/react";
import { useNavigate } from "react-router-dom";
import CIcon from "@coreui/icons-react";
import {
  cilUser,
  cilEnvelopeClosed,
  cilPhone,
  cilLocationPin,
  cilLockLocked,
  cilSave,
} from "@coreui/icons";

const Settings = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [originalData, setOriginalData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [changePassword, setChangePassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const navigate = useNavigate();

  // Fetch user data when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("userToken");

        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch("http://localhost:5000/api/auth/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }

        const userData = await response.json();

        // Update form with user data
        setFormData((prev) => ({
          ...prev,
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          address: userData.address || "",
        }));

        // Save original data for comparison
        setOriginalData({
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          address: userData.address || "",
        });
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load user data. Please try again later.");

        // Try to load from localStorage as fallback
        const cachedData = localStorage.getItem("userData");
        if (cachedData) {
          try {
            const userData = JSON.parse(cachedData);
            setFormData((prev) => ({
              ...prev,
              name: userData.name || "",
              email: userData.email || "",
              phone: userData.phone || "",
              address: userData.address || "",
            }));
            setOriginalData({
              name: userData.name || "",
              email: userData.email || "",
              phone: userData.phone || "",
              address: userData.address || "",
            });
          } catch (e) {
            console.error("Error parsing cached data:", e);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear specific field error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Toggle password change form
  const handleTogglePasswordChange = () => {
    setChangePassword(!changePassword);
    if (!changePassword) {
      // Reset password fields when opening the form
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    }
  };

  // Validate form before submission
  const validateForm = () => {
    const errors = {};

    // Validate name
    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }

    // Validate email
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = "Invalid email format";
      }
    }

    // Validate phone if provided
    if (formData.phone && !/^[0-9+\-\s()]{10,15}$/.test(formData.phone)) {
      errors.phone = "Invalid phone number format";
    }

    // Validate password fields if changing password
    if (changePassword) {
      if (!formData.currentPassword) {
        errors.currentPassword = "Current password is required";
      }

      if (!formData.newPassword) {
        errors.newPassword = "New password is required";
      } else if (formData.newPassword.length < 8) {
        errors.newPassword = "Password must be at least 8 characters";
      }

      if (!formData.confirmPassword) {
        errors.confirmPassword = "Please confirm your new password";
      } else if (formData.newPassword !== formData.confirmPassword) {
        errors.confirmPassword = "Passwords don't match";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset messages
    setError("");
    setSuccess("");

    // Validate form
    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        navigate("/login");
        return;
      }

      // Prepare data to update
      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
      };

      // Add password fields if changing password
      if (changePassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      // Make API call to update user data
      const response = await fetch("http://localhost:5000/api/users/{id}", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      // Update localStorage with fresh data
      localStorage.setItem("userData", JSON.stringify(data.user));

      // Dispatch event to update other components
      window.dispatchEvent(new Event("userLoggedIn"));

      // Update original data for comparison
      setOriginalData({
        name: data.user.name || "",
        email: data.user.email || "",
        phone: data.user.phone || "",
        address: data.user.address || "",
      });

      // Reset password fields
      if (changePassword) {
        setFormData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
        setChangePassword(false);
      }

      setSuccess("Profile updated successfully!");

      // Scroll to top to show success message
      window.scrollTo(0, 0);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err.message || "Failed to update profile. Please try again.");
      window.scrollTo(0, 0);
    } finally {
      setSaving(false);
    }
  };

  // Check if form has been modified
  const isFormModified = () => {
    return (
      formData.name !== originalData.name ||
      formData.email !== originalData.email ||
      formData.phone !== originalData.phone ||
      formData.address !== originalData.address ||
      (changePassword &&
        (formData.currentPassword ||
          formData.newPassword ||
          formData.confirmPassword))
    );
  };

  // Handle cancel button
  const handleCancel = () => {
    // Reset form to original values
    setFormData((prev) => ({
      ...prev,
      name: originalData.name || "",
      email: originalData.email || "",
      phone: originalData.phone || "",
      address: originalData.address || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }));

    // Close password change form
    setChangePassword(false);

    // Clear errors
    setFormErrors({});
    setError("");
    setSuccess("");
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "300px" }}
      >
        <CSpinner color="primary" />
      </div>
    );
  }

  return (
    <>
      <CRow>
        <CCol>
          <h2 className="mb-4">Account Settings</h2>
        </CCol>
      </CRow>

      {error && (
        <CAlert color="danger" className="mb-4">
          {error}
        </CAlert>
      )}

      {success && (
        <CAlert color="success" className="mb-4">
          {success}
        </CAlert>
      )}

      <CRow>
        <CCol md={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>Profile Information</strong>
            </CCardHeader>
            <CCardBody>
              <CForm onSubmit={handleSubmit}>
                <CRow className="mb-3">
                  <CCol md={6}>
                    <CInputGroup className="mb-3">
                      <CInputGroupText>
                        <CIcon icon={cilUser} />
                      </CInputGroupText>
                      <CFormInput
                        type="text"
                        id="name"
                        name="name"
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={handleInputChange}
                        invalid={!!formErrors.name}
                        required
                      />
                      {formErrors.name && (
                        <CFormFeedback invalid>{formErrors.name}</CFormFeedback>
                      )}
                    </CInputGroup>
                  </CCol>

                  <CCol md={6}>
                    <CInputGroup className="mb-3">
                      <CInputGroupText>
                        <CIcon icon={cilEnvelopeClosed} />
                      </CInputGroupText>
                      <CFormInput
                        type="email"
                        id="email"
                        name="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleInputChange}
                        invalid={!!formErrors.email}
                        required
                      />
                      {formErrors.email && (
                        <CFormFeedback invalid>
                          {formErrors.email}
                        </CFormFeedback>
                      )}
                    </CInputGroup>
                  </CCol>
                </CRow>

                <CRow className="mb-3">
                  <CCol md={6}>
                    <CInputGroup className="mb-3">
                      <CInputGroupText>
                        <CIcon icon={cilPhone} />
                      </CInputGroupText>
                      <CFormInput
                        type="text"
                        id="phone"
                        name="phone"
                        placeholder="Phone Number"
                        value={formData.phone}
                        onChange={handleInputChange}
                        invalid={!!formErrors.phone}
                      />
                      {formErrors.phone && (
                        <CFormFeedback invalid>
                          {formErrors.phone}
                        </CFormFeedback>
                      )}
                    </CInputGroup>
                  </CCol>
                </CRow>

                <CRow className="mb-3">
                  <CCol md={12}>
                    <CInputGroup className="mb-3">
                      <CInputGroupText>
                        <CIcon icon={cilLocationPin} />
                      </CInputGroupText>
                      <CFormTextarea
                        id="address"
                        name="address"
                        placeholder="Address"
                        value={formData.address}
                        onChange={handleInputChange}
                        rows={3}
                      />
                    </CInputGroup>
                  </CCol>
                </CRow>

                <CRow className="mb-3">
                  <CCol>
                    <CFormCheck
                      id="changePassword"
                      label="Change Password"
                      checked={changePassword}
                      onChange={handleTogglePasswordChange}
                    />
                  </CCol>
                </CRow>

                {changePassword && (
                  <>
                    <CCard className="mb-4 mt-3 border-warning">
                      <CCardHeader className="bg-warning bg-opacity-10">
                        <strong>Change Password</strong>
                      </CCardHeader>
                      <CCardBody>
                        <CRow>
                          <CCol md={6}>
                            <CInputGroup className="mb-3">
                              <CInputGroupText>
                                <CIcon icon={cilLockLocked} />
                              </CInputGroupText>
                              <CFormInput
                                type="password"
                                id="currentPassword"
                                name="currentPassword"
                                placeholder="Current Password"
                                value={formData.currentPassword}
                                onChange={handleInputChange}
                                invalid={!!formErrors.currentPassword}
                              />
                              {formErrors.currentPassword && (
                                <CFormFeedback invalid>
                                  {formErrors.currentPassword}
                                </CFormFeedback>
                              )}
                            </CInputGroup>
                          </CCol>
                        </CRow>

                        <CRow>
                          <CCol md={6}>
                            <CInputGroup className="mb-3">
                              <CInputGroupText>
                                <CIcon icon={cilLockLocked} />
                              </CInputGroupText>
                              <CFormInput
                                type="password"
                                id="newPassword"
                                name="newPassword"
                                placeholder="New Password"
                                value={formData.newPassword}
                                onChange={handleInputChange}
                                invalid={!!formErrors.newPassword}
                              />
                              {formErrors.newPassword && (
                                <CFormFeedback invalid>
                                  {formErrors.newPassword}
                                </CFormFeedback>
                              )}
                            </CInputGroup>
                          </CCol>

                          <CCol md={6}>
                            <CInputGroup className="mb-3">
                              <CInputGroupText>
                                <CIcon icon={cilLockLocked} />
                              </CInputGroupText>
                              <CFormInput
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                placeholder="Confirm New Password"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                invalid={!!formErrors.confirmPassword}
                              />
                              {formErrors.confirmPassword && (
                                <CFormFeedback invalid>
                                  {formErrors.confirmPassword}
                                </CFormFeedback>
                              )}
                            </CInputGroup>
                          </CCol>
                        </CRow>
                      </CCardBody>
                    </CCard>
                  </>
                )}
              </CForm>
            </CCardBody>
            <CCardFooter>
              <CRow>
                <CCol className="d-flex gap-2 justify-content-end">
                  <CButton
                    color="secondary"
                    onClick={handleCancel}
                    disabled={saving || !isFormModified()}
                  >
                    Cancel
                  </CButton>
                  <CButton
                    type="submit"
                    color="primary"
                    onClick={handleSubmit}
                    disabled={saving || !isFormModified()}
                  >
                    {saving ? (
                      <>
                        <CSpinner size="sm" className="me-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CIcon icon={cilSave} className="me-2" />
                        Save Changes
                      </>
                    )}
                  </CButton>
                </CCol>
              </CRow>
            </CCardFooter>
          </CCard>
        </CCol>
      </CRow>
    </>
  );
};

export default Settings;
