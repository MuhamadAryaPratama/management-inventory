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
  cilCog,
  cilPeople,
  cilCalendarCheck,
  cilReload,
  cilX,
  cilClock,
  cilHistory,
  cilArrowTop,
  cilArrowBottom,
} from "@coreui/icons";

const TransactionLog = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [typeFilter, setTypeFilter] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });

  const getAuthToken = () => {
    // Try localStorage first, then cookies
    let token =
      localStorage.getItem("token") || localStorage.getItem("userToken");

    if (!token) {
      const cookies = document.cookie.split("; ");
      const tokenCookie = cookies.find((row) => row.startsWith("token="));
      token = tokenCookie ? tokenCookie.split("=")[1] : null;
    }

    if (!token) {
      throw new Error("No authentication token found. Please login again.");
    }

    return token;
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getAuthToken();

      // Build query parameters
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      if (searchTerm.trim()) queryParams.append("search", searchTerm.trim());
      if (typeFilter) queryParams.append("type", typeFilter);

      const response = await fetch(
        `http://localhost:5000/api/transactions?${queryParams}`,
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
          localStorage.removeItem("token");
          localStorage.removeItem("userToken");
          throw new Error("Session expired. Please login again.");
        } else if (response.status === 403) {
          throw new Error("You don't have permission to view this data.");
        } else if (response.status === 404) {
          throw new Error("Endpoint not found. Check server configuration.");
        } else if (response.status >= 500) {
          throw new Error("Server error. Please try again later.");
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Handle response data
      let transactionData = [];
      let paginationData = {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
      };

      if (data && typeof data === "object") {
        if (data.success !== undefined) {
          if (data.success) {
            transactionData = Array.isArray(data.data) ? data.data : [];
            paginationData = data.pagination || {
              currentPage: currentPage,
              totalPages: Math.ceil(transactionData.length / itemsPerPage),
              totalItems: transactionData.length,
            };
          } else {
            throw new Error(data.message || "Failed to fetch transaction data");
          }
        } else if (Array.isArray(data)) {
          transactionData = data;
          paginationData = {
            currentPage: currentPage,
            totalPages: Math.ceil(transactionData.length / itemsPerPage),
            totalItems: transactionData.length,
          };
        } else if (data.data && Array.isArray(data.data)) {
          transactionData = data.data;
          paginationData = data.pagination || {
            currentPage: currentPage,
            totalPages: Math.ceil(transactionData.length / itemsPerPage),
            totalItems: transactionData.length,
          };
        } else if (data.transactions && Array.isArray(data.transactions)) {
          transactionData = data.transactions;
          paginationData = data.pagination || {
            currentPage: currentPage,
            totalPages: Math.ceil(transactionData.length / itemsPerPage),
            totalItems: transactionData.length,
          };
        } else if (Object.keys(data).length === 0) {
          transactionData = [];
          paginationData = {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
          };
        } else {
          console.warn("Unexpected response format:", data);
          throw new Error("Unexpected response format");
        }
      } else {
        throw new Error("Invalid response data");
      }

      setTransactions(transactionData);
      setPagination(paginationData);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError(err.message || "Failed to fetch transaction data");
      setTransactions([]);
      setPagination({ currentPage: 1, totalPages: 1, totalItems: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, itemsPerPage]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== "" || typeFilter) {
        handleSearch();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, typeFilter]);

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
        return `${diffInSeconds} seconds ago`;
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} minutes ago`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hours ago`;
      } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} days ago`;
      } else if (diffInSeconds < 2592000) {
        const weeks = Math.floor(diffInSeconds / 604800);
        return `${weeks} weeks ago`;
      } else if (diffInSeconds < 31536000) {
        const months = Math.floor(diffInSeconds / 2592000);
        return `${months} months ago`;
      } else {
        const years = Math.floor(diffInSeconds / 31536000);
        return `${years} years ago`;
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

  const getTransactionTypeBadge = (type) => {
    return type === "pembelian" ? (
      <CBadge color="success">Stock In</CBadge>
    ) : (
      <CBadge color="danger">Stock Out</CBadge>
    );
  };

  const getStockChangeIcon = (change) => {
    return change > 0 ? (
      <CIcon icon={cilArrowTop} className="text-success" />
    ) : (
      <CIcon icon={cilArrowBottom} className="text-danger" />
    );
  };

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= pagination.totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    fetchTransactions();
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchTransactions();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("");
    setCurrentPage(1);
    setTimeout(() => fetchTransactions(), 100);
  };

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
              <strong>Date:</strong> {formatDateOnly(dateString)}
            </div>
            <div>
              <strong>Time:</strong> {formatTimeOnly(dateString)}
            </div>
            <div>
              <strong>Relative:</strong> {getRelativeTime(dateString)}
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
          <div className="mt-3">Loading transaction data...</div>
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
                    Transaction Log
                  </h4>
                  <small className="text-medium-emphasis">
                    Detailed history of all stock transactions
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
                      Try Again
                    </CButton>
                  </div>
                </CAlert>
              )}

              {/* Filters */}
              <CRow className="mb-4">
                <CCol md={4}>
                  <CInputGroup>
                    <CInputGroupText>
                      <CIcon icon={cilSearch} />
                    </CInputGroupText>
                    <CFormInput
                      placeholder="Search product or notes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    />
                  </CInputGroup>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={typeFilter}
                    onChange={(e) => {
                      setTypeFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="">All Types</option>
                    <option value="pembelian">Stock In</option>
                    <option value="penjualan">Stock Out</option>
                  </CFormSelect>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                  </CFormSelect>
                </CCol>
                <CCol md={2}>
                  <CButton
                    color="primary"
                    onClick={handleSearch}
                    disabled={loading}
                  >
                    Search
                  </CButton>
                </CCol>
              </CRow>

              {/* Results Info */}
              {pagination.totalItems > 0 && (
                <div className="mb-3">
                  <small className="text-medium-emphasis">
                    Showing page {pagination.currentPage || currentPage} of{" "}
                    {pagination.totalPages} ({pagination.totalItems} total
                    transactions)
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
                    <CTableHeaderCell scope="col">Product</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Type</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Quantity</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Price</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Total</CTableHeaderCell>
                    <CTableHeaderCell scope="col">
                      Stock Change
                    </CTableHeaderCell>
                    <CTableHeaderCell scope="col">
                      Previous Stock
                    </CTableHeaderCell>
                    <CTableHeaderCell scope="col">New Stock</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Notes</CTableHeaderCell>
                    <CTableHeaderCell scope="col">User</CTableHeaderCell>
                    <CTableHeaderCell scope="col" style={{ minWidth: "180px" }}>
                      <CIcon icon={cilCalendarCheck} className="me-1" />
                      Transaction Time
                    </CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {transactions.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan="12" className="text-center py-5">
                        <div className="text-medium-emphasis">
                          <CIcon
                            icon={cilCog}
                            size="3xl"
                            className="mb-3 opacity-50"
                          />
                          <div className="fs-5 mb-2">
                            No transaction data found
                          </div>
                          {(searchTerm || typeFilter) && (
                            <div>
                              <p className="mb-2">
                                Try adjusting your search filters
                              </p>
                              <CButton
                                color="primary"
                                variant="outline"
                                onClick={clearFilters}
                                size="sm"
                              >
                                Clear all filters
                              </CButton>
                            </div>
                          )}
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    transactions.map((transaction, index) => (
                      <CTableRow
                        key={transaction._id || transaction.id || index}
                      >
                        <CTableDataCell>
                          {((pagination.currentPage || currentPage) - 1) *
                            itemsPerPage +
                            index +
                            1}
                        </CTableDataCell>
                        <CTableDataCell>
                          <div className="fw-semibold">
                            {transaction.product?.name || "N/A"}
                          </div>
                          {transaction.product?.description && (
                            <small className="text-medium-emphasis">
                              {transaction.product.description}
                            </small>
                          )}
                        </CTableDataCell>
                        <CTableDataCell>
                          {getTransactionTypeBadge(transaction.type)}
                        </CTableDataCell>
                        <CTableDataCell>
                          <div className="fw-semibold">
                            {transaction.quantity || 0}
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>
                          <div className="fw-semibold">
                            {formatCurrency(transaction.price)}
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>
                          <div className="fw-semibold">
                            {formatCurrency(transaction.total)}
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>
                          <div className="d-flex align-items-center">
                            {getStockChangeIcon(transaction.stockChange)}
                            <span className="ms-1 fw-semibold">
                              {transaction.stockChange > 0 ? "+" : ""}
                              {transaction.stockChange}
                            </span>
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>
                          <div className="fw-semibold">
                            {transaction.previousStock || 0}
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>
                          <div className="fw-semibold">
                            {transaction.newStock || 0}
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>
                          <small className="text-medium-emphasis">
                            {transaction.notes || "-"}
                          </small>
                        </CTableDataCell>
                        <CTableDataCell>
                          <div className="d-flex align-items-center">
                            <CIcon
                              icon={cilPeople}
                              className="me-1"
                              size="sm"
                            />
                            <span>
                              {transaction.user?.name ||
                                transaction.createdBy?.name ||
                                "N/A"}
                            </span>
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>
                          <DateTimeDisplay
                            dateString={transaction.createdAt}
                            label="Transaction"
                            icon={cilCalendarCheck}
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

export default TransactionLog;
