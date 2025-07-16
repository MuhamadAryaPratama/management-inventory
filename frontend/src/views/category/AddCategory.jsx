import React, { useState } from "react";
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CBreadcrumb,
  CBreadcrumbItem,
  CForm,
  CFormLabel,
  CFormInput,
  CFormTextarea,
  CButton,
  CSpinner,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilTags, cilArrowLeft } from "@coreui/icons";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

const AddCategory = () => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const navigate = useNavigate();

  // SweetAlert configuration
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    // Show loading alert
    Toast.fire({
      title: "Menambahkan Kategori...",
      text: "Harap tunggu",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      await axios.post("http://localhost:5000/api/categories", formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          "Content-Type": "application/json",
        },
      });

      // Success with API
      Toast.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Kategori berhasil ditambahkan!",
      });

      navigate("/categories");
    } catch (err) {
      console.error("Gagal menambahkan kategori:", err);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="add-category-page">
      {/* Breadcrumb */}
      <CRow className="mb-3">
        <CCol>
          <CBreadcrumb>
            <CBreadcrumbItem href="/dashboard">Beranda</CBreadcrumbItem>
            <CBreadcrumbItem href="/categories">
              Kategori Barang
            </CBreadcrumbItem>
            <CBreadcrumbItem active>Tambah Kategori</CBreadcrumbItem>
          </CBreadcrumb>
        </CCol>
      </CRow>

      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4 shadow-sm">
            <CCardHeader className="bg-primary text-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <CIcon icon={cilTags} className="me-2" />
                  Tambah Kategori Baru
                </h5>
                <CButton
                  color="light"
                  variant="outline"
                  onClick={() => navigate("/product-management/categories")}
                  className="text-white"
                >
                  <CIcon icon={cilArrowLeft} className="me-1" />
                  Kembali
                </CButton>
              </div>
            </CCardHeader>
            <CCardBody>
              <CForm onSubmit={handleSubmit}>
                <CRow>
                  <CCol md={12}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="name">
                        Nama Kategori <span className="text-danger">*</span>
                      </CFormLabel>
                      <CFormInput
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Masukkan nama kategori"
                        maxLength={50}
                        required
                        className="border-primary"
                      />
                      <div className="form-text">
                        Maksimal 50 karakter ({formData.name.length}/50)
                      </div>
                    </div>
                  </CCol>
                </CRow>

                <CRow>
                  <CCol md={12}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="description">Deskripsi</CFormLabel>
                      <CFormTextarea
                        id="description"
                        name="description"
                        rows={4}
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Masukkan deskripsi kategori (opsional)"
                        maxLength={200}
                        className="border-primary"
                      />
                      <div className="form-text">
                        Maksimal 200 karakter ({formData.description.length}
                        /200)
                      </div>
                    </div>
                  </CCol>
                </CRow>

                <CRow>
                  <CCol className="d-flex justify-content-end">
                    <CButton
                      color="primary"
                      type="submit"
                      disabled={formLoading || !formData.name.trim()}
                    >
                      {formLoading && <CSpinner size="sm" className="me-2" />}
                      Tambah Kategori
                    </CButton>
                  </CCol>
                </CRow>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </div>
  );
};

export default AddCategory;
