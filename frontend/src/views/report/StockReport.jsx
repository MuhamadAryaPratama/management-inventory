import React, { useState, useEffect, useRef } from "react";
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
import {
  Package,
  Eye,
  Download,
  Filter,
  Home,
  List,
  Database,
  Box,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Search,
  RefreshCw,
  Info,
  FileText,
} from "lucide-react";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const StockReport = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const pdfRef = useRef();

  // Mengambil data produk dari API
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
        setFilteredProducts(response.data);
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
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Mendapatkan status stok
  const getStockStatus = (currentStock, minStock) => {
    if (currentStock === 0) return "out-of-stock";
    if (currentStock <= minStock) return "low-stock";
    return "in-stock";
  };

  // Mendapatkan warna status untuk CoreUI
  const getStatusColor = (status) => {
    switch (status) {
      case "out-of-stock":
        return "danger";
      case "low-stock":
        return "warning";
      case "in-stock":
        return "success";
      default:
        return "secondary";
    }
  };

  // Mendapatkan teks status
  const getStatusText = (status) => {
    switch (status) {
      case "out-of-stock":
        return "Stok Habis";
      case "low-stock":
        return "Stok Rendah";
      case "in-stock":
        return "Stok Tersedia";
      default:
        return "Tidak Diketahui";
    }
  };

  // Filter dan pencarian produk
  useEffect(() => {
    let filtered = products.filter((product) => {
      const matchesSearch =
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        product.supplier?.name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

      const status = getStockStatus(product.currentStock, product.minStock);
      const matchesFilter = filterStatus === "all" || status === filterStatus;

      return matchesSearch && matchesFilter;
    });

    // Mengurutkan produk
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "name":
          aValue = a.name?.toLowerCase() || "";
          bValue = b.name?.toLowerCase() || "";
          break;
        case "currentStock":
          aValue = a.currentStock || 0;
          bValue = b.currentStock || 0;
          break;
        case "minStock":
          aValue = a.minStock || 0;
          bValue = b.minStock || 0;
          break;
        case "price":
          aValue = a.price || 0;
          bValue = b.price || 0;
          break;
        default:
          aValue = a.name?.toLowerCase() || "";
          bValue = b.name?.toLowerCase() || "";
      }

      return aValue > bValue ? 1 : -1;
    });

    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [products, searchTerm, filterStatus, sortBy]);

  // Menghitung statistik
  const stats = {
    total: products.length,
    inStock: products.filter(
      (p) => getStockStatus(p.currentStock, p.minStock) === "in-stock"
    ).length,
    lowStock: products.filter(
      (p) => getStockStatus(p.currentStock, p.minStock) === "low-stock"
    ).length,
    outOfStock: products.filter(
      (p) => getStockStatus(p.currentStock, p.minStock) === "out-of-stock"
    ).length,
  };

  // Format mata uang
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format tanggal
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchProducts();
  };

  // Handle download PDF
  const downloadPDF = () => {
    const input = pdfRef.current;
    setCurrentPage(1); // Set ke halaman pertama untuk mengambil semua data

    setTimeout(() => {
      html2canvas(input, {
        scale: 2,
        scrollY: -window.scrollY,
        useCORS: true,
      }).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save("laporan_stok.pdf");
      });
    }, 500);
  };

  // Handle export CSV
  const exportToCSV = () => {
    const headers = [
      "No",
      "Nama Produk",
      "Deskripsi",
      "Kategori",
      "Supplier",
      "Harga",
      "Stok Saat Ini",
      "Stok Minimum",
      "Status Stok",
      "Terakhir Diupdate",
      "Diupdate Oleh",
    ];

    const csvContent = [
      headers.join(","), // Header row
      ...filteredProducts.map((product, index) => {
        const status = getStockStatus(product.currentStock, product.minStock);
        const supplierInfo = getSupplierInfo(product.supplier);

        return [
          index + 1,
          `"${product.name.replace(/"/g, '""')}"`,
          `"${(product.description || "-").replace(/"/g, '""')}"`,
          `"${getCategoryName(product.category).replace(/"/g, '""')}"`,
          `"${supplierInfo.name.replace(/"/g, '""')}"`,
          formatCurrency(product.price).replace(/[^\d,-]/g, ""),
          product.currentStock || 0,
          product.minStock || 0,
          getStatusText(status),
          formatDate(product.updatedAt),
          product.updatedBy?.name || "System",
        ].join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", "laporan_stok.csv");
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper function untuk mendapatkan nama kategori
  const getCategoryName = (category) => {
    if (!category) return "Tanpa Kategori";
    return typeof category === "object" ? category.name : category;
  };

  // Helper function untuk mendapatkan info supplier
  const getSupplierInfo = (supplier) => {
    if (!supplier) return { name: "Tanpa Supplier", contact: "-" };
    if (typeof supplier === "object") {
      return {
        name: supplier.name || "Tanpa Supplier",
        contact: supplier.contact || supplier.email || "-",
      };
    }
    return { name: supplier, contact: "-" };
  };

  // Perhitungan pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  return (
    <>
      <div ref={pdfRef}>
        <CRow>
          <CCol>
            <CBreadcrumb className="mb-3">
              <CBreadcrumbItem href="/dashboard">Beranda</CBreadcrumbItem>
              <CBreadcrumbItem>Laporan</CBreadcrumbItem>
              <CBreadcrumbItem active>Laporan Stok Barang</CBreadcrumbItem>
            </CBreadcrumb>
          </CCol>
        </CRow>

        {/* Kartu Statistik */}
        <CRow className="mb-4">
          <CCol sm={6} lg={3}>
            <CCard className="text-white bg-primary">
              <CCardBody className="pb-0 d-flex justify-content-between align-items-start">
                <div>
                  <div className="fs-4 fw-semibold">{stats.total}</div>
                  <div>Total Produk</div>
                </div>
                <Box size={24} />
              </CCardBody>
            </CCard>
          </CCol>
          <CCol sm={6} lg={3}>
            <CCard className="text-white bg-success">
              <CCardBody className="pb-0 d-flex justify-content-between align-items-start">
                <div>
                  <div className="fs-4 fw-semibold">{stats.inStock}</div>
                  <div>Stok Tersedia</div>
                </div>
                <CheckCircle size={24} />
              </CCardBody>
            </CCard>
          </CCol>
          <CCol sm={6} lg={3}>
            <CCard className="text-white bg-warning">
              <CCardBody className="pb-0 d-flex justify-content-between align-items-start">
                <div>
                  <div className="fs-4 fw-semibold">{stats.lowStock}</div>
                  <div>Stok Rendah</div>
                </div>
                <AlertTriangle size={24} />
              </CCardBody>
            </CCard>
          </CCol>
          <CCol sm={6} lg={3}>
            <CCard className="text-white bg-danger">
              <CCardBody className="pb-0 d-flex justify-content-between align-items-start">
                <div>
                  <div className="fs-4 fw-semibold">{stats.outOfStock}</div>
                  <div>Stok Habis</div>
                </div>
                <XCircle size={24} />
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>

        <CRow>
          <CCol xs={12}>
            <CCard className="mb-4">
              <CCardHeader>
                <h5>
                  <Database size={20} className="me-2" />
                  Laporan Stok
                </h5>
                <p className="text-medium-emphasis mb-0">
                  Pantau tingkat persediaan dan status stok Anda
                </p>
              </CCardHeader>
              <CCardBody>
                {/* Filter dan Pencarian */}
                <CRow className="mb-3">
                  <CCol sm={12} md={4} className="mb-2 mb-md-0">
                    <CInputGroup>
                      <CFormInput
                        placeholder="Cari produk, kategori, supplier..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <CButton type="button" color="primary" variant="outline">
                        <Search size={14} />
                      </CButton>
                    </CInputGroup>
                  </CCol>
                  <CCol sm={6} md={2} className="mb-2 mb-md-0">
                    <CFormSelect
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="all">
                        <Filter size={14} className="me-1" />
                        Semua Status
                      </option>
                      <option value="in-stock">Stok Tersedia</option>
                      <option value="low-stock">Stok Rendah</option>
                      <option value="out-of-stock">Stok Habis</option>
                    </CFormSelect>
                  </CCol>
                  <CCol sm={6} md={2} className="mb-2 mb-md-0">
                    <CFormSelect
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="name">Urutkan berdasarkan Nama</option>
                      <option value="currentStock">
                        Urutkan berdasarkan Stok Saat Ini
                      </option>
                      <option value="minStock">
                        Urutkan berdasarkan Stok Minimum
                      </option>
                      <option value="price">Urutkan berdasarkan Harga</option>
                    </CFormSelect>
                  </CCol>
                  <CCol sm={6} md={2} className="mb-2 mb-md-0">
                    <CButton
                      color="info"
                      onClick={exportToCSV}
                      className="w-100"
                    >
                      <FileText size={14} className="me-1" />
                      CSV
                    </CButton>
                  </CCol>
                  <CCol sm={6} md={2} className="d-flex gap-2">
                    <CButton
                      color="success"
                      onClick={downloadPDF}
                      className="flex-fill"
                    >
                      <Download size={14} className="me-1" />
                      PDF
                    </CButton>
                    <CButton color="secondary" onClick={handleRefresh}>
                      <RefreshCw size={14} />
                    </CButton>
                  </CCol>
                </CRow>

                {error && (
                  <CAlert
                    color="danger"
                    dismissible
                    onClose={() => setError(null)}
                  >
                    <div className="d-flex align-items-center">
                      <Info size={16} className="me-2" />
                      {error}
                    </div>
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
                          <CTableHeaderCell scope="col">
                            Produk
                          </CTableHeaderCell>
                          <CTableHeaderCell scope="col">
                            Kategori
                          </CTableHeaderCell>
                          <CTableHeaderCell scope="col">
                            Supplier
                          </CTableHeaderCell>
                          <CTableHeaderCell scope="col">Harga</CTableHeaderCell>
                          <CTableHeaderCell scope="col">
                            Stok Saat Ini
                          </CTableHeaderCell>
                          <CTableHeaderCell scope="col">
                            Stok Minimum
                          </CTableHeaderCell>
                          <CTableHeaderCell scope="col">
                            Status
                          </CTableHeaderCell>
                          <CTableHeaderCell scope="col">
                            Terakhir Diupdate
                          </CTableHeaderCell>
                          <CTableHeaderCell scope="col">Aksi</CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        {currentItems.length > 0 ? (
                          currentItems.map((product, index) => {
                            const status = getStockStatus(
                              product.currentStock,
                              product.minStock
                            );
                            const supplierInfo = getSupplierInfo(
                              product.supplier
                            );
                            return (
                              <CTableRow key={product._id}>
                                <CTableDataCell>
                                  {indexOfFirstItem + index + 1}
                                </CTableDataCell>
                                <CTableDataCell>
                                  <div>
                                    <div className="fw-semibold">
                                      {product.name}
                                    </div>
                                    <div className="text-medium-emphasis small">
                                      {product.description || "-"}
                                    </div>
                                  </div>
                                </CTableDataCell>
                                <CTableDataCell>
                                  {getCategoryName(product.category)}
                                </CTableDataCell>
                                <CTableDataCell>
                                  <div>
                                    <div>{supplierInfo.name}</div>
                                    <div className="text-medium-emphasis small">
                                      {supplierInfo.contact}
                                    </div>
                                  </div>
                                </CTableDataCell>
                                <CTableDataCell>
                                  <div className="fw-semibold">
                                    {formatCurrency(product.price)}
                                  </div>
                                </CTableDataCell>
                                <CTableDataCell>
                                  <div className="fw-bold">
                                    {product.currentStock || 0}
                                  </div>
                                </CTableDataCell>
                                <CTableDataCell>
                                  {product.minStock || 0}
                                </CTableDataCell>
                                <CTableDataCell>
                                  <CBadge color={getStatusColor(status)}>
                                    {getStatusText(status)}
                                  </CBadge>
                                </CTableDataCell>
                                <CTableDataCell>
                                  <div>
                                    <div className="small">
                                      {formatDate(product.updatedAt)}
                                    </div>
                                    <div className="text-medium-emphasis small">
                                      oleh {product.updatedBy?.name || "System"}
                                    </div>
                                  </div>
                                </CTableDataCell>
                                <CTableDataCell>
                                  <CButton
                                    color="info"
                                    variant="outline"
                                    size="sm"
                                  >
                                    <Eye size={14} />
                                  </CButton>
                                </CTableDataCell>
                              </CTableRow>
                            );
                          })
                        ) : (
                          <CTableRow>
                            <CTableDataCell
                              colSpan="10"
                              className="text-center py-4"
                            >
                              <Package
                                size={48}
                                className="text-medium-emphasis mb-2"
                              />
                              <div className="fw-semibold">
                                Tidak ada produk yang ditemukan
                              </div>
                              <div className="text-medium-emphasis small">
                                Coba sesuaikan kriteria pencarian atau filter
                                Anda.
                              </div>
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

                        {Array.from(
                          { length: totalPages },
                          (_, i) => i + 1
                        ).map((page) => (
                          <CPaginationItem
                            key={page}
                            active={page === currentPage}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
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

                    <div className="text-medium-emphasis small">
                      Menampilkan{" "}
                      {filteredProducts.length > 0 ? indexOfFirstItem + 1 : 0}{" "}
                      sampai{" "}
                      {Math.min(indexOfLastItem, filteredProducts.length)} dari{" "}
                      {filteredProducts.length} entri
                    </div>
                  </>
                )}
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </div>
    </>
  );
};

export default StockReport;
