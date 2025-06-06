import React, { useState, useEffect } from "react";
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CButton,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  CSpinner,
  CBreadcrumb,
  CBreadcrumbItem,
  CInputGroup,
  CInputGroupText,
  CFormFeedback,
  CAlert,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilSave, cilArrowLeft, cilX } from "@coreui/icons";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

const EditProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingProduct, setLoadingProduct] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    currentStock: "",
    minStock: "",
    category: "",
    supplier: "",
  });

  const [originalData, setOriginalData] = useState({});
  const [validated, setValidated] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoadingData(true);
      try {
        const [categoriesRes, suppliersRes, productRes] = await Promise.all([
          axios.get("http://localhost:5000/api/categories", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("userToken")}`,
            },
          }),
          axios.get("http://localhost:5000/api/suppliers", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("userToken")}`,
            },
          }),
          axios.get(`http://localhost:5000/api/products/${id}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("userToken")}`,
            },
          }),
        ]);

        setCategories(categoriesRes.data || []);
        setSuppliers(suppliersRes.data || []);

        // Set product data
        const productData = productRes.data;
        const formattedData = {
          name: productData.name || "",
          description: productData.description || "",
          price: productData.price?.toString() || "",
          currentStock: productData.currentStock?.toString() || "",
          minStock: productData.minStock?.toString() || "",
          category: productData.category?._id || productData.category || "",
          supplier: productData.supplier?._id || productData.supplier || "",
        };

        setFormData(formattedData);
        setOriginalData(formattedData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(
          `Failed to load data: ${err.response?.data?.message || err.message}`
        );

        if (err.response?.status === 404) {
          Swal.fire({
            icon: "error",
            title: "Product Not Found",
            text: "The product you're trying to edit doesn't exist.",
            confirmButtonText: "Go Back",
          }).then(() => {
            navigate("/product-management");
          });
        } else {
          Swal.fire(
            "Error",
            "Failed to load product data. Please try again.",
            "error"
          );
        }
      } finally {
        setLoadingData(false);
        setLoadingProduct(false);
      }
    };

    if (id) {
      fetchInitialData();
    } else {
      navigate("/product-management");
    }
  }, [id, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Product name is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.supplier) newErrors.supplier = "Supplier is required";

    if (!formData.price || formData.price <= 0) {
      newErrors.price = "Price must be greater than 0";
    }
    if (!formData.currentStock || formData.currentStock < 0) {
      newErrors.currentStock = "Stock cannot be negative";
    }
    if (formData.minStock && formData.minStock < 0) {
      newErrors.minStock = "Minimum stock cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    setValidated(true);

    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        currentStock: parseInt(formData.currentStock),
        minStock: formData.minStock ? parseInt(formData.minStock) : 0,
        category: formData.category,
        supplier: formData.supplier,
      };

      await axios.put(`http://localhost:5000/api/products/${id}`, productData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          "Content-Type": "application/json",
        },
      });

      Swal.fire({
        icon: "success",
        title: "Product Updated",
        text: "Product updated successfully!",
        confirmButtonText: "OK",
      }).then(() => {
        navigate("/product-management");
      });
    } catch (err) {
      console.error("Error updating product:", err);
      const errorMessage = err.response?.data?.message || err.message;
      setError(`Failed to update product: ${errorMessage}`);

      Swal.fire({
        icon: "error",
        title: "Failed to Update Product",
        text: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/product-management");
  };

  const handleReset = () => {
    setFormData(originalData);
    setValidated(false);
    setErrors({});
    setError(null);
  };

  if (loadingData || loadingProduct) {
    return (
      <div className="d-flex justify-content-center my-5">
        <CSpinner color="primary" />
      </div>
    );
  }

  return (
    <>
      <CRow>
        <CCol>
          <CBreadcrumb className="mb-3">
            <CBreadcrumbItem href="/dashboard">Home</CBreadcrumbItem>
            <CBreadcrumbItem>Product Management</CBreadcrumbItem>
            <CBreadcrumbItem href="/product-management">
              Product List
            </CBreadcrumbItem>
            <CBreadcrumbItem active>Edit Product</CBreadcrumbItem>
          </CBreadcrumb>
        </CCol>
      </CRow>

      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <h5>Edit Product</h5>
            </CCardHeader>
            <CCardBody>
              {error && (
                <CAlert
                  color="danger"
                  dismissible
                  onClose={() => setError(null)}
                  className="mb-3"
                >
                  {error}
                </CAlert>
              )}

              <CForm
                className={validated ? "was-validated" : ""}
                onSubmit={handleSubmit}
                noValidate
              >
                <CRow>
                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="name">
                        Product Name <span className="text-danger">*</span>
                      </CFormLabel>
                      <CFormInput
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter product name"
                        invalid={!!errors.name}
                        required
                      />
                      <CFormFeedback invalid>{errors.name}</CFormFeedback>
                    </div>

                    <div className="mb-3">
                      <CFormLabel htmlFor="category">
                        Category <span className="text-danger">*</span>
                      </CFormLabel>
                      <CFormSelect
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        invalid={!!errors.category}
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map((category) => (
                          <option key={category._id} value={category._id}>
                            {category.name}
                          </option>
                        ))}
                      </CFormSelect>
                      <CFormFeedback invalid>{errors.category}</CFormFeedback>
                    </div>

                    <div className="mb-3">
                      <CFormLabel htmlFor="supplier">
                        Supplier <span className="text-danger">*</span>
                      </CFormLabel>
                      <CFormSelect
                        id="supplier"
                        name="supplier"
                        value={formData.supplier}
                        onChange={handleInputChange}
                        invalid={!!errors.supplier}
                        required
                      >
                        <option value="">Select Supplier</option>
                        {suppliers.map((supplier) => (
                          <option key={supplier._id} value={supplier._id}>
                            {supplier.name}
                          </option>
                        ))}
                      </CFormSelect>
                      <CFormFeedback invalid>{errors.supplier}</CFormFeedback>
                    </div>
                  </CCol>

                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="price">
                        Unit Price <span className="text-danger">*</span>
                      </CFormLabel>
                      <CInputGroup>
                        <CInputGroupText>Rp</CInputGroupText>
                        <CFormInput
                          type="number"
                          id="price"
                          name="price"
                          value={formData.price}
                          onChange={handleInputChange}
                          placeholder="0"
                          min="0"
                          step="0.01"
                          invalid={!!errors.price}
                          required
                        />
                        <CFormFeedback invalid>{errors.price}</CFormFeedback>
                      </CInputGroup>
                    </div>

                    <div className="mb-3">
                      <CFormLabel htmlFor="currentStock">
                        Current Stock <span className="text-danger">*</span>
                      </CFormLabel>
                      <CFormInput
                        type="number"
                        id="currentStock"
                        name="currentStock"
                        value={formData.currentStock}
                        onChange={handleInputChange}
                        placeholder="Enter current stock quantity"
                        min="0"
                        invalid={!!errors.currentStock}
                        required
                      />
                      <CFormFeedback invalid>
                        {errors.currentStock}
                      </CFormFeedback>
                    </div>

                    <div className="mb-3">
                      <CFormLabel htmlFor="minStock">Minimum Stock</CFormLabel>
                      <CFormInput
                        type="number"
                        id="minStock"
                        name="minStock"
                        value={formData.minStock}
                        onChange={handleInputChange}
                        placeholder="Minimum stock alert level"
                        min="0"
                        invalid={!!errors.minStock}
                      />
                      <CFormFeedback invalid>{errors.minStock}</CFormFeedback>
                    </div>
                  </CCol>
                </CRow>

                <CRow>
                  <CCol xs={12}>
                    <div className="mb-4">
                      <CFormLabel htmlFor="description">Description</CFormLabel>
                      <CFormTextarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="3"
                        placeholder="Product description (optional)"
                      />
                    </div>
                  </CCol>
                </CRow>

                <CRow>
                  <CCol xs={12}>
                    <div className="d-flex justify-content-between">
                      <div>
                        <CButton
                          color="secondary"
                          variant="outline"
                          onClick={handleCancel}
                          className="me-2"
                        >
                          <CIcon icon={cilArrowLeft} className="me-1" />
                          Back
                        </CButton>
                        <CButton
                          color="warning"
                          variant="outline"
                          onClick={handleReset}
                          type="button"
                        >
                          <CIcon icon={cilX} className="me-1" />
                          Reset
                        </CButton>
                      </div>
                      <CButton color="primary" type="submit" disabled={loading}>
                        {loading ? (
                          <>
                            <CSpinner size="sm" className="me-1" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <CIcon icon={cilSave} className="me-1" />
                            Update Product
                          </>
                        )}
                      </CButton>
                    </div>
                  </CCol>
                </CRow>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  );
};

export default EditProduct;
