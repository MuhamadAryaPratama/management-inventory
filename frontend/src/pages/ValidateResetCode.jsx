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
} from "@coreui/react";
import { useNavigate, Link, useLocation } from "react-router-dom";

const ValidateResetCode = () => {
  const [email, setEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationSuccess, setValidationSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Get email from previous page state if available
  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!email.trim() || !resetCode.trim()) {
        throw new Error("Email and reset code are required");
      }

      if (resetCode.trim().length !== 6) {
        throw new Error("Reset code must be 6 digits");
      }

      // Validate reset code using proxy
      const response = await fetch("/api/auth/validate-reset-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Tambahkan ini untuk menyertakan cookies
        body: JSON.stringify({
          email: email.trim(),
          resetCode: resetCode.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid reset code");
      }

      if (data.valid) {
        setValidationSuccess(true);

        // Navigate to reset password page after a brief success message
        setTimeout(() => {
          navigate("/reset-password", {
            state: {
              email: email.trim(),
              resetCode: resetCode.trim(),
              validated: true,
              validationData: data,
            },
          });
        }, 1500);
      } else {
        throw new Error(data.message || "Invalid reset code");
      }
    } catch (err) {
      console.error("Code validation error:", err);
      setError(
        err.message || "Failed to validate reset code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // Only allow digits
    if (value.length <= 6) {
      setResetCode(value);
    }
  };

  const handleRequestNewCode = () => {
    navigate("/forgot-password", {
      state: { email: email },
    });
  };

  if (validationSuccess) {
    return (
      <div className="bg-light min-vh-100 d-flex flex-row align-items-center">
        <CContainer>
          <CRow className="justify-content-center">
            <CCol md={6}>
              <CCard className="p-4">
                <CCardBody className="text-center">
                  <div className="mb-4">
                    <div
                      className="text-success mb-3"
                      style={{ fontSize: "3rem" }}
                    >
                      🔓
                    </div>
                    <h2 className="text-success">Code Verified!</h2>
                  </div>

                  <CAlert color="success" className="mb-4">
                    Reset code verified successfully. Redirecting to password
                    reset...
                  </CAlert>

                  <CSpinner color="primary" />
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
                  <h1>Verify Reset Code</h1>
                  <p className="text-medium-emphasis">
                    Enter your email address and the 6-digit reset code that was
                    sent to your email.
                  </p>

                  {error && (
                    <CAlert color="danger" className="mb-3">
                      <strong>Error:</strong> {error}
                    </CAlert>
                  )}

                  <CForm onSubmit={handleSubmit}>
                    <CInputGroup className="mb-3">
                      <CInputGroupText>
                        <span>📧</span>
                      </CInputGroupText>
                      <CFormInput
                        type="email"
                        placeholder="Email Address"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        required
                      />
                    </CInputGroup>

                    <CInputGroup className="mb-4">
                      <CInputGroupText>
                        <span>🔑</span>
                      </CInputGroupText>
                      <CFormInput
                        type="text"
                        placeholder="6-Digit Reset Code"
                        maxLength="6"
                        value={resetCode}
                        onChange={handleCodeChange}
                        disabled={loading}
                        required
                        style={{
                          letterSpacing:
                            resetCode.length > 0 ? "0.5em" : "normal",
                          textAlign: resetCode.length > 0 ? "center" : "left",
                        }}
                      />
                    </CInputGroup>

                    <div className="mb-3">
                      <small className="text-medium-emphasis">
                        Enter the 6-digit code sent to your email. The code will
                        expire in 15 minutes.
                      </small>
                    </div>

                    <CRow>
                      <CCol xs={12}>
                        <CButton
                          type="submit"
                          color="primary"
                          size="lg"
                          className="w-100 mb-3"
                          disabled={
                            loading ||
                            !email.trim() ||
                            !resetCode.trim() ||
                            resetCode.length !== 6
                          }
                        >
                          {loading ? (
                            <>
                              <CSpinner size="sm" className="me-2" />
                              Validating Code...
                            </>
                          ) : (
                            "Validate Code"
                          )}
                        </CButton>
                      </CCol>
                      <CCol xs={12} className="text-center">
                        <CButton
                          color="link"
                          className="px-0 me-3"
                          onClick={handleRequestNewCode}
                          disabled={loading}
                        >
                          Request New Code
                        </CButton>
                        <Link to="/login">
                          <CButton color="link" className="px-0">
                            Back to Login
                          </CButton>
                        </Link>
                      </CCol>
                    </CRow>
                  </CForm>
                </CCardBody>
              </CCard>

              <CCard
                className="text-white bg-primary py-5"
                style={{ width: "44%" }}
              >
                <CCardBody className="text-center">
                  <div>
                    <h2>Reset Code Verification</h2>
                    <div className="text-start mt-4">
                      <div className="mb-3 d-flex align-items-start">
                        <span
                          className="me-3 mt-1"
                          style={{ fontSize: "1.2rem" }}
                        >
                          🔑
                        </span>
                        <div>
                          <strong>Check your email</strong>
                          <br />
                          <small>Look for the 6-digit reset code</small>
                        </div>
                      </div>
                      <div className="mb-3 d-flex align-items-start">
                        <span className="badge bg-warning text-dark me-3 mt-1">
                          ⏰
                        </span>
                        <div>
                          <strong>15 minutes validity</strong>
                          <br />
                          <small>Code expires after 15 minutes</small>
                        </div>
                      </div>
                      <div className="mb-3 d-flex align-items-start">
                        <span className="badge bg-danger me-3 mt-1">🔐</span>
                        <div>
                          <strong>Keep it secure</strong>
                          <br />
                          <small>Don't share your reset code</small>
                        </div>
                      </div>
                    </div>
                    <Link to="/login">
                      <CButton
                        color="light"
                        className="mt-3"
                        active
                        tabIndex={-1}
                      >
                        Back to Login
                      </CButton>
                    </Link>
                  </div>
                </CCardBody>
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  );
};

export default ValidateResetCode;
