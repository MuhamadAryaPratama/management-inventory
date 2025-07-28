import React, { useState, useEffect } from "react";
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CForm,
  CFormInput,
  CFormSelect,
  CButton,
  CSpinner,
  CAlert,
  CBreadcrumb,
  CBreadcrumbItem,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilSave, cilArrowLeft } from "@coreui/icons";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [user, setUser] = useState({
    name: "",
    email: "",
    role: "karyawan",
  });

  // Daftar peran yang tersedia
  const roles = ["karyawan", "pemilik"];

  // Mengambil data peran pengguna saat ini dan detail pengguna
  const fetchUser = async () => {
    setLoading(true);
    setError(null);
    try {
      // Ambil peran pengguna saat ini menggunakan endpoint /me
      const currentUserResponse = await axios.get(
        "http://localhost:5000/api/users/me",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        }
      );
      setCurrentUserRole(currentUserResponse.data.user.role);

      // Ambil data pengguna yang akan diedit menggunakan endpoint ID
      const response = await axios.get(
        `http://localhost:5000/api/users/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        }
      );

      if (response.data) {
        // Hanya pemilik yang dapat mengedit akun pemilik lain
        if (
          currentUserResponse.data.user.role !== "pemilik" &&
          response.data.role === "pemilik"
        ) {
          Swal.fire({
            title: "Akses Ditolak",
            text: "Hanya pemilik yang dapat mengedit akun pemilik lain",
            icon: "error",
            confirmButtonText: "OK",
          }).then(() => navigate("/user-management/users"));
          return;
        }

        setUser({
          name: response.data.name || response.data.fullName || "",
          email: response.data.email || "",
          role: response.data.role || "karyawan",
        });
      } else {
        throw new Error("Tidak ada data yang diterima dari server");
      }
    } catch (err) {
      console.error("Gagal memuat data pengguna:", err);
      setError(
        `Gagal memuat data pengguna: ${
          err.response?.data?.message || err.message
        }. Silakan coba lagi nanti.`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Siapkan data yang akan dikirim
      const updateData = {
        name: user.name,
        email: user.email,
        role: user.role,
      };

      await axios.put(`http://localhost:5000/api/users/${id}`, updateData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
        },
      });

      await Swal.fire({
        title: "Berhasil!",
        text: "Data pengguna berhasil diperbarui",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });

      navigate("/user-management/users");
    } catch (err) {
      console.error("Gagal memperbarui pengguna:", err);
      setError(
        `Gagal memperbarui pengguna: ${
          err.response?.data?.message || err.message
        }. Silakan coba lagi.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Tentukan apakah pilihan peran harus dinonaktifkan
  const isRoleDisabled = currentUserRole !== "pemilik";

  return (
    <>
      <CRow>
        <CCol>
          <CBreadcrumb className="mb-3">
            <CBreadcrumbItem href="/dashboard">Beranda</CBreadcrumbItem>
            <CBreadcrumbItem href="/user-management/users">
              Manajemen Pengguna
            </CBreadcrumbItem>
            <CBreadcrumbItem active>Edit Pengguna</CBreadcrumbItem>
          </CBreadcrumb>
        </CCol>
      </CRow>

      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <h5>Edit Pengguna</h5>
            </CCardHeader>
            <CCardBody>
              <CButton
                color="secondary"
                variant="outline"
                onClick={() => navigate("/user-management/users")}
                className="mb-3"
              >
                <CIcon icon={cilArrowLeft} /> Kembali ke Daftar Pengguna
              </CButton>

              {error && (
                <CAlert
                  color="danger"
                  dismissible
                  onClose={() => setError(null)}
                >
                  {error}
                </CAlert>
              )}

              {loading ? (
                <div className="d-flex justify-content-center my-5">
                  <CSpinner color="primary" />
                </div>
              ) : (
                <CForm onSubmit={handleSubmit}>
                  <CRow className="mb-3">
                    <CCol md={6}>
                      <CFormInput
                        label="Nama"
                        name="name"
                        value={user.name}
                        onChange={handleInputChange}
                        required
                        placeholder="Masukkan nama lengkap pengguna"
                      />
                    </CCol>
                    <CCol md={6}>
                      <CFormInput
                        type="email"
                        label="Email"
                        name="email"
                        value={user.email}
                        onChange={handleInputChange}
                        required
                        placeholder="Masukkan email pengguna"
                      />
                    </CCol>
                  </CRow>

                  <CRow className="mb-3">
                    <CCol md={6}>
                      <CFormSelect
                        label="Peran"
                        name="role"
                        value={user.role}
                        onChange={handleInputChange}
                        required
                        disabled={isRoleDisabled}
                      >
                        {roles.map((role) => (
                          <option key={role} value={role}>
                            {role === "karyawan" ? "Karyawan" : "Pemilik"}
                          </option>
                        ))}
                      </CFormSelect>
                      {isRoleDisabled && (
                        <small className="text-muted">
                          Hanya pemilik yang dapat mengubah peran
                        </small>
                      )}
                    </CCol>
                  </CRow>

                  <div className="d-flex justify-content-end">
                    <CButton
                      type="submit"
                      color="primary"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <CSpinner
                            component="span"
                            size="sm"
                            aria-hidden="true"
                          />
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <CIcon icon={cilSave} className="me-2" />
                          Simpan Perubahan
                        </>
                      )}
                    </CButton>
                  </div>
                </CForm>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  );
};

export default EditUser;
