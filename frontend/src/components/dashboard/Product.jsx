import React from "react";
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CButton,
  CBadge,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
} from "@coreui/react";
import {
  ShoppingCart,
  Package,
  AlertTriangle,
  CheckCircle,
  Plus,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const ProductDashboard = ({
  statistics,
  trends,
  currentProducts,
  navigate,
}) => {
  const getTrendColor = (value) => {
    if (value > 0) return "success";
    if (value < 0) return "danger";
    return "secondary";
  };

  const getTrendIcon = (value) => {
    if (value > 0) return TrendingUp;
    if (value < 0) return TrendingDown;
    return BarChart3;
  };

  const getCategoryName = (category) => {
    if (!category) return "-";
    if (typeof category === "string") return category;
    if (typeof category === "object" && category.name) return category.name;
    return "-";
  };

  return (
    <>
      {/* Kartu Statistik Produk */}
      <CRow className="mb-4">
        <CCol sm={6} lg={3}>
          <CCard className="mb-3">
            <CCardBody className="text-center">
              <ShoppingCart size={48} className="text-primary mb-2" />
              <h3 className="text-primary">{statistics.totalProducts}</h3>
              <p className="text-medium-emphasis mb-1">Total Produk</p>
              <div className="d-flex align-items-center justify-content-center">
                {React.createElement(getTrendIcon(trends.productGrowth), {
                  className: `text-${getTrendColor(trends.productGrowth)} me-1`,
                  size: 16,
                })}
                <CBadge color={getTrendColor(trends.productGrowth)}>
                  {trends.productGrowth > 0 ? "+" : ""}
                  {trends.productGrowth}%
                </CBadge>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol sm={6} lg={3}>
          <CCard className="mb-3">
            <CCardBody className="text-center">
              <Package size={48} className="text-info mb-2" />
              <h3 className="text-info">{statistics.totalStock}</h3>
              <p className="text-medium-emphasis mb-1">Total Stok</p>
              <div className="d-flex align-items-center justify-content-center">
                {React.createElement(getTrendIcon(trends.stockGrowth), {
                  className: `text-${getTrendColor(trends.stockGrowth)} me-1`,
                  size: 16,
                })}
                <CBadge color={getTrendColor(trends.stockGrowth)}>
                  {trends.stockGrowth > 0 ? "+" : ""}
                  {trends.stockGrowth}%
                </CBadge>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol sm={6} lg={3}>
          <CCard className="mb-3">
            <CCardBody className="text-center">
              <AlertTriangle size={48} className="text-warning mb-2" />
              <h3 className="text-warning">{statistics.lowStockProducts}</h3>
              <p className="text-medium-emphasis mb-1">Produk Stok Rendah</p>
              <div className="d-flex align-items-center justify-content-center">
                {React.createElement(getTrendIcon(trends.lowStockTrend), {
                  className: `text-${getTrendColor(trends.lowStockTrend)} me-1`,
                  size: 16,
                })}
                <CBadge color={getTrendColor(trends.lowStockTrend)}>
                  {trends.lowStockTrend > 0 ? "+" : ""}
                  {trends.lowStockTrend}%
                </CBadge>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol sm={6} lg={3}>
          <CCard className="mb-3">
            <CCardBody className="text-center">
              <CheckCircle size={48} className="text-danger mb-2" />
              <h3 className="text-danger">{statistics.outOfStockProducts}</h3>
              <p className="text-medium-emphasis mb-1">Stok Habis</p>
              <CButton
                color="primary"
                size="sm"
                variant="outline"
                onClick={() => navigate("/products")}
              >
                Kelola Stok
              </CButton>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Tabel Daftar Produk */}
      <CCard className="mb-4">
        <CCardHeader>
          <div className="d-flex justify-content-between align-items-center">
            <h6>Inventori Produk</h6>
          </div>
        </CCardHeader>
        <CCardBody>
          <CTable striped hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Produk</CTableHeaderCell>
                <CTableHeaderCell>Kategori</CTableHeaderCell>
                <CTableHeaderCell className="text-center">
                  Stok
                </CTableHeaderCell>
                <CTableHeaderCell className="text-center">
                  Status
                </CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {currentProducts.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan="5" className="text-center">
                    Tidak ada produk ditemukan
                  </CTableDataCell>
                </CTableRow>
              ) : (
                currentProducts.map((product) => (
                  <CTableRow key={product._id}>
                    <CTableDataCell>
                      <div className="fw-bold">{product.name}</div>
                      <small className="text-muted">{product.code}</small>
                    </CTableDataCell>
                    <CTableDataCell>
                      {getCategoryName(product.category)}
                    </CTableDataCell>
                    <CTableDataCell className="text-center">
                      {product.currentStock || 0}
                    </CTableDataCell>
                    <CTableDataCell className="text-center">
                      {product.currentStock <= 0 ? (
                        <CBadge color="danger">Stok Habis</CBadge>
                      ) : product.currentStock < 10 ? (
                        <CBadge color="warning">Stok Rendah</CBadge>
                      ) : (
                        <CBadge color="success">Tersedia</CBadge>
                      )}
                    </CTableDataCell>
                  </CTableRow>
                ))
              )}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>
    </>
  );
};

export default ProductDashboard;
