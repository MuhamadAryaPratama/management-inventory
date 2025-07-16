import React, { useState, useEffect, useCallback } from "react";
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
  CAlert,
  CBadge,
  CSpinner,
  CInputGroup,
  CInputGroupText,
  CFormInput,
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
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRopDetail, setSelectedRopDetail] = useState(null);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState("all");

  const showAlert = useCallback((type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: "", message: "" }), 5000);
  }, []);

  const fetchRopData = useCallback(async () => {
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

      const data = response.data?.data || response.data || [];
      setRopData(Array.isArray(data) ? data : []);
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
  }, [showAlert]);

  const fetchProducts = useCallback(async () => {
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
    } catch (error) {
      console.error("Error fetching products:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.statusText ||
        "Gagal memuat data produk";
      showAlert("danger", errorMessage);
      setProducts([]);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchRopData();
    fetchProducts();
  }, [fetchRopData, fetchProducts]);

  const getCurrentStock = useCallback((product) => {
    if (!product) return 0;
    return product.currentStock !== undefined
      ? product.currentStock
      : product.stock || 0;
  }, []);

  const getMergedRopData = useCallback(() => {
    return ropData.map((rop) => {
      const currentProduct = products.find((p) => p._id === rop.product?._id);

      if (currentProduct) {
        return {
          ...rop,
          product: {
            ...rop.product,
            currentStock: getCurrentStock(currentProduct),
            stock: getCurrentStock(currentProduct),
          },
        };
      }

      return {
        ...rop,
        product: {
          ...rop.product,
          currentStock: getCurrentStock(rop.product),
          stock: getCurrentStock(rop.product),
        },
      };
    });
  }, [ropData, products, getCurrentStock]);

  const handleDetail = (rop) => {
    setSelectedRopDetail(rop);
    setShowDetailModal(true);
  };

  const getRopStatus = useCallback((rop, currentStock) => {
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
  }, []);

  const mergedRopData = getMergedRopData();

  const filteredData = mergedRopData.filter((rop) => {
    const matchesSearch = rop.product?.name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());

    if (statusFilter === "all") return matchesSearch;

    const currentStock = getCurrentStock(rop.product);
    const status = getRopStatus(rop, currentStock);
    return matchesSearch && status.status === statusFilter;
  });

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
                    color="primary"
                    variant="outline"
                    size="sm"
                    onClick={() => (window.location.href = "/rop/calculator")}
                  >
                    <CIcon icon={cilCalculator} className="me-2" />
                    Hitung ROP
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
