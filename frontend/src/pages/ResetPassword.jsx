import React, { useState, useEffect } from "react";
import {
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
  CButton,
  CAlert,
  CSpinner,
  CFormFeedback,
  CProgress,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilLockLocked, cilCheckAlt, cilShieldAlt } from "@coreui/icons";
import { useNavigate, Link, useLocation } from "react-router-dom";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user came from validate-reset-code page
  useEffect(() => {
    if (
      !location.state?.validated ||
      !location.state?.email ||
      !location.state?.resetCode
    ) {
      // If not validated, redirect to validate reset code page
      navigate("/validate-reset-code");
      return;
    }

    setEmail(location.state.email);
    setResetCode(location.state.resetCode);
  }, [location, navigate]);

  // Password strength calculator
  const calculatePasswordStrength = (pwd) => {
    let strength = 0;
    if (pwd.length >= 6) strength += 25;
    if (pwd.length >= 8) strength += 25;
    if (/[A-Z]/.test(pwd)) strength += 25;
    if (/[0-9]/.test(pwd)) strength += 25;
    return strength;
  };

  // Validate password requirements
  const validatePassword = (pwd) => {
    const errors = {};

    if (pwd.length < 6) {
      errors.length = "Password must be at least 6 characters long";
    }

    if (pwd && confirmPassword && pwd !== confirmPassword) {
      errors.match = "Passwords do not match";
    }

    return errors;
  };

  // Real-time password validation and strength calculation
  useEffect(() => {
    if (password) {
      setPasswordErrors(validatePassword(password));
      setPasswordStrength(calculatePasswordStrength(password));
    } else {
      setPasswordStrength(0);
    }
  }, [password, confirmPassword]);

  // Countdown for redirect
  useEffect(() => {
    let timer;
    if (success && redirectCountdown > 0) {
      timer = setTimeout(() => {
        setRedirectCountdown(redirectCountdown - 1);
      }, 1000);
    } else if (success && redirectCountdown === 0) {
      navigate("/login", {
        state: {
          message:
            "Password berhasil direset! Silakan login dengan password baru Anda.",
          alertType: "success",
        },
      });
    }
    return () => clearTimeout(timer);
  }, [success, redirectCountdown, navigate]);

  // Reset password
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Client-side validation
      if (!password.trim() || !confirmPassword.trim()) {
        throw new Error("Both password fields are required");
      }

      const errors = validatePassword(password);
      if (Object.keys(errors).length > 0) {
        throw new Error(Object.values(errors)[0]);
      }

      // Call reset password API using proxy
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          resetCode: resetCode.trim(),
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      setSuccess(true);
    } catch (err) {
      console.error("Reset password error:", err);
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToValidation = () => {
    navigate("/validate-reset-code", {
      state: { email: email },
    });
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return "danger";
    if (passwordStrength < 50) return "warning";
    if (passwordStrength < 75) return "info";
    return "success";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return "Weak";
    if (passwordStrength < 50) return "Fair";
    if (passwordStrength < 75) return "Good";
    return "Strong";
  };

  if (success) {
    return (
      <div className="bg-light min-vh-100 d-flex flex-row align-items-center">
        <CContainer>
          <CRow className="justify-content-center">
            <CCol md={6}>
              <CCard className="p-4">
                <CCardBody className="text-center">
                  <div className="mb-4">
                    <CIcon
                      icon={cilCheckAlt}
                      size="3xl"
                      className="text-success mb-3"
                    />
                    <h2 className="text-success">Password Reset Successful!</h2>
                  </div>

                  <CAlert color="success" className="mb-4">
                    <strong>Success!</strong> Your password has been
                    successfully reset. You can now login with your new
                    password.
                  </CAlert>

                  <div className="mb-4">
                    <p className="text-medium-emphasis">
                      Redirecting to login page in {redirectCountdown}{" "}
                      seconds...
                    </p>
                    <CProgress
                      value={(5 - redirectCountdown) * 20}
                      color="success"
                      className="mb-3"
                    />
                  </div>

                  <div className="d-grid gap-2">
                    <Link to="/login">
                      <CButton color="primary" size="lg" className="w-100">
                        Login Now
                      </CButton>
                    </Link>
                    <CButton
                      color="secondary"
                      onClick={() => setRedirectCountdown(0)}
                    >
                      Skip Countdown
                    </CButton>
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </CContainer>
      </div>
    );
  }

  return (
    <div className="bg-light min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={8}>
            <CCardGroup>
              <CCard className="p-4">
                <CCardBody>
                  <h1>Set New Password</h1>
                  <p className="text-medium-emphasis">
                    Enter your new password. Make sure it's strong and easy to
                    remember.
                  </p>

                  {error && (
                    <CAlert color="danger" className="mb-3">
                      <strong>Error:</strong> {error}
                    </CAlert>
                  )}

                  <CAlert color="success" className="mb-3">
                    ✅ Reset code verified! Please enter your new password.
                  </CAlert>

                  <CForm onSubmit={handleSubmit}>
                    <CInputGroup className="mb-3">
                      <CInputGroupText>
                        <CIcon icon={cilLockLocked} />
                      </CInputGroupText>
                      <CFormInput
                        type="password"
                        placeholder="New Password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        invalid={passwordErrors.length ? true : false}
                        required
                      />
                      {passwordErrors.length && (
                        <CFormFeedback invalid>
                          {passwordErrors.length}
                        </CFormFeedback>
                      )}
                    </CInputGroup>

                    {/* Password Strength Indicator */}
                    {password && (
                      <div className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <small className="text-medium-emphasis">
                            Password Strength:
                          </small>
                          <small
                            className={`text-${getPasswordStrengthColor()}`}
                          >
                            {getPasswordStrengthText()}
                          </small>
                        </div>
                        <CProgress
                          value={passwordStrength}
                          color={getPasswordStrengthColor()}
                          height={4}
                        />
                      </div>
                    )}

                    <CInputGroup className="mb-4">
                      <CInputGroupText>
                        <CIcon icon={cilShieldAlt} />
                      </CInputGroupText>
                      <CFormInput
                        type="password"
                        placeholder="Confirm New Password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                        invalid={passwordErrors.match ? true : false}
                        required
                      />
                      {passwordErrors.match && (
                        <CFormFeedback invalid>
                          {passwordErrors.match}
                        </CFormFeedback>
                      )}
                    </CInputGroup>

                    {/* Password Requirements */}
                    <div className="mb-3">
                      <small className="text-medium-emphasis d-block mb-2">
                        Password Requirements:
                      </small>
                      <div className="small">
                        <div
                          className={`mb-1 ${
                            password.length >= 6 ? "text-success" : "text-muted"
                          }`}
                        >
                          {password.length >= 6 ? "✓" : "○"} At least 6
                          characters
                        </div>
                        <div
                          className={`mb-1 ${
                            password &&
                            confirmPassword &&
                            password === confirmPassword
                              ? "text-success"
                              : "text-muted"
                          }`}
                        >
                          {password &&
                          confirmPassword &&
                          password === confirmPassword
                            ? "✓"
                            : "○"}{" "}
                          Passwords must match
                        </div>
                        <div
                          className={`mb-1 ${
                            /[A-Z]/.test(password)
                              ? "text-success"
                              : "text-muted"
                          }`}
                        >
                          {/[A-Z]/.test(password) ? "✓" : "○"} Contains
                          uppercase letter (recommended)
                        </div>
                        <div
                          className={`mb-1 ${
                            /[0-9]/.test(password)
                              ? "text-success"
                              : "text-muted"
                          }`}
                        >
                          {/[0-9]/.test(password) ? "✓" : "○"} Contains number
                          (recommended)
                        </div>
                      </div>
                    </div>
                    <CRow>
                      <CCol xs={6}>
                        <CButton
                          color="primary"
                          type="submit"
                          className="px-4"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <CSpinner
                                component="span"
                                size="sm"
                                aria-hidden="true"
                              />
                              {" Resetting..."}
                            </>
                          ) : (
                            "Reset Password"
                          )}
                        </CButton>
                      </CCol>
                      <CCol xs={6} className="text-end">
                        <CButton
                          color="secondary"
                          variant="outline"
                          onClick={handleBackToValidation}
                        >
                          Back to Code Validation
                        </CButton>
                      </CCol>
                    </CRow>
                  </CForm>
                </CCardBody>
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  );
};

export default ResetPassword;
