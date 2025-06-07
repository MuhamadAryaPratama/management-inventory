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
  Search,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Package,
  User,
  FileText,
  RefreshCw,
  AlertCircle,
  Home,
  List,
  Database,
  Info,
  ArrowUp,
  ArrowDown,
  Filter,
} from "lucide-react";

const TransactionReport = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalSales: 0,
    totalPurchases: 0,
    totalRevenue: 0,
  });

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if we're in a browser environment and get token
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("userToken")
          : null;

      const headers = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch("http://localhost:5000/api/transactions", {
        method: "GET",
        headers: headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please login again.");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Handle both array response and object with data property
      const transactionData = Array.isArray(data) ? data : data.data || [];
      setTransactions(transactionData);
      setFilteredTransactions(transactionData);
      calculateStats(transactionData);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError(err.message);
      setTransactions([]);
      setFilteredTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const calculateStats = (data) => {
    const stats = data.reduce(
      (acc, transaction) => {
        acc.totalTransactions++;
        if (transaction.type === "penjualan") {
          acc.totalSales++;
          acc.totalRevenue += transaction.total || 0;
        } else {
          acc.totalPurchases++;
        }
        return acc;
      },
      {
        totalTransactions: 0,
        totalSales: 0,
        totalPurchases: 0,
        totalRevenue: 0,
      }
    );

    setStats(stats);
  };

  const checkDateFilter = (date, filter) => {
    const transactionDate = new Date(date);
    const now = new Date();

    switch (filter) {
      case "today":
        return transactionDate.toDateString() === now.toDateString();
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return transactionDate >= weekAgo;
      case "month":
        const monthAgo = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          now.getDate()
        );
        return transactionDate >= monthAgo;
      default:
        return true;
    }
  };

  // Filter and search transactions
  useEffect(() => {
    let filtered = transactions.filter((transaction) => {
      const matchesSearch =
        (transaction.product?.name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (transaction.user?.name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (transaction.notes || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesType =
        typeFilter === "all" || transaction.type === typeFilter;

      const matchesUser =
        userFilter === "all" || transaction.user?.name === userFilter;

      const matchesDate =
        dateFilter === "all" ||
        checkDateFilter(transaction.createdAt, dateFilter);

      return matchesSearch && matchesType && matchesUser && matchesDate;
    });

    // Sort transactions
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "createdAt":
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
          break;
        case "product":
          aValue = (a.product?.name || "").toLowerCase();
          bValue = (b.product?.name || "").toLowerCase();
          break;
        case "type":
          aValue = a.type || "";
          bValue = b.type || "";
          break;
        case "total":
          aValue = a.total || 0;
          bValue = b.total || 0;
          break;
        case "user":
          aValue = (a.user?.name || "").toLowerCase();
          bValue = (b.user?.name || "").toLowerCase();
          break;
        default:
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredTransactions(filtered);
    calculateStats(filtered);
    setCurrentPage(1);
  }, [
    transactions,
    searchTerm,
    typeFilter,
    dateFilter,
    userFilter,
    sortBy,
    sortOrder,
  ]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const exportToCSV = () => {
    const headers = [
      "Tanggal",
      "Produk",
      "Jenis",
      "Jumlah",
      "Harga",
      "Total",
      "User",
      "Catatan",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredTransactions.map((t) =>
        [
          formatDate(t.createdAt),
          `"${t.product?.name || "N/A"}"`,
          t.type === "penjualan" ? "Sale" : "Purchase",
          t.quantity || 0,
          t.price || 0,
          t.total || 0,
          `"${t.user?.name || "N/A"}"`,
          `"${t.notes || ""}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transaction-report-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleRefresh = () => {
    fetchTransactions();
  };

  const uniqueUsers = [
    ...new Set(transactions.map((t) => t.user?.name).filter(Boolean)),
  ];

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTransactions.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

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
              Transaction Report
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
                <div className="fs-4 fw-semibold">
                  {stats.totalTransactions}
                </div>
                <div>Total Transactions</div>
              </div>
              <FileText size={24} />
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} lg={3}>
          <CCard className="text-white bg-success">
            <CCardBody className="pb-0 d-flex justify-content-between align-items-start">
              <div>
                <div className="fs-4 fw-semibold">{stats.totalSales}</div>
                <div>Sales Transactions</div>
              </div>
              <TrendingUp size={24} />
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} lg={3}>
          <CCard className="text-white bg-warning">
            <CCardBody className="pb-0 d-flex justify-content-between align-items-start">
              <div>
                <div className="fs-4 fw-semibold">{stats.totalPurchases}</div>
                <div>Purchase Transactions</div>
              </div>
              <TrendingDown size={24} />
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} lg={3}>
          <CCard className="text-white bg-info">
            <CCardBody className="pb-0 d-flex justify-content-between align-items-start">
              <div>
                <div className="fs-4 fw-semibold">
                  {formatCurrency(stats.totalRevenue)}
                </div>
                <div>Total Revenue</div>
              </div>
              <Package size={24} />
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
                Transaction Report
              </h5>
              <p className="text-medium-emphasis mb-0">
                Monitor and analyze all inventory transactions
              </p>
            </CCardHeader>
            <CCardBody>
              {/* Filters and Search */}
              <CRow className="mb-3">
                <CCol sm={12} md={3} className="mb-2 mb-md-0">
                  <CInputGroup>
                    <CFormInput
                      placeholder="Search products, users, notes..."
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
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <option value="all">All Types</option>
                    <option value="penjualan">Sales</option>
                    <option value="pembelian">Purchases</option>
                  </CFormSelect>
                </CCol>
                <CCol sm={6} md={2} className="mb-2 mb-md-0">
                  <CFormSelect
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </CFormSelect>
                </CCol>
                <CCol sm={6} md={2} className="mb-2 mb-md-0">
                  <CFormSelect
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                  >
                    <option value="all">All Users</option>
                    {uniqueUsers.map((user) => (
                      <option key={user} value={user}>
                        {user}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol sm={6} md={1} className="d-flex gap-2">
                  <CButton
                    color="success"
                    onClick={exportToCSV}
                    className="flex-fill"
                  >
                    <Download size={14} className="me-1" />
                    Export
                  </CButton>
                </CCol>
                <CCol sm={6} md={2} className="d-flex gap-2">
                  <CFormSelect
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="createdAt">Sort by Date</option>
                    <option value="product">Sort by Product</option>
                    <option value="type">Sort by Type</option>
                    <option value="total">Sort by Total</option>
                    <option value="user">Sort by User</option>
                  </CFormSelect>
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
                    <AlertCircle size={16} className="me-2" />
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
                        <CTableHeaderCell
                          scope="col"
                          style={{ cursor: "pointer" }}
                          onClick={() => {
                            setSortBy("createdAt");
                            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                          }}
                        >
                          <div className="d-flex align-items-center">
                            Date & Time
                            {sortBy === "createdAt" && (
                              <span className="ms-1">
                                {sortOrder === "asc" ? (
                                  <ArrowUp size={12} />
                                ) : (
                                  <ArrowDown size={12} />
                                )}
                              </span>
                            )}
                          </div>
                        </CTableHeaderCell>
                        <CTableHeaderCell
                          scope="col"
                          style={{ cursor: "pointer" }}
                          onClick={() => {
                            setSortBy("product");
                            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                          }}
                        >
                          <div className="d-flex align-items-center">
                            Product
                            {sortBy === "product" && (
                              <span className="ms-1">
                                {sortOrder === "asc" ? (
                                  <ArrowUp size={12} />
                                ) : (
                                  <ArrowDown size={12} />
                                )}
                              </span>
                            )}
                          </div>
                        </CTableHeaderCell>
                        <CTableHeaderCell
                          scope="col"
                          style={{ cursor: "pointer" }}
                          onClick={() => {
                            setSortBy("type");
                            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                          }}
                        >
                          <div className="d-flex align-items-center">
                            Type
                            {sortBy === "type" && (
                              <span className="ms-1">
                                {sortOrder === "asc" ? (
                                  <ArrowUp size={12} />
                                ) : (
                                  <ArrowDown size={12} />
                                )}
                              </span>
                            )}
                          </div>
                        </CTableHeaderCell>
                        <CTableHeaderCell scope="col">Qty</CTableHeaderCell>
                        <CTableHeaderCell scope="col">Price</CTableHeaderCell>
                        <CTableHeaderCell
                          scope="col"
                          style={{ cursor: "pointer" }}
                          onClick={() => {
                            setSortBy("total");
                            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                          }}
                        >
                          <div className="d-flex align-items-center">
                            Total
                            {sortBy === "total" && (
                              <span className="ms-1">
                                {sortOrder === "asc" ? (
                                  <ArrowUp size={12} />
                                ) : (
                                  <ArrowDown size={12} />
                                )}
                              </span>
                            )}
                          </div>
                        </CTableHeaderCell>
                        <CTableHeaderCell
                          scope="col"
                          style={{ cursor: "pointer" }}
                          onClick={() => {
                            setSortBy("user");
                            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                          }}
                        >
                          <div className="d-flex align-items-center">
                            User
                            {sortBy === "user" && (
                              <span className="ms-1">
                                {sortOrder === "asc" ? (
                                  <ArrowUp size={12} />
                                ) : (
                                  <ArrowDown size={12} />
                                )}
                              </span>
                            )}
                          </div>
                        </CTableHeaderCell>
                        <CTableHeaderCell scope="col">Notes</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {currentItems.length > 0 ? (
                        currentItems.map((transaction, index) => (
                          <CTableRow key={transaction._id || transaction.id}>
                            <CTableDataCell>
                              {indexOfFirstItem + index + 1}
                            </CTableDataCell>
                            <CTableDataCell>
                              <div className="small">
                                {formatDate(transaction.createdAt)}
                              </div>
                            </CTableDataCell>
                            <CTableDataCell>
                              <div className="fw-semibold">
                                {transaction.product?.name || "N/A"}
                              </div>
                            </CTableDataCell>
                            <CTableDataCell>
                              <CBadge
                                color={
                                  transaction.type === "penjualan"
                                    ? "success"
                                    : "warning"
                                }
                              >
                                {transaction.type === "penjualan"
                                  ? "Sale"
                                  : "Purchase"}
                              </CBadge>
                            </CTableDataCell>
                            <CTableDataCell>
                              {transaction.quantity || 0}
                            </CTableDataCell>
                            <CTableDataCell>
                              {formatCurrency(transaction.price)}
                            </CTableDataCell>
                            <CTableDataCell>
                              <div className="fw-semibold">
                                {formatCurrency(transaction.total)}
                              </div>
                            </CTableDataCell>
                            <CTableDataCell>
                              {transaction.user?.name || "N/A"}
                            </CTableDataCell>
                            <CTableDataCell>
                              <div
                                className="text-truncate"
                                style={{ maxWidth: "200px" }}
                              >
                                {transaction.notes || "-"}
                              </div>
                            </CTableDataCell>
                          </CTableRow>
                        ))
                      ) : (
                        <CTableRow>
                          <CTableDataCell
                            colSpan="9"
                            className="text-center py-4"
                          >
                            <FileText
                              size={48}
                              className="text-medium-emphasis mb-2"
                            />
                            <div className="fw-semibold">
                              No transactions found
                            </div>
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
                    {filteredTransactions.length > 0 ? indexOfFirstItem + 1 : 0}{" "}
                    to {Math.min(indexOfLastItem, filteredTransactions.length)}{" "}
                    of {filteredTransactions.length} entries
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

export default TransactionReport;
