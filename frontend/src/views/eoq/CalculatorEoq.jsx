import React, { useState, useEffect } from "react";
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CForm,
  CFormLabel,
  CFormInput,
  CFormSelect,
  CButton,
  CAlert,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CSpinner,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilCalculator, cilChart, cilReload, cilInfo } from "@coreui/icons";
import axios from "axios";

const CalculatorEoq = () => {
  const [formData, setFormData] = useState({
    productId: "",
    orderingCost: "",
    holdingCost: "",
    annualDemand: "",
  });

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      // Use consistent token key - match with Product.jsx
      const token = localStorage.getItem("userToken");

      if (!token) {
        setError("Token tidak ditemukan. Silakan login kembali.");
        return;
      }

      // Use consistent API URL - match with Product.jsx
      const response = await axios.get("http://localhost:5000/api/products", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Handle response data properly
      if (response.data && Array.isArray(response.data)) {
        setProducts(response.data);
      } else if (response.data.data && Array.isArray(response.data.data)) {
        setProducts(response.data.data);
      } else {
        console.warn("Unexpected API response format:", response.data);
        setProducts([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setError(
        `Gagal memuat data produk: ${
          error.response?.data?.message || error.message
        }`
      );
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear previous results when input changes
    if (result) {
      setResult(null);
    }

    // Clear success message when input changes
    if (success) {
      setSuccess("");
    }
  };

  const calculateEOQ = async (e) => {
    e.preventDefault();

    // Validation
    if (
      !formData.productId ||
      !formData.orderingCost ||
      !formData.holdingCost ||
      !formData.annualDemand
    ) {
      setError("Semua field harus diisi");
      return;
    }

    // Validate positive numbers
    if (
      parseFloat(formData.orderingCost) <= 0 ||
      parseFloat(formData.holdingCost) <= 0 ||
      parseFloat(formData.annualDemand) <= 0
    ) {
      setError("Semua nilai harus lebih besar dari 0");
      return;
    }

    try {
      setCalculating(true);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("userToken");

      if (!token) {
        setError("Token tidak ditemukan. Silakan login kembali.");
        return;
      }

      const response = await axios.post(
        "http://localhost:5000/api/eoq",
        {
          product: formData.productId,
          orderingCost: parseFloat(formData.orderingCost),
          holdingCost: parseFloat(formData.holdingCost),
          annualDemand: parseFloat(formData.annualDemand),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Handle response data
      if (response.data) {
        setResult(response.data.data || response.data);
        setSuccess("Perhitungan EOQ berhasil dan data telah disimpan");
      }
    } catch (error) {
      console.error("Error calculating EOQ:", error);
      setError(
        error.response?.data?.message ||
          "Gagal menghitung EOQ. Silakan coba lagi."
      );
    } finally {
      setCalculating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      productId: "",
      orderingCost: "",
      holdingCost: "",
      annualDemand: "",
    });
    setResult(null);
    setError("");
    setSuccess("");
  };

  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (number) => {
    if (!number || isNaN(number)) return "0";
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(number);
  };

  // Get selected product details
  const getSelectedProduct = () => {
    return products.find((p) => p._id === formData.productId);
  };

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <div>
                <CIcon icon={cilCalculator} className="me-2" />
                <strong>Kalkulator EOQ (Economic Order Quantity)</strong>
              </div>
              <CButton
                color="info"
                variant="outline"
                size="sm"
                onClick={() => setShowInfoModal(true)}
              >
                <CIcon icon={cilInfo} className="me-1" />
                Info EOQ
              </CButton>
            </CCardHeader>
            <CCardBody>
              {error && (
                <CAlert color="danger" dismissible onClose={() => setError("")}>
                  {error}
                </CAlert>
              )}
              {success && (
                <CAlert
                  color="success"
                  dismissible
                  onClose={() => setSuccess("")}
                >
                  {success}
                </CAlert>
              )}

              <CForm onSubmit={calculateEOQ}>
                <CRow className="mb-3">
                  <CCol md={6}>
                    <CFormLabel htmlFor="productId">Pilih Produk *</CFormLabel>
                    <CFormSelect
                      id="productId"
                      name="productId"
                      value={formData.productId}
                      onChange={handleInputChange}
                      disabled={loading}
                    >
                      <option value="">
                        {loading ? "Memuat produk..." : "-- Pilih Produk --"}
                      </option>
                      {products.map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.name} {product.sku ? `- ${product.sku}` : ""}
                        </option>
                      ))}
                    </CFormSelect>
                    {loading && (
                      <div className="mt-2">
                        <CSpinner size="sm" className="me-2" />
                        <small className="text-muted">
                          Memuat data produk...
                        </small>
                      </div>
                    )}
                    {!loading && products.length === 0 && !error && (
                      <small className="text-muted">
                        Tidak ada produk tersedia.{" "}
                        <CButton
                          color="link"
                          size="sm"
                          className="p-0"
                          onClick={fetchProducts}
                        >
                          Muat ulang
                        </CButton>
                      </small>
                    )}
                  </CCol>
                  <CCol md={6}>
                    {getSelectedProduct() && (
                      <div className="mt-4">
                        <small className="text-muted d-block">
                          Produk Terpilih:
                        </small>
                        <strong>{getSelectedProduct().name}</strong>
                        <div>
                          <small className="text-muted">
                            Kategori:{" "}
                            {getSelectedProduct().category?.name || "Tidak ada"}
                          </small>
                        </div>
                        <div>
                          <small className="text-muted">
                            Stok: {getSelectedProduct().currentStock || 0} unit
                          </small>
                        </div>
                        <div>
                          <small className="text-muted">
                            Harga: {formatCurrency(getSelectedProduct().price)}
                          </small>
                        </div>
                      </div>
                    )}
                  </CCol>
                </CRow>

                <CRow className="mb-3">
                  <CCol md={4}>
                    <CFormLabel htmlFor="orderingCost">
                      Biaya Pemesanan per Order (Rp) *
                    </CFormLabel>
                    <CFormInput
                      type="number"
                      id="orderingCost"
                      name="orderingCost"
                      value={formData.orderingCost}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0.01"
                      step="0.01"
                    />
                    <small className="text-muted">
                      Biaya tetap untuk setiap kali melakukan pemesanan
                    </small>
                  </CCol>
                  <CCol md={4}>
                    <CFormLabel htmlFor="holdingCost">
                      Biaya Penyimpanan per Unit per Tahun (Rp) *
                    </CFormLabel>
                    <CFormInput
                      type="number"
                      id="holdingCost"
                      name="holdingCost"
                      value={formData.holdingCost}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0.01"
                      step="0.01"
                    />
                    <small className="text-muted">
                      Biaya menyimpan satu unit barang selama satu tahun
                    </small>
                  </CCol>
                  <CCol md={4}>
                    <CFormLabel htmlFor="annualDemand">
                      Permintaan Tahunan (Unit) *
                    </CFormLabel>
                    <CFormInput
                      type="number"
                      id="annualDemand"
                      name="annualDemand"
                      value={formData.annualDemand}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="1"
                      step="1"
                    />
                    <small className="text-muted">
                      Jumlah unit yang dibutuhkan dalam satu tahun
                    </small>
                  </CCol>
                </CRow>

                <CRow className="mb-3">
                  <CCol>
                    <div className="d-flex gap-2">
                      <CButton
                        type="submit"
                        color="primary"
                        disabled={
                          calculating || loading || products.length === 0
                        }
                      >
                        {calculating ? (
                          <>
                            <CSpinner size="sm" className="me-1" />
                            Menghitung...
                          </>
                        ) : (
                          <>
                            <CIcon icon={cilCalculator} className="me-1" />
                            Hitung EOQ
                          </>
                        )}
                      </CButton>
                      <CButton
                        type="button"
                        color="secondary"
                        variant="outline"
                        onClick={resetForm}
                        disabled={calculating}
                      >
                        <CIcon icon={cilReload} className="me-1" />
                        Reset
                      </CButton>
                      <CButton
                        type="button"
                        color="info"
                        variant="outline"
                        onClick={fetchProducts}
                        disabled={loading}
                      >
                        {loading ? (
                          <CSpinner size="sm" />
                        ) : (
                          <>
                            <CIcon icon={cilReload} className="me-1" />
                            Muat Ulang Produk
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

      {result && (
        <CRow>
          <CCol xs={12}>
            <CCard>
              <CCardHeader>
                <CIcon icon={cilChart} className="me-2" />
                <strong>Hasil Perhitungan EOQ</strong>
              </CCardHeader>
              <CCardBody>
                <CRow className="mb-4">
                  <CCol md={6}>
                    <h5>Data Input:</h5>
                    <CTable responsive bordered>
                      <CTableBody>
                        <CTableRow>
                          <CTableDataCell>
                            <strong>Produk</strong>
                          </CTableDataCell>
                          <CTableDataCell>
                            {getSelectedProduct()?.name || "N/A"}
                          </CTableDataCell>
                        </CTableRow>
                        <CTableRow>
                          <CTableDataCell>
                            <strong>Biaya Pemesanan</strong>
                          </CTableDataCell>
                          <CTableDataCell>
                            {formatCurrency(formData.orderingCost)}
                          </CTableDataCell>
                        </CTableRow>
                        <CTableRow>
                          <CTableDataCell>
                            <strong>Biaya Penyimpanan</strong>
                          </CTableDataCell>
                          <CTableDataCell>
                            {formatCurrency(formData.holdingCost)}
                          </CTableDataCell>
                        </CTableRow>
                        <CTableRow>
                          <CTableDataCell>
                            <strong>Permintaan Tahunan</strong>
                          </CTableDataCell>
                          <CTableDataCell>
                            {formatNumber(formData.annualDemand)} unit
                          </CTableDataCell>
                        </CTableRow>
                      </CTableBody>
                    </CTable>
                  </CCol>
                  <CCol md={6}>
                    <h5>Hasil Perhitungan:</h5>
                    <CTable responsive bordered>
                      <CTableBody>
                        <CTableRow>
                          <CTableDataCell>
                            <strong>EOQ (Unit Optimal)</strong>
                          </CTableDataCell>
                          <CTableDataCell className="text-primary fw-bold">
                            {formatNumber(result.eoq)} unit
                          </CTableDataCell>
                        </CTableRow>
                        <CTableRow>
                          <CTableDataCell>
                            <strong>Frekuensi Pemesanan</strong>
                          </CTableDataCell>
                          <CTableDataCell>
                            {formatNumber(result.orderFrequency)} kali/tahun
                          </CTableDataCell>
                        </CTableRow>
                        <CTableRow>
                          <CTableDataCell>
                            <strong>Total Biaya Optimal</strong>
                          </CTableDataCell>
                          <CTableDataCell className="text-success fw-bold">
                            {formatCurrency(result.totalCost)}
                          </CTableDataCell>
                        </CTableRow>
                        <CTableRow>
                          <CTableDataCell>
                            <strong>Periode Antar Pesanan</strong>
                          </CTableDataCell>
                          <CTableDataCell>
                            {formatNumber(365 / result.orderFrequency)} hari
                          </CTableDataCell>
                        </CTableRow>
                      </CTableBody>
                    </CTable>
                  </CCol>
                </CRow>

                <CAlert color="info">
                  <strong>Interpretasi:</strong>
                  <ul className="mb-0 mt-2">
                    <li>
                      Pesan sebanyak{" "}
                      <strong>{formatNumber(result.eoq)} unit</strong> setiap
                      kali melakukan pemesanan
                    </li>
                    <li>
                      Lakukan pemesanan sebanyak{" "}
                      <strong>
                        {formatNumber(result.orderFrequency)} kali
                      </strong>{" "}
                      dalam setahun
                    </li>
                    <li>
                      Interval antar pemesanan sekitar{" "}
                      <strong>
                        {formatNumber(365 / result.orderFrequency)} hari
                      </strong>
                    </li>
                    <li>
                      Total biaya optimal per tahun:{" "}
                      <strong>{formatCurrency(result.totalCost)}</strong>
                    </li>
                  </ul>
                </CAlert>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      )}

      {/* Info Modal */}
      <CModal
        visible={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        size="lg"
      >
        <CModalHeader>
          <CModalTitle>Tentang EOQ (Economic Order Quantity)</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <h6>Apa itu EOQ?</h6>
          <p>
            EOQ adalah metode untuk menentukan jumlah pemesanan yang optimal
            untuk meminimalkan total biaya persediaan, yang terdiri dari biaya
            pemesanan dan biaya penyimpanan.
          </p>

          <h6>Rumus EOQ:</h6>
          <div className="bg-light p-3 rounded mb-3">
            <code>EOQ = √(2 × D × S / H)</code>
            <br />
            <small>
              D = Permintaan tahunan, S = Biaya pemesanan per order, H = Biaya
              penyimpanan per unit per tahun
            </small>
          </div>

          <h6>Manfaat EOQ:</h6>
          <ul>
            <li>Meminimalkan total biaya persediaan</li>
            <li>Menentukan frekuensi pemesanan yang optimal</li>
            <li>Menghindari kelebihan atau kekurangan stok</li>
            <li>Meningkatkan efisiensi manajemen persediaan</li>
          </ul>

          <h6>Parameter yang Dibutuhkan:</h6>
          <ul>
            <li>
              <strong>Biaya Pemesanan:</strong> Biaya tetap setiap kali
              melakukan pemesanan (administrasi, pengiriman, dll)
            </li>
            <li>
              <strong>Biaya Penyimpanan:</strong> Biaya menyimpan satu unit
              barang selama satu tahun (sewa gudang, asuransi, dll)
            </li>
            <li>
              <strong>Permintaan Tahunan:</strong> Jumlah unit yang dibutuhkan
              dalam satu tahun
            </li>
          </ul>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowInfoModal(false)}>
            Tutup
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default CalculatorEoq;
