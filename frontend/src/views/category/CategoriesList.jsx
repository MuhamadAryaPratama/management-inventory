import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

const CategoriesList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const navigate = useNavigate();

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

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/api/categories", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
        },
      });
      setCategories(response.data);
    } catch (err) {
      console.error("Gagal memuat kategori:", err);
      Toast.fire({
        icon: "error",
        title: "Gagal memuat kategori",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const filteredCategories = categories.filter((category) => {
    const searchTerm = search.toLowerCase();
    return (
      category.name?.toLowerCase().includes(searchTerm) ||
      category.description?.toLowerCase().includes(searchTerm)
    );
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCategories.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);

  const handleDeleteCategory = async (id) => {
    const result = await Swal.fire({
      title: "Apakah Anda yakin?",
      text: "Anda tidak akan dapat mengembalikan ini!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`http://localhost:5000/api/categories/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        });
        Toast.fire({
          icon: "success",
          title: "Kategori berhasil dihapus",
        });
        fetchCategories();
      } catch (err) {
        console.error("Gagal menghapus kategori:", err);
        Toast.fire({
          icon: "error",
          title: "Gagal menghapus kategori",
        });
      }
    }
  };

  return (
    <div className="category-page">
      <CRow className="mb-3">
        <CCol>
          <CBreadcrumb>
            <CBreadcrumbItem href="/dashboard">Beranda</CBreadcrumbItem>
            <CBreadcrumbItem href="/product-management">
              Manajemen Barang
            </CBreadcrumbItem>
            <CBreadcrumbItem active>Kategori Produk</CBreadcrumbItem>
          </CBreadcrumb>
        </CCol>
      </CRow>

      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4 shadow-sm">
            <CCardHeader className="bg-primary text-white">
              <h5 className="mb-0">
                <CIcon icon={cilTags} className="me-2" />
                Kategori Produk
              </h5>
            </CCardHeader>
            <CCardBody>
              <CRow className="mb-4">
                <CCol sm={12} lg={8} className="mb-2 mb-lg-0">
                  <CInputGroup>
                    <CFormInput
                      placeholder="Cari kategori..."
                      value={search}
                      onChange={handleSearchChange}
                    />
                    <CButton color="primary" variant="outline">
                      <CIcon icon={cilSearch} />
                    </CButton>
                  </CInputGroup>
                </CCol>
                <CCol sm={12} lg={4} className="d-flex justify-content-lg-end">
                  <CButtonGroup>
                    <CButton
                      color="success"
                      onClick={() =>
                        navigate("/product-management/categories/add")
                      }
                    >
                      <CIcon icon={cilPlus} className="me-1" />
                      Tambah Kategori
                    </CButton>
                    <CButton
                      color="secondary"
                      onClick={fetchCategories}
                      disabled={loading}
                    >
                      <CIcon icon={cilReload} />
                    </CButton>
                  </CButtonGroup>
                </CCol>
              </CRow>

              {loading ? (
                <div className="d-flex justify-content-center py-5">
                  <CSpinner color="primary" />
                </div>
              ) : (
                <>
                  <CTable hover striped>
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell width="5%">No</CTableHeaderCell>
                        <CTableHeaderCell>Nama Kategori</CTableHeaderCell>
                        <CTableHeaderCell>Deskripsi</CTableHeaderCell>
                        <CTableHeaderCell width="15%">Aksi</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {currentItems.length > 0 ? (
                        currentItems.map((category, index) => (
                          <CTableRow key={category._id}>
                            <CTableDataCell>
                              {indexOfFirstItem + index + 1}
                            </CTableDataCell>
                            <CTableDataCell>{category.name}</CTableDataCell>
                            <CTableDataCell>
                              {category.description || "-"}
                            </CTableDataCell>
                            <CTableDataCell>
                              <CButtonGroup>
                                <CButton
                                  color="info"
                                  size="sm"
                                  onClick={() =>
                                    navigate(
                                      `/product-management/categories/edit/${category._id}`
                                    )
                                  }
                                >
                                  <CIcon icon={cilPencil} />
                                </CButton>
                                <CButton
                                  color="danger"
                                  size="sm"
                                  onClick={() =>
                                    handleDeleteCategory(category._id)
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
                          <CTableDataCell
                            colSpan={4}
                            className="text-center py-5"
                          >
                            {search ? (
                              <span>Tidak ada hasil untuk "{search}"</span>
                            ) : (
                              <span>Tidak ada kategori tersedia</span>
                            )}
                          </CTableDataCell>
                        </CTableRow>
                      )}
                    </CTableBody>
                  </CTable>

                  {totalPages > 1 && (
                    <CPagination align="end" className="mt-3">
                      <CPaginationItem
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                      >
                        Sebelumnya
                      </CPaginationItem>
                      {[...Array(totalPages).keys()].map((page) => (
                        <CPaginationItem
                          key={page + 1}
                          active={page + 1 === currentPage}
                          onClick={() => setCurrentPage(page + 1)}
                        >
                          {page + 1}
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
                </>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </div>
  );
};

export default CategoriesList;
