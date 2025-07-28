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
  CButtonGroup,
  CBadge,
  CAlert,
  CPagination,
  CPaginationItem,
  CBreadcrumb,
  CBreadcrumbItem,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilSearch, cilPencil, cilTrash, cilReload } from "@coreui/icons";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const User = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [currentUserRole, setCurrentUserRole] = useState("");
  const navigate = useNavigate();

  // Available roles for filtering
  const roles = ["pemilik", "karyawan"];

  // Fetch users from API
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      // First get current user's role
      const currentUserResponse = await axios.get(
        "http://localhost:5000/api/users/me",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        }
      );
      setCurrentUserRole(currentUserResponse.data.user.role);

      // Then get all users
      const response = await axios.get("http://localhost:5000/api/users", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
        },
      });

      if (response.data) {
        setUsers(response.data);
      } else {
        throw new Error("Tidak ada data yang diterima dari server");
      }
    } catch (err) {
      console.error("Gagal memuat data pengguna:", err);
      setError(
        `Gagal memuat data pengguna: ${
          err.response?.data?.message || err.message
        }. Silakan coba lagi nanti.`
      );
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleRoleChange = (e) => {
    setFilterRole(e.target.value);
    setCurrentPage(1);
  };

  const filteredUsers = users.filter((user) => {
    const searchTerm = search.toLowerCase();
    const matchesSearch =
      (user.name?.toLowerCase() || "").includes(searchTerm) ||
      (user.email?.toLowerCase() || "").includes(searchTerm);

    const matchesRole = filterRole === "" || user.role === filterRole;

    return matchesSearch && matchesRole;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handleEditUser = (id, userRole) => {
    // Prevent editing pemilik users
    if (userRole === "pemilik") {
      Swal.fire({
        title: "Akses Ditolak",
        text: "Akun pemilik tidak dapat diedit",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }
    navigate(`/user-management/edit/${id}`);
  };

  const handleDeleteUser = async (id, userName, userRole) => {
    try {
      // Prevent deleting pemilik users
      if (userRole === "pemilik") {
        Swal.fire({
          title: "Akses Ditolak",
          text: "Akun pemilik tidak dapat dihapus",
          icon: "error",
          confirmButtonText: "OK",
        });
        return;
      }

      const result = await Swal.fire({
        title: "Apakah Anda yakin?",
        text: `Anda akan menghapus pengguna "${userName}". Aksi ini tidak dapat dibatalkan!`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Ya, hapus!",
        cancelButtonText: "Batal",
        reverseButtons: true,
      });

      if (result.isConfirmed) {
        Swal.fire({
          title: "Menghapus...",
          text: "Harap tunggu sedang menghapus pengguna",
          allowOutsideClick: false,
          showConfirmButton: false,
          willOpen: () => {
            Swal.showLoading();
          },
        });

        await axios.delete(`http://localhost:5000/api/users/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        });

        await Swal.fire({
          title: "Terhapus!",
          text: "Pengguna berhasil dihapus.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });

        fetchUsers();
      }
    } catch (err) {
      console.error("Gagal menghapus pengguna:", err);
      await Swal.fire({
        title: "Error!",
        text: `Gagal menghapus pengguna: ${
          err.response?.data?.message || err.message
        }. Silakan coba lagi.`,
        icon: "error",
        confirmButtonText: "OK",
      });
      setError(
        `Gagal menghapus pengguna: ${
          err.response?.data?.message || err.message
        }. Silakan coba lagi.`
      );
    }
  };

  const handleRefresh = () => {
    fetchUsers();
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case "pemilik":
        return "danger";
      case "karyawan":
        return "warning";
      default:
        return "light";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <CRow>
        <CCol>
          <CBreadcrumb className="mb-3">
            <CBreadcrumbItem href="/dashboard">Beranda</CBreadcrumbItem>
            <CBreadcrumbItem>Manajemen Pengguna</CBreadcrumbItem>
            <CBreadcrumbItem active>Daftar Pengguna</CBreadcrumbItem>
          </CBreadcrumb>
        </CCol>
      </CRow>

      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <h5>Daftar Pengguna</h5>
            </CCardHeader>
            <CCardBody>
              <CRow className="mb-3">
                <CCol sm={12} md={4} className="mb-2 mb-md-0">
                  <CInputGroup>
                    <CFormInput
                      placeholder="Cari berdasarkan nama atau email..."
                      value={search}
                      onChange={handleSearchChange}
                    />
                    <CButton type="button" color="primary" variant="outline">
                      <CIcon icon={cilSearch} />
                    </CButton>
                  </CInputGroup>
                </CCol>
                <CCol sm={12} md={2} className="mb-2 mb-md-0">
                  <CFormSelect value={filterRole} onChange={handleRoleChange}>
                    <option value="">Semua Peran</option>
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role === "pemilik" ? "Pemilik" : "Karyawan"}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol sm={12} md={2} className="mb-2 mb-md-0"></CCol>
                <CCol sm={12} md={4} className="d-flex justify-content-md-end">
                  <CButtonGroup>
                    <CButton color="secondary" onClick={handleRefresh}>
                      <CIcon icon={cilReload} />
                    </CButton>
                  </CButtonGroup>
                </CCol>
              </CRow>

              {error && (
                <CAlert
                  color="danger"
                  dismissible
                  onClose={() => setError(null)}
                >
                  {error}
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
                        <CTableHeaderCell scope="col">Nama</CTableHeaderCell>
                        <CTableHeaderCell scope="col">Email</CTableHeaderCell>
                        <CTableHeaderCell scope="col">Peran</CTableHeaderCell>
                        <CTableHeaderCell scope="col">Dibuat</CTableHeaderCell>
                        <CTableHeaderCell scope="col">Aksi</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {currentItems.length > 0 ? (
                        currentItems.map((user, index) => (
                          <CTableRow key={user._id}>
                            <CTableDataCell>
                              {indexOfFirstItem + index + 1}
                            </CTableDataCell>
                            <CTableDataCell>
                              {user.name || user.fullName || "N/A"}
                            </CTableDataCell>
                            <CTableDataCell>
                              {user.email || "N/A"}
                            </CTableDataCell>
                            <CTableDataCell>
                              <CBadge color={getRoleColor(user.role)}>
                                {user.role === "pemilik"
                                  ? "Pemilik"
                                  : "Karyawan"}
                              </CBadge>
                            </CTableDataCell>
                            <CTableDataCell>
                              {formatDate(user.createdAt)}
                            </CTableDataCell>
                            <CTableDataCell>
                              <CButtonGroup size="sm">
                                <CButton
                                  color="info"
                                  variant="outline"
                                  onClick={() =>
                                    handleEditUser(user._id, user.role)
                                  }
                                  disabled={user.role === "pemilik"}
                                >
                                  <CIcon icon={cilPencil} />
                                </CButton>
                                <CButton
                                  color="danger"
                                  variant="outline"
                                  onClick={() =>
                                    handleDeleteUser(
                                      user._id,
                                      user.name || user.email,
                                      user.role
                                    )
                                  }
                                  disabled={user.role === "pemilik"}
                                >
                                  <CIcon icon={cilTrash} />
                                </CButton>
                              </CButtonGroup>
                            </CTableDataCell>
                          </CTableRow>
                        ))
                      ) : (
                        <CTableRow>
                          <CTableDataCell colSpan="8" className="text-center">
                            Tidak ada pengguna ditemukan
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
                    {filteredUsers.length > 0 ? indexOfFirstItem + 1 : 0} sampai{" "}
                    {Math.min(indexOfLastItem, filteredUsers.length)} dari{" "}
                    {filteredUsers.length} entri
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

export default User;
