import React, { useState } from "react";
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
import CIcon from "@coreui/icons-react";
import { cilEnvelopeClosed } from "@coreui/icons";
import { Link, useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      // Basic validation
      if (!email.trim()) {
        throw new Error("Email is required");
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        throw new Error("Please enter a valid email address");
      }

      // Call forgot password API using proxy
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send reset email");
      }

      setMessage(data.message);
      setEmailSent(true);

      // Show debug info in development
      if (import.meta.env.DEV && data.debug) {
        console.log("Debug info:", data.debug);
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setError(err.message || "Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToValidation = () => {
    navigate("/validate-reset-code", {
      state: { email: email.trim() },
    });
  };

  const handleResendEmail = () => {
    setEmailSent(false);
    setEmail("");
    setMessage("");
    setError("");
  };

  if (emailSent) {
    return (
      <div className="bg-light min-vh-100 d-flex flex-row align-items-center">
        <CContainer>
          <CRow className="justify-content-center">
            <CCol md={6}>
              <CCard className="p-4">
                <CCardBody className="text-center">
                  <div className="mb-4">
                    <CIcon
                      icon={cilEnvelopeClosed}
                      size="3xl"
                      className="text-success mb-3"
                    />
                    <h2 className="text-success">Reset Code Sent!</h2>
                  </div>

                  <CAlert color="success" className="mb-4">
                    {message}
                  </CAlert>

                  <div className="mb-4">
                    <p className="text-medium-emphasis mb-2">
                      A 6-digit reset code has been sent to:
                    </p>
                    <p className="fw-bold text-primary mb-3">{email}</p>
                    <p className="text-medium-emphasis small">
                      Please check your email inbox (and spam folder). The code
                      will expire in 15 minutes.
                    </p>
                  </div>

                  <div className="d-grid gap-2">
                    <CButton
                      color="primary"
                      size="lg"
                      onClick={handleProceedToValidation}
                    >
                      Enter Reset Code
                    </CButton>

                    <div className="d-flex gap-2">
                      <CButton
                        color="outline-secondary"
                        className="flex-fill"
                        onClick={handleResendEmail}
                      >
                        Send Another Email
                      </CButton>
                      <Link to="/login" className="flex-fill">
                        <CButton color="secondary" className="w-100">
                          Back to Login
                        </CButton>
                      </Link>
                    </div>
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
                  <h1>Forgot Password</h1>
                  <p className="text-medium-emphasis">
                    Enter your email address and we'll send you a 6-digit code
                    to reset your password.
                  </p>

                  {error && (
                    <CAlert color="danger" className="mb-3">
                      <strong>Error:</strong> {error}
                    </CAlert>
                  )}

                  <CForm onSubmit={handleSubmit}>
                    <CInputGroup className="mb-4">
                      <CInputGroupText>
                        <CIcon icon={cilEnvelopeClosed} />
                      </CInputGroupText>
                      <CFormInput
                        type="email"
                        placeholder="Enter your email address"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        required
                      />
                    </CInputGroup>

                    <CRow>
                      <CCol xs={12}>
                        <CButton
                          type="submit"
                          color="primary"
                          size="lg"
                          className="w-100 mb-3"
                          disabled={loading || !email.trim()}
                        >
                          {loading ? (
                            <>
                              <CSpinner size="sm" className="me-2" />
                              Sending Reset Code...
                            </>
                          ) : (
                            "Send Reset Code"
                          )}
                        </CButton>
                      </CCol>
                      <CCol xs={12} className="text-center">
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
                    <h2>Password Reset Process</h2>
                    <div className="text-start mt-4">
                      <div className="mb-3 d-flex align-items-center">
                        <span className="badge bg-light text-primary me-3 rounded-pill">
                          1
                        </span>
                        <span>Enter your email address</span>
                      </div>
                      <div className="mb-3 d-flex align-items-center">
                        <span className="badge bg-light text-primary me-3 rounded-pill">
                          2
                        </span>
                        <span>Check email for 6-digit code</span>
                      </div>
                      <div className="mb-3 d-flex align-items-center">
                        <span className="badge bg-light text-primary me-3 rounded-pill">
                          3
                        </span>
                        <span>Enter the reset code</span>
                      </div>
                      <div className="mb-3 d-flex align-items-center">
                        <span className="badge bg-light text-primary me-3 rounded-pill">
                          4
                        </span>
                        <span>Set your new password</span>
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

export default ForgotPassword;
