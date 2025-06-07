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
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormLabel,
  CFormTextarea,
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

const Category = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" or "edit"
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [formLoading, setFormLoading] = useState(false);

  // Initialize with sample data
  useEffect(() => {
    // console.log("Category component mounted");
    // Then try to fetch from API
    fetchCategories();
  }, []);

  // SweetAlert configuration
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

  // Fetch categories from API
  const fetchCategories = async () => {
    setLoading(true);

    try {
      const response = await axios.get("http://localhost:5000/api/categories", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
        },
      });

      if (response.data && Array.isArray(response.data)) {
        setCategories(response.data);
        // Toast.fire({
        //   icon: "success",
        //   title: "Categories loaded successfully!",
        // });
      } else {
        throw new Error("Invalid data format received from server");
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  // Filter categories based on search
  const filteredCategories = categories.filter((category) => {
    const searchTerm = search.toLowerCase();
    return (
      (category.name?.toLowerCase() || "").includes(searchTerm) ||
      (category.description?.toLowerCase() || "").includes(searchTerm)
    );
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCategories.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Open modal for adding new category
  const handleAddCategory = () => {
    setModalMode("add");
    setSelectedCategory(null);
    setFormData({
      name: "",
      description: "",
    });
    setShowModal(true);
  };

  // Open modal for editing category
  const handleEditCategory = (category) => {
    setModalMode("edit");
    setSelectedCategory(category);
    setFormData({
      name: category.name || "",
      description: category.description || "",
    });
    setShowModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCategory(null);
    setFormData({
      name: "",
      description: "",
    });
  };

  // Submit form (add or edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    // Show loading alert
    Toast.fire({
      title:
        modalMode === "add" ? "Adding Category..." : "Updating Category...",
      text: "Please wait",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const url =
        modalMode === "add"
          ? "http://localhost:5000/api/categories"
          : `http://localhost:5000/api/categories/${selectedCategory._id}`;

      const method = modalMode === "add" ? "post" : "put";

      await axios[method](url, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          "Content-Type": "application/json",
        },
      });

      // Success with API
      Toast.fire({
        icon: "success",
        title: "Success!",
        text: `Category ${
          modalMode === "add" ? "added" : "updated"
        } successfully!`,
        // timer: 2000,
        // showConfirmButton: false,
      });

      handleCloseModal();
      fetchCategories();
    } catch (err) {
      console.error(
        `Error ${modalMode === "add" ? "adding" : "updating"} category:`,
        err
      );

      handleCloseModal();
    } finally {
      setFormLoading(false);
    }
  };

  // Handle category deletion
  const handleDeleteCategory = async (id) => {
    const category = categories.find((cat) => cat._id === id);

    // Show confirmation dialog
    const result = await Swal.fire({
      title: "Are you sure?",
      html: `You want to delete category <strong>"${category?.name}"</strong>?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      focusCancel: true,
    });

    if (result.isConfirmed) {
      // Show loading
      Swal.fire({
        title: "Deleting Category...",
        text: "Please wait",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      try {
        await axios.delete(`http://localhost:5000/api/categories/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        });

        // Success with API
        Toast.fire({
          icon: "success",
          title: "Deleted!",
          text: "Category has been deleted successfully.",
        });

        fetchCategories();
      } catch (err) {
        console.error("Error deleting category:", err);
      }
    }
  };

  // Format date for display
  // const formatDate = (dateString) => {
  //   try {
  //     return new Date(dateString).toLocaleDateString("id-ID", {
  //       year: "numeric",
  //       month: "short",
  //       day: "numeric",
  //       hour: "2-digit",
  //       minute: "2-digit",
  //     });
  //   } catch (error) {
  //     return "Invalid Date";
  //   }
  // };

  return (
    <div className="category-page">
      {/* Breadcrumb */}
      <CRow className="mb-3">
        <CCol>
          <CBreadcrumb>
            <CBreadcrumbItem href="/dashboard">Home</CBreadcrumbItem>
            <CBreadcrumbItem>Manajemen Barang</CBreadcrumbItem>
            <CBreadcrumbItem active>Kategori Barang</CBreadcrumbItem>
          </CBreadcrumb>
        </CCol>
      </CRow>

      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4 shadow-sm">
            <CCardHeader className="bg-primary text-white">
              <h5 className="mb-0">
                <CIcon icon={cilTags} className="me-2" />
                Kategori Barang
              </h5>
            </CCardHeader>
            <CCardBody>
              {/* Toolbar */}
              <CRow className="mb-4">
                <CCol sm={12} lg={8} className="mb-2 mb-lg-0">
                  <CInputGroup>
                    <CFormInput
                      placeholder="Search by name or description..."
                      value={search}
                      onChange={handleSearchChange}
                      className="border-primary"
                    />
                    <CButton
                      type="button"
                      color="primary"
                      variant="outline"
                      title="Search"
                    >
                      <CIcon icon={cilSearch} />
                    </CButton>
                  </CInputGroup>
                </CCol>
                <CCol sm={12} lg={4} className="d-flex justify-content-lg-end">
                  <CButtonGroup>
                    <CButton
                      color="success"
                      onClick={handleAddCategory}
                      title="Add new category"
                    >
                      <CIcon icon={cilPlus} className="me-1" />
                      Add Category
                    </CButton>
                    <CButton
                      color="secondary"
                      onClick={fetchCategories}
                      disabled={loading}
                      title="Refresh data"
                    >
                      <CIcon icon={cilReload} />
                    </CButton>
                  </CButtonGroup>
                </CCol>
              </CRow>

              {/* Categories Table */}
              {loading ? (
                <div className="d-flex justify-content-center align-items-center py-5">
                  <CSpinner color="primary" className="me-2" />
                  <span>Loading categories...</span>
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
                            Category Name
                          </CTableHeaderCell>
                          <CTableHeaderCell scope="col">
                            Description
                          </CTableHeaderCell>
                          <CTableHeaderCell scope="col" className="text-center">
                            Actions
                          </CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        {currentItems.length > 0 ? (
                          currentItems.map((category, index) => (
                            <CTableRow key={category._id || index}>
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
                                      {category.name}
                                    </strong>
                                  </div>
                                </div>
                              </CTableDataCell>
                              <CTableDataCell>
                                <span className="text-muted">
                                  {category.description || "No description"}
                                </span>
                              </CTableDataCell>
                              <CTableDataCell className="text-center">
                                <CButtonGroup size="sm">
                                  <CButton
                                    color="info"
                                    variant="outline"
                                    onClick={() => handleEditCategory(category)}
                                    title="Edit Category"
                                  >
                                    <CIcon icon={cilPencil} />
                                  </CButton>
                                  <CButton
                                    color="danger"
                                    variant="outline"
                                    onClick={() =>
                                      handleDeleteCategory(category._id)
                                    }
                                    title="Delete Category"
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
                              colSpan="5"
                              className="text-center py-5"
                            >
                              <div className="text-muted">
                                <CIcon
                                  icon={cilTags}
                                  size="xl"
                                  className="mb-3 text-primary"
                                />
                                <h6>No categories found</h6>
                                {search ? (
                                  <p className="mb-2">
                                    No results for "{search}"
                                  </p>
                                ) : (
                                  <p className="mb-2">
                                    Start by adding your first category
                                  </p>
                                )}
                                {search && (
                                  <CButton
                                    color="link"
                                    onClick={() => setSearch("")}
                                    className="p-0"
                                  >
                                    Clear search
                                  </CButton>
                                )}
                              </div>
                            </CTableDataCell>
                          </CTableRow>
                        )}
                      </CTableBody>
                    </CTable>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="text-muted small">
                        Showing{" "}
                        {filteredCategories.length > 0
                          ? indexOfFirstItem + 1
                          : 0}{" "}
                        to{" "}
                        {Math.min(indexOfLastItem, filteredCategories.length)}{" "}
                        of {filteredCategories.length} entries
                        {search &&
                          ` (filtered from ${categories.length} total)`}
                      </div>

                      <CPagination aria-label="Category pagination">
                        <CPaginationItem
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(currentPage - 1)}
                        >
                          Previous
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
                          Next
                        </CPaginationItem>
                      </CPagination>
                    </div>
                  )}

                  {/* Summary for single page */}
                  {totalPages <= 1 && (
                    <div className="text-muted small mt-3 text-center">
                      Showing {filteredCategories.length} of {categories.length}{" "}
                      categories
                      {search && ` matching "${search}"`}
                    </div>
                  )}
                </>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Add/Edit Modal */}
      <CModal
        visible={showModal}
        onClose={handleCloseModal}
        backdrop="static"
        size="lg"
        className="category-modal"
      >
        <CModalHeader>
          <CModalTitle>
            <CIcon icon={cilTags} className="me-2" />
            {modalMode === "add" ? "Add New Category" : "Edit Category"}
          </CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleSubmit}>
          <CModalBody>
            <CRow>
              <CCol md={12}>
                <div className="mb-3">
                  <CFormLabel htmlFor="name">
                    Category Name <span className="text-danger">*</span>
                  </CFormLabel>
                  <CFormInput
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter category name"
                    maxLength={50}
                    required
                    className="border-primary"
                  />
                  <div className="form-text">
                    Maximum 50 characters ({formData.name.length}/50)
                  </div>
                </div>
              </CCol>
            </CRow>

            <CRow>
              <CCol md={12}>
                <div className="mb-3">
                  <CFormLabel htmlFor="description">Description</CFormLabel>
                  <CFormTextarea
                    id="description"
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter category description (optional)"
                    maxLength={200}
                    className="border-primary"
                  />
                  <div className="form-text">
                    Maximum 200 characters ({formData.description.length}/200)
                  </div>
                </div>
              </CCol>
            </CRow>
          </CModalBody>
          <CModalFooter>
            <CButton
              color="secondary"
              onClick={handleCloseModal}
              disabled={formLoading}
            >
              Cancel
            </CButton>
            <CButton
              color="primary"
              type="submit"
              disabled={formLoading || !formData.name.trim()}
            >
              {formLoading && <CSpinner size="sm" className="me-2" />}
              {modalMode === "add" ? "Add Category" : "Update Category"}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>
    </div>
  );
};

export default Category;
