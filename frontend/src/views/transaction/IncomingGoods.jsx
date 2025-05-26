import React, { useState, useEffect } from "react";
import {
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CButton,
  CForm,
  CFormLabel,
  CFormInput,
  CFormSelect,
  CFormTextarea,
  CAlert,
  CSpinner,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilPlus, cilArrowCircleBottom } from "@coreui/icons";
import axios from "axios";
import Swal from "sweetalert2";

const IncomingGoods = () => {
  // State management
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    color: "success",
  });

  // Form state
  const [formData, setFormData] = useState({
    product: "",
    quantity: "",
    notes: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem("userToken") || localStorage.getItem("token");
  };

  // Create axios instance with default config
  const createAxiosInstance = () => {
    const token = getAuthToken();
    return axios.create({
      baseURL: "http://localhost:5000/api",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      timeout: 15000, // 15 second timeout for better reliability
    });
  };

  // Fetch products for dropdown
  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login kembali.");
      }

      const api = createAxiosInstance();
      const response = await api.get("/products");

      console.log("Products response:", response.data);

      if (response.data && response.status === 200) {
        const productData =
          response.data.products || response.data.data || response.data || [];
        setProducts(Array.isArray(productData) ? productData : []);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      handleApiError(error, "Gagal mengambil data produk");
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  // Handle API errors consistently
  const handleApiError = (error, defaultMessage) => {
    let errorMessage = defaultMessage;

    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;

      if (status === 401) {
        errorMessage = "Sesi telah berakhir. Silakan login kembali.";
        Swal.fire({
          icon: "warning",
          title: "Sesi Berakhir",
          text: errorMessage,
          confirmButtonText: "OK",
          confirmButtonColor: "#f59e0b",
        });
        return;
      } else if (status === 403) {
        errorMessage = "Anda tidak memiliki akses untuk melakukan operasi ini.";
      } else if (status === 404) {
        errorMessage = "Endpoint tidak ditemukan. Periksa konfigurasi API.";
      } else if (status === 422 || status === 400) {
        errorMessage =
          data.message || data.error || "Data yang dikirim tidak valid.";
      } else if (status >= 500) {
        errorMessage =
          "Terjadi kesalahan pada server. Silakan coba lagi nanti.";
      } else {
        errorMessage = data.message || data.error || defaultMessage;
      }
    } else if (error.request) {
      // Network error
      errorMessage =
        "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.";
    } else {
      // Other error
      errorMessage = error.message || defaultMessage;
    }

    Swal.fire({
      icon: "error",
      title: "Error",
      text: errorMessage,
      confirmButtonText: "OK",
      confirmButtonColor: "#dc3545",
    });
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.product || formData.product.trim() === "") {
      errors.product = "Produk harus dipilih";
    }

    const quantity = parseInt(formData.quantity);
    if (!formData.quantity || isNaN(quantity) || quantity <= 0) {
      errors.quantity = "Jumlah harus berupa angka positif";
    } else if (quantity > 10000) {
      errors.quantity = "Jumlah tidak boleh lebih dari 10,000";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission with SweetAlert
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      Swal.fire({
        icon: "warning",
        title: "Form Tidak Valid",
        text: "Mohon periksa kembali data yang diisi",
        confirmButtonText: "OK",
        confirmButtonColor: "#f59e0b",
      });
      return;
    }

    // Show confirmation dialog
    const selectedProduct = products.find((p) => p._id === formData.product);
    const quantity = parseInt(formData.quantity);
    const currentStock = getCurrentStock();
    const newStock = currentStock + quantity;

    const confirmResult = await Swal.fire({
      title: "Konfirmasi Barang Masuk",
      html: `
        <div class="text-start">
          <p><strong>Produk:</strong> ${selectedProduct?.name || "N/A"}</p>
          <p><strong>Jumlah Masuk:</strong> <span class="text-success">+${quantity}</span></p>
          <p><strong>Stok Saat Ini:</strong> ${currentStock}</p>
          <p><strong>Stok Setelah:</strong> <span class="text-success"><strong>${newStock}</strong></span></p>
          ${
            formData.notes
              ? `<p><strong>Catatan:</strong> ${formData.notes}</p>`
              : ""
          }
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Tambah Barang",
      cancelButtonText: "Batal",
      confirmButtonColor: "#198754",
      cancelButtonColor: "#6c757d",
      reverseButtons: true,
    });

    if (!confirmResult.isConfirmed) {
      return;
    }

    setSubmitting(true);

    // Show loading
    Swal.fire({
      title: "Memproses...",
      text: "Sedang menambahkan barang masuk",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login kembali.");
      }

      if (!selectedProduct) {
        throw new Error("Produk yang dipilih tidak valid");
      }

      // Prepare transaction data for stock-in endpoint
      const transactionData = {
        product: formData.product, // Product ID (required)
        quantity: quantity, // Quantity to add (required)
        notes: formData.notes.trim() || "", // Optional notes
      };

      console.log("Submitting stock-in transaction:", transactionData);

      const api = createAxiosInstance();

      // POST request to stock-in endpoint
      const response = await api.post(
        "/transactions/stock-in",
        transactionData
      );

      console.log("Stock-in response:", response.data);

      // Handle successful response
      if (response.status === 200 || response.status === 201) {
        const successMessage =
          response.data.message ||
          `Berhasil menambah ${quantity} unit ${selectedProduct.name} ke stok!`;

        // Show success alert
        await Swal.fire({
          icon: "success",
          title: "Berhasil!",
          html: `
            <div class="text-start">
              <p>${successMessage}</p>
              <hr>
              <p><strong>Detail Transaksi:</strong></p>
              <p><strong>Produk:</strong> ${selectedProduct.name}</p>
              <p><strong>Jumlah Ditambahkan:</strong> <span class="text-success">+${quantity}</span></p>
              <p><strong>Stok Baru:</strong> <span class="text-success"><strong>${newStock}</strong></span></p>
            </div>
          `,
          confirmButtonText: "OK",
          confirmButtonColor: "#198754",
        });

        resetForm();

        // Refresh products to show updated stock
        await fetchProducts();
      } else {
        throw new Error("Respons tidak valid dari server");
      }
    } catch (error) {
      console.error("Error submitting stock-in transaction:", error);

      // Close loading and show error
      Swal.close();

      // More specific error handling for stock-in endpoint
      if (error.response?.status === 400) {
        handleApiError(
          error,
          "Data yang dikirim tidak valid untuk transaksi stock-in"
        );
      } else if (error.response?.status === 404) {
        handleApiError(
          error,
          "Produk tidak ditemukan atau endpoint stock-in tidak tersedia"
        );
      } else {
        handleApiError(error, "Terjadi kesalahan saat menambah barang masuk");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      product: "",
      quantity: "",
      notes: "",
    });
    setFormErrors({});
  };

  // Show alert with auto-hide
  const showAlert = (message, color) => {
    setAlert({ show: true, message, color });
    setTimeout(() => {
      setAlert({ show: false, message: "", color: "success" });
    }, 5000);
  };

  // Get current stock for selected product
  const getCurrentStock = () => {
    if (!formData.product) return "-";
    const selectedProduct = products.find((p) => p._id === formData.product);
    return selectedProduct?.currentStock || selectedProduct?.stock || 0;
  };

  // Get new stock calculation
  const getNewStock = () => {
    if (!formData.product || !formData.quantity) return "-";
    const currentStock = getCurrentStock();
    const quantity = parseInt(formData.quantity) || 0;
    return currentStock + quantity;
  };

  return (
    <>
      {alert.show && (
        <CAlert
          color={alert.color}
          dismissible
          onClose={() =>
            setAlert({ show: false, message: "", color: "success" })
          }
        >
          {alert.message}
        </CAlert>
      )}

      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-0">
                    <CIcon icon={cilArrowCircleBottom} className="me-2" />
                    Tambah Barang Masuk
                  </h4>
                  <small className="text-muted">
                    Form untuk menambahkan barang masuk ke inventory
                  </small>
                </div>
              </div>
            </CCardHeader>
            <CCardBody>
              <CForm onSubmit={handleSubmit}>
                <CRow>
                  <CCol md={12}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="product">
                        Produk <span className="text-danger">*</span>
                      </CFormLabel>
                      <CFormSelect
                        id="product"
                        name="product"
                        value={formData.product}
                        onChange={handleInputChange}
                        invalid={!!formErrors.product}
                        disabled={productsLoading}
                      >
                        <option value="">
                          {productsLoading
                            ? "Loading products..."
                            : "Pilih Produk"}
                        </option>
                        {products.map((product) => (
                          <option key={product._id} value={product._id}>
                            {product.name} - Stok:{" "}
                            {product.currentStock || product.stock || 0}
                          </option>
                        ))}
                      </CFormSelect>
                      {formErrors.product && (
                        <div className="invalid-feedback d-block">
                          {formErrors.product}
                        </div>
                      )}
                      {products.length === 0 && !productsLoading && (
                        <small className="text-muted">
                          Tidak ada produk tersedia. Pastikan produk sudah
                          ditambahkan.
                        </small>
                      )}
                    </div>
                  </CCol>

                  <CCol md={4}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="quantity">
                        Jumlah Masuk <span className="text-danger">*</span>
                      </CFormLabel>
                      <CFormInput
                        type="number"
                        id="quantity"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        placeholder="Masukkan jumlah"
                        min="1"
                        max="10000"
                        invalid={!!formErrors.quantity}
                      />
                      {formErrors.quantity && (
                        <div className="invalid-feedback">
                          {formErrors.quantity}
                        </div>
                      )}
                    </div>
                  </CCol>

                  <CCol md={4}>
                    <div className="mb-3">
                      <CFormLabel>Stok Saat Ini</CFormLabel>
                      <CFormInput
                        type="text"
                        value={getCurrentStock()}
                        disabled
                        className="bg-light"
                      />
                    </div>
                  </CCol>

                  <CCol md={4}>
                    <div className="mb-3">
                      <CFormLabel>Stok Setelah</CFormLabel>
                      <CFormInput
                        type="text"
                        value={getNewStock()}
                        disabled
                        className="bg-light text-success fw-bold"
                      />
                    </div>
                  </CCol>

                  <CCol md={12}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="notes">Catatan</CFormLabel>
                      <CFormTextarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows="3"
                        placeholder="Catatan tambahan (opsional) - contoh: Pembelian dari supplier ABC"
                        maxLength="500"
                      />
                      <small className="text-muted">
                        {formData.notes.length}/500 karakter
                      </small>
                    </div>
                  </CCol>
                </CRow>

                <div className="d-flex justify-content-end gap-2">
                  <CButton
                    color="secondary"
                    type="button"
                    onClick={resetForm}
                    disabled={submitting}
                  >
                    Reset Form
                  </CButton>
                  <CButton
                    type="submit"
                    color="primary"
                    disabled={
                      submitting || productsLoading || products.length === 0
                    }
                  >
                    {submitting ? (
                      <>
                        <CSpinner size="sm" className="me-2" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <CIcon icon={cilPlus} className="me-2" />
                        Simpan Barang Masuk
                      </>
                    )}
                  </CButton>
                </div>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  );
};

export default IncomingGoods;
