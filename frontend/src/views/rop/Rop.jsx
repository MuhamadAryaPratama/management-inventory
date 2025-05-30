import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CAlert,
  CBadge,
  CSpinner,
  CInputGroup,
  CInputGroupText,
  CPagination,
  CPaginationItem,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import {
  cilStorage,
  cilPlus,
  cilSearch,
  cilFilter,
  cilReload,
  cilInfo,
  cilCalculator,
} from "@coreui/icons";

const Rop = () => {
  const [ropData, setRopData] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRopDetail, setSelectedRopDetail] = useState(null);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });

  // Form states
  const [selectedProduct, setSelectedProduct] = useState("");
  const [leadTime, setLeadTime] = useState("");
  const [dailyDemand, setDailyDemand] = useState("");

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchRopData();
    fetchProducts();
  }, []);

  const fetchRopData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("userToken");

      if (!token) {
        showAlert("danger", "Token tidak ditemukan. Silakan login kembali.");
        return;
      }

      const response = await axios.get("http://localhost:5000/api/rop", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Handle different response structures
      const data = response.data?.data || response.data || [];
      setRopData(Array.isArray(data) ? data : []);

      console.log("ROP Data fetched:", data); // Debug log
    } catch (error) {
      console.error("Error fetching ROP data:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.statusText ||
        "Gagal memuat data ROP";
      showAlert("danger", errorMessage);
      setRopData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("userToken");

      if (!token) {
        showAlert("danger", "Token tidak ditemukan. Silakan login kembali.");
        return;
      }

      const response = await axios.get("http://localhost:5000/api/products", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = response.data?.data || response.data || [];
      setProducts(Array.isArray(data) ? data : []);

      console.log("Products fetched:", data); // Debug log
    } catch (error) {
      console.error("Error fetching products:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.statusText ||
        "Gagal memuat data produk";
      showAlert("danger", errorMessage);
      setProducts([]);
    }
  };

  // Function to calculate/recalculate ROP
  const calculateRop = async () => {
    try {
      setCalculating(true);
      const token = localStorage.getItem("userToken");

      if (!token) {
        showAlert("danger", "Token tidak ditemukan. Silakan login kembali.");
        return;
      }

      // If there's a separate calculate endpoint
      const response = await axios.post(
        "http://localhost:5000/api/rop/calculate",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      showAlert("success", "ROP berhasil dihitung ulang");
      fetchRopData(); // Refresh data after calculation
    } catch (error) {
      console.error("Error calculating ROP:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.statusText ||
        "Gagal menghitung ROP";
      showAlert("danger", errorMessage);
    } finally {
      setCalculating(false);
    }
  };

  // Helper function to get current stock consistently
  const getCurrentStock = (product) => {
    if (!product) return 0;
    // Priority: currentStock > stock > 0
    return product.currentStock !== undefined
      ? product.currentStock
      : product.stock || 0;
  };

  // Enhanced function to merge ROP data with latest product stock
  const getMergedRopData = () => {
    return ropData.map((rop) => {
      // Find the corresponding product from products array to get latest stock
      const currentProduct = products.find((p) => p._id === rop.product?._id);

      if (currentProduct) {
        return {
          ...rop,
          product: {
            ...rop.product,
            currentStock: getCurrentStock(currentProduct),
            stock: getCurrentStock(currentProduct), // Keep both for compatibility
          },
        };
      }

      // If no matching product found, use existing data
      return {
        ...rop,
        product: {
          ...rop.product,
          currentStock: getCurrentStock(rop.product),
          stock: getCurrentStock(rop.product),
        },
      };
    });
  };

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: "", message: "" }), 5000);
  };

  const handleAddNew = () => {
    setSelectedProduct("");
    setLeadTime("");
    setDailyDemand("");
    setShowModal(true);
  };

  const handleDetail = (rop) => {
    setSelectedRopDetail(rop);
    setShowDetailModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedProduct || !leadTime || !dailyDemand) {
      showAlert("warning", "Semua field harus diisi");
      return;
    }

    const leadTimeNum = parseFloat(leadTime);
    const dailyDemandNum = parseFloat(dailyDemand);

    if (leadTimeNum <= 0 || dailyDemandNum <= 0) {
      showAlert("warning", "Lead time dan daily demand harus lebih dari 0");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        product: selectedProduct,
        leadTime: leadTimeNum,
        dailyDemand: dailyDemandNum,
      };

      const token = localStorage.getItem("userToken");

      if (!token) {
        showAlert("danger", "Token tidak ditemukan. Silakan login kembali.");
        return;
      }

      // Create new ROP
      await axios.post("http://localhost:5000/api/rop", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      showAlert("success", "Data ROP berhasil ditambahkan");
      setShowModal(false);
      fetchRopData();
    } catch (error) {
      console.error("Error saving ROP:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.statusText ||
        "Terjadi kesalahan saat menyimpan data";
      showAlert("danger", errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const getRopStatus = (rop, currentStock) => {
    if (currentStock === undefined || currentStock === null || !rop.rop) {
      return { status: "unknown", label: "Unknown", color: "secondary" };
    }

    const ropValue = parseFloat(rop.rop) || 0;

    if (currentStock <= ropValue) {
      return { status: "critical", label: "Perlu Reorder", color: "danger" };
    } else if (currentStock <= ropValue * 1.2) {
      return { status: "warning", label: "Hampir ROP", color: "warning" };
    } else {
      return { status: "safe", label: "Aman", color: "success" };
    }
  };

  // Get merged data for display
  const mergedRopData = getMergedRopData();

  // Filter and search logic
  const filteredData = mergedRopData.filter((rop) => {
    const matchesSearch = rop.product?.name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());

    if (statusFilter === "all") return matchesSearch;

    const currentStock = getCurrentStock(rop.product);
    const status = getRopStatus(rop, currentStock);
    return matchesSearch && status.status === statusFilter;
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <div className="d-flex justify-content-between align-items-center">
                <strong>
                  <CIcon icon={cilStorage} className="me-2" />
                  Data ROP Barang
                </strong>
                <div className="d-flex gap-2">
                  <CButton
                    color="success"
                    onClick={calculateRop}
                    disabled={calculating}
                  >
                    {calculating ? (
                      <>
                        <CSpinner size="sm" className="me-2" />
                        Menghitung...
                      </>
                    ) : (
                      <>
                        <CIcon icon={cilCalculator} className="me-2" />
                        Hitung ROP
                      </>
                    )}
                  </CButton>
                  <CButton color="primary" onClick={handleAddNew}>
                    <CIcon icon={cilPlus} className="me-2" />
                    Tambah ROP
                  </CButton>
                  <CButton
                    color="secondary"
                    variant="outline"
                    onClick={() => {
                      fetchRopData();
                      fetchProducts();
                    }}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <CSpinner size="sm" className="me-2" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <CIcon icon={cilReload} className="me-2" />
                        Refresh
                      </>
                    )}
                  </CButton>
                </div>
              </div>
            </CCardHeader>
            <CCardBody>
              {alert.show && (
                <CAlert color={alert.type} className="mb-3">
                  {alert.message}
                </CAlert>
              )}

              {/* Search and Filter */}
              <CRow className="mb-3">
                <CCol md={6}>
                  <CInputGroup>
                    <CInputGroupText>
                      <CIcon icon={cilSearch} />
                    </CInputGroupText>
                    <CFormInput
                      placeholder="Cari nama produk..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </CInputGroup>
                </CCol>
                <CCol md={3}>
                  <CDropdown>
                    <CDropdownToggle color="outline-secondary">
                      <CIcon icon={cilFilter} className="me-2" />
                      Filter Status
                    </CDropdownToggle>
                    <CDropdownMenu>
                      <CDropdownItem onClick={() => setStatusFilter("all")}>
                        Semua Status
                      </CDropdownItem>
                      <CDropdownItem
                        onClick={() => setStatusFilter("critical")}
                      >
                        Perlu Reorder
                      </CDropdownItem>
                      <CDropdownItem onClick={() => setStatusFilter("warning")}>
                        Hampir ROP
                      </CDropdownItem>
                      <CDropdownItem onClick={() => setStatusFilter("safe")}>
                        Aman
                      </CDropdownItem>
                    </CDropdownMenu>
                  </CDropdown>
                </CCol>
                <CCol md={3}>
                  <div className="text-end">
                    <small className="text-muted">
                      Total: {filteredData.length} data
                    </small>
                  </div>
                </CCol>
              </CRow>

              {loading ? (
                <div className="text-center py-4">
                  <CSpinner color="primary" />
                  <p className="mt-2">Memuat data ROP...</p>
                </div>
              ) : (
                <>
                  <CTable hover responsive>
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>No</CTableHeaderCell>
                        <CTableHeaderCell>Produk</CTableHeaderCell>
                        <CTableHeaderCell>Lead Time (Hari)</CTableHeaderCell>
                        <CTableHeaderCell>Daily Demand</CTableHeaderCell>
                        <CTableHeaderCell>ROP</CTableHeaderCell>
                        <CTableHeaderCell>Stock Saat Ini</CTableHeaderCell>
                        <CTableHeaderCell>Status</CTableHeaderCell>
                        <CTableHeaderCell>Terakhir Dihitung</CTableHeaderCell>
                        <CTableHeaderCell>Aksi</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {currentItems.length > 0 ? (
                        currentItems.map((rop, index) => {
                          const currentStock = getCurrentStock(rop.product);
                          const status = getRopStatus(rop, currentStock);
                          return (
                            <CTableRow key={rop._id}>
                              <CTableDataCell>
                                {indexOfFirstItem + index + 1}
                              </CTableDataCell>
                              <CTableDataCell>
                                {rop.product?.name || "N/A"}
                              </CTableDataCell>
                              <CTableDataCell>
                                {rop.leadTime || 0} hari
                              </CTableDataCell>
                              <CTableDataCell>
                                {rop.dailyDemand || 0} unit/hari
                              </CTableDataCell>
                              <CTableDataCell>
                                <strong>{Math.ceil(rop.rop || 0)} unit</strong>
                              </CTableDataCell>
                              <CTableDataCell>
                                <strong>{currentStock} unit</strong>
                              </CTableDataCell>
                              <CTableDataCell>
                                <CBadge color={status.color}>
                                  {status.label}
                                </CBadge>
                              </CTableDataCell>
                              <CTableDataCell>
                                {rop.lastCalculated
                                  ? new Date(
                                      rop.lastCalculated
                                    ).toLocaleDateString("id-ID")
                                  : "Belum dihitung"}
                              </CTableDataCell>
                              <CTableDataCell>
                                <CButton
                                  color="info"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDetail(rop)}
                                  title="Lihat Detail"
                                >
                                  <CIcon icon={cilInfo} />
                                </CButton>
                              </CTableDataCell>
                            </CTableRow>
                          );
                        })
                      ) : (
                        <CTableRow>
                          <CTableDataCell colSpan="9" className="text-center">
                            {searchTerm || statusFilter !== "all"
                              ? "Tidak ada data yang sesuai dengan filter"
                              : "Tidak ada data ROP. Silakan tambah data ROP terlebih dahulu."}
                          </CTableDataCell>
                        </CTableRow>
                      )}
                    </CTableBody>
                  </CTable>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <CPagination className="justify-content-center mt-3">
                      <CPaginationItem
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                      >
                        Previous
                      </CPaginationItem>
                      {[...Array(totalPages)].map((_, index) => (
                        <CPaginationItem
                          key={index}
                          active={currentPage === index + 1}
                          onClick={() => setCurrentPage(index + 1)}
                        >
                          {index + 1}
                        </CPaginationItem>
                      ))}
                      <CPaginationItem
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                      >
                        Next
                      </CPaginationItem>
                    </CPagination>
                  )}
                </>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Add Modal */}
      <CModal visible={showModal} onClose={() => setShowModal(false)} size="lg">
        <CModalHeader>
          <CModalTitle>Tambah Data ROP</CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleSubmit}>
          <CModalBody>
            <CRow className="mb-3">
              <CCol>
                <CFormLabel htmlFor="product">Produk</CFormLabel>
                <CFormSelect
                  id="product"
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  required
                >
                  <option value="">Pilih Produk</option>
                  {products.map((product) => (
                    <option key={product._id} value={product._id}>
                      {product.name} (Stock: {getCurrentStock(product)})
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
            </CRow>

            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel htmlFor="leadTime">Lead Time (Hari)</CFormLabel>
                <CFormInput
                  type="number"
                  id="leadTime"
                  placeholder="Masukkan lead time"
                  value={leadTime}
                  onChange={(e) => setLeadTime(e.target.value)}
                  min="0"
                  step="0.1"
                  required
                />
                <small className="text-muted">
                  Waktu tunggu dari pemesanan hingga barang diterima
                </small>
              </CCol>

              <CCol md={6}>
                <CFormLabel htmlFor="dailyDemand">
                  Permintaan Harian (Unit/Hari)
                </CFormLabel>
                <CFormInput
                  type="number"
                  id="dailyDemand"
                  placeholder="Masukkan permintaan harian"
                  value={dailyDemand}
                  onChange={(e) => setDailyDemand(e.target.value)}
                  min="0"
                  step="0.1"
                  required
                />
                <small className="text-muted">
                  Rata-rata penggunaan barang per hari
                </small>
              </CCol>
            </CRow>

            {leadTime && dailyDemand && (
              <CRow className="mb-3">
                <CCol>
                  <CAlert color="info">
                    <strong>Perhitungan ROP:</strong>
                    <br />
                    ROP = {dailyDemand} × {leadTime} ={" "}
                    <strong>
                      {Math.ceil(
                        parseFloat(dailyDemand) * parseFloat(leadTime)
                      )}{" "}
                      unit
                    </strong>
                  </CAlert>
                </CCol>
              </CRow>
            )}
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={() => setShowModal(false)}>
              Batal
            </CButton>
            <CButton color="primary" type="submit" disabled={saving}>
              {saving ? (
                <>
                  <CSpinner size="sm" className="me-2" />
                  Menyimpan...
                </>
              ) : (
                "Simpan"
              )}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>

      {/* Detail Modal */}
      <CModal
        visible={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        size="lg"
      >
        <CModalHeader>
          <CModalTitle>Detail Data ROP</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {selectedRopDetail && (
            <div>
              <CCard className="mb-3">
                <CCardHeader>
                  <strong>Informasi Produk</strong>
                </CCardHeader>
                <CCardBody>
                  <CRow>
                    <CCol md={6}>
                      <p>
                        <strong>Nama Produk:</strong>
                      </p>
                      <p className="text-muted">
                        {selectedRopDetail.product?.name || "N/A"}
                      </p>
                    </CCol>
                    <CCol md={6}>
                      <p>
                        <strong>Stock Saat Ini:</strong>
                      </p>
                      <p className="text-muted">
                        {getCurrentStock(selectedRopDetail.product)} unit
                      </p>
                    </CCol>
                  </CRow>
                </CCardBody>
              </CCard>

              <CCard className="mb-3">
                <CCardHeader>
                  <strong>Parameter ROP</strong>
                </CCardHeader>
                <CCardBody>
                  <CRow>
                    <CCol md={4}>
                      <p>
                        <strong>Lead Time:</strong>
                      </p>
                      <p className="text-muted">
                        {selectedRopDetail.leadTime || 0} hari
                      </p>
                    </CCol>
                    <CCol md={4}>
                      <p>
                        <strong>Daily Demand:</strong>
                      </p>
                      <p className="text-muted">
                        {selectedRopDetail.dailyDemand || 0} unit/hari
                      </p>
                    </CCol>
                    <CCol md={4}>
                      <p>
                        <strong>ROP:</strong>
                      </p>
                      <p className="text-muted">
                        {Math.ceil(selectedRopDetail.rop || 0)} unit
                      </p>
                    </CCol>
                  </CRow>
                </CCardBody>
              </CCard>

              <CCard className="mb-3">
                <CCardHeader>
                  <strong>Status & Analisis</strong>
                </CCardHeader>
                <CCardBody>
                  <CRow>
                    <CCol md={6}>
                      <p>
                        <strong>Status Saat Ini:</strong>
                      </p>
                      <CBadge
                        color={
                          getRopStatus(
                            selectedRopDetail,
                            getCurrentStock(selectedRopDetail.product)
                          ).color
                        }
                        className="mb-2"
                      >
                        {
                          getRopStatus(
                            selectedRopDetail,
                            getCurrentStock(selectedRopDetail.product)
                          ).label
                        }
                      </CBadge>
                    </CCol>
                    <CCol md={6}>
                      <p>
                        <strong>Terakhir Dihitung:</strong>
                      </p>
                      <p className="text-muted">
                        {selectedRopDetail.lastCalculated
                          ? new Date(
                              selectedRopDetail.lastCalculated
                            ).toLocaleDateString("id-ID", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Belum dihitung"}
                      </p>
                    </CCol>
                  </CRow>
                </CCardBody>
              </CCard>

              <CCard>
                <CCardHeader>
                  <strong>Perhitungan ROP</strong>
                </CCardHeader>
                <CCardBody>
                  <CAlert color="info">
                    <strong>Formula:</strong> ROP = Daily Demand × Lead Time
                    <br />
                    <strong>Perhitungan:</strong>{" "}
                    {selectedRopDetail.dailyDemand || 0} ×{" "}
                    {selectedRopDetail.leadTime || 0} ={" "}
                    {Math.ceil(selectedRopDetail.rop || 0)} unit
                    <br />
                    <br />
                    <strong>Interpretasi:</strong>
                    <br />
                    Ketika stock mencapai{" "}
                    {Math.ceil(selectedRopDetail.rop || 0)} unit atau kurang,
                    maka perlu dilakukan pemesanan ulang untuk menghindari
                    kehabisan stock selama lead time.
                  </CAlert>

                  {getCurrentStock(selectedRopDetail.product) <=
                    (selectedRopDetail.rop || 0) &&
                    selectedRopDetail.rop > 0 && (
                      <CAlert color="warning">
                        <strong>Perhatian!</strong> Stock saat ini (
                        {getCurrentStock(selectedRopDetail.product)} unit) sudah
                        mencapai atau di bawah ROP. Disarankan untuk segera
                        melakukan pemesanan ulang.
                      </CAlert>
                    )}
                </CCardBody>
              </CCard>
            </div>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowDetailModal(false)}>
            Tutup
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default Rop;
