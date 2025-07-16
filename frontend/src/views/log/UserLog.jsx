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
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilSearch, cilCalendar, cilUser, cilClock } from "@coreui/icons";

const UserLog = () => {
  const [allLogs, setAllLogs] = useState([]);
  const [displayedLogs, setDisplayedLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage, setLogsPerPage] = useState(10);
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second for live duration calculation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch all logs from backend
  const fetchUserLogs = async () => {
    try {
      setLoading(true);
      setError("");

      // Get token from localStorage or cookie
      const token =
        localStorage.getItem("userToken") ||
        document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1];

      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login kembali.");
      }

      const response = await fetch(`http://localhost:5000/api/logs`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Tidak memiliki akses. Silakan login sebagai admin.");
        } else if (response.status === 403) {
          throw new Error(
            "Akses ditolak. Hanya admin yang dapat melihat log pengguna."
          );
        }
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        setAllLogs(data.data);
        setFilteredLogs(data.data);
      } else {
        throw new Error("Format data tidak valid");
      }
    } catch (err) {
      console.error("Error fetching user logs:", err);
      setError(err.message || "Gagal mengambil data log pengguna");
    } finally {
      setLoading(false);
    }
  };

  // Apply filters to logs
  const applyFilters = () => {
    let filtered = [...allLogs];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply date filter
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter((log) => {
        const loginDate = new Date(log.loginTime);
        return loginDate.toDateString() === filterDate.toDateString();
      });
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter((log) => log.status === statusFilter);
    }

    setFilteredLogs(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Apply pagination to filtered logs
  const applyPagination = () => {
    const startIndex = (currentPage - 1) * logsPerPage;
    const endIndex = startIndex + logsPerPage;
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);
    setDisplayedLogs(paginatedLogs);
  };

  // Calculate pagination info
  const getPaginationInfo = () => {
    const totalItems = filteredLogs.length;
    const totalPages = Math.ceil(totalItems / logsPerPage);

    return {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage: logsPerPage,
      startItem: totalItems > 0 ? (currentPage - 1) * logsPerPage + 1 : 0,
      endItem: Math.min(currentPage * logsPerPage, totalItems),
    };
  };

  // Initial fetch
  useEffect(() => {
    fetchUserLogs();
  }, []);

  // Apply filters when dependencies change
  useEffect(() => {
    applyFilters();
  }, [allLogs, searchTerm, dateFilter, statusFilter]);

  // Apply pagination when filtered logs or pagination settings change
  useEffect(() => {
    applyPagination();
  }, [filteredLogs, currentPage, logsPerPage]);

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleString("id-ID", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "-";
    }
  };

  const formatDuration = (milliseconds) => {
    // Handle null, undefined, or invalid values
    if (!milliseconds || isNaN(milliseconds) || milliseconds <= 0) {
      return "-";
    }

    try {
      // Ensure we're working with a number
      const ms = Number(milliseconds);

      if (isNaN(ms) || ms <= 0) {
        return "-";
      }

      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) {
        return `${days}d ${hours % 24}h ${minutes % 60}m`;
      } else if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
      } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
      } else {
        return `${seconds}s`;
      }
    } catch (error) {
      console.error("Error formatting duration:", error);
      return "-";
    }
  };

  // Enhanced duration calculation that works for both active and logged out sessions
  const calculateDuration = (log) => {
    try {
      // First check if duration is already provided by the model and it's valid
      if (log.duration && !isNaN(log.duration) && log.duration > 0) {
        return log.duration;
      }

      // If no valid duration provided, calculate it based on login/logout times
      if (log.loginTime) {
        const loginDate = new Date(log.loginTime);

        if (isNaN(loginDate.getTime())) {
          return null;
        }

        let endTime;

        // For active sessions, use current time
        if (log.status === "active" || !log.logoutTime) {
          endTime = currentTime;
        } else {
          // For logged out sessions, use logout time
          endTime = new Date(log.logoutTime);

          if (isNaN(endTime.getTime())) {
            return null;
          }
        }

        const duration = endTime.getTime() - loginDate.getTime();
        return duration > 0 ? duration : null;
      }

      return null;
    } catch (error) {
      console.error("Error calculating duration:", error);
      return null;
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: "success", text: "Aktif" },
      logout: { color: "secondary", text: "Logout" },
    };

    const config = statusConfig[status] || {
      color: "secondary",
      text: status || "Unknown",
    };
    return <CBadge color={config.color}>{config.text}</CBadge>;
  };

  const getDurationBadgeColor = (status) => {
    return status === "active" ? "warning" : "secondary";
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleRefresh = () => {
    fetchUserLogs();
  };

  const handleSearch = () => {
    applyFilters();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDateFilter("");
    setStatusFilter("");
    setCurrentPage(1);
  };

  const handleLogsPerPageChange = (newLogsPerPage) => {
    setLogsPerPage(Number(newLogsPerPage));
    setCurrentPage(1);
  };

  const paginationInfo = getPaginationInfo();

  if (loading) {
    return (
      <CContainer>
        <div className="text-center py-5">
          <CSpinner color="primary" />
          <div className="mt-2">Loading user logs...</div>
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
                    <CIcon icon={cilUser} className="me-2" />
                    Log Pengguna
                  </h4>
                  <small className="text-medium-emphasis">
                    Riwayat aktivitas login pengguna sistem
                  </small>
                </div>
                <div className="d-flex gap-2">
                  <CButton
                    color="secondary"
                    variant="outline"
                    onClick={clearFilters}
                    size="sm"
                  >
                    Clear Filter
                  </CButton>
                  <CButton
                    color="primary"
                    onClick={handleRefresh}
                    disabled={loading}
                  >
                    <CIcon icon={cilClock} className="me-2" />
                    Refresh
                  </CButton>
                </div>
              </div>
            </CCardHeader>
            <CCardBody>
              {error && (
                <CAlert color="danger" className="mb-4">
                  <strong>Error:</strong> {error}
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
                      placeholder="Cari nama atau email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
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
                  </CInputGroup>
                </CCol>
                <CCol md={2}>
                  <CFormSelect
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">Semua Status</option>
                    <option value="active">Aktif</option>
                    <option value="logout">Logout</option>
                  </CFormSelect>
                </CCol>
                <CCol md={2}>
                  <CFormSelect
                    value={logsPerPage}
                    onChange={(e) => handleLogsPerPageChange(e.target.value)}
                  >
                    <option value={10}>10 per halaman</option>
                    <option value={25}>25 per halaman</option>
                    <option value={50}>50 per halaman</option>
                    <option value={100}>100 per halaman</option>
                  </CFormSelect>
                </CCol>
                <CCol md={1}>
                  <CButton color="primary" onClick={handleSearch}>
                    Cari
                  </CButton>
                </CCol>
              </CRow>

              {/* Results Info */}
              <div className="mb-3">
                <small className="text-medium-emphasis">
                  Menampilkan {paginationInfo.startItem} -{" "}
                  {paginationInfo.endItem} dari {paginationInfo.totalItems}{" "}
                  total log
                  {paginationInfo.totalItems > 0 && (
                    <span>
                      {" "}
                      | Halaman {paginationInfo.currentPage} dari{" "}
                      {paginationInfo.totalPages}
                    </span>
                  )}
                </small>
              </div>

              {/* Table */}
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell scope="col">No</CTableHeaderCell>
                    <CTableHeaderCell scope="col">
                      Nama Pengguna
                    </CTableHeaderCell>
                    <CTableHeaderCell scope="col">Email</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Waktu Login</CTableHeaderCell>
                    <CTableHeaderCell scope="col">
                      Waktu Logout
                    </CTableHeaderCell>
                    <CTableHeaderCell scope="col">Durasi Sesi</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Status</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Dibuat</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {displayedLogs.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan="8" className="text-center py-4">
                        <div className="text-medium-emphasis">
                          <CIcon
                            icon={cilUser}
                            size="3xl"
                            className="mb-3 opacity-50"
                          />
                          <div>
                            {filteredLogs.length === 0 && allLogs.length > 0
                              ? "Tidak ada log yang sesuai dengan filter"
                              : "Tidak ada log pengguna yang ditemukan"}
                          </div>
                          {(searchTerm || dateFilter || statusFilter) && (
                            <CButton
                              color="link"
                              onClick={clearFilters}
                              className="mt-2"
                            >
                              Clear semua filter
                            </CButton>
                          )}
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    displayedLogs.map((log, index) => {
                      const duration = calculateDuration(log);
                      const absoluteIndex =
                        (currentPage - 1) * logsPerPage + index + 1;

                      return (
                        <CTableRow key={log._id || index}>
                          <CTableDataCell>{absoluteIndex}</CTableDataCell>
                          <CTableDataCell>
                            <div className="fw-semibold">
                              {log.name || "N/A"}
                            </div>
                          </CTableDataCell>
                          <CTableDataCell>
                            <small>{log.email || "N/A"}</small>
                          </CTableDataCell>
                          <CTableDataCell>
                            <div className="fw-semibold">
                              {formatDateTime(log.loginTime)}
                            </div>
                          </CTableDataCell>
                          <CTableDataCell>
                            {log.logoutTime ? (
                              <div className="fw-semibold">
                                {formatDateTime(log.logoutTime)}
                              </div>
                            ) : (
                              <span className="text-medium-emphasis">
                                Masih Login
                              </span>
                            )}
                          </CTableDataCell>
                          <CTableDataCell>
                            <CBadge
                              color={getDurationBadgeColor(log.status)}
                              className="px-2"
                            >
                              {formatDuration(duration)}
                              {log.status === "active" && (
                                <span className="ms-1">
                                  <CIcon icon={cilClock} size="sm" />
                                </span>
                              )}
                            </CBadge>
                          </CTableDataCell>
                          <CTableDataCell>
                            {getStatusBadge(log.status)}
                          </CTableDataCell>
                          <CTableDataCell>
                            <small className="text-muted">
                              {formatDateTime(log.createdAt)}
                            </small>
                          </CTableDataCell>
                        </CTableRow>
                      );
                    })
                  )}
                </CTableBody>
              </CTable>

              {/* Pagination */}
              {paginationInfo.totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <CPagination>
                    <CPaginationItem
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      Previous
                    </CPaginationItem>

                    {[...Array(paginationInfo.totalPages)].map((_, index) => {
                      const pageNumber = index + 1;
                      const isVisible =
                        pageNumber === 1 ||
                        pageNumber === paginationInfo.totalPages ||
                        (pageNumber >= currentPage - 2 &&
                          pageNumber <= currentPage + 2);

                      if (!isVisible) {
                        if (
                          pageNumber === currentPage - 3 ||
                          pageNumber === currentPage + 3
                        ) {
                          return (
                            <CPaginationItem key={pageNumber} disabled>
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
                        >
                          {pageNumber}
                        </CPaginationItem>
                      );
                    })}

                    <CPaginationItem
                      disabled={currentPage === paginationInfo.totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
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

export default UserLog;
