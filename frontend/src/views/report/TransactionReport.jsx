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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalSales: 0,
    totalPurchases: 0,
    totalRevenue: 0,
  });

  const getToken = () => {
    try {
      return localStorage.getItem("userToken") || "";
    } catch (err) {
      console.error("Error accessing localStorage:", err);
      return "";
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      if (!token) {
        throw new Error("Token autentikasi tidak ditemukan");
      }

      const response = await fetch("http://localhost:5000/api/transactions", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Sesi telah berakhir. Silakan login kembali.");
        }
        throw new Error(`Error HTTP! status: ${response.status}`);
      }

      const data = await response.json();

      // Handle both array response and object with data property
      const transactionData = Array.isArray(data) ? data : data.data || [];

      setTransactions(transactionData);
      setFilteredTransactions(transactionData);
      calculateStats(transactionData);
    } catch (err) {
      console.error("Error saat mengambil data transaksi:", err);
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
    if (!date) return false;
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

    // Default sort by createdAt descending
    filtered.sort((a, b) => {
      const aDate = new Date(a.createdAt || 0);
      const bDate = new Date(b.createdAt || 0);
      return bDate - aDate;
    });

    setFilteredTransactions(filtered);
    calculateStats(filtered);
    setCurrentPage(1);
  }, [transactions, searchTerm, typeFilter, dateFilter, userFilter]);

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
          t.type === "penjualan" ? "Penjualan" : "Pembelian",
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
    a.download = `laporan-transaksi-${
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
              Beranda
            </CBreadcrumbItem>
            <CBreadcrumbItem active>
              <List size={14} className="me-1" />
              Laporan Transaksi
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
                <div>Total Transaksi</div>
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
                <div>Transaksi Penjualan</div>
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
                <div>Transaksi Pembelian</div>
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
                <div>Total Pendapatan</div>
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
                Laporan Transaksi
              </h5>
              <p className="text-medium-emphasis mb-0">
                Pantau dan analisis semua transaksi inventaris
              </p>
            </CCardHeader>
            <CCardBody>
              {/* Filters and Search */}
              <CRow className="mb-3">
                <CCol sm={12} md={3} className="mb-2 mb-md-0">
                  <CInputGroup>
                    <CFormInput
                      placeholder="Cari produk, pengguna, catatan..."
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
                    <option value="all">Semua Jenis</option>
                    <option value="penjualan">Penjualan</option>
                    <option value="pembelian">Pembelian</option>
                  </CFormSelect>
                </CCol>
                <CCol sm={6} md={2} className="mb-2 mb-md-0">
                  <CFormSelect
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  >
                    <option value="all">Semua Tanggal</option>
                    <option value="today">Hari Ini</option>
                    <option value="week">Minggu Ini</option>
                    <option value="month">Bulan Ini</option>
                  </CFormSelect>
                </CCol>
                <CCol sm={6} md={2} className="mb-2 mb-md-0">
                  <CFormSelect
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                  >
                    <option value="all">Semua Pengguna</option>
                    {uniqueUsers.map((user) => (
                      <option key={user} value={user}>
                        {user}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol
                  sm={6}
                  md={3}
                  className="mb-2 mb-md-0 d-flex justify-content-end gap-2"
                >
                  <CButton color="secondary" onClick={handleRefresh}>
                    <RefreshCw size={14} />
                  </CButton>
                  <CButton color="success" onClick={exportToCSV}>
                    <Download size={14} className="me-1" />
                    Ekspor
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
                        <CTableHeaderCell scope="col">
                          Tanggal & Waktu
                        </CTableHeaderCell>
                        <CTableHeaderCell scope="col">Produk</CTableHeaderCell>
                        <CTableHeaderCell scope="col">Jenis</CTableHeaderCell>
                        <CTableHeaderCell scope="col">Jumlah</CTableHeaderCell>
                        <CTableHeaderCell scope="col">Harga</CTableHeaderCell>
                        <CTableHeaderCell scope="col">Total</CTableHeaderCell>
                        <CTableHeaderCell scope="col">
                          Pengguna
                        </CTableHeaderCell>
                        <CTableHeaderCell scope="col">Catatan</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {currentItems.length > 0 ? (
                        currentItems.map((transaction, index) => (
                          <CTableRow key={transaction._id || index}>
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
                                  ? "Penjualan"
                                  : "Pembelian"}
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
                              Tidak ada transaksi ditemukan
                            </div>
                            <div className="text-medium-emphasis small">
                              Coba sesuaikan kriteria pencarian atau filter
                              Anda.
                            </div>
                          </CTableDataCell>
                        </CTableRow>
                      )}
                    </CTableBody>
                  </CTable>

                  {totalPages > 1 && (
                    <CPagination align="end" aria-label="Navigasi halaman">
                      <CPaginationItem
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                      >
                        Sebelumnya
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
                        Selanjutnya
                      </CPaginationItem>
                    </CPagination>
                  )}

                  <div className="text-medium-emphasis small">
                    Menampilkan{" "}
                    {filteredTransactions.length > 0 ? indexOfFirstItem + 1 : 0}{" "}
                    sampai{" "}
                    {Math.min(indexOfLastItem, filteredTransactions.length)}{" "}
                    dari {filteredTransactions.length} entri
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
