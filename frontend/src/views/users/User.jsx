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
import {
  cilSearch,
  cilPencil,
  cilTrash,
  cilPlus,
  cilReload,
} from "@coreui/icons";
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
  const navigate = useNavigate();

  // Available roles for filtering
  const roles = ["pemilik", "karyawan"];

  // Fetch users from API
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get("http://localhost:5000/api/users", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
        },
      });

      if (response.data) {
        setUsers(response.data);
      } else {
        throw new Error("No data received from server");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(
        `Failed to load user data: ${
          err.response?.data?.message || err.message
        }. Please try again later.`
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

  const handleAddUser = () => {
    navigate("/user-management/add");
  };

  const handleEditUser = (id) => {
    navigate(`/user-management/edit/${id}`);
  };

  const handleDeleteUser = async (id, userName) => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: `You are about to delete "${userName}". This action cannot be undone!`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "Cancel",
        reverseButtons: true,
      });

      if (result.isConfirmed) {
        Swal.fire({
          title: "Deleting...",
          text: "Please wait while we delete the user",
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
          title: "Deleted!",
          text: "The user has been deleted successfully.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });

        fetchUsers();
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      await Swal.fire({
        title: "Error!",
        text: `Failed to delete user: ${
          err.response?.data?.message || err.message
        }. Please try again.`,
        icon: "error",
        confirmButtonText: "OK",
      });
      setError(
        `Failed to delete user: ${
          err.response?.data?.message || err.message
        }. Please try again.`
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
            <CBreadcrumbItem href="/dashboard">Home</CBreadcrumbItem>
            <CBreadcrumbItem>User Management</CBreadcrumbItem>
            <CBreadcrumbItem active>User List</CBreadcrumbItem>
          </CBreadcrumb>
        </CCol>
      </CRow>

      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <h5>User List</h5>
            </CCardHeader>
            <CCardBody>
              <CRow className="mb-3">
                <CCol sm={12} md={4} className="mb-2 mb-md-0">
                  <CInputGroup>
                    <CFormInput
                      placeholder="Search by name, or email..."
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
                    <option value="">All Roles</option>
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol sm={12} md={2} className="mb-2 mb-md-0"></CCol>
                <CCol sm={12} md={4} className="d-flex justify-content-md-end">
                  <CButtonGroup>
                    <CButton color="primary" onClick={handleAddUser}>
                      <CIcon icon={cilPlus} className="me-1" /> Add User
                    </CButton>
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
                        <CTableHeaderCell scope="col">Name</CTableHeaderCell>
                        <CTableHeaderCell scope="col">Email</CTableHeaderCell>
                        <CTableHeaderCell scope="col">Role</CTableHeaderCell>
                        <CTableHeaderCell scope="col">Created</CTableHeaderCell>
                        <CTableHeaderCell scope="col">Actions</CTableHeaderCell>
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
                                {user.role?.charAt(0).toUpperCase() +
                                  user.role?.slice(1) || "N/A"}
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
                                  onClick={() => handleEditUser(user._id)}
                                >
                                  <CIcon icon={cilPencil} />
                                </CButton>
                                <CButton
                                  color="danger"
                                  variant="outline"
                                  onClick={() =>
                                    handleDeleteUser(
                                      user._id,
                                      user.name || user.email
                                    )
                                  }
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
                            No users found
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
                    {filteredUsers.length > 0 ? indexOfFirstItem + 1 : 0} to{" "}
                    {Math.min(indexOfLastItem, filteredUsers.length)} of{" "}
                    {filteredUsers.length} entries
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
