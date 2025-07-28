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

const Product = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const navigate = useNavigate();

  // Ambil data kategori dari API
  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/api/categories", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
        },
      });

      if (response.data) {
        setCategories(response.data);
      } else {
        throw new Error("Tidak ada data kategori yang diterima dari server");
      }
    } catch (err) {
      console.error("Gagal mengambil data kategori:", err);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Ambil data produk dari API
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get("http://localhost:5000/api/products", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
        },
      });

      if (response.data) {
        setProducts(response.data);
      } else {
        throw new Error("Tidak ada data yang diterima dari server");
      }
    } catch (err) {
      console.error("Gagal mengambil data produk:", err);
      setError(
        `Gagal memuat data produk: ${
          err.response?.data?.message || err.message
        }. Silakan coba lagi nanti.`
      );
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (e) => {
    setFilterCategory(e.target.value);
    setCurrentPage(1);
  };

  const filteredProducts = products.filter((product) => {
    const searchTerm = search.toLowerCase();
    const matchesSearch = (product.name?.toLowerCase() || "").includes(
      searchTerm
    );
    const matchesCategory =
      filterCategory === "" ||
      (product.category && product.category._id === filterCategory);
    return matchesSearch && matchesCategory;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handleAddProduct = () => {
    navigate("/product-management/add");
  };

  const handleEditProduct = (id) => {
    navigate(`/product-management/edit/${id}`);
  };

  const handleDeleteProduct = async (id, productName) => {
    try {
      const result = await Swal.fire({
        title: "Apakah Anda yakin?",
        text: `Anda akan menghapus produk "${productName}". Tindakan ini tidak dapat dibatalkan!`,
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
          text: "Harap tunggu sedang menghapus produk",
          allowOutsideClick: false,
          showConfirmButton: false,
          willOpen: () => {
            Swal.showLoading();
          },
        });

        await axios.delete(`http://localhost:5000/api/products/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        });

        await Swal.fire({
          title: "Terhapus!",
          text: "Produk berhasil dihapus.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });

        fetchProducts();
      }
    } catch (err) {
      console.error("Gagal menghapus produk:", err);
      await Swal.fire({
        title: "Error!",
        text: `Gagal menghapus produk: ${
          err.response?.data?.message || err.message
        }. Silakan coba lagi.`,
        icon: "error",
        confirmButtonText: "OK",
      });
      setError(
        `Gagal menghapus produk: ${
          err.response?.data?.message || err.message
        }. Silakan coba lagi.`
      );
    }
  };

  const handleRefresh = () => {
    fetchProducts();
    fetchCategories();
  };

  const getStockStatusColor = (quantity) => {
    if (quantity <= 0) return "danger";
    if (quantity < 10) return "warning";
    return "success";
  };

  const getCategoryName = (category) => {
    if (!category) return "Tanpa Kategori";
    return typeof category === "object" ? category.name : category;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <>
      <CRow>
        <CCol>
          <CBreadcrumb className="mb-3">
            <CBreadcrumbItem href="/dashboard">Beranda</CBreadcrumbItem>
            <CBreadcrumbItem>Manajemen Produk</CBreadcrumbItem>
            <CBreadcrumbItem active>Daftar Produk</CBreadcrumbItem>
          </CBreadcrumb>
        </CCol>
      </CRow>

      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Daftar Produk</h5>
                <div>
                  <CButton
                    color="primary"
                    onClick={handleAddProduct}
                    className="me-1"
                  >
                    Tambah Barang
                  </CButton>
                  <CButton color="secondary" onClick={handleRefresh}>
                    <CIcon icon={cilReload} />
                  </CButton>
                </div>
              </div>
            </CCardHeader>
            <CCardBody>
              <CRow className="mb-3">
                <CCol sm={12} md={6} className="mb-2 mb-md-0">
                  <CInputGroup>
                    <CFormInput
                      placeholder="Cari berdasarkan nama..."
                      value={search}
                      onChange={handleSearchChange}
                    />
                    <CButton type="button" color="primary" variant="outline">
                      <CIcon icon={cilSearch} />
                    </CButton>
                  </CInputGroup>
                </CCol>
                <CCol sm={12} md={6}>
                  <CFormSelect
                    value={filterCategory}
                    onChange={handleCategoryChange}
                    disabled={categoriesLoading}
                    className="float-md-end"
                    style={{ width: "auto", minWidth: "200px" }}
                  >
                    <option value="">Semua Kategori</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </CFormSelect>
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
                        <CTableHeaderCell scope="col">
                          Kategori
                        </CTableHeaderCell>
                        <CTableHeaderCell scope="col">Stok</CTableHeaderCell>
                        <CTableHeaderCell scope="col">Harga</CTableHeaderCell>
                        <CTableHeaderCell scope="col">Aksi</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {currentItems.length > 0 ? (
                        currentItems.map((product, index) => (
                          <CTableRow key={product._id}>
                            <CTableDataCell>
                              {indexOfFirstItem + index + 1}
                            </CTableDataCell>
                            <CTableDataCell>{product.name}</CTableDataCell>
                            <CTableDataCell>
                              {getCategoryName(product.category)}
                            </CTableDataCell>
                            <CTableDataCell>
                              <CBadge
                                color={getStockStatusColor(
                                  product.currentStock
                                )}
                              >
                                {product.currentStock}
                              </CBadge>
                            </CTableDataCell>
                            <CTableDataCell>
                              {formatCurrency(product.price)}
                            </CTableDataCell>
                            <CTableDataCell>
                              <div className="d-flex">
                                <CButton
                                  color="info"
                                  variant="outline"
                                  onClick={() => handleEditProduct(product._id)}
                                  className="me-2"
                                >
                                  <CIcon icon={cilPencil} />
                                </CButton>
                                <CButton
                                  color="danger"
                                  variant="outline"
                                  onClick={() =>
                                    handleDeleteProduct(
                                      product._id,
                                      product.name
                                    )
                                  }
                                >
                                  <CIcon icon={cilTrash} />
                                </CButton>
                              </div>
                            </CTableDataCell>
                          </CTableRow>
                        ))
                      ) : (
                        <CTableRow>
                          <CTableDataCell colSpan="6" className="text-center">
                            Tidak ada produk ditemukan
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
                    {filteredProducts.length > 0 ? indexOfFirstItem + 1 : 0}{" "}
                    sampai {Math.min(indexOfLastItem, filteredProducts.length)}{" "}
                    dari {filteredProducts.length} data
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

export default Product;
