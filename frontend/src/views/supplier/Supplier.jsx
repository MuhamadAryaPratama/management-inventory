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

const Supplier = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState([10]);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    phone: "",
    address: "",
  });
  const [formLoading, setFormLoading] = useState(false);

  // Initialize with sample data
  useEffect(() => {
    console.log("Supplier component mounted");
    // Then try to fetch from API
    fetchSuppliers();
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
        throw new Error("Invalid data format received from server");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  // Filter supplier based on search
  const filteredSuppliers = suppliers.filter((supplier) => {
    const searchTerm = search.toLowerCase();
    return (
      (supplier.name?.toLowerCase() || "").includes(searchTerm) ||
      (supplier.contact?.toLowerCase() || "").includes(searchTerm) ||
      (supplier.phone?.toLowerCase() || "").includes(searchTerm) ||
      (supplier.address?.toLowerCase() || "").includes(searchTerm)
    );
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSuppliers.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Open modal for adding new supplier
  const handleAddSupplier = () => {
    setModalMode("add");
    setSelectedSupplier(null);
    setFormData({
      name: "",
      contact: "",
      phone: "",
      address: "",
    });
    setShowModal(true);
  };

  // Open modal for editing supplier
  const handleEditSupplier = (supplier) => {
    setModalMode("edit");
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name || "",
      contact: supplier.contact || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
    });
    setShowModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSupplier(null);
    setFormData({
      name: "",
      contact: "",
      phone: "",
      address: "",
    });
  };

  // Submit form (add or edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    // Shoe loading alert
    Toast.fire({
      title:
        modalMode === "add" ? "Adding Supplier..." : "Updating Supplier...",
      text: "Please wait",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const url =
        modalMode === "add"
          ? "http://localhost:5000/api/suppliers"
          : `http://localhost:5000/api/suppliers/${selectedSupplier._id}`;

      const method = modalMode === "add" ? "post" : "put";

      await axios[method](url, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          "Content-Type": "application/json",
        },
      });

      // Success alert
      Toast.fire({
        icon: "success",
        title: "Success!",
        text: `Supplier ${
          modalMode === "add" ? "added" : "updated"
        } successfully!`,
      });

      handleCloseModal();
      fetchSuppliers();
    } catch (error) {
      console.error(
        `Error ${modalMode === "add" ? "adding" : "updating"} supplier:`,
        error
      );

      handleCloseModal();
    } finally {
      setFormLoading(false);
    }
  };

  // Handle supplier delete
  const handleDeleteSupplier = async (id) => {
    const supplier = suppliers.find((cat) => cat._id === id);

    // Show confirmation
    const result = await Swal.fire({
      title: "Are you sure?",
      html: `You want to delete category <strong>"${supplier?.name}"</strong>?`,
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
        await axios.delete(`http://localhost:5000/api/supliers/${id}`, {
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

        fetchSuppliers();
      } catch (error) {
        console.error("Error deleting supplier: ", error);
      }
    }
  };

  return (
    <div className="supplier-page">
      {/* Breadcrumb */}
      <CRow className="mb-3">
        <CCol>
          <CBreadcrumb>
            <CBreadcrumbItem href="/dashboard">Home</CBreadcrumbItem>
            <CBreadcrumbItem>Supplier</CBreadcrumbItem>
            <CBreadcrumbItem active>Data Supplier</CBreadcrumbItem>
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
                      onClick={handleAddSupplier}
                      title="Add new supplier"
                    >
                      <CIcon icon={cilPlus} className="me-1" />
                      Add Supplier
                    </CButton>
                    <CButton
                      color="secondary"
                      onClick={fetchSuppliers}
                      disabled={loading}
                      title="Refresh data"
                    >
                      <CIcon icon={cilReload} />
                    </CButton>
                  </CButtonGroup>
                </CCol>
              </CRow>

              {/* Suppliers Table */}
              {loading ? (
                <div className="d-flex justify-content-center align-items-center py-5">
                  <CSpinner color="primary" className="me-2" />
                  <span>Loading supplier...</span>
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
                            Supplier Name
                          </CTableHeaderCell>
                          <CTableHeaderCell scope="col">
                            Contact
                          </CTableHeaderCell>
                          <CTableHeaderCell scope="col">Phone</CTableHeaderCell>
                          <CTableHeaderCell scope="col">
                            Address
                          </CTableHeaderCell>
                          <CTableHeaderCell scope="col" className="text-center">
                            Actions
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
                                  {supplier.contact || "No contact"}
                                </span>
                              </CTableDataCell>
                              <CTableDataCell>
                                <span className="text-muted">
                                  {supplier.phone || "No phone"}
                                </span>
                              </CTableDataCell>
                              <CTableDataCell>
                                <span className="text-muted">
                                  {supplier.address || "No address"}
                                </span>
                              </CTableDataCell>
                              <CTableDataCell className="text-center">
                                <CButtonGroup size="sm">
                                  <CButton
                                    color="info"
                                    variant="outline"
                                    onClick={() => handleEditSupplier(supplier)}
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
                                    title="Delete Supplier"
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
                                <h6>No supplier found</h6>
                                {search ? (
                                  <p className="mb-2">
                                    No results for "{search}"
                                  </p>
                                ) : (
                                  <p className="mb-2">
                                    Start by adding your first supplier
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
                        {filteredSuppliers.length > 0
                          ? indexOfFirstItem + 1
                          : 0}{" "}
                        to {Math.min(indexOfLastItem, filteredSuppliers.length)}{" "}
                        of {filteredSuppliers.length} entries{" "}
                        {search &&
                          ` (filtered from ${suppliers.length} total) `}
                      </div>

                      <CPagination aria-label="Supplier pagination">
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
                      Showing {filteredSuppliers.length} of {suppliers.length}{" "}
                      suppliers
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
            {modalMode === "add" ? "Add New Supplier" : "Edit Supplier"}
          </CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleSubmit}>
          <CModalBody>
            <CRow>
              <CCol md={12}>
                <div className="mb-3">
                  <CFormLabel htmlFor="name">
                    Supplier Name <span className="text-danger">*</span>
                  </CFormLabel>
                  <CFormInput
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter supplier name"
                    maxLength={50}
                    required
                    className="border-primary"
                  />
                </div>
              </CCol>
            </CRow>

            <CRow>
              <CCol md={12}>
                <div className="mb-3">
                  <CFormLabel htmlFor="contact">Contact</CFormLabel>
                  <CFormInput
                    id="contact"
                    name="contact"
                    rows={4}
                    value={formData.contact}
                    onChange={handleInputChange}
                    placeholder="Enter supplier contact"
                    maxLength={20}
                    className="border-primary"
                  />
                </div>
              </CCol>
            </CRow>

            <CRow>
              <CCol md={12}>
                <div className="mb-3">
                  <CFormLabel htmlFor="phone">Phone</CFormLabel>
                  <CFormInput
                    id="phone"
                    name="phone"
                    rows={4}
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter supplier phone"
                    maxLength={20}
                    className="border-primary"
                  />
                </div>
              </CCol>
            </CRow>

            <CRow>
              <CCol md={12}>
                <div className="mb-3">
                  <CFormLabel htmlFor="address">Address</CFormLabel>
                  <CFormTextarea
                    id="address"
                    name="address"
                    rows={4}
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter supplier address"
                    maxLength={100}
                    className="border-primary"
                  />
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
              {modalMode === "add" ? "Add Supplier" : "Update Supplier"}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>
    </div>
  );
};

export default Supplier;
