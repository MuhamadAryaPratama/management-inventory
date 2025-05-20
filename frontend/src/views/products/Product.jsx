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

const Product = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const navigate = useNavigate();

  // Fetch products from API
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get("http://localhost:5000/api/products");
      setProducts(response.data);

      // Extract unique categories for filter dropdown
      const uniqueCategories = [
        ...new Set(response.data.map((product) => product.category)),
      ];
      setCategories(uniqueCategories);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to load product data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Load products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle category filter change
  const handleCategoryChange = (e) => {
    setFilterCategory(e.target.value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Filter products based on search and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.code.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      filterCategory === "" || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // Navigate to add product page
  const handleAddProduct = () => {
    navigate("/product-management/add");
  };

  // Navigate to edit product page
  const handleEditProduct = (id) => {
    navigate(`/product-management/edit/${id}`);
  };

  // Handle product deletion
  const handleDeleteProduct = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await axios.delete(`http://localhost:5000/products/${id}`);
        // Refresh products list after deletion
        fetchProducts();
      } catch (err) {
        console.error("Error deleting product:", err);
        setError("Failed to delete product. Please try again.");
      }
    }
  };

  // Get stock status badge color
  const getStockStatusColor = (quantity) => {
    if (quantity <= 0) return "danger";
    if (quantity < 10) return "warning";
    return "success";
  };

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <h5>Data Barang</h5>
          </CCardHeader>
          <CCardBody>
            {/* Toolbar */}
            <CRow className="mb-3">
              <CCol sm={12} md={6} className="mb-2 mb-md-0">
                <CInputGroup>
                  <CFormInput
                    placeholder="Search by name or code..."
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
                >
                  <option value="">All Categories</option>
                  {categories.map((category, index) => (
                    <option key={index} value={category}>
                      {category}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol sm={12} md={3} className="d-flex justify-content-md-end">
                <CButtonGroup>
                  <CButton color="primary" onClick={handleAddProduct}>
                    <CIcon icon={cilPlus} className="me-1" /> Add
                  </CButton>
                  <CButton color="secondary" onClick={fetchProducts}>
                    <CIcon icon={cilReload} />
                  </CButton>
                </CButtonGroup>
              </CCol>
            </CRow>

            {/* Error Alert */}
            {error && (
              <CAlert color="danger" dismissible onClose={() => setError(null)}>
                {error}
              </CAlert>
            )}

            {/* Products Table */}
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
                      <CTableHeaderCell scope="col">Code</CTableHeaderCell>
                      <CTableHeaderCell scope="col">Name</CTableHeaderCell>
                      <CTableHeaderCell scope="col">Category</CTableHeaderCell>
                      <CTableHeaderCell scope="col">Location</CTableHeaderCell>
                      <CTableHeaderCell scope="col">Stock</CTableHeaderCell>
                      <CTableHeaderCell scope="col">Unit</CTableHeaderCell>
                      <CTableHeaderCell scope="col">Price</CTableHeaderCell>
                      <CTableHeaderCell scope="col">Actions</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {currentItems.length > 0 ? (
                      currentItems.map((product, index) => (
                        <CTableRow key={product.id}>
                          <CTableDataCell>
                            {indexOfFirstItem + index + 1}
                          </CTableDataCell>
                          <CTableDataCell>{product.code}</CTableDataCell>
                          <CTableDataCell>{product.name}</CTableDataCell>
                          <CTableDataCell>{product.category}</CTableDataCell>
                          <CTableDataCell>{product.location}</CTableDataCell>
                          <CTableDataCell>
                            <CBadge
                              color={getStockStatusColor(product.quantity)}
                            >
                              {product.quantity}
                            </CBadge>
                          </CTableDataCell>
                          <CTableDataCell>{product.unit}</CTableDataCell>
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
                                onClick={() => handleEditProduct(product.id)}
                              >
                                <CIcon icon={cilPencil} />
                              </CButton>
                              <CButton
                                color="danger"
                                variant="outline"
                                onClick={() => handleDeleteProduct(product.id)}
                              >
                                <CIcon icon={cilTrash} />
                              </CButton>
                            </CButtonGroup>
                          </CTableDataCell>
                        </CTableRow>
                      ))
                    ) : (
                      <CTableRow>
                        <CTableDataCell colSpan="9" className="text-center">
                          No products found
                        </CTableDataCell>
                      </CTableRow>
                    )}
                  </CTableBody>
                </CTable>

                {/* Pagination */}
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

                {/* Summary */}
                <div className="text-medium-emphasis small">
                  Showing {indexOfFirstItem + 1} to{" "}
                  {Math.min(indexOfLastItem, filteredProducts.length)} of{" "}
                  {filteredProducts.length} entries
                </div>
              </>
            )}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );
};

export default Product;
