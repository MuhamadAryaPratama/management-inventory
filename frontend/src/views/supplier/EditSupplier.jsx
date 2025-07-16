import React, { useState, useEffect } from "react";
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
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

const EditSupplier = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/suppliers/${id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("userToken")}`,
            },
          }
        );

        setFormData({
          name: response.data.name || "",
          contact: response.data.contact || "",
          phone: response.data.phone || "",
          address: response.data.address || "",
        });
      } catch (error) {
        console.error("Error fetching supplier:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to load supplier data",
        }).then(() => {
          navigate("/suppliers");
        });
      } finally {
        setFetching(false);
      }
    };

    fetchSupplier();
  }, [id, navigate]);

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
      await axios.put(`http://localhost:5000/api/suppliers/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          "Content-Type": "application/json",
        },
      });

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Supplier updated successfully!",
      }).then(() => {
        navigate("/suppliers");
      });
    } catch (error) {
      console.error("Error updating supplier:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update supplier",
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <CSpinner color="primary" />
      </div>
    );
  }

  return (
    <div className="edit-supplier-page">
      <CRow className="mb-3">
        <CCol>
          <CBreadcrumb>
            <CBreadcrumbItem href="/dashboard">Home</CBreadcrumbItem>
            <CBreadcrumbItem href="/suppliers">Suppliers</CBreadcrumbItem>
            <CBreadcrumbItem active>Edit Supplier</CBreadcrumbItem>
          </CBreadcrumb>
        </CCol>
      </CRow>

      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4 shadow-sm">
            <CCardHeader className="bg-primary text-white">
              <h5 className="mb-0">Edit Supplier</h5>
            </CCardHeader>
            <CCardBody>
              <CForm onSubmit={handleSubmit}>
                <CRow>
                  <CCol md={12}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="name">
                        Supplier Name <span className="text-danger">*</span>
                      </CFormLabel>
                      <CFormInput
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter supplier name"
                        maxLength={50}
                        required
                      />
                    </div>
                  </CCol>
                </CRow>

                <CRow>
                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="contact">Contact</CFormLabel>
                      <CFormInput
                        id="contact"
                        name="contact"
                        value={formData.contact}
                        onChange={handleInputChange}
                        placeholder="Enter contact person"
                        maxLength={20}
                      />
                    </div>
                  </CCol>
                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="phone">Phone</CFormLabel>
                      <CFormInput
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Enter phone number"
                        maxLength={20}
                      />
                    </div>
                  </CCol>
                </CRow>

                <CRow>
                  <CCol md={12}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="address">Address</CFormLabel>
                      <CFormTextarea
                        id="address"
                        name="address"
                        rows={3}
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Enter supplier address"
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
                      Back
                    </CButton>
                    <CButton
                      color="primary"
                      type="submit"
                      disabled={loading || !formData.name.trim()}
                    >
                      {loading && <CSpinner size="sm" className="me-2" />}
                      <CIcon icon={cilSave} className="me-1" />
                      Update Supplier
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

export default EditSupplier;
