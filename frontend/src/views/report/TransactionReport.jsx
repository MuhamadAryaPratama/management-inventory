import React, { useState, useEffect, useRef } from "react";
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
  TrendingUp,
  TrendingDown,
  Package,
  FileText,
  RefreshCw,
  AlertCircle,
  Calendar,
  BarChart3,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const TransactionReport = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalSales: 0,
    totalPurchases: 0,
    totalRevenue: 0,
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);
  const pdfRef = useRef();

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

      const response = await axios.get(
        "http://localhost:5000/api/transactions",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Handle both array response and object with data property
      const transactionData = Array.isArray(response.data)
        ? response.data
        : response.data.data || [];

      setTransactions(transactionData);
      setFilteredTransactions(transactionData);
      calculateStats(transactionData);
      calculateMonthlyData(transactionData);
      extractAvailableYears(transactionData);
    } catch (err) {
      console.error("Error saat mengambil data transaksi:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Gagal memuat data transaksi. Silakan coba lagi nanti."
      );
      setTransactions([]);
      setFilteredTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const extractAvailableYears = (data) => {
    const years = [
      ...new Set(
        data.map((transaction) => new Date(transaction.createdAt).getFullYear())
      ),
    ].sort((a, b) => b - a);
    setAvailableYears(years);
  };

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

  const calculateMonthlyData = (data) => {
    const monthlyStats = {};
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // Initialize all months for the selected year
    for (let i = 0; i < 12; i++) {
      const monthKey = `${yearFilter}-${String(i + 1).padStart(2, "0")}`;
      monthlyStats[monthKey] = {
        month: monthNames[i],
        year: yearFilter,
        totalTransactions: 0,
        sales: 0,
        purchases: 0,
        revenue: 0,
        purchaseValue: 0,
      };
    }

    // Filter data by selected year and calculate monthly stats
    data
      .filter(
        (transaction) =>
          new Date(transaction.createdAt).getFullYear() === yearFilter
      )
      .forEach((transaction) => {
        const date = new Date(transaction.createdAt);
        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

        if (monthlyStats[monthKey]) {
          monthlyStats[monthKey].totalTransactions++;

          if (transaction.type === "penjualan") {
            monthlyStats[monthKey].sales++;
            monthlyStats[monthKey].revenue += transaction.total || 0;
          } else {
            monthlyStats[monthKey].purchases++;
            monthlyStats[monthKey].purchaseValue += transaction.total || 0;
          }
        }
      });

    // Convert to array for chart
    const chartData = Object.values(monthlyStats).map((item) => ({
      ...item,
      name: item.month,
    }));

    setMonthlyData(chartData);
  };

  // Recalculate monthly data when year filter changes
  useEffect(() => {
    if (transactions.length > 0) {
      calculateMonthlyData(transactions);
    }
  }, [yearFilter, transactions]);

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

      return matchesSearch && matchesType && matchesUser;
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
  }, [transactions, searchTerm, typeFilter, userFilter]);

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

  const handleRefresh = () => {
    fetchTransactions();
  };

  const uniqueUsers = [
    ...new Set(transactions.map((t) => t.user?.name).filter(Boolean)),
  ];

  // Download PDF function
  const downloadPDF = () => {
    const input = pdfRef.current;
    setCurrentPage(1); // Set to first page to capture all data

    setTimeout(() => {
      html2canvas(input, {
        scale: 2,
        scrollY: -window.scrollY,
        useCORS: true,
      }).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save(`laporan_transaksi_${yearFilter}.pdf`);
      });
    }, 500);
  };

  // Export to CSV function
  const exportToCSV = () => {
    const headers = [
      "No",
      "Tanggal",
      "Produk",
      "Jenis",
      "Jumlah",
      "Harga Satuan",
      "Total",
      "Pengguna",
      "Catatan",
    ];

    const csvContent = [
      headers.join(","), // Header row
      ...filteredTransactions.map((transaction, index) => {
        return [
          index + 1,
          formatDate(transaction.createdAt),
          `"${(transaction.product?.name || "N/A").replace(/"/g, '""')}"`,
          transaction.type === "penjualan" ? "Penjualan" : "Pembelian",
          transaction.quantity || 0,
          formatCurrency(transaction.price).replace(/[^\d,-]/g, ""),
          formatCurrency(transaction.total).replace(/[^\d,-]/g, ""),
          `"${(transaction.user?.name || "N/A").replace(/"/g, '""')}"`,
          `"${(transaction.notes || "-").replace(/"/g, '""')}"`,
        ].join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `laporan_transaksi_${yearFilter}.csv`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow">
          <p className="font-semibold">{`Bulan: ${label} ${yearFilter}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

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
      <div ref={pdfRef}>
        <CRow>
          <CCol>
            <CBreadcrumb className="mb-3">
              <CBreadcrumbItem href="/dashboard">Beranda</CBreadcrumbItem>
              <CBreadcrumbItem>Laporan</CBreadcrumbItem>
              <CBreadcrumbItem active>Laporan Transaksi</CBreadcrumbItem>
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

        {/* Monthly Charts */}
        <CRow className="mb-4">
          <CCol xs={12}>
            <CCard>
              <CCardHeader className="d-flex justify-content-between align-items-center">
                <div>
                  <h5>
                    <BarChart3 size={20} className="me-2" />
                    Grafik Transaksi Bulanan
                  </h5>
                  <p className="text-medium-emphasis mb-0">
                    Analisis transaksi per bulan untuk tahun {yearFilter}
                  </p>
                </div>
                <CFormSelect
                  style={{ width: "120px" }}
                  value={yearFilter}
                  onChange={(e) => setYearFilter(parseInt(e.target.value))}
                >
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </CFormSelect>
              </CCardHeader>
              <CCardBody>
                <CRow>
                  <CCol lg={6}>
                    <h6>Jumlah Transaksi per Bulan</h6>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="totalTransactions"
                          stroke="#0d6efd"
                          strokeWidth={2}
                          name="Total Transaksi"
                        />
                        <Line
                          type="monotone"
                          dataKey="sales"
                          stroke="#198754"
                          strokeWidth={2}
                          name="Penjualan"
                        />
                        <Line
                          type="monotone"
                          dataKey="purchases"
                          stroke="#fd7e14"
                          strokeWidth={2}
                          name="Pembelian"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CCol>
                  <CCol lg={6}>
                    <h6>Nilai Transaksi per Bulan</h6>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis
                          tickFormatter={(value) =>
                            `${(value / 1000000).toFixed(1)}M`
                          }
                        />
                        <Tooltip
                          formatter={(value) => [formatCurrency(value), ""]}
                          labelFormatter={(label) =>
                            `Bulan: ${label} ${yearFilter}`
                          }
                        />
                        <Legend />
                        <Bar
                          dataKey="revenue"
                          fill="#198754"
                          name="Pendapatan Penjualan"
                        />
                        <Bar
                          dataKey="purchaseValue"
                          fill="#fd7e14"
                          name="Nilai Pembelian"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>

        {/* Monthly Summary Table */}
        <CRow className="mb-4">
          <CCol xs={12}>
            <CCard>
              <CCardHeader>
                <h5>
                  <Calendar size={20} className="me-2" />
                  Ringkasan Bulanan {yearFilter}
                </h5>
              </CCardHeader>
              <CCardBody>
                <CTable hover responsive>
                  <CTableHead color="light">
                    <CTableRow>
                      <CTableHeaderCell>Bulan</CTableHeaderCell>
                      <CTableHeaderCell>Total Transaksi</CTableHeaderCell>
                      <CTableHeaderCell>Penjualan</CTableHeaderCell>
                      <CTableHeaderCell>Pembelian</CTableHeaderCell>
                      <CTableHeaderCell>Pendapatan</CTableHeaderCell>
                      <CTableHeaderCell>Nilai Pembelian</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {monthlyData.map((month, index) => (
                      <CTableRow key={index}>
                        <CTableDataCell className="fw-semibold">
                          {month.month} {month.year}
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color="primary">
                            {month.totalTransactions}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color="success">{month.sales}</CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color="warning">{month.purchases}</CBadge>
                        </CTableDataCell>
                        <CTableDataCell className="fw-semibold">
                          {formatCurrency(month.revenue)}
                        </CTableDataCell>
                        <CTableDataCell className="fw-semibold">
                          {formatCurrency(month.purchaseValue)}
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>

        <CRow>
          <CCol xs={12}>
            <CCard className="mb-4">
              <CCardHeader>
                <h5>
                  <FileText size={20} className="me-2" />
                  Detail Transaksi
                </h5>
                <p className="text-medium-emphasis mb-0">
                  Pantau dan analisis semua transaksi inventaris
                </p>
              </CCardHeader>
              <CCardBody>
                {/* Filters and Search */}
                <CRow className="mb-3">
                  <CCol sm={12} md={4} className="mb-2 mb-md-0">
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
                  <CCol sm={6} md={3} className="mb-2 mb-md-0">
                    <CFormSelect
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                    >
                      <option value="all">Semua Jenis</option>
                      <option value="penjualan">Penjualan</option>
                      <option value="pembelian">Pembelian</option>
                    </CFormSelect>
                  </CCol>
                  <CCol sm={6} md={3} className="mb-2 mb-md-0">
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
                  <CCol sm={12} md={2} className="d-flex gap-2">
                    <CButton
                      color="info"
                      onClick={exportToCSV}
                      className="flex-fill"
                    >
                      <FileText size={14} className="me-1" />
                      CSV
                    </CButton>
                    <CButton
                      color="success"
                      onClick={downloadPDF}
                      className="flex-fill"
                    >
                      <Download size={14} className="me-1" />
                      PDF
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
                          <CTableHeaderCell scope="col">
                            Produk
                          </CTableHeaderCell>
                          <CTableHeaderCell scope="col">Jenis</CTableHeaderCell>
                          <CTableHeaderCell scope="col">
                            Jumlah
                          </CTableHeaderCell>
                          <CTableHeaderCell scope="col">Harga</CTableHeaderCell>
                          <CTableHeaderCell scope="col">Total</CTableHeaderCell>
                          <CTableHeaderCell scope="col">
                            Pengguna
                          </CTableHeaderCell>
                          <CTableHeaderCell scope="col">
                            Catatan
                          </CTableHeaderCell>
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

                        {Array.from(
                          { length: totalPages },
                          (_, i) => i + 1
                        ).map((page) => (
                          <CPaginationItem
                            key={page}
                            active={page === currentPage}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </CPaginationItem>
                        ))}

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
                      {filteredTransactions.length > 0
                        ? indexOfFirstItem + 1
                        : 0}{" "}
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
      </div>
    </>
  );
};

export default TransactionReport;
