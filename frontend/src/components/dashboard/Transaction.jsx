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
  FileText,
  ArrowUpCircle,
  ArrowDownCircle,
  DollarSign,
  Plus,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const TransactionDashboard = ({
  transactionStats,
  trends,
  transactions,
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

  const getTransactionTypeDisplay = (type) => {
    switch (type) {
      case "pembelian":
        return { label: "Masuk", color: "success" };
      case "penjualan":
        return { label: "Keluar", color: "danger" };
      default:
        return { label: type || "N/A", color: "secondary" };
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Tanggal Tidak Valid";
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getProductName = (product) => {
    if (!product) return "Tidak Tersedia";
    if (typeof product === "string") return product;
    if (typeof product === "object" && product.name) return product.name;
    return "Tidak Tersedia";
  };

  return (
    <>
      {/* Kartu Statistik Transaksi */}
      <CRow className="mb-4">
        <CCol sm={6} lg={3}>
          <CCard className="mb-3">
            <CCardBody className="text-center">
              <FileText size={48} className="text-primary mb-2" />
              <h3 className="text-primary">
                {transactionStats.totalTransactions}
              </h3>
              <p className="text-medium-emphasis mb-1">Total Transaksi</p>
              <div className="d-flex align-items-center justify-content-center">
                {React.createElement(getTrendIcon(trends.transactionGrowth), {
                  className: `text-${getTrendColor(
                    trends.transactionGrowth
                  )} me-1`,
                  size: 16,
                })}
                <CBadge color={getTrendColor(trends.transactionGrowth)}>
                  {trends.transactionGrowth > 0 ? "+" : ""}
                  {trends.transactionGrowth}%
                </CBadge>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol sm={6} lg={3}>
          <CCard className="mb-3">
            <CCardBody className="text-center">
              <ArrowUpCircle size={48} className="text-success mb-2" />
              <h3 className="text-success">
                {transactionStats.incomingTransactions}
              </h3>
              <p className="text-medium-emphasis mb-1">Transaksi Masuk</p>
              <small className="text-muted">
                {transactionStats.totalIncomingQty} item
              </small>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol sm={6} lg={3}>
          <CCard className="mb-3">
            <CCardBody className="text-center">
              <ArrowDownCircle size={48} className="text-danger mb-2" />
              <h3 className="text-danger">
                {transactionStats.outgoingTransactions}
              </h3>
              <p className="text-medium-emphasis mb-1">Transaksi Keluar</p>
              <small className="text-muted">
                {transactionStats.totalOutgoingQty} item
              </small>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol sm={6} lg={3}>
          <CCard className="mb-3">
            <CCardBody className="text-center">
              <DollarSign size={48} className="text-info mb-2" />
              <h3 className="text-info">
                {formatCurrency(transactionStats.totalValue)}
              </h3>
              <p className="text-medium-emphasis mb-1">Total Nilai</p>
              <small className="text-muted">
                {formatCurrency(transactionStats.todayValue)} hari ini
              </small>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Tabel Riwayat Transaksi */}
      <CCard className="mb-4">
        <CCardHeader>
          <div className="d-flex justify-content-between align-items-center">
            <h6>Riwayat Transaksi</h6>
          </div>
        </CCardHeader>
        <CCardBody>
          <CTable striped hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Tanggal</CTableHeaderCell>
                <CTableHeaderCell>Produk</CTableHeaderCell>
                <CTableHeaderCell>Jenis</CTableHeaderCell>
                <CTableHeaderCell className="text-center">
                  Jumlah
                </CTableHeaderCell>
                <CTableHeaderCell className="text-end">Nilai</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {transactions.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan="6" className="text-center">
                    Tidak ada transaksi ditemukan
                  </CTableDataCell>
                </CTableRow>
              ) : (
                transactions.slice(0, 10).map((transaction) => {
                  const typeDisplay = getTransactionTypeDisplay(
                    transaction.type
                  );
                  return (
                    <CTableRow key={transaction._id}>
                      <CTableDataCell>
                        {formatDate(transaction.createdAt)}
                      </CTableDataCell>
                      <CTableDataCell>
                        {getProductName(transaction.product)}
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={typeDisplay.color}>
                          {typeDisplay.label}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell className="text-center">
                        {transaction.quantity}
                      </CTableDataCell>
                      <CTableDataCell className="text-end">
                        {transaction.price
                          ? formatCurrency(
                              transaction.price * transaction.quantity
                            )
                          : "-"}
                      </CTableDataCell>
                    </CTableRow>
                  );
                })
              )}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>
    </>
  );
};

export default TransactionDashboard;
