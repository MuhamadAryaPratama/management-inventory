import React, { useState } from "react";
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CButton,
  CForm,
  CFormLabel,
  CFormInput,
  CFormTextarea,
  CBreadcrumb,
  CBreadcrumbItem,
  CSpinner,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilArrowLeft, cilSave } from "@coreui/icons";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const AddSupplier = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post("http://localhost:5000/api/suppliers", formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          "Content-Type": "application/json",
        },
      });

      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Supplier berhasil ditambahkan!",
      }).then(() => {
        navigate("/suppliers");
      });
    } catch (error) {
      console.error("Gagal menambahkan supplier:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Gagal menambahkan supplier",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-supplier-page">
      <CRow className="mb-3">
        <CCol>
          <CBreadcrumb>
            <CBreadcrumbItem href="/dashboard">Beranda</CBreadcrumbItem>
            <CBreadcrumbItem href="/suppliers">Supplier</CBreadcrumbItem>
            <CBreadcrumbItem active>Tambah Supplier</CBreadcrumbItem>
          </CBreadcrumb>
        </CCol>
      </CRow>

      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4 shadow-sm">
            <CCardHeader className="bg-primary text-white">
              <h5 className="mb-0">Tambah Supplier Baru</h5>
            </CCardHeader>
            <CCardBody>
              <CForm onSubmit={handleSubmit}>
                <CRow>
                  <CCol md={12}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="name">
                        Nama Supplier <span className="text-danger">*</span>
                      </CFormLabel>
                      <CFormInput
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Masukkan nama supplier"
                        maxLength={50}
                        required
                      />
                    </div>
                  </CCol>
                </CRow>

                <CRow>
                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="contact">Kontak</CFormLabel>
                      <CFormInput
                        id="contact"
                        name="contact"
                        value={formData.contact}
                        onChange={handleInputChange}
                        placeholder="Masukkan nama kontak"
                        maxLength={20}
                      />
                    </div>
                  </CCol>
                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="phone">Telepon</CFormLabel>
                      <CFormInput
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Masukkan nomor telepon"
                        maxLength={20}
                      />
                    </div>
                  </CCol>
                </CRow>

                <CRow>
                  <CCol md={12}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="address">Alamat</CFormLabel>
                      <CFormTextarea
                        id="address"
                        name="address"
                        rows={3}
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Masukkan alamat supplier"
                        maxLength={100}
                      />
                    </div>
                  </CCol>
                </CRow>

                <CRow>
                  <CCol className="d-flex justify-content-between">
                    <CButton
                      color="secondary"
                      onClick={() => navigate("/supplier/suppliers")}
                      disabled={loading}
                    >
                      <CIcon icon={cilArrowLeft} className="me-1" />
                      Kembali
                    </CButton>
                    <CButton
                      color="primary"
                      type="submit"
                      disabled={loading || !formData.name.trim()}
                    >
                      {loading && <CSpinner size="sm" className="me-2" />}
                      <CIcon icon={cilSave} className="me-1" />
                      Simpan Supplier
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

export default AddSupplier;
