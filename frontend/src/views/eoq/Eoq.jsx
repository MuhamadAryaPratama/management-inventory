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
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import {
  cilStorage,
  cilSearch,
  cilReload,
  cilInfo,
  cilCalculator,
} from "@coreui/icons";
import axios from "axios";

const Eoq = () => {
  const [eoqData, setEoqData] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
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
  const [selectedEoq, setSelectedEoq] = useState(null);

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
      setEoqData(response.data.data || response.data || []);
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
      // Ensure we get the same structure as Product.jsx
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
      // Ensure we get the same structure as Product.jsx
      setCategories(response.data.data || response.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw new Error("Gagal memuat data kategori");
    }
  };

  // Helper function to get product data with populated category
  const getProductWithCategory = (productId) => {
    const product = products.find(
      (p) => p._id === productId || p.id === productId
    );

    if (!product) return null;

    // Handle different possible category structures from Product.jsx
    let categoryData = null;

    if (product.category) {
      if (typeof product.category === "object") {
        // Category is already populated (like in Product.jsx)
        categoryData = product.category;
      } else {
        // Category is just an ID, find it in categories array
        categoryData = categories.find(
          (c) => c._id === product.category || c.id === product.category
        );
      }
    } else if (product.categoryId) {
      // Handle categoryId field
      categoryData = categories.find(
        (c) => c._id === product.categoryId || c.id === product.categoryId
      );
    } else if (product.category_id) {
      // Handle category_id field
      categoryData = categories.find(
        (c) => c._id === product.category_id || c.id === product.category_id
      );
    }

    return {
      ...product,
      category: categoryData || null,
    };
  };

  // Helper function to get category name (consistent with Product.jsx)
  const getCategoryName = (productId) => {
    const productWithCategory = getProductWithCategory(productId);

    if (!productWithCategory || !productWithCategory.category) {
      return "Tidak ada kategori";
    }

    const category = productWithCategory.category;
    return typeof category === "object" ? category.name : category;
  };

  // Helper function to get product name (consistent with Product.jsx)
  const getProductName = (productId) => {
    const product = products.find(
      (p) => p._id === productId || p.id === productId
    );
    return product?.name || "N/A";
  };

  const filterAndSortData = () => {
    let filtered = eoqData.filter((item) => {
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

              {/* Search Bar */}
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
                          const productId =
                            eoq.productId ||
                            eoq.product_id ||
                            eoq.product?.id ||
                            eoq.product?._id;
                          const productName = getProductName(productId);
                          const categoryName = getCategoryName(productId);

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
                                <CButton
                                  color="info"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedEoq(eoq);
                                    setShowDetailModal(true);
                                  }}
                                >
                                  <CIcon icon={cilInfo} className="me-1" />
                                </CButton>
                              </CTableDataCell>
                            </CTableRow>
                          );
                        })
                      ) : (
                        <CTableRow>
                          <CTableDataCell
                            colSpan="8"
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
    </>
  );
};

export default Eoq;
