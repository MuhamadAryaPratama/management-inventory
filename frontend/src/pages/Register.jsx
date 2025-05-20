import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CButton,
  CCard,
  CCardBody,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CRow,
  CAlert,
  CSpinner,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilLockLocked, cilUser } from "@coreui/icons";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "karyawan", // Default to karyawan as per UserModel
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { name, email, password, confirmPassword, role } = formData;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    // Check required fields
    if (!name || !email || !password || !confirmPassword) {
      setError("Semua field harus diisi");
      return false;
    }

    // Name validation
    if (name.trim().length < 2) {
      setError("Nama minimal 2 karakter");
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Format email tidak valid");
      return false;
    }

    // Password validation
    if (password.length < 6) {
      setError("Password minimal 6 karakter");
      return false;
    }

    // Confirm password
    if (password !== confirmPassword) {
      setError("Password tidak sama");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Use the specific API endpoint
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
        }),
        // Removed credentials: "include" to match login approach
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases from the backend
        if (response.status === 400) {
          // Bad request - likely validation errors
          throw new Error(data.message || "Data tidak valid");
        } else if (response.status === 409) {
          // Conflict - likely email already exists
          throw new Error("Email sudah terdaftar");
        } else {
          throw new Error(data.message || "Pendaftaran gagal");
        }
      }

      // Redirect to login after successful registration with a success message
      navigate("/login", {
        state: {
          message: "Pendaftaran berhasil! Silakan login dengan akun baru Anda.",
        },
      });
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat mendaftar");
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={9} lg={7} xl={6}>
            <CCard className="mx-4">
              <CCardBody className="p-4">
                <CForm onSubmit={handleSubmit}>
                  <h1>Daftar</h1>
                  <p className="text-body-secondary">Buat akun Anda</p>

                  {error && (
                    <CAlert color="danger" className="mt-3">
                      {error}
                    </CAlert>
                  )}

                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilUser} />
                    </CInputGroupText>
                    <CFormInput
                      name="name"
                      placeholder="Nama Lengkap"
                      value={name}
                      onChange={handleChange}
                      required
                    />
                  </CInputGroup>

                  <CInputGroup className="mb-3">
                    <CInputGroupText>@</CInputGroupText>
                    <CFormInput
                      type="email"
                      name="email"
                      placeholder="Email"
                      autoComplete="email"
                      value={email}
                      onChange={handleChange}
                      required
                    />
                  </CInputGroup>

                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilLockLocked} />
                    </CInputGroupText>
                    <CFormInput
                      type="password"
                      name="password"
                      placeholder="Password"
                      autoComplete="new-password"
                      value={password}
                      onChange={handleChange}
                      required
                      minLength={6}
                    />
                  </CInputGroup>

                  <CInputGroup className="mb-4">
                    <CInputGroupText>
                      <CIcon icon={cilLockLocked} />
                    </CInputGroupText>
                    <CFormInput
                      type="password"
                      name="confirmPassword"
                      placeholder="Ulangi password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={handleChange}
                      required
                      minLength={6}
                    />
                  </CInputGroup>

                  <CInputGroup className="mb-4">
                    <CInputGroupText>Peran</CInputGroupText>
                    <CFormSelect
                      name="role"
                      value={role}
                      onChange={handleChange}
                    >
                      <option value="karyawan">Karyawan</option>
                      <option value="pemilik">Pemilik</option>
                    </CFormSelect>
                  </CInputGroup>

                  <div className="d-grid">
                    <CButton type="submit" color="success" disabled={loading}>
                      {loading ? (
                        <>
                          <CSpinner size="sm" className="me-2" /> Memproses...
                        </>
                      ) : (
                        "Buat Akun"
                      )}
                    </CButton>
                  </div>

                  <div className="text-center mt-3">
                    <Link to="/login">Sudah punya akun? Login</Link>
                  </div>
                </CForm>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  );
};

export default Register;
