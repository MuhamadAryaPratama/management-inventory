import React, { useState, useEffect } from "react";
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CButton,
  CAlert,
  CSpinner,
  CFormInput,
  CInputGroup,
  CBadge,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CForm,
  CFormLabel,
  CFormSelect,
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
  cilReload,
  cilPencil,
  cilTrash,
  cilInfo,
  cilCalculator,
  cilOptions,
} from "@coreui/icons";
import axios from "axios";

const Eoq = () => {
  const [eoqData, setEoqData] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEoq, setSelectedEoq] = useState(null);

  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    orderingCost: "",
    holdingCost: "",
    annualDemand: "",
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchEoqData();
    fetchProducts();
  }, []);

  useEffect(() => {
    filterAndSortData();
  }, [eoqData, searchTerm, sortConfig]);

  const fetchEoqData = async () => {
    try {
      setLoading(true);
      // Fixed: Use consistent token key and API endpoint
      const token = localStorage.getItem("userToken");
      const response = await axios.get("http://localhost:5000/api/eoq", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEoqData(response.data.data || response.data || []);
    } catch (error) {
      console.error("Error fetching EOQ data:", error);
      setError("Gagal memuat data EOQ");
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
      setError("Gagal memuat data produk");
    }
  };

  const filterAndSortData = () => {
    let filtered = eoqData.filter((item) => {
      const productName = item.product?.name?.toLowerCase() || "";
      const productSku = item.product?.sku?.toLowerCase() || "";
      const search = searchTerm.toLowerCase();

      return productName.includes(search) || productSku.includes(search);
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === "product") {
          aValue = a.product?.name || "";
          bValue = b.product?.name || "";
        }

        if (typeof aValue === "string") {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredData(filtered);
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleEdit = (eoq) => {
    setSelectedEoq(eoq);
    setEditFormData({
      orderingCost: eoq.orderingCost.toString(),
      holdingCost: eoq.holdingCost.toString(),
      annualDemand: eoq.annualDemand.toString(),
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      setUpdating(true);
      // Fixed: Use consistent token key and API endpoint
      const token = localStorage.getItem("userToken");

      await axios.put(
        `http://localhost:5000/api/eoq/${selectedEoq._id}`,
        {
          orderingCost: parseFloat(editFormData.orderingCost),
          holdingCost: parseFloat(editFormData.holdingCost),
          annualDemand: parseFloat(editFormData.annualDemand),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess("Data EOQ berhasil diperbarui");
      setShowEditModal(false);
      fetchEoqData();
    } catch (error) {
      console.error("Error updating EOQ:", error);
      setError(error.response?.data?.message || "Gagal memperbarui data EOQ");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      // Fixed: Use consistent token key and API endpoint
      const token = localStorage.getItem("userToken");
      await axios.delete(`http://localhost:5000/api/eoq/${selectedEoq._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess("Data EOQ berhasil dihapus");
      setShowDeleteModal(false);
      setSelectedEoq(null);
      fetchEoqData();
    } catch (error) {
      console.error("Error deleting EOQ:", error);
      setError(error.response?.data?.message || "Gagal menghapus data EOQ");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(number);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEoqStatus = (eoq, orderFrequency) => {
    if (orderFrequency > 12) {
      return { color: "warning", text: "Sering Order" };
    } else if (orderFrequency < 2) {
      return { color: "info", text: "Jarang Order" };
    } else {
      return { color: "success", text: "Optimal" };
    }
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <div>
                <CIcon icon={cilStorage} className="me-2" />
                <strong>Data EOQ Barang</strong>
              </div>
              <div className="d-flex gap-2">
                <CButton
                  color="primary"
                  variant="outline"
                  size="sm"
                  onClick={() => (window.location.href = "/eoq/calculator")}
                >
                  <CIcon icon={cilCalculator} className="me-1" />
                  Hitung EOQ Baru
                </CButton>
                <CButton
                  color="secondary"
                  variant="outline"
                  size="sm"
                  onClick={fetchEoqData}
                  disabled={loading}
                >
                  <CIcon icon={cilReload} className="me-1" />
                  Refresh
                </CButton>
              </div>
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

              {/* Search Bar */}
              <CRow className="mb-3">
                <CCol md={6}>
                  <CInputGroup>
                    <CFormInput
                      placeholder="Cari berdasarkan nama produk atau SKU..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <CButton color="primary" variant="outline">
                      <CIcon icon={cilSearch} />
                    </CButton>
                  </CInputGroup>
                </CCol>
                <CCol md={6} className="text-end">
                  <small className="text-muted">
                    Menampilkan {currentItems.length} dari {filteredData.length}{" "}
                    data
                  </small>
                </CCol>
              </CRow>

              {loading ? (
                <div className="text-center p-4">
                  <CSpinner color="primary" />
                  <p className="mt-2">Memuat data...</p>
                </div>
              ) : (
                <>
                  <CTable responsive striped hover>
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell
                          style={{ cursor: "pointer" }}
                          onClick={() => handleSort("product")}
                        >
                          Produk{" "}
                          {sortConfig.key === "product" &&
                            (sortConfig.direction === "asc" ? "↑" : "↓")}
                        </CTableHeaderCell>
                        <CTableHeaderCell
                          style={{ cursor: "pointer" }}
                          onClick={() => handleSort("eoq")}
                        >
                          EOQ (Unit){" "}
                          {sortConfig.key === "eoq" &&
                            (sortConfig.direction === "asc" ? "↑" : "↓")}
                        </CTableHeaderCell>
                        <CTableHeaderCell
                          style={{ cursor: "pointer" }}
                          onClick={() => handleSort("orderFrequency")}
                        >
                          Frekuensi Order{" "}
                          {sortConfig.key === "orderFrequency" &&
                            (sortConfig.direction === "asc" ? "↑" : "↓")}
                        </CTableHeaderCell>
                        <CTableHeaderCell
                          style={{ cursor: "pointer" }}
                          onClick={() => handleSort("totalCost")}
                        >
                          Total Biaya{" "}
                          {sortConfig.key === "totalCost" &&
                            (sortConfig.direction === "asc" ? "↑" : "↓")}
                        </CTableHeaderCell>
                        <CTableHeaderCell>Status</CTableHeaderCell>
                        <CTableHeaderCell
                          style={{ cursor: "pointer" }}
                          onClick={() => handleSort("lastCalculated")}
                        >
                          Terakhir Dihitung{" "}
                          {sortConfig.key === "lastCalculated" &&
                            (sortConfig.direction === "asc" ? "↑" : "↓")}
                        </CTableHeaderCell>
                        <CTableHeaderCell width="120">Aksi</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {currentItems.length > 0 ? (
                        currentItems.map((eoq) => {
                          const status = getEoqStatus(
                            eoq.eoq,
                            eoq.orderFrequency
                          );
                          return (
                            <CTableRow key={eoq._id}>
                              <CTableDataCell>
                                <div>
                                  <strong>{eoq.product?.name || "N/A"}</strong>
                                  <br />
                                  <small className="text-muted">
                                    SKU: {eoq.product?.sku || "N/A"}
                                  </small>
                                </div>
                              </CTableDataCell>
                              <CTableDataCell>
                                <strong className="text-primary">
                                  {formatNumber(eoq.eoq)} unit
                                </strong>
                              </CTableDataCell>
                              <CTableDataCell>
                                {formatNumber(eoq.orderFrequency)} kali/tahun
                                <br />
                                <small className="text-muted">
                                  ~{formatNumber(365 / eoq.orderFrequency)} hari
                                  sekali
                                </small>
                              </CTableDataCell>
                              <CTableDataCell>
                                <strong className="text-success">
                                  {formatCurrency(eoq.totalCost)}
                                </strong>
                              </CTableDataCell>
                              <CTableDataCell>
                                <CBadge color={status.color}>
                                  {status.text}
                                </CBadge>
                              </CTableDataCell>
                              <CTableDataCell>
                                <small>{formatDate(eoq.lastCalculated)}</small>
                              </CTableDataCell>
                              <CTableDataCell>
                                <CDropdown>
                                  <CDropdownToggle
                                    color="light"
                                    size="sm"
                                    caret={false}
                                  >
                                    <CIcon icon={cilOptions} />
                                  </CDropdownToggle>
                                  <CDropdownMenu>
                                    <CDropdownItem
                                      onClick={() => {
                                        setSelectedEoq(eoq);
                                        setShowDetailModal(true);
                                      }}
                                    >
                                      <CIcon icon={cilInfo} className="me-2" />
                                      Detail
                                    </CDropdownItem>
                                    <CDropdownItem
                                      onClick={() => handleEdit(eoq)}
                                    >
                                      <CIcon
                                        icon={cilPencil}
                                        className="me-2"
                                      />
                                      Edit
                                    </CDropdownItem>
                                    <CDropdownItem
                                      className="text-danger"
                                      onClick={() => {
                                        setSelectedEoq(eoq);
                                        setShowDeleteModal(true);
                                      }}
                                    >
                                      <CIcon icon={cilTrash} className="me-2" />
                                      Hapus
                                    </CDropdownItem>
                                  </CDropdownMenu>
                                </CDropdown>
                              </CTableDataCell>
                            </CTableRow>
                          );
                        })
                      ) : (
                        <CTableRow>
                          <CTableDataCell
                            colSpan="7"
                            className="text-center py-4"
                          >
                            <div className="text-muted">
                              <CIcon
                                icon={cilStorage}
                                size="3xl"
                                className="mb-3"
                              />
                              <p>Belum ada data EOQ</p>
                              <CButton
                                color="primary"
                                variant="outline"
                                onClick={() =>
                                  (window.location.href = "/eoq/calculator")
                                }
                              >
                                <CIcon icon={cilCalculator} className="me-1" />
                                Hitung EOQ Pertama
                              </CButton>
                            </div>
                          </CTableDataCell>
                        </CTableRow>
                      )}
                    </CTableBody>
                  </CTable>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <CRow className="mt-3">
                      <CCol className="d-flex justify-content-center">
                        <CPagination>
                          <CPaginationItem
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(currentPage - 1)}
                          >
                            Previous
                          </CPaginationItem>

                          {[...Array(totalPages)].map((_, index) => (
                            <CPaginationItem
                              key={index + 1}
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
                      </CCol>
                    </CRow>
                  )}
                </>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Detail Modal */}
      <CModal
        visible={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        size="lg"
      >
        <CModalHeader>
          <CModalTitle>Detail EOQ - {selectedEoq?.product?.name}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {selectedEoq && (
            <CRow>
              <CCol md={6}>
                <h6>Informasi Produk</h6>
                <CTable responsive bordered>
                  <CTableBody>
                    <CTableRow>
                      <CTableDataCell>
                        <strong>Nama Produk</strong>
                      </CTableDataCell>
                      <CTableDataCell>
                        {selectedEoq.product?.name}
                      </CTableDataCell>
                    </CTableRow>
                    <CTableRow>
                      <CTableDataCell>
                        <strong>SKU</strong>
                      </CTableDataCell>
                      <CTableDataCell>
                        {selectedEoq.product?.sku}
                      </CTableDataCell>
                    </CTableRow>
                    <CTableRow>
                      <CTableDataCell>
                        <strong>Kategori</strong>
                      </CTableDataCell>
                      <CTableDataCell>
                        {selectedEoq.product?.category?.name || "N/A"}
                      </CTableDataCell>
                    </CTableRow>
                  </CTableBody>
                </CTable>

                <h6 className="mt-4">Parameter Input</h6>
                <CTable responsive bordered>
                  <CTableBody>
                    <CTableRow>
                      <CTableDataCell>
                        <strong>Biaya Pemesanan</strong>
                      </CTableDataCell>
                      <CTableDataCell>
                        {formatCurrency(selectedEoq.orderingCost)}
                      </CTableDataCell>
                    </CTableRow>
                    <CTableRow>
                      <CTableDataCell>
                        <strong>Biaya Penyimpanan</strong>
                      </CTableDataCell>
                      <CTableDataCell>
                        {formatCurrency(selectedEoq.holdingCost)}
                      </CTableDataCell>
                    </CTableRow>
                    <CTableRow>
                      <CTableDataCell>
                        <strong>Permintaan Tahunan</strong>
                      </CTableDataCell>
                      <CTableDataCell>
                        {formatNumber(selectedEoq.annualDemand)} unit
                      </CTableDataCell>
                    </CTableRow>
                  </CTableBody>
                </CTable>
              </CCol>

              <CCol md={6}>
                <h6>Hasil Perhitungan</h6>
                <CTable responsive bordered>
                  <CTableBody>
                    <CTableRow>
                      <CTableDataCell>
                        <strong>EOQ (Unit Optimal)</strong>
                      </CTableDataCell>
                      <CTableDataCell className="text-primary fw-bold">
                        {formatNumber(selectedEoq.eoq)} unit
                      </CTableDataCell>
                    </CTableRow>
                    <CTableRow>
                      <CTableDataCell>
                        <strong>Frekuensi Pemesanan</strong>
                      </CTableDataCell>
                      <CTableDataCell>
                        {formatNumber(selectedEoq.orderFrequency)} kali/tahun
                      </CTableDataCell>
                    </CTableRow>
                    <CTableRow>
                      <CTableDataCell>
                        <strong>Total Biaya Optimal</strong>
                      </CTableDataCell>
                      <CTableDataCell className="text-success fw-bold">
                        {formatCurrency(selectedEoq.totalCost)}
                      </CTableDataCell>
                    </CTableRow>
                    <CTableRow>
                      <CTableDataCell>
                        <strong>Periode Antar Pesanan</strong>
                      </CTableDataCell>
                      <CTableDataCell>
                        {formatNumber(365 / selectedEoq.orderFrequency)} hari
                      </CTableDataCell>
                    </CTableRow>
                    <CTableRow>
                      <CTableDataCell>
                        <strong>Terakhir Dihitung</strong>
                      </CTableDataCell>
                      <CTableDataCell>
                        {formatDate(selectedEoq.lastCalculated)}
                      </CTableDataCell>
                    </CTableRow>
                  </CTableBody>
                </CTable>

                <CAlert color="info" className="mt-3">
                  <strong>Rekomendasi:</strong>
                  <ul className="mb-0 mt-2">
                    <li>
                      Pesan{" "}
                      <strong>{formatNumber(selectedEoq.eoq)} unit</strong>{" "}
                      setiap kali order
                    </li>
                    <li>
                      Lakukan pemesanan setiap{" "}
                      <strong>
                        {formatNumber(365 / selectedEoq.orderFrequency)} hari
                      </strong>
                    </li>
                    <li>
                      Total biaya optimal:{" "}
                      <strong>{formatCurrency(selectedEoq.totalCost)}</strong>
                    </li>
                  </ul>
                </CAlert>
              </CCol>
            </CRow>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowDetailModal(false)}>
            Tutup
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Edit Modal */}
      <CModal visible={showEditModal} onClose={() => setShowEditModal(false)}>
        <CModalHeader>
          <CModalTitle>Edit EOQ - {selectedEoq?.product?.name}</CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleUpdate}>
          <CModalBody>
            <CRow className="mb-3">
              <CCol>
                <CFormLabel htmlFor="editOrderingCost">
                  Biaya Pemesanan per Order (Rp) *
                </CFormLabel>
                <CFormInput
                  type="number"
                  id="editOrderingCost"
                  value={editFormData.orderingCost}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      orderingCost: e.target.value,
                    }))
                  }
                  min="0"
                  step="0.01"
                  required
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol>
                <CFormLabel htmlFor="editHoldingCost">
                  Biaya Penyimpanan per Unit per Tahun (Rp) *
                </CFormLabel>
                <CFormInput
                  type="number"
                  id="editHoldingCost"
                  value={editFormData.holdingCost}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      holdingCost: e.target.value,
                    }))
                  }
                  min="0"
                  step="0.01"
                  required
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol>
                <CFormLabel htmlFor="editAnnualDemand">
                  Permintaan Tahunan (Unit) *
                </CFormLabel>
                <CFormInput
                  type="number"
                  id="editAnnualDemand"
                  value={editFormData.annualDemand}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      annualDemand: e.target.value,
                    }))
                  }
                  min="0"
                  step="1"
                  required
                />
              </CCol>
            </CRow>
            <CAlert color="info">
              <small>
                <strong>Catatan:</strong> Setelah mengubah parameter, EOQ akan
                dihitung ulang secara otomatis.
              </small>
            </CAlert>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={() => setShowEditModal(false)}>
              Batal
            </CButton>
            <CButton type="submit" color="primary" disabled={updating}>
              {updating ? (
                <>
                  <CSpinner size="sm" className="me-1" />
                  Memperbarui...
                </>
              ) : (
                <>
                  <CIcon icon={cilCalculator} className="me-1" />
                  Perbarui & Hitung Ulang
                </>
              )}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>

      {/* Delete Confirmation Modal */}
      <CModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      >
        <CModalHeader>
          <CModalTitle>Konfirmasi Hapus</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>
            Apakah Anda yakin ingin menghapus data EOQ untuk produk{" "}
            <strong>{selectedEoq?.product?.name}</strong>?
          </p>
          <CAlert color="warning">
            <strong>Peringatan:</strong> Tindakan ini tidak dapat dibatalkan.
          </CAlert>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowDeleteModal(false)}>
            Batal
          </CButton>
          <CButton color="danger" onClick={handleDelete}>
            <CIcon icon={cilTrash} className="me-1" />
            Hapus
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default Eoq;
