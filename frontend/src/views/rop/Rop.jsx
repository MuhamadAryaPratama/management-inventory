import React, { useState, useEffect } from "react";
import axios from "axios"; // Added missing axios import
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
  cilPencil,
  cilTrash,
  cilPlus,
  cilSearch,
  cilFilter,
  cilReload,
} from "@coreui/icons";

const Rop = () => {
  const [ropData, setRopData] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRop, setEditingRop] = useState(null);
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
      // Fixed: Use consistent token key and API endpoint
      const token = localStorage.getItem("userToken");
      const response = await axios.get("http://localhost:5000/api/rop", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRopData(response.data.data || response.data || []);
    } catch (error) {
      console.error("Error fetching ROP data:", error);
      showAlert("danger", "Gagal memuat data ROP");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      // Fixed: Use consistent token key and API endpoint
      const token = localStorage.getItem("userToken");
      const response = await axios.get("http://localhost:5000/api/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(response.data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      showAlert("danger", "Gagal memuat data produk");
    }
  };

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: "", message: "" }), 5000);
  };

  const handleAddNew = () => {
    setEditingRop(null);
    setSelectedProduct("");
    setLeadTime("");
    setDailyDemand("");
    setShowModal(true);
  };

  const handleEdit = (rop) => {
    setEditingRop(rop);
    setSelectedProduct(rop.product._id);
    setLeadTime(rop.leadTime.toString());
    setDailyDemand(rop.dailyDemand.toString());
    setShowModal(true);
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

      // Fixed: Use axios consistently and proper URL
      const token = localStorage.getItem("userToken");
      let response;

      if (editingRop) {
        // For update - but based on your backend, there's no PUT endpoint
        // So we'll still use POST which will update if ROP exists
        response = await axios.post("http://localhost:5000/api/rop", payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      } else {
        response = await axios.post("http://localhost:5000/api/rop", payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      }

      showAlert(
        "success",
        `Data ROP berhasil ${editingRop ? "diperbarui" : "ditambahkan"}`
      );
      setShowModal(false);
      fetchRopData();
    } catch (error) {
      console.error("Error saving ROP:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Terjadi kesalahan saat menyimpan data";
      showAlert("danger", errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data ROP ini?")) {
      try {
        // Note: Based on your backend routes, there's no DELETE endpoint for ROP
        // You might need to add this endpoint to your backend
        const token = localStorage.getItem("userToken");
        await axios.delete(`http://localhost:5000/api/rop/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        showAlert("success", "Data ROP berhasil dihapus");
        fetchRopData();
      } catch (error) {
        console.error("Error deleting ROP:", error);
        showAlert(
          "danger",
          "Gagal menghapus data ROP. Endpoint mungkin belum tersedia."
        );
      }
    }
  };

  const getProductName = (productId) => {
    const product = products.find((p) => p._id === productId);
    return product ? product.name : "Unknown Product";
  };

  const getRopStatus = (rop, currentStock) => {
    if (!currentStock && currentStock !== 0)
      return { status: "unknown", label: "Unknown", color: "secondary" };

    if (currentStock <= rop.rop) {
      return { status: "critical", label: "Perlu Reorder", color: "danger" };
    } else if (currentStock <= rop.rop * 1.2) {
      return { status: "warning", label: "Hampir ROP", color: "warning" };
    } else {
      return { status: "safe", label: "Aman", color: "success" };
    }
  };

  // Filter and search logic
  const filteredData = ropData.filter((rop) => {
    const matchesSearch =
      rop.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rop.product?.code?.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === "all") return matchesSearch;

    const status = getRopStatus(
      rop,
      rop.product?.currentStock || rop.product?.stock
    );
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
                  <CButton color="primary" onClick={handleAddNew}>
                    <CIcon icon={cilPlus} className="me-2" />
                    Tambah ROP
                  </CButton>
                  <CButton
                    color="secondary"
                    variant="outline"
                    onClick={fetchRopData}
                  >
                    <CIcon icon={cilReload} className="me-2" />
                    Refresh
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
                      placeholder="Cari produk..."
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
                        <CTableHeaderCell>Kode</CTableHeaderCell>
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
                          const currentStock =
                            rop.product?.currentStock ||
                            rop.product?.stock ||
                            0;
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
                                {rop.product?.code || "N/A"}
                              </CTableDataCell>
                              <CTableDataCell>
                                {rop.leadTime} hari
                              </CTableDataCell>
                              <CTableDataCell>
                                {rop.dailyDemand} unit/hari
                              </CTableDataCell>
                              <CTableDataCell>
                                <strong>{Math.ceil(rop.rop)} unit</strong>
                              </CTableDataCell>
                              <CTableDataCell>
                                {currentStock} unit
                              </CTableDataCell>
                              <CTableDataCell>
                                <CBadge color={status.color}>
                                  {status.label}
                                </CBadge>
                              </CTableDataCell>
                              <CTableDataCell>
                                {new Date(
                                  rop.lastCalculated
                                ).toLocaleDateString("id-ID")}
                              </CTableDataCell>
                              <CTableDataCell>
                                <div className="d-flex gap-1">
                                  <CButton
                                    color="warning"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(rop)}
                                  >
                                    <CIcon icon={cilPencil} />
                                  </CButton>
                                  <CButton
                                    color="danger"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(rop._id)}
                                  >
                                    <CIcon icon={cilTrash} />
                                  </CButton>
                                </div>
                              </CTableDataCell>
                            </CTableRow>
                          );
                        })
                      ) : (
                        <CTableRow>
                          <CTableDataCell colSpan="10" className="text-center">
                            Tidak ada data ROP
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

      {/* Add/Edit Modal */}
      <CModal visible={showModal} onClose={() => setShowModal(false)} size="lg">
        <CModalHeader>
          <CModalTitle>
            {editingRop ? "Edit Data ROP" : "Tambah Data ROP"}
          </CModalTitle>
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
                  disabled={editingRop !== null}
                >
                  <option value="">Pilih Produk</option>
                  {products.map((product) => (
                    <option key={product._id} value={product._id}>
                      {product.name} - {product.code}
                    </option>
                  ))}
                </CFormSelect>
                {editingRop && (
                  <small className="text-muted">
                    Produk tidak dapat diubah saat mengedit
                  </small>
                )}
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
              ) : editingRop ? (
                "Update"
              ) : (
                "Simpan"
              )}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>
    </>
  );
};

export default Rop;
