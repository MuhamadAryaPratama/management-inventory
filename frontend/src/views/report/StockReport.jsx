import React, { useState, useEffect } from "react";
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
  CSpinner,
  CInputGroup,
  CFormInput,
  CFormSelect,
  CBadge,
  CAlert,
  CPagination,
  CPaginationItem,
  CBreadcrumb,
  CBreadcrumbItem,
} from "@coreui/react";
import {
  Package,
  Eye,
  Download,
  Filter,
  ArrowUp,
  ArrowDown,
  Home,
  List,
  Database,
  Box,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Search,
  RefreshCw,
  Info,
} from "lucide-react";
import axios from "axios";

const StockReport = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch products from API
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get("http://localhost:5000/api/products", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
        },
      });

      if (response.data) {
        setProducts(response.data);
        setFilteredProducts(response.data);
      } else {
        throw new Error("No data received from server");
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setError(
        `Failed to load product data: ${
          err.response?.data?.message || err.message
        }. Please try again later.`
      );
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Get stock status
  const getStockStatus = (currentStock, minStock) => {
    if (currentStock === 0) return "out-of-stock";
    if (currentStock <= minStock) return "low-stock";
    return "in-stock";
  };

  // Get stock status color for CoreUI
  const getStatusColor = (status) => {
    switch (status) {
      case "out-of-stock":
        return "danger";
      case "low-stock":
        return "warning";
      case "in-stock":
        return "success";
      default:
        return "secondary";
    }
  };

  // Get stock status text
  const getStatusText = (status) => {
    switch (status) {
      case "out-of-stock":
        return "Out of Stock";
      case "low-stock":
        return "Low Stock";
      case "in-stock":
        return "In Stock";
      default:
        return "Unknown";
    }
  };

  // Filter and search products
  useEffect(() => {
    let filtered = products.filter((product) => {
      const matchesSearch =
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        product.supplier?.name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

      const status = getStockStatus(product.currentStock, product.minStock);
      const matchesFilter = filterStatus === "all" || status === filterStatus;

      return matchesSearch && matchesFilter;
    });

    // Sort products
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "name":
          aValue = a.name?.toLowerCase() || "";
          bValue = b.name?.toLowerCase() || "";
          break;
        case "currentStock":
          aValue = a.currentStock || 0;
          bValue = b.currentStock || 0;
          break;
        case "minStock":
          aValue = a.minStock || 0;
          bValue = b.minStock || 0;
          break;
        case "price":
          aValue = a.price || 0;
          bValue = b.price || 0;
          break;
        default:
          aValue = a.name?.toLowerCase() || "";
          bValue = b.name?.toLowerCase() || "";
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [products, searchTerm, filterStatus, sortBy, sortOrder]);

  // Calculate statistics
  const stats = {
    total: products.length,
    inStock: products.filter(
      (p) => getStockStatus(p.currentStock, p.minStock) === "in-stock"
    ).length,
    lowStock: products.filter(
      (p) => getStockStatus(p.currentStock, p.minStock) === "low-stock"
    ).length,
    outOfStock: products.filter(
      (p) => getStockStatus(p.currentStock, p.minStock) === "out-of-stock"
    ).length,
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchProducts();
  };

  // Handle export (placeholder)
  const handleExport = () => {
    console.log("Export functionality to be implemented");
  };

  // Helper function to get category name
  const getCategoryName = (category) => {
    if (!category) return "No Category";
    return typeof category === "object" ? category.name : category;
  };

  // Helper function to get supplier info
  const getSupplierInfo = (supplier) => {
    if (!supplier) return { name: "No Supplier", contact: "-" };
    if (typeof supplier === "object") {
      return {
        name: supplier.name || "No Supplier",
        contact: supplier.contact || supplier.email || "-",
      };
    }
    return { name: supplier, contact: "-" };
  };

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  return (
    <>
      <CRow>
        <CCol>
          <CBreadcrumb className="mb-3">
            <CBreadcrumbItem href="/dashboard">
              <Home size={14} className="me-1" />
              Home
            </CBreadcrumbItem>
            <CBreadcrumbItem active>
              <List size={14} className="me-1" />
              Stock Report
            </CBreadcrumbItem>
          </CBreadcrumb>
        </CCol>
      </CRow>

      {/* Statistics Cards */}
      <CRow className="mb-4">
        <CCol sm={6} lg={3}>
          <CCard className="text-white bg-primary">
            <CCardBody className="pb-0 d-flex justify-content-between align-items-start">
              <div>
                <div className="fs-4 fw-semibold">{stats.total}</div>
                <div>Total Products</div>
              </div>
              <Box size={24} />
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} lg={3}>
          <CCard className="text-white bg-success">
            <CCardBody className="pb-0 d-flex justify-content-between align-items-start">
              <div>
                <div className="fs-4 fw-semibold">{stats.inStock}</div>
                <div>In Stock</div>
              </div>
              <CheckCircle size={24} />
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} lg={3}>
          <CCard className="text-white bg-warning">
            <CCardBody className="pb-0 d-flex justify-content-between align-items-start">
              <div>
                <div className="fs-4 fw-semibold">{stats.lowStock}</div>
                <div>Low Stock</div>
              </div>
              <AlertTriangle size={24} />
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} lg={3}>
          <CCard className="text-white bg-danger">
            <CCardBody className="pb-0 d-flex justify-content-between align-items-start">
              <div>
                <div className="fs-4 fw-semibold">{stats.outOfStock}</div>
                <div>Out of Stock</div>
              </div>
              <XCircle size={24} />
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <h5>
                <Database size={20} className="me-2" />
                Stock Report
              </h5>
              <p className="text-medium-emphasis mb-0">
                Monitor your inventory levels and stock status
              </p>
            </CCardHeader>
            <CCardBody>
              {/* Filters and Search */}
              <CRow className="mb-3">
                <CCol sm={12} md={4} className="mb-2 mb-md-0">
                  <CInputGroup>
                    <CFormInput
                      placeholder="Search products, categories, suppliers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <CButton type="button" color="primary" variant="outline">
                      <Search size={14} />
                    </CButton>
                  </CInputGroup>
                </CCol>
                <CCol sm={6} md={2} className="mb-2 mb-md-0">
                  <CFormSelect
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">
                      <Filter size={14} className="me-1" />
                      All Status
                    </option>
                    <option value="in-stock">In Stock</option>
                    <option value="low-stock">Low Stock</option>
                    <option value="out-of-stock">Out of Stock</option>
                  </CFormSelect>
                </CCol>
                <CCol sm={6} md={2} className="mb-2 mb-md-0">
                  <CFormSelect
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="name">Sort by Name</option>
                    <option value="currentStock">Sort by Current Stock</option>
                    <option value="minStock">Sort by Min Stock</option>
                    <option value="price">Sort by Price</option>
                  </CFormSelect>
                </CCol>
                <CCol sm={6} md={2} className="mb-2 mb-md-0">
                  <CFormSelect
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                  >
                    <option value="asc">
                      <ArrowUp size={14} className="me-1" />
                      Ascending
                    </option>
                    <option value="desc">
                      <ArrowDown size={14} className="me-1" />
                      Descending
                    </option>
                  </CFormSelect>
                </CCol>
                <CCol sm={6} md={2} className="d-flex gap-2">
                  <CButton
                    color="success"
                    onClick={handleExport}
                    className="flex-fill"
                  >
                    <Download size={14} className="me-1" />
                    Export
                  </CButton>
                  <CButton color="secondary" onClick={handleRefresh}>
                    <RefreshCw size={14} />
                  </CButton>
                </CCol>
              </CRow>

              {error && (
                <CAlert
                  color="danger"
                  dismissible
                  onClose={() => setError(null)}
                >
                  <div className="d-flex align-items-center">
                    <Info size={16} className="me-2" />
                    {error}
                  </div>
                </CAlert>
              )}

              {loading ? (
                <div className="d-flex justify-content-center my-5">
                  <CSpinner color="primary" />
                </div>
              ) : (
                <>
                  <CTable hover responsive className="mb-3">
                    <CTableHead color="light">
                      <CTableRow>
                        <CTableHeaderCell scope="col">No</CTableHeaderCell>
                        <CTableHeaderCell scope="col">Product</CTableHeaderCell>
                        <CTableHeaderCell scope="col">
                          Category
                        </CTableHeaderCell>
                        <CTableHeaderCell scope="col">
                          Supplier
                        </CTableHeaderCell>
                        <CTableHeaderCell scope="col">Price</CTableHeaderCell>
                        <CTableHeaderCell scope="col">
                          Current Stock
                        </CTableHeaderCell>
                        <CTableHeaderCell scope="col">
                          Min Stock
                        </CTableHeaderCell>
                        <CTableHeaderCell scope="col">Status</CTableHeaderCell>
                        <CTableHeaderCell scope="col">
                          Last Updated
                        </CTableHeaderCell>
                        <CTableHeaderCell scope="col">Actions</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {currentItems.length > 0 ? (
                        currentItems.map((product, index) => {
                          const status = getStockStatus(
                            product.currentStock,
                            product.minStock
                          );
                          const supplierInfo = getSupplierInfo(
                            product.supplier
                          );
                          return (
                            <CTableRow key={product._id}>
                              <CTableDataCell>
                                {indexOfFirstItem + index + 1}
                              </CTableDataCell>
                              <CTableDataCell>
                                <div>
                                  <div className="fw-semibold">
                                    {product.name}
                                  </div>
                                  <div className="text-medium-emphasis small">
                                    {product.description || "-"}
                                  </div>
                                </div>
                              </CTableDataCell>
                              <CTableDataCell>
                                {getCategoryName(product.category)}
                              </CTableDataCell>
                              <CTableDataCell>
                                <div>
                                  <div>{supplierInfo.name}</div>
                                  <div className="text-medium-emphasis small">
                                    {supplierInfo.contact}
                                  </div>
                                </div>
                              </CTableDataCell>
                              <CTableDataCell>
                                <div className="fw-semibold">
                                  {formatCurrency(product.price)}
                                </div>
                              </CTableDataCell>
                              <CTableDataCell>
                                <div className="fw-bold">
                                  {product.currentStock || 0}
                                </div>
                              </CTableDataCell>
                              <CTableDataCell>
                                {product.minStock || 0}
                              </CTableDataCell>
                              <CTableDataCell>
                                <CBadge color={getStatusColor(status)}>
                                  {getStatusText(status)}
                                </CBadge>
                              </CTableDataCell>
                              <CTableDataCell>
                                <div>
                                  <div className="small">
                                    {formatDate(product.updatedAt)}
                                  </div>
                                  <div className="text-medium-emphasis small">
                                    by {product.updatedBy?.name || "System"}
                                  </div>
                                </div>
                              </CTableDataCell>
                              <CTableDataCell>
                                <CButton
                                  color="info"
                                  variant="outline"
                                  size="sm"
                                >
                                  <Eye size={14} />
                                </CButton>
                              </CTableDataCell>
                            </CTableRow>
                          );
                        })
                      ) : (
                        <CTableRow>
                          <CTableDataCell
                            colSpan="10"
                            className="text-center py-4"
                          >
                            <Package
                              size={48}
                              className="text-medium-emphasis mb-2"
                            />
                            <div className="fw-semibold">No products found</div>
                            <div className="text-medium-emphasis small">
                              Try adjusting your search or filter criteria.
                            </div>
                          </CTableDataCell>
                        </CTableRow>
                      )}
                    </CTableBody>
                  </CTable>

                  {totalPages > 1 && (
                    <CPagination align="end" aria-label="Page navigation">
                      <CPaginationItem
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                      >
                        Previous
                      </CPaginationItem>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <CPaginationItem
                            key={page}
                            active={page === currentPage}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </CPaginationItem>
                        )
                      )}

                      <CPaginationItem
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                      >
                        Next
                      </CPaginationItem>
                    </CPagination>
                  )}

                  <div className="text-medium-emphasis small">
                    Showing{" "}
                    {filteredProducts.length > 0 ? indexOfFirstItem + 1 : 0} to{" "}
                    {Math.min(indexOfLastItem, filteredProducts.length)} of{" "}
                    {filteredProducts.length} entries
                  </div>
                </>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  );
};

export default StockReport;
