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
  CPagination,
  CPaginationItem,
  CBreadcrumb,
  CBreadcrumbItem,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import {
  cilStorage,
  cilSearch,
  cilReload,
  cilInfo,
  cilCalculator,
  cilTrash,
} from "@coreui/icons";
import axios from "axios";

const Eoq = () => {
  const [eoqData, setEoqData] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEoq, setSelectedEoq] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Hitung indeks pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    filterAndSortData();
  }, [eoqData, searchTerm, sortConfig]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchEoqData(), fetchProducts(), fetchCategories()]);
      setError("");
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const fetchEoqData = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const response = await axios.get("http://localhost:5000/api/eoq", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Membulatkan semua nilai EOQ ke integer
      const roundedData = (response.data.data || response.data || []).map(
        (item) => ({
          ...item,
          eoq: Math.round(item.eoq),
          orderFrequency: Math.round(item.orderFrequency),
          totalCost: Math.round(item.totalCost),
        })
      );

      setEoqData(roundedData);
    } catch (error) {
      console.error("Error fetching EOQ data:", error);
      throw new Error("Gagal memuat data EOQ");
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const response = await axios.get("http://localhost:5000/api/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(response.data.data || response.data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      throw new Error("Gagal memuat data produk");
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const response = await axios.get("http://localhost:5000/api/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(response.data.data || response.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw new Error("Gagal memuat data kategori");
    }
  };

  const deleteEoq = async (id) => {
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem("userToken");
      await axios.delete(`http://localhost:5000/api/eoq/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess("Data EOQ berhasil dihapus");
      fetchAllData();
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Error deleting EOQ:", error);
      setError("Gagal menghapus data EOQ");
    } finally {
      setDeleteLoading(false);
    }
  };

  const productExists = (productId) => {
    return products.some((p) => p._id === productId || p.id === productId);
  };

  const getProductWithCategory = (productId) => {
    const product = products.find(
      (p) => p._id === productId || p.id === productId
    );

    if (!product) return null;

    let categoryData = null;
    if (product.category) {
      if (typeof product.category === "object") {
        categoryData = product.category;
      } else {
        categoryData = categories.find(
          (c) => c._id === product.category || c.id === product.category
        );
      }
    }

    return {
      ...product,
      category: categoryData || null,
    };
  };

  const getCategoryName = (productId) => {
    const productWithCategory = getProductWithCategory(productId);
    if (!productWithCategory || !productWithCategory.category) {
      return "Tidak ada kategori";
    }
    const category = productWithCategory.category;
    return typeof category === "object" ? category.name : category;
  };

  const getProductName = (productId) => {
    const product = products.find(
      (p) => p._id === productId || p.id === productId
    );
    return product?.name || "[Produk Dihapus]";
  };

  const filterAndSortData = () => {
    let filtered = eoqData.filter((item) => {
      const productId =
        item.productId ||
        item.product_id ||
        item.product?.id ||
        item.product?._id;
      return productExists(productId);
    });

    filtered = filtered.filter((item) => {
      const productId =
        item.productId ||
        item.product_id ||
        item.product?.id ||
        item.product?._id;
      const productName = getProductName(productId)?.toLowerCase() || "";
      const categoryName = getCategoryName(productId)?.toLowerCase() || "";
      const search = searchTerm.toLowerCase();

      return productName.includes(search) || categoryName.includes(search);
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === "product") {
          const aProductId =
            a.productId || a.product_id || a.product?.id || a.product?._id;
          const bProductId =
            b.productId || b.product_id || b.product?.id || b.product?._id;
          aValue = getProductName(aProductId) || "";
          bValue = getProductName(bProductId) || "";
        } else if (sortConfig.key === "category") {
          const aProductId =
            a.productId || a.product_id || a.product?.id || a.product?._id;
          const bProductId =
            b.productId || b.product_id || b.product?.id || b.product?._id;
          aValue = getCategoryName(aProductId) || "";
          bValue = getCategoryName(bProductId) || "";
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (number) => {
    // Tampilkan tanpa desimal untuk bilangan bulat
    return Number.isInteger(number)
      ? new Intl.NumberFormat("id-ID").format(number)
      : new Intl.NumberFormat("id-ID", {
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

  return (
    <>
      <CRow>
        <CCol>
          <CBreadcrumb className="mb-3">
            <CBreadcrumbItem href="/dashboard">Beranda</CBreadcrumbItem>
            <CBreadcrumbItem>Perhitungan EOQ & ROP</CBreadcrumbItem>
            <CBreadcrumbItem>EOQ</CBreadcrumbItem>
            <CBreadcrumbItem active>Data EOQ Barang</CBreadcrumbItem>
          </CBreadcrumb>
        </CCol>
      </CRow>

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
                  onClick={fetchAllData}
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

              <CRow className="mb-3">
                <CCol md={6}>
                  <CInputGroup>
                    <CFormInput
                      placeholder="Cari berdasarkan nama produk atau kategori..."
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
                          onClick={() => handleSort("category")}
                        >
                          Kategori{" "}
                          {sortConfig.key === "category" &&
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
                        <CTableHeaderCell>Status</CTableHeaderCell>
                        <CTableHeaderCell width="150">Aksi</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {currentItems.length > 0 ? (
                        currentItems.map((eoq) => {
                          const productId =
                            eoq.productId ||
                            eoq.product_id ||
                            eoq.product?.id ||
                            eoq.product?._id;
                          const productName = getProductName(productId);
                          const categoryName = getCategoryName(productId);
                          const status = getEoqStatus(
                            eoq.eoq,
                            eoq.orderFrequency
                          );

                          return (
                            <CTableRow key={eoq._id}>
                              <CTableDataCell>
                                <strong>{productName}</strong>
                              </CTableDataCell>
                              <CTableDataCell>
                                <CBadge color="secondary" className="text-dark">
                                  {categoryName}
                                </CBadge>
                              </CTableDataCell>
                              <CTableDataCell>
                                <strong className="text-primary">
                                  {Math.round(eoq.eoq)} unit
                                </strong>
                              </CTableDataCell>
                              <CTableDataCell>
                                <CBadge color={status.color}>
                                  {status.text}
                                </CBadge>
                              </CTableDataCell>
                              <CTableDataCell>
                                <CButton
                                  color="info"
                                  variant="outline"
                                  size="sm"
                                  className="me-2"
                                  onClick={() => {
                                    setSelectedEoq(eoq);
                                    setShowDetailModal(true);
                                  }}
                                >
                                  <CIcon icon={cilInfo} />
                                </CButton>
                                <CButton
                                  color="danger"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedEoq(eoq);
                                    setShowDeleteModal(true);
                                  }}
                                >
                                  <CIcon icon={cilTrash} />
                                </CButton>
                              </CTableDataCell>
                            </CTableRow>
                          );
                        })
                      ) : (
                        <CTableRow>
                          <CTableDataCell
                            colSpan="5"
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

      <CModal
        visible={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        size="lg"
      >
        <CModalHeader>
          <CModalTitle>
            Detail EOQ -{" "}
            {selectedEoq &&
              getProductName(
                selectedEoq.productId ||
                  selectedEoq.product_id ||
                  selectedEoq.product?.id ||
                  selectedEoq.product?._id
              )}
          </CModalTitle>
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
                        {getProductName(
                          selectedEoq.productId ||
                            selectedEoq.product_id ||
                            selectedEoq.product?.id ||
                            selectedEoq.product?._id
                        )}
                      </CTableDataCell>
                    </CTableRow>
                    <CTableRow>
                      <CTableDataCell>
                        <strong>Kategori</strong>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color="secondary" className="text-dark">
                          {getCategoryName(
                            selectedEoq.productId ||
                              selectedEoq.product_id ||
                              selectedEoq.product?.id ||
                              selectedEoq.product?._id
                          )}
                        </CBadge>
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
                        {Math.round(selectedEoq.annualDemand)} unit
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
                        {Math.round(selectedEoq.eoq)} unit
                      </CTableDataCell>
                    </CTableRow>
                    <CTableRow>
                      <CTableDataCell>
                        <strong>Frekuensi Pemesanan</strong>
                      </CTableDataCell>
                      <CTableDataCell>
                        {Math.round(selectedEoq.orderFrequency)} kali/tahun
                      </CTableDataCell>
                    </CTableRow>
                    <CTableRow>
                      <CTableDataCell>
                        <strong>Total Biaya Optimal</strong>
                      </CTableDataCell>
                      <CTableDataCell className="text-success fw-bold">
                        {formatCurrency(Math.round(selectedEoq.totalCost))}
                      </CTableDataCell>
                    </CTableRow>
                  </CTableBody>
                </CTable>
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

      <CModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      >
        <CModalHeader>
          <CModalTitle>Konfirmasi Hapus</CModalTitle>
        </CModalHeader>
        <CModalBody>
          Apakah Anda yakin ingin menghapus data EOQ untuk produk:{" "}
          <strong>
            {selectedEoq &&
              getProductName(
                selectedEoq.productId ||
                  selectedEoq.product_id ||
                  selectedEoq.product?.id ||
                  selectedEoq.product?._id
              )}
          </strong>
          ?
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => setShowDeleteModal(false)}
            disabled={deleteLoading}
          >
            Batal
          </CButton>
          <CButton
            color="danger"
            onClick={() => deleteEoq(selectedEoq._id)}
            disabled={deleteLoading}
          >
            {deleteLoading ? (
              <CSpinner size="sm" />
            ) : (
              <>
                <CIcon icon={cilTrash} className="me-1" />
                Hapus
              </>
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default Eoq;
