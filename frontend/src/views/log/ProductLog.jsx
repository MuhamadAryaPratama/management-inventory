import React, { useState, useEffect } from "react";
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CContainer,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CSpinner,
  CAlert,
  CBadge,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CButton,
  CPagination,
  CPaginationItem,
  CFormSelect,
  CTooltip,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import {
  cilSearch,
  cilList,
  cilFolder,
  cilCog,
  cilPeople,
  cilCalendarCheck,
  cilReload,
  cilX,
  cilClock,
  cilHistory,
} from "@coreui/icons";

const ProductLog = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(10);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchFilters();
  }, [currentPage, productsPerPage]);

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      if (
        searchTerm !== "" ||
        categoryFilter ||
        supplierFilter ||
        stockFilter
      ) {
        handleSearch();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, categoryFilter, supplierFilter, stockFilter]);

  const getAuthToken = () => {
    // Try localStorage first, then cookies
    let token = localStorage.getItem("userToken");

    if (!token) {
      const cookies = document.cookie.split("; ");
      const tokenCookie = cookies.find((row) => row.startsWith("token="));
      token = tokenCookie ? tokenCookie.split("=")[1] : null;
    }

    return token;
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getAuthToken();

      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login kembali.");
      }

      // Build query parameters
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: productsPerPage.toString(),
      });

      if (searchTerm.trim()) queryParams.append("search", searchTerm.trim());
      if (categoryFilter) queryParams.append("category", categoryFilter);
      if (supplierFilter) queryParams.append("supplier", supplierFilter);
      if (stockFilter) queryParams.append("stockStatus", stockFilter);

      const response = await fetch(
        `http://localhost:5000/api/products?${queryParams}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("userToken");
          throw new Error("Sesi telah berakhir. Silakan login kembali.");
        } else if (response.status === 403) {
          throw new Error("Anda tidak memiliki akses untuk melihat data ini.");
        } else if (response.status === 404) {
          throw new Error(
            "Endpoint tidak ditemukan. Periksa konfigurasi server."
          );
        } else if (response.status >= 500) {
          throw new Error(
            "Terjadi kesalahan pada server. Silakan coba lagi nanti."
          );
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Improved data handling - handle multiple response formats
      let productData = [];
      let paginationData = {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
      };

      // Handle different response structures
      if (data && typeof data === "object") {
        // Case 1: Standard format with success flag
        if (data.success !== undefined) {
          if (data.success) {
            productData = Array.isArray(data.data) ? data.data : [];
            paginationData = data.pagination || {
              currentPage: currentPage,
              totalPages: Math.ceil(productData.length / productsPerPage),
              totalItems: productData.length,
            };
          } else {
            throw new Error(data.message || "Gagal mengambil data produk");
          }
        }
        // Case 2: Direct array response
        else if (Array.isArray(data)) {
          productData = data;
          paginationData = {
            currentPage: currentPage,
            totalPages: Math.ceil(productData.length / productsPerPage),
            totalItems: productData.length,
          };
        }
        // Case 3: Object with data array but no success flag
        else if (data.data && Array.isArray(data.data)) {
          productData = data.data;
          paginationData = data.pagination || {
            currentPage: currentPage,
            totalPages: Math.ceil(productData.length / productsPerPage),
            totalItems: productData.length,
          };
        }
        // Case 4: Object with products array
        else if (data.products && Array.isArray(data.products)) {
          productData = data.products;
          paginationData = data.pagination || {
            currentPage: currentPage,
            totalPages: Math.ceil(productData.length / productsPerPage),
            totalItems: productData.length,
          };
        }
        // Case 5: Handle empty but successful response
        else if (Object.keys(data).length === 0) {
          productData = [];
          paginationData = {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
          };
        } else {
          console.warn("Unexpected response format:", data);
          throw new Error("Format response tidak sesuai yang diharapkan");
        }
      } else {
        throw new Error("Response data tidak valid");
      }

      setProducts(productData);
      setPagination(paginationData);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError(err.message || "Gagal mengambil data produk");
      setProducts([]);
      setPagination({ currentPage: 1, totalPages: 1, totalItems: 0 });
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const fetchOptions = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      };

      // Fetch categories
      try {
        const categoriesResponse = await fetch(
          "http://localhost:5000/api/categories",
          fetchOptions
        );
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          let categoryList = [];
          if (categoriesData.success && Array.isArray(categoriesData.data)) {
            categoryList = categoriesData.data;
          } else if (Array.isArray(categoriesData)) {
            categoryList = categoriesData;
          } else if (
            categoriesData.categories &&
            Array.isArray(categoriesData.categories)
          ) {
            categoryList = categoriesData.categories;
          }
          setCategories(categoryList);
        }
      } catch (err) {
        console.warn("Failed to fetch categories:", err);
      }

      // Fetch suppliers
      try {
        const suppliersResponse = await fetch(
          "http://localhost:5000/api/suppliers",
          fetchOptions
        );
        if (suppliersResponse.ok) {
          const suppliersData = await suppliersResponse.json();
          let supplierList = [];
          if (suppliersData.success && Array.isArray(suppliersData.data)) {
            supplierList = suppliersData.data;
          } else if (Array.isArray(suppliersData)) {
            supplierList = suppliersData;
          } else if (
            suppliersData.suppliers &&
            Array.isArray(suppliersData.suppliers)
          ) {
            supplierList = suppliersData.suppliers;
          }
          setSuppliers(supplierList);
        }
      } catch (err) {
        console.warn("Failed to fetch suppliers:", err);
      }
    } catch (err) {
      console.error("Error fetching filters:", err);
    }
  };

  // Enhanced date and time formatting functions
  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("id-ID", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "Asia/Jakarta",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "-";
    }
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "Asia/Jakarta",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "-";
    }
  };

  const formatTimeOnly = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "Asia/Jakarta",
      });
    } catch (error) {
      console.error("Error formatting time:", error);
      return "-";
    }
  };

  const getRelativeTime = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now - date) / 1000);

      if (diffInSeconds < 60) {
        return `${diffInSeconds} detik yang lalu`;
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} menit yang lalu`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} jam yang lalu`;
      } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} hari yang lalu`;
      } else if (diffInSeconds < 2592000) {
        const weeks = Math.floor(diffInSeconds / 604800);
        return `${weeks} minggu yang lalu`;
      } else if (diffInSeconds < 31536000) {
        const months = Math.floor(diffInSeconds / 2592000);
        return `${months} bulan yang lalu`;
      } else {
        const years = Math.floor(diffInSeconds / 31536000);
        return `${years} tahun yang lalu`;
      }
    } catch (error) {
      console.error("Error calculating relative time:", error);
      return "-";
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "-";
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return "-";

    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
  };

  const getStockBadge = (currentStock, minStock) => {
    const current = Number(currentStock) || 0;
    const minimum = Number(minStock) || 0;

    if (current <= 0) {
      return <CBadge color="danger">Habis</CBadge>;
    } else if (current <= minimum) {
      return <CBadge color="warning">Stok Rendah</CBadge>;
    } else {
      return <CBadge color="success">Stok Aman</CBadge>;
    }
  };

  const getStockColor = (currentStock, minStock) => {
    const current = Number(currentStock) || 0;
    const minimum = Number(minStock) || 0;

    if (current <= 0) return "text-danger";
    if (current <= minimum) return "text-warning";
    return "text-success";
  };

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= pagination.totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    fetchProducts();
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchProducts();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("");
    setSupplierFilter("");
    setStockFilter("");
    setCurrentPage(1);
    setTimeout(() => fetchProducts(), 100);
  };

  // Component to render date and time information
  const DateTimeDisplay = ({ dateString, label, icon = cilCalendarCheck }) => {
    if (!dateString) {
      return (
        <div className="d-flex align-items-center">
          <CIcon icon={icon} className="me-1" size="sm" />
          <span className="text-medium-emphasis">-</span>
        </div>
      );
    }

    return (
      <CTooltip
        content={
          <div>
            <div>
              <strong>Tanggal:</strong> {formatDateOnly(dateString)}
            </div>
            <div>
              <strong>Waktu:</strong> {formatTimeOnly(dateString)}
            </div>
            <div>
              <strong>Relatif:</strong> {getRelativeTime(dateString)}
            </div>
          </div>
        }
        placement="top"
      >
        <div className="d-flex align-items-center cursor-pointer">
          <CIcon icon={icon} className="me-1" size="sm" />
          <div>
            <div className="fw-semibold" style={{ fontSize: "0.875rem" }}>
              {formatDateOnly(dateString)}
            </div>
            <div
              className="text-medium-emphasis"
              style={{ fontSize: "0.75rem" }}
            >
              <CIcon icon={cilClock} className="me-1" size="sm" />
              {formatTimeOnly(dateString)}
            </div>
            <div className="text-info" style={{ fontSize: "0.75rem" }}>
              {getRelativeTime(dateString)}
            </div>
          </div>
        </div>
      </CTooltip>
    );
  };

  if (loading) {
    return (
      <CContainer>
        <div className="text-center py-5">
          <CSpinner color="primary" size="lg" />
          <div className="mt-3">Memuat data log barang...</div>
        </div>
      </CContainer>
    );
  }

  return (
    <CContainer fluid>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-0">
                    <CIcon icon={cilList} className="me-2" />
                    Log Barang
                  </h4>
                  <small className="text-medium-emphasis">
                    Riwayat data barang dalam sistem dengan waktu detail
                  </small>
                </div>
                <div className="d-flex gap-2">
                  <CButton
                    color="secondary"
                    variant="outline"
                    onClick={clearFilters}
                    size="sm"
                    disabled={loading}
                  >
                    <CIcon icon={cilX} className="me-1" />
                    Clear Filter
                  </CButton>
                  <CButton
                    color="primary"
                    onClick={handleRefresh}
                    disabled={loading}
                    size="sm"
                  >
                    <CIcon icon={cilReload} className="me-2" />
                    Refresh
                  </CButton>
                </div>
              </div>
            </CCardHeader>
            <CCardBody>
              {error && (
                <CAlert color="danger" className="mb-4">
                  <strong>Error:</strong> {error}
                  <div className="mt-2">
                    <CButton
                      color="danger"
                      variant="outline"
                      size="sm"
                      onClick={handleRefresh}
                    >
                      Coba Lagi
                    </CButton>
                  </div>
                </CAlert>
              )}

              {/* Filters */}
              <CRow className="mb-4">
                <CCol md={3}>
                  <CInputGroup>
                    <CInputGroupText>
                      <CIcon icon={cilSearch} />
                    </CInputGroupText>
                    <CFormInput
                      placeholder="Cari nama barang..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    />
                  </CInputGroup>
                </CCol>
                <CCol md={2}>
                  <CFormSelect
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="">Semua Kategori</option>
                    {categories.map((category) => (
                      <option
                        key={category._id || category.id}
                        value={category._id || category.id}
                      >
                        {category.name}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={2}>
                  <CFormSelect
                    value={supplierFilter}
                    onChange={(e) => {
                      setSupplierFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="">Semua Supplier</option>
                    {suppliers.map((supplier) => (
                      <option
                        key={supplier._id || supplier.id}
                        value={supplier._id || supplier.id}
                      >
                        {supplier.name}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={2}>
                  <CFormSelect
                    value={stockFilter}
                    onChange={(e) => {
                      setStockFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="">Semua Stok</option>
                    <option value="out">Stok Habis</option>
                    <option value="low">Stok Rendah</option>
                    <option value="sufficient">Stok Aman</option>
                  </CFormSelect>
                </CCol>
                <CCol md={2}>
                  <CFormSelect
                    value={productsPerPage}
                    onChange={(e) => {
                      setProductsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value={10}>10 per halaman</option>
                    <option value={25}>25 per halaman</option>
                    <option value={50}>50 per halaman</option>
                    <option value={100}>100 per halaman</option>
                  </CFormSelect>
                </CCol>
                <CCol md={1}>
                  <CButton
                    color="primary"
                    onClick={handleSearch}
                    disabled={loading}
                  >
                    Cari
                  </CButton>
                </CCol>
              </CRow>

              {/* Results Info */}
              {pagination.totalItems > 0 && (
                <div className="mb-3">
                  <small className="text-medium-emphasis">
                    Menampilkan halaman {pagination.currentPage || currentPage}{" "}
                    dari {pagination.totalPages} ({pagination.totalItems} total
                    barang)
                  </small>
                </div>
              )}

              {/* Table */}
              <CTable hover responsive striped>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell scope="col" style={{ width: "50px" }}>
                      No
                    </CTableHeaderCell>
                    <CTableHeaderCell scope="col">Nama Barang</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Kategori</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Supplier</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Harga</CTableHeaderCell>
                    <CTableHeaderCell scope="col">
                      Stok Saat Ini
                    </CTableHeaderCell>
                    <CTableHeaderCell scope="col">Min Stok</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Status Stok</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Dibuat Oleh</CTableHeaderCell>
                    <CTableHeaderCell scope="col">
                      Diupdate Oleh
                    </CTableHeaderCell>
                    <CTableHeaderCell scope="col" style={{ minWidth: "180px" }}>
                      <CIcon icon={cilCalendarCheck} className="me-1" />
                      Waktu Dibuat
                    </CTableHeaderCell>
                    <CTableHeaderCell scope="col" style={{ minWidth: "180px" }}>
                      <CIcon icon={cilHistory} className="me-1" />
                      Waktu Update
                    </CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {products.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan="12" className="text-center py-5">
                        <div className="text-medium-emphasis">
                          <CIcon
                            icon={cilCog}
                            size="3xl"
                            className="mb-3 opacity-50"
                          />
                          <div className="fs-5 mb-2">
                            Tidak ada data barang yang ditemukan
                          </div>
                          {(searchTerm ||
                            categoryFilter ||
                            supplierFilter ||
                            stockFilter) && (
                            <div>
                              <p className="mb-2">
                                Coba sesuaikan filter pencarian Anda
                              </p>
                              <CButton
                                color="primary"
                                variant="outline"
                                onClick={clearFilters}
                                size="sm"
                              >
                                Clear semua filter
                              </CButton>
                            </div>
                          )}
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    products.map((product, index) => (
                      <CTableRow key={product._id || product.id || index}>
                        <CTableDataCell>
                          {((pagination.currentPage || currentPage) - 1) *
                            productsPerPage +
                            index +
                            1}
                        </CTableDataCell>
                        <CTableDataCell>
                          <div className="fw-semibold">
                            {product.name || "N/A"}
                          </div>
                          {product.description && (
                            <small className="text-medium-emphasis">
                              {product.description}
                            </small>
                          )}
                        </CTableDataCell>
                        <CTableDataCell>
                          <div className="d-flex align-items-center">
                            <CIcon
                              icon={cilFolder}
                              className="me-1"
                              size="sm"
                            />
                            <span>{product.category?.name || "N/A"}</span>
                          </div>
                          {product.category?.description && (
                            <small className="text-medium-emphasis d-block">
                              {product.category.description}
                            </small>
                          )}
                        </CTableDataCell>
                        <CTableDataCell>
                          <div className="fw-semibold">
                            {product.supplier?.name || "N/A"}
                          </div>
                          {product.supplier?.contact && (
                            <small className="text-medium-emphasis d-block">
                              Kontak: {product.supplier.contact}
                            </small>
                          )}
                          {product.supplier?.phone && (
                            <small className="text-medium-emphasis d-block">
                              Tel: {product.supplier.phone}
                            </small>
                          )}
                        </CTableDataCell>
                        <CTableDataCell>
                          <div className="fw-semibold">
                            {formatCurrency(product.price)}
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>
                          <div
                            className={`fw-semibold ${getStockColor(
                              product.currentStock,
                              product.minStock
                            )}`}
                          >
                            {product.currentStock || 0}
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>
                          <div className="fw-semibold">
                            {product.minStock || 0}
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>
                          {getStockBadge(
                            product.currentStock,
                            product.minStock
                          )}
                        </CTableDataCell>
                        <CTableDataCell>
                          <div className="d-flex align-items-center">
                            <CIcon
                              icon={cilPeople}
                              className="me-1"
                              size="sm"
                            />
                            <span>
                              {product.createdBy?.name ||
                                product.createdBy ||
                                "N/A"}
                            </span>
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>
                          <div className="d-flex align-items-center">
                            <CIcon
                              icon={cilPeople}
                              className="me-1"
                              size="sm"
                            />
                            <span>
                              {product.updatedBy?.name ||
                                product.updatedBy ||
                                "-"}
                            </span>
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>
                          <DateTimeDisplay
                            dateString={product.createdAt}
                            label="Dibuat"
                            icon={cilCalendarCheck}
                          />
                        </CTableDataCell>
                        <CTableDataCell>
                          <DateTimeDisplay
                            dateString={product.updatedAt}
                            label="Diupdate"
                            icon={cilHistory}
                          />
                        </CTableDataCell>
                      </CTableRow>
                    ))
                  )}
                </CTableBody>
              </CTable>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <CPagination>
                    <CPaginationItem
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                      style={{
                        cursor: currentPage === 1 ? "not-allowed" : "pointer",
                      }}
                    >
                      Previous
                    </CPaginationItem>

                    {[...Array(pagination.totalPages)].map((_, index) => {
                      const pageNumber = index + 1;
                      const isVisible =
                        pageNumber === 1 ||
                        pageNumber === pagination.totalPages ||
                        (pageNumber >= currentPage - 2 &&
                          pageNumber <= currentPage + 2);

                      if (!isVisible) {
                        if (
                          pageNumber === currentPage - 3 ||
                          pageNumber === currentPage + 3
                        ) {
                          return (
                            <CPaginationItem
                              key={`ellipsis-${pageNumber}`}
                              disabled
                            >
                              ...
                            </CPaginationItem>
                          );
                        }
                        return null;
                      }

                      return (
                        <CPaginationItem
                          key={pageNumber}
                          active={pageNumber === currentPage}
                          onClick={() => handlePageChange(pageNumber)}
                          style={{ cursor: "pointer" }}
                        >
                          {pageNumber}
                        </CPaginationItem>
                      );
                    })}

                    <CPaginationItem
                      disabled={currentPage === pagination.totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                      style={{
                        cursor:
                          currentPage === pagination.totalPages
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      Next
                    </CPaginationItem>
                  </CPagination>
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>
  );
};

export default ProductLog;
