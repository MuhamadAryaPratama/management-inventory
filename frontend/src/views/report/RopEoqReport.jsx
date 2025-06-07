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
  CFormSelect,
  CNav,
  CNavItem,
  CNavLink,
  CTabContent,
  CTabPane,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import {
  cilDescription,
  cilSearch,
  cilReload,
  cilInfo,
  cilChart,
  cilCloudDownload,
  cilFilter,
  cilWarning,
  cilCheckCircle,
  cilStorage,
} from "@coreui/icons";
import axios from "axios";

const Report = () => {
  const [eoqData, setEoqData] = useState([]);
  const [ropData, setRopData] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Tab states
  const [activeTab, setActiveTab] = useState("summary");

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [reportFilter, setReportFilter] = useState("all"); // all, critical, warning, optimal

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);

  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    combineAndFilterData();
  }, [eoqData, ropData, searchTerm, sortConfig, reportFilter]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchEoqData(),
        fetchRopData(),
        fetchProducts(),
        fetchCategories(),
      ]);
      // setSuccess("Data berhasil dimuat");
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

  const fetchRopData = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const response = await axios.get("http://localhost:5000/api/rop", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRopData(response.data.data || response.data || []);
    } catch (error) {
      console.error("Error fetching ROP data:", error);
      throw new Error("Gagal memuat data ROP");
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

  // Helper functions
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
    return product?.name || "N/A";
  };

  const getCurrentStock = (product) => {
    if (!product) return 0;
    return product.currentStock !== undefined
      ? product.currentStock
      : product.stock || 0;
  };

  // Combine EOQ and ROP data
  const combineAndFilterData = () => {
    const combinedData = [];

    // Process EOQ data
    eoqData.forEach((eoq) => {
      const productId =
        eoq.productId || eoq.product_id || eoq.product?.id || eoq.product?._id;
      const product = products.find((p) => p._id === productId);
      const ropItem = ropData.find((rop) => {
        const ropProductId =
          rop.product?._id || rop.productId || rop.product_id;
        return ropProductId === productId;
      });

      const currentStock = getCurrentStock(product);
      const productName = getProductName(productId);
      const categoryName = getCategoryName(productId);

      // Calculate statuses
      const eoqStatus = getEoqStatus(eoq.eoq, eoq.orderFrequency);
      const ropStatus = ropItem
        ? getRopStatus(ropItem, currentStock)
        : { status: "no-data", label: "Tidak ada data", color: "secondary" };

      // Overall status priority: critical > warning > optimal
      let overallStatus = "optimal";
      let overallColor = "success";

      if (
        eoqStatus.color === "warning" ||
        ropStatus.color === "warning" ||
        ropStatus.color === "danger"
      ) {
        overallStatus = "warning";
        overallColor = "warning";
      }

      if (ropStatus.color === "danger") {
        overallStatus = "critical";
        overallColor = "danger";
      }

      combinedData.push({
        id: eoq._id,
        type: "combined",
        productId,
        productName,
        categoryName,
        currentStock,
        // EOQ data
        eoq: eoq.eoq,
        orderFrequency: eoq.orderFrequency,
        totalCost: eoq.totalCost,
        orderingCost: eoq.orderingCost,
        holdingCost: eoq.holdingCost,
        annualDemand: eoq.annualDemand,
        eoqStatus,
        eoqLastCalculated: eoq.lastCalculated,
        // ROP data
        rop: ropItem?.rop || null,
        leadTime: ropItem?.leadTime || null,
        dailyDemand: ropItem?.dailyDemand || null,
        ropStatus,
        ropLastCalculated: ropItem?.lastCalculated || null,
        // Overall status
        overallStatus,
        overallColor,
      });
    });

    // Filter data
    let filtered = combinedData.filter((item) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        item.productName.toLowerCase().includes(search) ||
        item.categoryName.toLowerCase().includes(search);

      if (reportFilter === "all") return matchesSearch;
      if (reportFilter === "critical")
        return matchesSearch && item.overallStatus === "critical";
      if (reportFilter === "warning")
        return matchesSearch && item.overallStatus === "warning";
      if (reportFilter === "optimal")
        return matchesSearch && item.overallStatus === "optimal";

      return matchesSearch;
    });

    // Sort data
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

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

  const getEoqStatus = (eoq, orderFrequency) => {
    if (orderFrequency > 12) {
      return { color: "warning", text: "Sering Order" };
    } else if (orderFrequency < 2) {
      return { color: "info", text: "Jarang Order" };
    } else {
      return { color: "success", text: "Optimal" };
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
    if (number === null || number === undefined) return "-";
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(number);
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Statistics calculations
  const getStatistics = () => {
    const total = filteredData.length;
    const critical = filteredData.filter(
      (item) => item.overallStatus === "critical"
    ).length;
    const warning = filteredData.filter(
      (item) => item.overallStatus === "warning"
    ).length;
    const optimal = filteredData.filter(
      (item) => item.overallStatus === "optimal"
    ).length;

    const totalEoqCost = filteredData.reduce(
      (sum, item) => sum + (item.totalCost || 0),
      0
    );
    const averageEoq =
      filteredData.length > 0
        ? filteredData.reduce((sum, item) => sum + (item.eoq || 0), 0) /
          filteredData.length
        : 0;

    return {
      total,
      critical,
      warning,
      optimal,
      totalEoqCost,
      averageEoq,
    };
  };

  const stats = getStatistics();

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleExportData = () => {
    // Simple CSV export
    const csvData = [
      [
        "No",
        "Produk",
        "Kategori",
        "Stock",
        "EOQ",
        "ROP",
        "Status EOQ",
        "Status ROP",
        "Status Keseluruhan",
      ],
      ...filteredData.map((item, index) => [
        index + 1,
        item.productName,
        item.categoryName,
        item.currentStock,
        item.eoq || "-",
        item.rop || "-",
        item.eoqStatus.text,
        item.ropStatus.label,
        item.overallStatus,
      ]),
    ];

    const csvContent = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-eoq-rop-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <div>
                <CIcon icon={cilDescription} className="me-2" />
                <strong>Laporan EOQ & ROP</strong>
              </div>
              <div className="d-flex gap-2">
                <CButton
                  color="success"
                  variant="outline"
                  size="sm"
                  onClick={handleExportData}
                >
                  <CIcon icon={cilCloudDownload} className="me-1" />
                  Export CSV
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

              {/* Statistics Cards */}
              <CRow className="mb-4">
                <CCol md={3}>
                  <CCard className="text-center border-primary">
                    <CCardBody>
                      <div className="text-primary">
                        <CIcon icon={cilChart} size="2xl" />
                      </div>
                      <h4 className="text-primary mt-2">{stats.total}</h4>
                      <p className="text-muted mb-0">Total Produk</p>
                    </CCardBody>
                  </CCard>
                </CCol>
                <CCol md={3}>
                  <CCard className="text-center border-danger">
                    <CCardBody>
                      <div className="text-danger">
                        <CIcon icon={cilWarning} size="2xl" />
                      </div>
                      <h4 className="text-danger mt-2">{stats.critical}</h4>
                      <p className="text-muted mb-0">Status Kritis</p>
                    </CCardBody>
                  </CCard>
                </CCol>
                <CCol md={3}>
                  <CCard className="text-center border-warning">
                    <CCardBody>
                      <div className="text-warning">
                        <CIcon icon={cilStorage} size="2xl" />
                      </div>
                      <h4 className="text-warning mt-2">{stats.warning}</h4>
                      <p className="text-muted mb-0">Perlu Perhatian</p>
                    </CCardBody>
                  </CCard>
                </CCol>
                <CCol md={3}>
                  <CCard className="text-center border-success">
                    <CCardBody>
                      <div className="text-success">
                        <CIcon icon={cilCheckCircle} size="2xl" />
                      </div>
                      <h4 className="text-success mt-2">{stats.optimal}</h4>
                      <p className="text-muted mb-0">Status Optimal</p>
                    </CCardBody>
                  </CCard>
                </CCol>
              </CRow>

              <CRow className="mb-3">
                <CCol md={6}>
                  <CCard>
                    <CCardBody>
                      <h6>Total Biaya EOQ</h6>
                      <h4 className="text-success">
                        {formatCurrency(stats.totalEoqCost)}
                      </h4>
                    </CCardBody>
                  </CCard>
                </CCol>
                <CCol md={6}>
                  <CCard>
                    <CCardBody>
                      <h6>Rata-rata Nilai EOQ</h6>
                      <h4 className="text-info">
                        {formatNumber(stats.averageEoq)} unit
                      </h4>
                    </CCardBody>
                  </CCard>
                </CCol>
              </CRow>

              {/* Search and Filter */}
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
                <CCol md={3}>
                  <CDropdown>
                    <CDropdownToggle color="outline-secondary">
                      <CIcon icon={cilFilter} className="me-2" />
                      Filter Status
                    </CDropdownToggle>
                    <CDropdownMenu>
                      <CDropdownItem onClick={() => setReportFilter("all")}>
                        Semua Status
                      </CDropdownItem>
                      <CDropdownItem
                        onClick={() => setReportFilter("critical")}
                      >
                        Status Kritis
                      </CDropdownItem>
                      <CDropdownItem onClick={() => setReportFilter("warning")}>
                        Perlu Perhatian
                      </CDropdownItem>
                      <CDropdownItem onClick={() => setReportFilter("optimal")}>
                        Status Optimal
                      </CDropdownItem>
                    </CDropdownMenu>
                  </CDropdown>
                </CCol>
                <CCol md={3} className="text-end">
                  <small className="text-muted">
                    Menampilkan {currentItems.length} dari {filteredData.length}{" "}
                    data
                  </small>
                </CCol>
              </CRow>

              {loading ? (
                <div className="text-center p-4">
                  <CSpinner color="primary" />
                  <p className="mt-2">Memuat laporan...</p>
                </div>
              ) : (
                <>
                  <CTable responsive striped hover>
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>No</CTableHeaderCell>
                        <CTableHeaderCell
                          style={{ cursor: "pointer" }}
                          onClick={() => handleSort("productName")}
                        >
                          Produk{" "}
                          {sortConfig.key === "productName" &&
                            (sortConfig.direction === "asc" ? "↑" : "↓")}
                        </CTableHeaderCell>
                        <CTableHeaderCell
                          style={{ cursor: "pointer" }}
                          onClick={() => handleSort("categoryName")}
                        >
                          Kategori{" "}
                          {sortConfig.key === "categoryName" &&
                            (sortConfig.direction === "asc" ? "↑" : "↓")}
                        </CTableHeaderCell>
                        <CTableHeaderCell
                          style={{ cursor: "pointer" }}
                          onClick={() => handleSort("currentStock")}
                        >
                          Stock{" "}
                          {sortConfig.key === "currentStock" &&
                            (sortConfig.direction === "asc" ? "↑" : "↓")}
                        </CTableHeaderCell>
                        <CTableHeaderCell
                          style={{ cursor: "pointer" }}
                          onClick={() => handleSort("eoq")}
                        >
                          EOQ{" "}
                          {sortConfig.key === "eoq" &&
                            (sortConfig.direction === "asc" ? "↑" : "↓")}
                        </CTableHeaderCell>
                        <CTableHeaderCell
                          style={{ cursor: "pointer" }}
                          onClick={() => handleSort("rop")}
                        >
                          ROP{" "}
                          {sortConfig.key === "rop" &&
                            (sortConfig.direction === "asc" ? "↑" : "↓")}
                        </CTableHeaderCell>
                        <CTableHeaderCell>Status EOQ</CTableHeaderCell>
                        <CTableHeaderCell>Status ROP</CTableHeaderCell>
                        <CTableHeaderCell>Status Keseluruhan</CTableHeaderCell>
                        <CTableHeaderCell width="120">Aksi</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {currentItems.length > 0 ? (
                        currentItems.map((item, index) => (
                          <CTableRow key={item.id}>
                            <CTableDataCell>
                              {indexOfFirstItem + index + 1}
                            </CTableDataCell>
                            <CTableDataCell>
                              <strong>{item.productName}</strong>
                            </CTableDataCell>
                            <CTableDataCell>
                              <CBadge color="secondary" className="text-dark">
                                {item.categoryName}
                              </CBadge>
                            </CTableDataCell>
                            <CTableDataCell>
                              <strong className="text-info">
                                {item.currentStock} unit
                              </strong>
                            </CTableDataCell>
                            <CTableDataCell>
                              <strong className="text-primary">
                                {formatNumber(item.eoq)} unit
                              </strong>
                            </CTableDataCell>
                            <CTableDataCell>
                              <strong className="text-warning">
                                {item.rop ? `${Math.ceil(item.rop)} unit` : "-"}
                              </strong>
                            </CTableDataCell>
                            <CTableDataCell>
                              <CBadge color={item.eoqStatus.color}>
                                {item.eoqStatus.text}
                              </CBadge>
                            </CTableDataCell>
                            <CTableDataCell>
                              <CBadge color={item.ropStatus.color}>
                                {item.ropStatus.label}
                              </CBadge>
                            </CTableDataCell>
                            <CTableDataCell>
                              <CBadge
                                color={item.overallColor}
                                className="fw-bold"
                              >
                                {item.overallStatus.toUpperCase()}
                              </CBadge>
                            </CTableDataCell>
                            <CTableDataCell>
                              <CButton
                                color="info"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedItem(item);
                                  setShowDetailModal(true);
                                }}
                              >
                                <CIcon icon={cilInfo} className="me-1" />
                              </CButton>
                            </CTableDataCell>
                          </CTableRow>
                        ))
                      ) : (
                        <CTableRow>
                          <CTableDataCell
                            colSpan="10"
                            className="text-center py-4"
                          >
                            <div className="text-muted">
                              <CIcon
                                icon={cilDescription}
                                size="3xl"
                                className="mb-3"
                              />
                              <p>Tidak ada data untuk ditampilkan</p>
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
        size="xl"
      >
        <CModalHeader>
          <CModalTitle>
            Detail Laporan - {selectedItem?.productName}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          {selectedItem && (
            <CRow>
              <CCol md={6}>
                <CCard className="mb-3">
                  <CCardHeader>
                    <strong>Informasi Produk</strong>
                  </CCardHeader>
                  <CCardBody>
                    <CTable responsive>
                      <CTableBody>
                        <CTableRow>
                          <CTableDataCell>
                            <strong>Nama Produk</strong>
                          </CTableDataCell>
                          <CTableDataCell>
                            {selectedItem.productName}
                          </CTableDataCell>
                        </CTableRow>
                        <CTableRow>
                          <CTableDataCell>
                            <strong>Kategori</strong>
                          </CTableDataCell>
                          <CTableDataCell>
                            <CBadge color="secondary">
                              {selectedItem.categoryName}
                            </CBadge>
                          </CTableDataCell>
                        </CTableRow>
                        <CTableRow>
                          <CTableDataCell>
                            <strong>Stock Saat Ini</strong>
                          </CTableDataCell>
                          <CTableDataCell>
                            <strong className="text-info">
                              {selectedItem.currentStock} unit
                            </strong>
                          </CTableDataCell>
                        </CTableRow>
                      </CTableBody>
                    </CTable>
                  </CCardBody>
                </CCard>

                <CCard className="mb-3">
                  <CCardHeader>
                    <strong>Data EOQ</strong>
                  </CCardHeader>
                  <CCardBody>
                    <CTable responsive>
                      <CTableBody>
                        <CTableRow>
                          <CTableDataCell>
                            <strong>EOQ (Unit Optimal)</strong>
                          </CTableDataCell>
                          <CTableDataCell>
                            <strong className="text-primary">
                              {formatNumber(selectedItem.eoq)} unit
                            </strong>
                          </CTableDataCell>
                        </CTableRow>
                        <CTableRow>
                          <CTableDataCell>
                            <strong>Frekuensi Order</strong>
                          </CTableDataCell>
                          <CTableDataCell>
                            {formatNumber(selectedItem.orderFrequency)}{" "}
                            kali/tahun
                          </CTableDataCell>
                        </CTableRow>
                        <CTableRow>
                          <CTableDataCell>
                            <strong>Total Biaya</strong>
                          </CTableDataCell>
                          <CTableDataCell>
                            {formatCurrency(selectedItem.totalCost)}
                          </CTableDataCell>
                        </CTableRow>
                        <CTableRow>
                          <CTableDataCell>
                            <strong>Biaya Pemesanan</strong>
                          </CTableDataCell>
                          <CTableDataCell>
                            {formatCurrency(selectedItem.orderingCost)}
                          </CTableDataCell>
                        </CTableRow>
                        <CTableRow>
                          <CTableDataCell>
                            <strong>Biaya Penyimpanan</strong>
                          </CTableDataCell>
                          <CTableDataCell>
                            {formatCurrency(selectedItem.holdingCost)}
                          </CTableDataCell>
                        </CTableRow>
                        <CTableRow>
                          <CTableDataCell>
                            <strong>Permintaan Tahunan</strong>
                          </CTableDataCell>
                          <CTableDataCell>
                            {formatNumber(selectedItem.annualDemand)} unit
                          </CTableDataCell>
                        </CTableRow>
                        <CTableRow>
                          <CTableDataCell>
                            <strong>Status EOQ</strong>
                          </CTableDataCell>
                          <CTableDataCell>
                            <CBadge color={selectedItem.eoqStatus.color}>
                              {selectedItem.eoqStatus.text}
                            </CBadge>
                          </CTableDataCell>
                        </CTableRow>
                        <CTableRow>
                          <CTableDataCell>
                            <strong>Terakhir Dihitung</strong>
                          </CTableDataCell>
                          <CTableDataCell>
                            {formatDate(selectedItem.eoqLastCalculated)}
                          </CTableDataCell>
                        </CTableRow>
                      </CTableBody>
                    </CTable>
                  </CCardBody>
                </CCard>
              </CCol>

              <CCol md={6}>
                <CCard className="mb-3">
                  <CCardHeader>
                    <strong>Data ROP (Reorder Point)</strong>
                  </CCardHeader>
                  <CCardBody>
                    <CTable responsive>
                      <CTableBody>
                        <CTableRow>
                          <CTableDataCell>
                            <strong>ROP</strong>
                          </CTableDataCell>
                          <CTableDataCell>
                            {selectedItem.rop ? (
                              <strong className="text-warning">
                                {Math.ceil(selectedItem.rop)} unit
                              </strong>
                            ) : (
                              "-"
                            )}
                          </CTableDataCell>
                        </CTableRow>
                        <CTableRow>
                          <CTableDataCell>
                            <strong>Lead Time</strong>
                          </CTableDataCell>
                          <CTableDataCell>
                            {selectedItem.leadTime
                              ? `${selectedItem.leadTime} hari`
                              : "-"}
                          </CTableDataCell>
                        </CTableRow>
                        <CTableRow>
                          <CTableDataCell>
                            <strong>Permintaan Harian</strong>
                          </CTableDataCell>
                          <CTableDataCell>
                            {selectedItem.dailyDemand
                              ? `${formatNumber(
                                  selectedItem.dailyDemand
                                )} unit/hari`
                              : "-"}
                          </CTableDataCell>
                        </CTableRow>
                        <CTableRow>
                          <CTableDataCell>
                            <strong>Status ROP</strong>
                          </CTableDataCell>
                          <CTableDataCell>
                            <CBadge color={selectedItem.ropStatus.color}>
                              {selectedItem.ropStatus.label}
                            </CBadge>
                          </CTableDataCell>
                        </CTableRow>
                        <CTableRow>
                          <CTableDataCell>
                            <strong>Terakhir Dihitung</strong>
                          </CTableDataCell>
                          <CTableDataCell>
                            {selectedItem.ropLastCalculated
                              ? formatDate(selectedItem.ropLastCalculated)
                              : "-"}
                          </CTableDataCell>
                        </CTableRow>
                      </CTableBody>
                    </CTable>
                  </CCardBody>
                </CCard>

                <CCard>
                  <CCardHeader>
                    <strong>Analisis Status</strong>
                  </CCardHeader>
                  <CCardBody>
                    <div className="mb-3">
                      <h6>Status Keseluruhan</h6>
                      <CBadge
                        color={selectedItem.overallColor}
                        className="fs-5 p-2"
                      >
                        {selectedItem.overallStatus.toUpperCase()}
                      </CBadge>
                    </div>

                    {selectedItem.overallStatus === "critical" && (
                      <CAlert color="danger">
                        <CIcon icon={cilWarning} className="me-2" />
                        <strong>Perhatian!</strong> Produk ini dalam status
                        kritis. Stok saat ini ({selectedItem.currentStock} unit)
                        sudah mencapai atau di bawah titik ROP (
                        {Math.ceil(selectedItem.rop)} unit). Segera lakukan
                        pemesanan.
                      </CAlert>
                    )}

                    {selectedItem.overallStatus === "warning" && (
                      <CAlert color="warning">
                        <CIcon icon={cilInfo} className="me-2" />
                        <strong>Perhatian!</strong> Produk ini membutuhkan
                        perhatian. Stok saat ini ({selectedItem.currentStock}{" "}
                        unit) mendekati titik ROP ({Math.ceil(selectedItem.rop)}{" "}
                        unit). Pertimbangkan untuk melakukan pemesanan.
                      </CAlert>
                    )}

                    {selectedItem.overallStatus === "optimal" && (
                      <CAlert color="success">
                        <CIcon icon={cilCheckCircle} className="me-2" />
                        <strong>Status Optimal!</strong> Produk ini dalam
                        kondisi baik. Stok saat ini ({selectedItem.currentStock}{" "}
                        unit) masih aman di atas titik ROP (
                        {Math.ceil(selectedItem.rop)} unit).
                      </CAlert>
                    )}

                    <div className="mt-3">
                      <h6>Rekomendasi</h6>
                      <ul>
                        <li>
                          Jumlah optimal pemesanan:{" "}
                          <strong>{Math.ceil(selectedItem.eoq)} unit</strong>
                        </li>
                        <li>
                          Frekuensi pemesanan:{" "}
                          <strong>
                            {formatNumber(selectedItem.orderFrequency)} kali per
                            tahun
                          </strong>
                        </li>
                        {selectedItem.rop && (
                          <li>
                            Titik pemesanan ulang:{" "}
                            <strong>{Math.ceil(selectedItem.rop)} unit</strong>
                          </li>
                        )}
                      </ul>
                    </div>
                  </CCardBody>
                </CCard>
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

export default Report;
