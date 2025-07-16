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
  CButtonGroup,
  CPagination,
  CPaginationItem,
  CBreadcrumb,
  CBreadcrumbItem,
  CBadge,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import {
  cilSearch,
  cilPencil,
  cilTrash,
  cilPlus,
  cilReload,
  cilTags,
} from "@coreui/icons";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

const Supplier = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/api/suppliers", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
        },
      });

      if (response.data && Array.isArray(response.data)) {
        setSuppliers(response.data);
      } else {
        throw new Error("Format data tidak valid dari server");
      }
    } catch (error) {
      console.error("Gagal mengambil data supplier:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const filteredSuppliers = suppliers.filter((supplier) => {
    const searchTerm = search.toLowerCase();
    return (
      (supplier.name?.toLowerCase() || "").includes(searchTerm) ||
      (supplier.contact?.toLowerCase() || "").includes(searchTerm) ||
      (supplier.phone?.toLowerCase() || "").includes(searchTerm) ||
      (supplier.address?.toLowerCase() || "").includes(searchTerm)
    );
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSuppliers.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);

  const handleDeleteSupplier = async (id) => {
    const supplier = suppliers.find((sup) => sup._id === id);

    const result = await Swal.fire({
      title: "Apakah Anda yakin?",
      html: `Anda ingin menghapus supplier <strong>"${supplier?.name}"</strong>?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
      reverseButtons: true,
      focusCancel: true,
    });

    if (result.isConfirmed) {
      Swal.fire({
        title: "Menghapus Supplier...",
        text: "Harap tunggu",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      try {
        await axios.delete(`http://localhost:5000/api/suppliers/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        });

        Toast.fire({
          icon: "success",
          title: "Terhapus!",
          text: "Supplier berhasil dihapus.",
        });

        fetchSuppliers();
      } catch (error) {
        console.error("Gagal menghapus supplier: ", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Gagal menghapus supplier",
        });
      }
    }
  };

  return (
    <div className="supplier-page">
      <CRow className="mb-3">
        <CCol>
          <CBreadcrumb>
            <CBreadcrumbItem href="/dashboard">Beranda</CBreadcrumbItem>
            <CBreadcrumbItem active>Supplier</CBreadcrumbItem>
          </CBreadcrumb>
        </CCol>
      </CRow>

      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4 shadow-sm">
            <CCardHeader className="bg-primary text-white">
              <h5 className="mb-0">
                <CIcon icon={cilTags} className="me-2" />
                Data Supplier
              </h5>
            </CCardHeader>
            <CCardBody>
              <CRow className="mb-4">
                <CCol sm={12} lg={8} className="mb-2 mb-lg-0">
                  <CInputGroup>
                    <CFormInput
                      placeholder="Cari berdasarkan nama, kontak, telepon atau alamat..."
                      value={search}
                      onChange={handleSearchChange}
                      className="border-primary"
                    />
                    <CButton
                      type="button"
                      color="primary"
                      variant="outline"
                      title="Cari"
                    >
                      <CIcon icon={cilSearch} />
                    </CButton>
                  </CInputGroup>
                </CCol>
                <CCol sm={12} lg={4} className="d-flex justify-content-lg-end">
                  <CButtonGroup>
                    <CButton
                      color="success"
                      onClick={() => navigate("/supplier/suppliers/add")}
                      title="Tambah supplier baru"
                    >
                      <CIcon icon={cilPlus} className="me-1" />
                      Tambah Supplier
                    </CButton>
                    <CButton
                      color="secondary"
                      onClick={fetchSuppliers}
                      disabled={loading}
                      title="Muat ulang data"
                    >
                      <CIcon icon={cilReload} />
                    </CButton>
                  </CButtonGroup>
                </CCol>
              </CRow>

              {loading ? (
                <div className="d-flex justify-content-center align-items-center py-5">
                  <CSpinner color="primary" className="me-2" />
                  <span>Memuat data supplier...</span>
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <CTable hover striped className="mb-3">
                      <CTableHead color="light">
                        <CTableRow>
                          <CTableHeaderCell scope="col" className="text-center">
                            No
                          </CTableHeaderCell>
                          <CTableHeaderCell scope="col">
                            Nama Supplier
                          </CTableHeaderCell>
                          <CTableHeaderCell scope="col">
                            Kontak
                          </CTableHeaderCell>
                          <CTableHeaderCell scope="col">
                            Telepon
                          </CTableHeaderCell>
                          <CTableHeaderCell scope="col">
                            Alamat
                          </CTableHeaderCell>
                          <CTableHeaderCell scope="col" className="text-center">
                            Aksi
                          </CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        {currentItems.length > 0 ? (
                          currentItems.map((supplier, index) => (
                            <CTableRow key={supplier._id || index}>
                              <CTableDataCell className="text-center">
                                <strong>{indexOfFirstItem + index + 1}</strong>
                              </CTableDataCell>
                              <CTableDataCell>
                                <div className="d-flex align-items-center">
                                  <CIcon
                                    icon={cilTags}
                                    className="me-2 text-primary"
                                  />
                                  <div>
                                    <strong className="text-dark">
                                      {supplier.name}
                                    </strong>
                                  </div>
                                </div>
                              </CTableDataCell>
                              <CTableDataCell>
                                <span className="text-muted">
                                  {supplier.contact || "Tidak ada kontak"}
                                </span>
                              </CTableDataCell>
                              <CTableDataCell>
                                <span className="text-muted">
                                  {supplier.phone || "Tidak ada telepon"}
                                </span>
                              </CTableDataCell>
                              <CTableDataCell>
                                <span className="text-muted">
                                  {supplier.address || "Tidak ada alamat"}
                                </span>
                              </CTableDataCell>
                              <CTableDataCell className="text-center">
                                <CButtonGroup size="sm">
                                  <CButton
                                    color="info"
                                    variant="outline"
                                    onClick={() =>
                                      navigate(
                                        `/supplier/suppliers/edit/${supplier._id}`
                                      )
                                    }
                                    title="Edit Supplier"
                                  >
                                    <CIcon icon={cilPencil} />
                                  </CButton>
                                  <CButton
                                    color="danger"
                                    variant="outline"
                                    onClick={() =>
                                      handleDeleteSupplier(supplier._id)
                                    }
                                    title="Hapus Supplier"
                                  >
                                    <CIcon icon={cilTrash} />
                                  </CButton>
                                </CButtonGroup>
                              </CTableDataCell>
                            </CTableRow>
                          ))
                        ) : (
                          <CTableRow>
                            <CTableDataCell
                              colSpan="6"
                              className="text-center py-5"
                            >
                              <div className="text-muted">
                                <CIcon
                                  icon={cilTags}
                                  size="xl"
                                  className="mb-3 text-primary"
                                />
                                <h6>Tidak ada supplier ditemukan</h6>
                                {search ? (
                                  <p className="mb-2">
                                    Tidak ada hasil untuk "{search}"
                                  </p>
                                ) : (
                                  <p className="mb-2">
                                    Mulai dengan menambahkan supplier pertama
                                    Anda
                                  </p>
                                )}
                                {search && (
                                  <CButton
                                    color="link"
                                    onClick={() => setSearch("")}
                                    className="p-0"
                                  >
                                    Hapus pencarian
                                  </CButton>
                                )}
                              </div>
                            </CTableDataCell>
                          </CTableRow>
                        )}
                      </CTableBody>
                    </CTable>
                  </div>

                  {totalPages > 1 && (
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="text-muted small">
                        Menampilkan{" "}
                        {filteredSuppliers.length > 0
                          ? indexOfFirstItem + 1
                          : 0}{" "}
                        sampai{" "}
                        {Math.min(indexOfLastItem, filteredSuppliers.length)}{" "}
                        dari {filteredSuppliers.length} data{" "}
                        {search &&
                          ` (difilter dari ${suppliers.length} total) `}
                      </div>

                      <CPagination aria-label="Navigasi halaman supplier">
                        <CPaginationItem
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(currentPage - 1)}
                        >
                          Sebelumnya
                        </CPaginationItem>

                        {Array.from(
                          { length: Math.min(totalPages, 5) },
                          (_, i) => {
                            let page;
                            if (totalPages <= 5) {
                              page = i + 1;
                            } else if (currentPage <= 3) {
                              page = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              page = totalPages - 4 + i;
                            } else {
                              page = currentPage - 2 + i;
                            }

                            return (
                              <CPaginationItem
                                key={page}
                                active={page === currentPage}
                                onClick={() => setCurrentPage(page)}
                              >
                                {page}
                              </CPaginationItem>
                            );
                          }
                        )}

                        <CPaginationItem
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(currentPage + 1)}
                        >
                          Selanjutnya
                        </CPaginationItem>
                      </CPagination>
                    </div>
                  )}

                  {totalPages <= 1 && (
                    <div className="text-muted small mt-3 text-center">
                      Menampilkan {filteredSuppliers.length} dari{" "}
                      {suppliers.length} supplier
                      {search && ` yang cocok dengan "${search}"`}
                    </div>
                  )}
                </>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </div>
  );
};

export default Supplier;
