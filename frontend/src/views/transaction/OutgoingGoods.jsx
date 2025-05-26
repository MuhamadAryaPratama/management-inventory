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
  CInputGroup,
  CInputGroupText,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilMinus, cilArrowCircleTop, cilMoney } from "@coreui/icons";
import axios from "axios";
import Swal from "sweetalert2";

const OutgoingGoods = () => {
  // State management
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    color: "success",
  });

  // Form state - enhanced with price
  const [formData, setFormData] = useState({
    product: "",
    quantity: "",
    price: "",
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
        // Filter products that have stock > 0
        const availableProducts = productData.filter((product) => {
          const stock = product.currentStock || product.stock || 0;
          return stock > 0;
        });
        setProducts(Array.isArray(availableProducts) ? availableProducts : []);
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

    // Special handling for product selection to auto-fill price
    if (name === "product") {
      const selectedProduct = products.find((p) => p._id === value);
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        price: selectedProduct
          ? selectedProduct.price || selectedProduct.sellingPrice || 0
          : "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

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
    const currentStock = getCurrentStock();

    if (!formData.quantity || isNaN(quantity) || quantity <= 0) {
      errors.quantity = "Jumlah harus berupa angka positif";
    } else if (quantity > currentStock) {
      errors.quantity = `Jumlah tidak boleh melebihi stok tersedia (${currentStock})`;
    } else if (quantity > 10000) {
      errors.quantity = "Jumlah tidak boleh lebih dari 10,000";
    }

    const price = parseFloat(formData.price);
    if (!formData.price || isNaN(price) || price < 0) {
      errors.price = "Harga harus berupa angka yang valid";
    } else if (price > 99999999) {
      errors.price = "Harga tidak boleh lebih dari 99,999,999";
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
    const price = parseFloat(formData.price);
    const totalValue = quantity * price;
    const currentStock = getCurrentStock();
    const newStock = currentStock - quantity;

    const confirmResult = await Swal.fire({
      title: "Konfirmasi Barang Keluar",
      html: `
        <div class="text-start">
          <p><strong>Produk:</strong> ${selectedProduct?.name || "N/A"}</p>
          <p><strong>Jumlah Keluar:</strong> <span class="text-danger">-${quantity}</span></p>
          <p><strong>Harga Satuan:</strong> Rp ${price.toLocaleString(
            "id-ID"
          )}</p>
          <p><strong>Total Nilai:</strong> <span class="text-success fw-bold">Rp ${totalValue.toLocaleString(
            "id-ID"
          )}</span></p>
          <hr>
          <p><strong>Stok Saat Ini:</strong> ${currentStock}</p>
          <p><strong>Stok Setelah:</strong> <span class="text-${
            newStock < 10 ? "warning" : "info"
          }"><strong>${newStock}</strong></span></p>
          ${
            newStock < 10
              ? '<p class="text-warning"><small><i class="fas fa-exclamation-triangle"></i> Peringatan: Stok akan menjadi rendah!</small></p>'
              : ""
          }
          ${
            formData.notes
              ? `<p><strong>Catatan:</strong> ${formData.notes}</p>`
              : ""
          }
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Kurangi Stok",
      cancelButtonText: "Batal",
      confirmButtonColor: "#dc3545",
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
      text: "Sedang memproses barang keluar",
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

      // Prepare transaction data for stock-out endpoint
      const transactionData = {
        product: formData.product, // Product ID (required)
        quantity: quantity, // Quantity to subtract (required)
        price: price, // Price per unit (added)
        totalValue: totalValue, // Total transaction value (added)
        notes: formData.notes.trim() || "", // Optional notes
      };

      console.log("Submitting stock-out transaction:", transactionData);

      const api = createAxiosInstance();

      // POST request to stock-out endpoint
      const response = await api.post(
        "/transactions/stock-out",
        transactionData
      );

      console.log("Stock-out response:", response.data);

      // Handle successful response
      if (response.status === 200 || response.status === 201) {
        const successMessage =
          response.data.message ||
          `Berhasil mengurangi ${quantity} unit ${selectedProduct.name} dari stok!`;

        // Show success alert with warning if stock is low
        const alertColor = newStock < 10 ? "warning" : "success";
        const alertIcon = newStock < 10 ? "warning" : "success";

        await Swal.fire({
          icon: alertIcon,
          title: "Berhasil!",
          html: `
            <div class="text-start">
              <p>${successMessage}</p>
              ${
                newStock < 10
                  ? '<p class="text-warning"><strong>⚠️ Stok rendah!</strong> Pertimbangkan untuk melakukan restok.</p>'
                  : ""
              }
              <hr>
              <p><strong>Detail Transaksi:</strong></p>
              <p><strong>Produk:</strong> ${selectedProduct.name}</p>
              <p><strong>Jumlah Dikurangi:</strong> <span class="text-danger">-${quantity}</span></p>
              <p><strong>Harga Satuan:</strong> Rp ${price.toLocaleString(
                "id-ID"
              )}</p>
              <p><strong>Total Nilai:</strong> <span class="text-success fw-bold">Rp ${totalValue.toLocaleString(
                "id-ID"
              )}</span></p>
              <p><strong>Stok Baru:</strong> <span class="text-${
                newStock < 10 ? "warning" : "info"
              }"><strong>${newStock}</strong></span></p>
            </div>
          `,
          confirmButtonText: "OK",
          confirmButtonColor: newStock < 10 ? "#f59e0b" : "#198754",
        });

        resetForm();
        await fetchProducts();
      } else {
        throw new Error("Respons tidak valid dari server");
      }
    } catch (error) {
      console.error("Error submitting stock-out transaction:", error);

      // Close loading and show error
      Swal.close();

      // More specific error handling for stock-out endpoint
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (
          errorData.message &&
          errorData.message.includes("insufficient stock")
        ) {
          handleApiError(error, "Stok tidak mencukupi untuk transaksi ini");
        } else {
          handleApiError(
            error,
            "Data yang dikirim tidak valid untuk transaksi stock-out"
          );
        }
      } else if (error.response?.status === 404) {
        handleApiError(
          error,
          "Produk tidak ditemukan atau endpoint stock-out tidak tersedia"
        );
      } else {
        handleApiError(error, "Terjadi kesalahan saat memproses barang keluar");
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
      price: "",
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

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return "Rp 0";
    return `Rp ${parseFloat(amount).toLocaleString("id-ID")}`;
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
    return Math.max(0, currentStock - quantity);
  };

  // Calculate total value
  const getTotalValue = () => {
    if (!formData.quantity || !formData.price) return 0;
    const quantity = parseInt(formData.quantity) || 0;
    const price = parseFloat(formData.price) || 0;
    return quantity * price;
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
                    <CIcon icon={cilArrowCircleTop} className="me-2" />
                    Barang Keluar
                  </h4>
                  <small className="text-muted">
                    Form untuk mengurangi stok barang keluar dari inventory
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
                        {products.map((product) => {
                          const stock =
                            product.currentStock || product.stock || 0;
                          const price =
                            product.price || product.sellingPrice || 0;
                          return (
                            <option key={product._id} value={product._id}>
                              {product.name} - Stok: {stock} -{" "}
                              {formatCurrency(price)}
                              {stock < 10 ? " ⚠️" : ""}
                            </option>
                          );
                        })}
                      </CFormSelect>
                      {formErrors.product && (
                        <div className="invalid-feedback d-block">
                          {formErrors.product}
                        </div>
                      )}
                      {products.length === 0 && !productsLoading && (
                        <small className="text-warning">
                          Tidak ada produk dengan stok tersedia. Pastikan ada
                          stok produk sebelum melakukan transaksi keluar.
                        </small>
                      )}
                    </div>
                  </CCol>
                  <CCol md={4}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="quantity">
                        Jumlah Keluar <span className="text-danger">*</span>
                      </CFormLabel>
                      <CFormInput
                        type="number"
                        id="quantity"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        placeholder="Masukkan jumlah"
                        min="1"
                        max={getCurrentStock()}
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
                      <CFormLabel htmlFor="price">
                        Harga Satuan <span className="text-danger">*</span>
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
                          invalid={!!formErrors.price}
                        />
                      </CInputGroup>
                      {formErrors.price && (
                        <div className="invalid-feedback d-block">
                          {formErrors.price}
                        </div>
                      )}
                      <small className="text-muted">
                        Harga akan otomatis terisi saat memilih produk
                      </small>
                    </div>
                  </CCol>
                  <CCol md={4}>
                    <div className="mb-3">
                      <CFormLabel>
                        <CIcon icon={cilMoney} className="me-1" />
                        Total Nilai
                      </CFormLabel>
                      <CFormInput
                        type="text"
                        value={formatCurrency(getTotalValue())}
                        disabled
                        className="bg-light text-success fw-bold"
                      />
                      <small className="text-muted">
                        {formData.quantity && formData.price
                          ? `${formData.quantity} x ${formatCurrency(
                              formData.price
                            )}`
                          : "Akan dihitung otomatis"}
                      </small>
                    </div>
                  </CCol>
                  <CCol md={4}>
                    <div className="mb-3">
                      <CFormLabel>Stok Tersedia</CFormLabel>
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
                        className={`bg-light ${
                          getNewStock() !== "-" && getNewStock() < 10
                            ? "text-warning"
                            : "text-info"
                        } fw-bold`}
                      />
                      {getNewStock() !== "-" && getNewStock() < 10 && (
                        <small className="text-warning">
                          ⚠️ Stok akan menjadi rendah!
                        </small>
                      )}
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
                        placeholder="Catatan tambahan (opsional) - contoh: Penjualan ke customer XYZ, Return produk cacat, dll."
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
                    color="danger"
                    disabled={
                      submitting || productsLoading || products.length === 0
                    }
                  >
                    {submitting ? (
                      <>
                        <CSpinner size="sm" className="me-2" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <CIcon icon={cilMinus} className="me-2" />
                        Konfirmasi Barang Keluar
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

export default OutgoingGoods;
