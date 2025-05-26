import React, { useState, useEffect } from "react";
import {
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CButton,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CBadge,
  CAlert,
  CSpinner,
  CPagination,
  CPaginationItem,
  CInputGroup,
  CInputGroupText,
  CFormInput,
  CFormSelect,
  CNav,
  CNavItem,
  CNavLink,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import {
  cilSearch,
  cilReload,
  cilHistory,
  cilCalendar,
  cilArrowCircleBottom,
  cilArrowCircleTop,
} from "@coreui/icons";
import axios from "axios";
import Swal from "sweetalert2";

const History = () => {
  // State management
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    color: "success",
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchTransactions();
  }, []);

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem("userToken") || localStorage.getItem("token");
  };

  // Create axios instance with default config
  const createAxiosInstance = () => {
    const token = getAuthToken();
    return axios.create({
      baseURL: "http://localhost:5000/api",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      timeout: 15000,
    });
  };

  // Fetch all transactions with enhanced stock data
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login kembali.");
      }

      const api = createAxiosInstance();
      const response = await api.get("/transactions");

      if (response.data && response.status === 200) {
        const transactionData = response.data.data || [];

        // Enhance transactions with calculated stock values
        const enhancedTransactions = transactionData.map((transaction) => {
          // Calculate initial and final stock if not provided by backend
          let initialStock = transaction.initialStock;
          let finalStock = transaction.finalStock;

          if (transaction.type === "pembelian") {
            // For incoming goods, final = initial + quantity
            if (!initialStock && initialStock !== 0) {
              initialStock =
                (transaction.product?.currentStock ||
                  transaction.product?.stock ||
                  0) - transaction.quantity;
            }
            if (!finalStock && finalStock !== 0) {
              finalStock = initialStock + transaction.quantity;
            }
          } else if (transaction.type === "penjualan") {
            // For outgoing goods, initial = final + quantity
            if (!finalStock && finalStock !== 0) {
              finalStock =
                transaction.product?.currentStock ||
                transaction.product?.stock ||
                0;
            }
            if (!initialStock && initialStock !== 0) {
              initialStock = finalStock + transaction.quantity;
            }
          }

          return {
            ...transaction,
            initialStock,
            finalStock,
          };
        });

        setTransactions(
          Array.isArray(enhancedTransactions) ? enhancedTransactions : []
        );
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      handleApiError(error, "Gagal mengambil data transaksi");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle API errors
  const handleApiError = (error, defaultMessage) => {
    // ... (keep existing error handling code)
  };

  // Filter transactions based on active tab and filters
  const getFilteredTransactions = () => {
    let filtered = transactions;

    if (activeTab === "incoming") {
      filtered = filtered.filter((t) => t.type === "pembelian");
    } else if (activeTab === "outgoing") {
      filtered = filtered.filter((t) => t.type === "penjualan");
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (dateFilter) {
      filtered = filtered.filter(
        (t) =>
          new Date(t.createdAt).toDateString() ===
          new Date(dateFilter).toDateString()
      );
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((t) => t.type === typeFilter);
    }

    return filtered;
  };

  const filteredTransactions = getFilteredTransactions();

  // Pagination
  const indexOfLastTransaction = currentPage * itemsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - itemsPerPage;
  const currentTransactions = filteredTransactions.slice(
    indexOfFirstTransaction,
    indexOfLastTransaction
  );
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  // Format date
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  // Get transaction type display
  const getTransactionTypeDisplay = (type) => {
    switch (type) {
      case "pembelian":
        return {
          label: "Barang Masuk",
          color: "success",
          icon: cilArrowCircleBottom,
        };
      case "penjualan":
        return {
          label: "Barang Keluar",
          color: "danger",
          icon: cilArrowCircleTop,
        };
      default:
        return { label: type || "N/A", color: "secondary", icon: cilHistory };
    }
  };

  // Get transaction statistics
  const getStatistics = () => {
    const incoming = transactions.filter((t) => t.type === "pembelian");
    const outgoing = transactions.filter((t) => t.type === "penjualan");

    return {
      total: transactions.length,
      incoming: incoming.length,
      outgoing: outgoing.length,
      incomingQty: incoming.reduce((sum, t) => sum + (t.quantity || 0), 0),
      outgoingQty: outgoing.reduce((sum, t) => sum + (t.quantity || 0), 0),
    };
  };

  const stats = getStatistics();

  return (
    <>
      {alert.show && (
        <CAlert
          color={alert.color}
          dismissible
          onClose={() =>
            setAlert({ show: false, message: "", color: "success" })
          }
        >
          {alert.message}
        </CAlert>
      )}

      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-0">
                    <CIcon icon={cilHistory} className="me-2" />
                    Riwayat Transaksi
                  </h4>
                  <small className="text-muted">
                    Riwayat semua transaksi barang masuk dan keluar
                  </small>
                </div>
                <CButton
                  color="secondary"
                  variant="outline"
                  onClick={fetchTransactions}
                  disabled={loading}
                  title="Refresh Data"
                >
                  <CIcon
                    icon={cilReload}
                    className={loading ? "fa-spin" : ""}
                  />
                  {loading ? " Loading..." : " Refresh"}
                </CButton>
              </div>
            </CCardHeader>
            <CCardBody>
              {/* Statistics Cards */}
              <CRow className="mb-4">
                <CCol md={3}>
                  <CCard className="text-center border-primary">
                    <CCardBody>
                      <h4 className="text-primary">{stats.total}</h4>
                      <small className="text-muted">Total Transaksi</small>
                    </CCardBody>
                  </CCard>
                </CCol>
                <CCol md={3}>
                  <CCard className="text-center border-success">
                    <CCardBody>
                      <h4 className="text-success">{stats.incoming}</h4>
                      <small className="text-muted">Barang Masuk</small>
                      <div className="small text-success">
                        +{stats.incomingQty} unit
                      </div>
                    </CCardBody>
                  </CCard>
                </CCol>
                <CCol md={3}>
                  <CCard className="text-center border-danger">
                    <CCardBody>
                      <h4 className="text-danger">{stats.outgoing}</h4>
                      <small className="text-muted">Barang Keluar</small>
                      <div className="small text-danger">
                        -{stats.outgoingQty} unit
                      </div>
                    </CCardBody>
                  </CCard>
                </CCol>
                <CCol md={3}>
                  <CCard className="text-center border-info">
                    <CCardBody>
                      <h4 className="text-info">
                        {stats.incomingQty - stats.outgoingQty}
                      </h4>
                      <small className="text-muted">Net Movement</small>
                    </CCardBody>
                  </CCard>
                </CCol>
              </CRow>

              {/* Tabs */}
              <CNav variant="tabs" className="mb-3">
                <CNavItem>
                  <CNavLink
                    active={activeTab === "all"}
                    onClick={() => setActiveTab("all")}
                    style={{ cursor: "pointer" }}
                  >
                    Semua Transaksi ({stats.total})
                  </CNavLink>
                </CNavItem>
                <CNavItem>
                  <CNavLink
                    active={activeTab === "incoming"}
                    onClick={() => setActiveTab("incoming")}
                    style={{ cursor: "pointer" }}
                  >
                    <CIcon icon={cilArrowCircleBottom} className="me-1" />
                    Barang Masuk ({stats.incoming})
                  </CNavLink>
                </CNavItem>
                <CNavItem>
                  <CNavLink
                    active={activeTab === "outgoing"}
                    onClick={() => setActiveTab("outgoing")}
                    style={{ cursor: "pointer" }}
                  >
                    <CIcon icon={cilArrowCircleTop} className="me-1" />
                    Barang Keluar ({stats.outgoing})
                  </CNavLink>
                </CNavItem>
              </CNav>

              {/* Filters */}
              <CRow className="mb-3">
                <CCol md={4}>
                  <CInputGroup>
                    <CInputGroupText>
                      <CIcon icon={cilSearch} />
                    </CInputGroupText>
                    <CFormInput
                      placeholder="Cari produk atau catatan..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </CInputGroup>
                </CCol>
                <CCol md={3}>
                  <CInputGroup>
                    <CInputGroupText>
                      <CIcon icon={cilCalendar} />
                    </CInputGroupText>
                    <CFormInput
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                    />
                    {dateFilter && (
                      <CButton
                        color="secondary"
                        variant="outline"
                        onClick={() => setDateFilter("")}
                      >
                        Clear
                      </CButton>
                    )}
                  </CInputGroup>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <option value="all">Semua Jenis</option>
                    <option value="pembelian">Barang Masuk</option>
                    <option value="penjualan">Barang Keluar</option>
                  </CFormSelect>
                </CCol>
                <CCol md={2} className="d-flex justify-content-end">
                  <CButton
                    color="secondary"
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setDateFilter("");
                      setTypeFilter("all");
                      setActiveTab("all");
                    }}
                  >
                    Reset Filter
                  </CButton>
                </CCol>
              </CRow>

              {/* Transaction Table */}
              {loading ? (
                <div className="text-center my-5">
                  <CSpinner />
                  <p>Memuat data transaksi...</p>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center my-5">
                  <p>Tidak ada data transaksi yang ditemukan</p>
                  <CButton
                    color="primary"
                    variant="outline"
                    onClick={fetchTransactions}
                  >
                    Coba Lagi
                  </CButton>
                </div>
              ) : (
                <>
                  <CTable striped hover responsive>
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>Tanggal</CTableHeaderCell>
                        <CTableHeaderCell>Produk</CTableHeaderCell>
                        <CTableHeaderCell>Jenis</CTableHeaderCell>
                        <CTableHeaderCell className="text-end">
                          Jumlah
                        </CTableHeaderCell>
                        <CTableHeaderCell className="text-end">
                          Stok Awal
                        </CTableHeaderCell>
                        <CTableHeaderCell className="text-end">
                          Stok Akhir
                        </CTableHeaderCell>
                        <CTableHeaderCell>Catatan</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {currentTransactions.map((transaction) => {
                        const typeDisplay = getTransactionTypeDisplay(
                          transaction.type
                        );
                        return (
                          <CTableRow key={transaction._id}>
                            <CTableDataCell>
                              {formatDate(transaction.createdAt)}
                            </CTableDataCell>
                            <CTableDataCell>
                              {transaction.product?.name || "N/A"}
                              <div className="small text-muted">
                                {transaction.product?.code || "N/A"}
                              </div>
                            </CTableDataCell>
                            <CTableDataCell>
                              <CBadge color={typeDisplay.color}>
                                <CIcon
                                  icon={typeDisplay.icon}
                                  className="me-1"
                                />
                                {typeDisplay.label}
                              </CBadge>
                            </CTableDataCell>
                            <CTableDataCell className="text-end">
                              {transaction.type === "pembelian" ? (
                                <span className="text-success">
                                  +{transaction.quantity}
                                </span>
                              ) : (
                                <span className="text-danger">
                                  -{transaction.quantity}
                                </span>
                              )}
                            </CTableDataCell>
                            <CTableDataCell className="text-end">
                              {transaction.initialStock ?? "N/A"}
                            </CTableDataCell>
                            <CTableDataCell className="text-end">
                              {transaction.finalStock ?? "N/A"}
                            </CTableDataCell>
                            <CTableDataCell>
                              {transaction.notes || "-"}
                            </CTableDataCell>
                          </CTableRow>
                        );
                      })}
                    </CTableBody>
                  </CTable>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <CPagination className="justify-content-center mt-3">
                      <CPaginationItem
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(1)}
                      >
                        First
                      </CPaginationItem>
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
                      <CPaginationItem
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(totalPages)}
                      >
                        Last
                      </CPaginationItem>
                    </CPagination>
                  )}
                </>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  );
};

export default History;
