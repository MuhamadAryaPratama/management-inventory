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

const CalculatorRop = () => {
  const [formData, setFormData] = useState({
    productId: "",
    leadTime: "",
    dailyDemand: "",
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

      // Use consistent token key - match with CalculatorEoq
      const token = localStorage.getItem("userToken");

      if (!token) {
        setError("Token tidak ditemukan. Silakan login kembali.");
        return;
      }

      // Use consistent API URL - match with CalculatorEoq
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

  const calculateROP = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.productId || !formData.leadTime || !formData.dailyDemand) {
      setError("Semua field harus diisi");
      return;
    }

    // Validate positive numbers
    if (
      parseFloat(formData.leadTime) <= 0 ||
      parseFloat(formData.dailyDemand) <= 0
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
        "http://localhost:5000/api/rop",
        {
          product: formData.productId,
          leadTime: parseFloat(formData.leadTime),
          dailyDemand: parseFloat(formData.dailyDemand),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Handle response data
      if (response.data) {
        setResult(response.data.data || response.data);
        setSuccess("Perhitungan ROP berhasil dan data telah disimpan");
      }
    } catch (error) {
      console.error("Error calculating ROP:", error);
      setError(
        error.response?.data?.message ||
          "Gagal menghitung ROP. Silakan coba lagi."
      );
    } finally {
      setCalculating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      productId: "",
      leadTime: "",
      dailyDemand: "",
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
                <strong>Kalkulator ROP (Reorder Point)</strong>
              </div>
              <CButton
                color="info"
                variant="outline"
                size="sm"
                onClick={() => setShowInfoModal(true)}
              >
                <CIcon icon={cilInfo} className="me-1" />
                Info ROP
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

              <CForm onSubmit={calculateROP}>
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
                  <CCol md={6}>
                    <CFormLabel htmlFor="leadTime">
                      Lead Time (Hari) *
                    </CFormLabel>
                    <CFormInput
                      type="number"
                      id="leadTime"
                      name="leadTime"
                      value={formData.leadTime}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0.1"
                      step="0.1"
                    />
                    <small className="text-muted">
                      Waktu yang dibutuhkan dari pemesanan hingga barang
                      diterima (dalam hari)
                    </small>
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel htmlFor="dailyDemand">
                      Permintaan Harian (Unit/Hari) *
                    </CFormLabel>
                    <CFormInput
                      type="number"
                      id="dailyDemand"
                      name="dailyDemand"
                      value={formData.dailyDemand}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0.1"
                      step="0.1"
                    />
                    <small className="text-muted">
                      Rata-rata jumlah unit yang dibutuhkan per hari
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
                            Hitung ROP
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
                <strong>Hasil Perhitungan ROP</strong>
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
                            <strong>Lead Time</strong>
                          </CTableDataCell>
                          <CTableDataCell>
                            {formatNumber(formData.leadTime)} hari
                          </CTableDataCell>
                        </CTableRow>
                        <CTableRow>
                          <CTableDataCell>
                            <strong>Permintaan Harian</strong>
                          </CTableDataCell>
                          <CTableDataCell>
                            {formatNumber(formData.dailyDemand)} unit/hari
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
                            <strong>ROP (Reorder Point)</strong>
                          </CTableDataCell>
                          <CTableDataCell className="text-primary fw-bold">
                            {formatNumber(result.rop)} unit
                          </CTableDataCell>
                        </CTableRow>
                        <CTableRow>
                          <CTableDataCell>
                            <strong>Total Kebutuhan Selama Lead Time</strong>
                          </CTableDataCell>
                          <CTableDataCell>
                            {formatNumber(result.totalDemandDuringLeadTime)}{" "}
                            unit
                          </CTableDataCell>
                        </CTableRow>
                        <CTableRow>
                          <CTableDataCell>
                            <strong>Status Rekomendasi</strong>
                          </CTableDataCell>
                          <CTableDataCell className="text-success fw-bold">
                            {getSelectedProduct()?.currentStock > result.rop
                              ? "Stok Aman"
                              : "Perlu Reorder"}
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
                      Lakukan pemesanan ulang ketika stok mencapai{" "}
                      <strong>{Math.ceil(result.rop)} unit</strong>
                    </li>
                    <li>
                      Total kebutuhan selama lead time:{" "}
                      <strong>
                        {formatNumber(result.totalDemandDuringLeadTime)} unit
                      </strong>
                    </li>
                    <li>
                      Stok saat ini:{" "}
                      <strong>
                        {getSelectedProduct()?.currentStock || 0} unit
                      </strong>
                    </li>
                    <li>
                      Status:{" "}
                      <strong>
                        {getSelectedProduct()?.currentStock > result.rop
                          ? "Stok masih aman, belum perlu reorder"
                          : "Segera lakukan pemesanan ulang"}
                      </strong>
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
          <CModalTitle>Tentang ROP (Reorder Point)</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <h6>Apa itu ROP?</h6>
          <p>
            ROP (Reorder Point) adalah titik pemesanan kembali yang menunjukkan
            kapan harus melakukan pemesanan ulang untuk menghindari kehabisan
            stok. ROP membantu menentukan tingkat persediaan minimum yang harus
            dipertahankan.
          </p>

          <h6>Rumus ROP:</h6>
          <div className="bg-light p-3 rounded mb-3">
            <code>ROP = Daily Demand × Lead Time</code>
            <br />
            <small>
              Daily Demand = Permintaan harian rata-rata, Lead Time = Waktu
              tunggu pemesanan (hari)
            </small>
          </div>

          <h6>Manfaat ROP:</h6>
          <ul>
            <li>Mencegah terjadinya stockout (kehabisan stok)</li>
            <li>Menentukan waktu yang tepat untuk melakukan pemesanan</li>
            <li>Menjaga kontinuitas operasional bisinis</li>
            <li>Mengoptimalkan pengelolaan persediaan</li>
          </ul>

          <h6>Parameter yang Dibutuhkan:</h6>
          <ul>
            <li>
              <strong>Lead Time:</strong> Waktu yang dibutuhkan dari pemesanan
              hingga barang diterima (dalam hari)
            </li>
            <li>
              <strong>Daily Demand:</strong> Rata-rata jumlah unit yang
              dibutuhkan per hari
            </li>
          </ul>

          <h6>Contoh Penggunaan:</h6>
          <p>
            Jika permintaan harian = 10 unit dan lead time = 5 hari, maka:
            <br />
            ROP = 10 × 5 = 50 unit
            <br />
            <em>Artinya, lakukan pemesanan ketika stok mencapai 50 unit.</em>
          </p>
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

export default CalculatorRop;
