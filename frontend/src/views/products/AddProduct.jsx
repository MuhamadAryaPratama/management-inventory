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
  CAlert,
  CSpinner,
  CBreadcrumb,
  CBreadcrumbItem,
  CInputGroup,
  CInputGroupText,
  CFormFeedback,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilSave, cilArrowLeft, cilX, cilCheckCircle } from "@coreui/icons";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AddProduct = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    category: "",
    location: "",
    supplier: "",
    quantity: "",
    unit: "",
    price: "",
    minStock: "",
    maxStock: "",
    description: "",
  });

  // Form validation state
  const [validated, setValidated] = useState(false);
  const [errors, setErrors] = useState({});

  // Load initial data (categories, locations, suppliers)
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoadingData(true);
      try {
        const [categoriesRes, locationsRes, suppliersRes] = await Promise.all([
          axios.get("http://localhost:5000/api/categories", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("userToken")}`,
            },
          }),
          axios.get("http://localhost:5000/api/locations", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("userToken")}`,
            },
          }),
          axios.get("http://localhost:5000/api/suppliers", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("userToken")}`,
            },
          }),
        ]);

        setCategories(categoriesRes.data || []);
        setLocations(locationsRes.data || []);
        setSuppliers(suppliersRes.data || []);
      } catch (err) {
        console.error("Error fetching initial data:", err);
        setError("Failed to load form data. Please refresh the page.");
      } finally {
        setLoadingData(false);
      }
    };

    fetchInitialData();
  }, []);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Generate product code automatically
  const generateProductCode = () => {
    const timestamp = Date.now().toString().slice(-6);
    const randomNum = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    const code = `PRD${timestamp}${randomNum}`;
    setFormData((prev) => ({
      ...prev,
      code: code,
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Required field validation
    if (!formData.code.trim()) newErrors.code = "Product code is required";
    if (!formData.name.trim()) newErrors.name = "Product name is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.location) newErrors.location = "Location is required";
    if (!formData.unit.trim()) newErrors.unit = "Unit is required";

    // Numeric validation
    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = "Quantity must be greater than 0";
    }
    if (!formData.price || formData.price <= 0) {
      newErrors.price = "Price must be greater than 0";
    }
    if (formData.minStock && formData.minStock < 0) {
      newErrors.minStock = "Minimum stock cannot be negative";
    }
    if (formData.maxStock && formData.maxStock < 0) {
      newErrors.maxStock = "Maximum stock cannot be negative";
    }
    if (
      formData.minStock &&
      formData.maxStock &&
      parseInt(formData.minStock) >= parseInt(formData.maxStock)
    ) {
      newErrors.maxStock = "Maximum stock must be greater than minimum stock";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    setValidated(true);

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const productData = {
        ...formData,
        quantity: parseInt(formData.quantity),
        price: parseFloat(formData.price),
        minStock: formData.minStock ? parseInt(formData.minStock) : null,
        maxStock: formData.maxStock ? parseInt(formData.maxStock) : null,
      };

      await axios.post("http://localhost:5000/api/products", productData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          "Content-Type": "application/json",
        },
      });

      setSuccess(true);

      // Redirect after success
      setTimeout(() => {
        navigate("/product-management/items");
      }, 2000);
    } catch (err) {
      console.error("Error adding product:", err);
      setError(
        `Failed to add product: ${
          err.response?.data?.message || err.message
        }. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate("/product-management/items");
  };

  // Reset form
  const handleReset = () => {
    setFormData({
      code: "",
      name: "",
      category: "",
      location: "",
      supplier: "",
      quantity: "",
      unit: "",
      price: "",
      minStock: "",
      maxStock: "",
      description: "",
    });
    setValidated(false);
    setErrors({});
    setError(null);
  };

  if (loadingData) {
    return (
      <div className="d-flex justify-content-center my-5">
        <CSpinner color="primary" />
      </div>
    );
  }

  return (
    <>
      {/* Breadcrumb */}
      <CRow>
        <CCol>
          <CBreadcrumb className="mb-3">
            <CBreadcrumbItem href="/dashboard">Home</CBreadcrumbItem>
            <CBreadcrumbItem>Manajemen Barang</CBreadcrumbItem>
            <CBreadcrumbItem href="/product-management/items">
              Data Barang
            </CBreadcrumbItem>
            <CBreadcrumbItem active>Tambah Barang</CBreadcrumbItem>
          </CBreadcrumb>
        </CCol>
      </CRow>

      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <h5>Tambah Barang Baru</h5>
            </CCardHeader>
            <CCardBody>
              {/* Success Alert */}
              {success && (
                <CAlert color="success" className="d-flex align-items-center">
                  <CIcon icon={cilCheckCircle} className="me-2" />
                  Product added successfully! Redirecting...
                </CAlert>
              )}

              {/* Error Alert */}
              {error && (
                <CAlert
                  color="danger"
                  dismissible
                  onClose={() => setError(null)}
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
                  {/* Left Column */}
                  <CCol md={6}>
                    {/* Product Code */}
                    <div className="mb-3">
                      <CFormLabel htmlFor="code">
                        Product Code <span className="text-danger">*</span>
                      </CFormLabel>
                      <CInputGroup>
                        <CFormInput
                          type="text"
                          id="code"
                          name="code"
                          value={formData.code}
                          onChange={handleInputChange}
                          placeholder="Enter product code"
                          invalid={!!errors.code}
                          required
                        />
                        <CButton
                          type="button"
                          color="secondary"
                          variant="outline"
                          onClick={generateProductCode}
                          title="Generate Code"
                        >
                          Generate
                        </CButton>
                        <CFormFeedback invalid>{errors.code}</CFormFeedback>
                      </CInputGroup>
                    </div>

                    {/* Product Name */}
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

                    {/* Category */}
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
                        {categories.map((category, index) => (
                          <option key={index} value={category.name || category}>
                            {category.name || category}
                          </option>
                        ))}
                      </CFormSelect>
                      <CFormFeedback invalid>{errors.category}</CFormFeedback>
                    </div>

                    {/* Location */}
                    <div className="mb-3">
                      <CFormLabel htmlFor="location">
                        Storage Location <span className="text-danger">*</span>
                      </CFormLabel>
                      <CFormSelect
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        invalid={!!errors.location}
                        required
                      >
                        <option value="">Select Location</option>
                        {locations.map((location, index) => (
                          <option key={index} value={location.name || location}>
                            {location.name || location}
                          </option>
                        ))}
                      </CFormSelect>
                      <CFormFeedback invalid>{errors.location}</CFormFeedback>
                    </div>

                    {/* Supplier */}
                    <div className="mb-3">
                      <CFormLabel htmlFor="supplier">Supplier</CFormLabel>
                      <CFormSelect
                        id="supplier"
                        name="supplier"
                        value={formData.supplier}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Supplier (Optional)</option>
                        {suppliers.map((supplier, index) => (
                          <option key={index} value={supplier.name || supplier}>
                            {supplier.name || supplier}
                          </option>
                        ))}
                      </CFormSelect>
                    </div>
                  </CCol>

                  {/* Right Column */}
                  <CCol md={6}>
                    {/* Quantity */}
                    <div className="mb-3">
                      <CFormLabel htmlFor="quantity">
                        Initial Stock <span className="text-danger">*</span>
                      </CFormLabel>
                      <CFormInput
                        type="number"
                        id="quantity"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        placeholder="Enter initial stock quantity"
                        min="0"
                        invalid={!!errors.quantity}
                        required
                      />
                      <CFormFeedback invalid>{errors.quantity}</CFormFeedback>
                    </div>

                    {/* Unit */}
                    <div className="mb-3">
                      <CFormLabel htmlFor="unit">
                        Unit <span className="text-danger">*</span>
                      </CFormLabel>
                      <CFormInput
                        type="text"
                        id="unit"
                        name="unit"
                        value={formData.unit}
                        onChange={handleInputChange}
                        placeholder="e.g., pcs, kg, liter"
                        invalid={!!errors.unit}
                        required
                      />
                      <CFormFeedback invalid>{errors.unit}</CFormFeedback>
                    </div>

                    {/* Price */}
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

                    {/* Min Stock */}
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

                    {/* Max Stock */}
                    <div className="mb-3">
                      <CFormLabel htmlFor="maxStock">Maximum Stock</CFormLabel>
                      <CFormInput
                        type="number"
                        id="maxStock"
                        name="maxStock"
                        value={formData.maxStock}
                        onChange={handleInputChange}
                        placeholder="Maximum stock capacity"
                        min="0"
                        invalid={!!errors.maxStock}
                      />
                      <CFormFeedback invalid>{errors.maxStock}</CFormFeedback>
                    </div>
                  </CCol>
                </CRow>

                {/* Description */}
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

                {/* Action Buttons */}
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
                            Saving...
                          </>
                        ) : (
                          <>
                            <CIcon icon={cilSave} className="me-1" />
                            Save Product
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

export default AddProduct;
