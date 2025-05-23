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

  // Fetch categories from API
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
        throw new Error("No categories data received from server");
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Fetch products from API
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
        throw new Error("No data received from server");
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setError(
        `Failed to load product data: ${
          err.response?.data?.message || err.message
        }. Please try again later.`
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
        title: "Are you sure?",
        text: `You are about to delete "${productName}". This action cannot be undone!`,
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
          text: "Please wait while we delete the product",
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
          title: "Deleted!",
          text: "The product has been deleted successfully.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });

        fetchProducts();
      }
    } catch (err) {
      console.error("Error deleting product:", err);
      await Swal.fire({
        title: "Error!",
        text: `Failed to delete product: ${
          err.response?.data?.message || err.message
        }. Please try again.`,
        icon: "error",
        confirmButtonText: "OK",
      });
      setError(
        `Failed to delete product: ${
          err.response?.data?.message || err.message
        }. Please try again.`
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
    if (!category) return "No Category";
    return typeof category === "object" ? category.name : category;
  };

  return (
    <>
      <CRow>
        <CCol>
          <CBreadcrumb className="mb-3">
            <CBreadcrumbItem href="/dashboard">Home</CBreadcrumbItem>
            <CBreadcrumbItem>Product Management</CBreadcrumbItem>
            <CBreadcrumbItem active>Product List</CBreadcrumbItem>
          </CBreadcrumb>
        </CCol>
      </CRow>

      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <h5>Product List</h5>
            </CCardHeader>
            <CCardBody>
              <CRow className="mb-3">
                <CCol sm={12} md={6} className="mb-2 mb-md-0">
                  <CInputGroup>
                    <CFormInput
                      placeholder="Search by name..."
                      value={search}
                      onChange={handleSearchChange}
                    />
                    <CButton type="button" color="primary" variant="outline">
                      <CIcon icon={cilSearch} />
                    </CButton>
                  </CInputGroup>
                </CCol>
                <CCol sm={12} md={3} className="mb-2 mb-md-0">
                  <CFormSelect
                    value={filterCategory}
                    onChange={handleCategoryChange}
                    disabled={categoriesLoading}
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol sm={12} md={3} className="d-flex justify-content-md-end">
                  <CButtonGroup>
                    <CButton color="primary" onClick={handleAddProduct}>
                      <CIcon icon={cilPlus} className="me-1" /> Add
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
                        <CTableHeaderCell scope="col">
                          Category
                        </CTableHeaderCell>
                        <CTableHeaderCell scope="col">Stock</CTableHeaderCell>
                        <CTableHeaderCell scope="col">Price</CTableHeaderCell>
                        <CTableHeaderCell scope="col">Actions</CTableHeaderCell>
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
                              {new Intl.NumberFormat("id-ID", {
                                style: "currency",
                                currency: "IDR",
                              }).format(product.price)}
                            </CTableDataCell>
                            <CTableDataCell>
                              <CButtonGroup size="sm">
                                <CButton
                                  color="info"
                                  variant="outline"
                                  onClick={() => handleEditProduct(product._id)}
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
                              </CButtonGroup>
                            </CTableDataCell>
                          </CTableRow>
                        ))
                      ) : (
                        <CTableRow>
                          <CTableDataCell colSpan="6" className="text-center">
                            No products found
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
                    {filteredProducts.length > 0 ? indexOfFirstItem + 1 : 0} to{" "}
                    {Math.min(indexOfLastItem, filteredProducts.length)} of{" "}
                    {filteredProducts.length} entries
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
