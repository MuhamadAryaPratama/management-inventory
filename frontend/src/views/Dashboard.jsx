import React, { useState, useEffect } from "react";
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CBreadcrumb,
  CBreadcrumbItem,
  CSpinner,
  CAlert,
  CButton,
  CButtonGroup,
  CBadge,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import {
  cilReload,
  cilCart,
  cilLayers,
  cilWarning,
  cilCheckCircle,
  cilBarChart,
  cilGraph,
} from "@coreui/icons";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    stockReport: null,
    transactionsReport: null,
    eoqReport: null,
    ropReport: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch dashboard data from report APIs
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = {
        Authorization: `Bearer ${localStorage.getItem("userToken")}`,
      };

      // Fetch all reports concurrently
      const [stockResponse, transactionsResponse, eoqResponse, ropResponse] =
        await Promise.allSettled([
          axios.get("http://localhost:5000/api/reports/stock", { headers }),
          axios.get("http://localhost:5000/api/reports/transactions", {
            headers,
          }),
          axios.get("http://localhost:5000/api/reports/eoq", { headers }),
          axios.get("http://localhost:5000/api/reports/rop", { headers }),
        ]);

      setDashboardData({
        stockReport:
          stockResponse.status === "fulfilled"
            ? stockResponse.value.data
            : null,
        transactionsReport:
          transactionsResponse.status === "fulfilled"
            ? transactionsResponse.value.data
            : null,
        eoqReport:
          eoqResponse.status === "fulfilled" ? eoqResponse.value.data : null,
        ropReport:
          ropResponse.status === "fulfilled" ? ropResponse.value.data : null,
      });

      // Check if any requests failed
      const failedRequests = [
        stockResponse,
        transactionsResponse,
        eoqResponse,
        ropResponse,
      ].filter((response) => response.status === "rejected");

      if (failedRequests.length > 0) {
        console.warn("Some report requests failed:", failedRequests);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(
        `Failed to load dashboard data: ${
          err.response?.data?.message || err.message
        }. Please try again later.`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    fetchDashboardData();
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

  const handleViewProducts = () => {
    navigate("/product-management");
  };

  const handleViewReports = () => {
    navigate("/reports");
  };

  const handleViewTransactions = () => {
    navigate("/transactions");
  };

  // Get summary statistics from reports
  const getStockSummary = () => {
    if (!dashboardData.stockReport)
      return { total: 0, lowStock: 0, outOfStock: 0 };

    const products =
      dashboardData.stockReport.products || dashboardData.stockReport || [];
    return {
      total: products.length,
      lowStock: products.filter(
        (p) => p.currentStock > 0 && p.currentStock < 10
      ).length,
      outOfStock: products.filter((p) => p.currentStock <= 0).length,
    };
  };

  const getTransactionSummary = () => {
    if (!dashboardData.transactionsReport) return { total: 0, recent: [] };

    const transactions =
      dashboardData.transactionsReport.transactions ||
      dashboardData.transactionsReport ||
      [];
    return {
      total: transactions.length,
      recent: transactions.slice(0, 5),
    };
  };

  const getLowStockProducts = () => {
    if (!dashboardData.stockReport) return [];

    const products =
      dashboardData.stockReport.products || dashboardData.stockReport || [];
    return products.filter((p) => p.currentStock < 10).slice(0, 5);
  };

  const getRecentProducts = () => {
    if (!dashboardData.stockReport) return [];

    const products =
      dashboardData.stockReport.products || dashboardData.stockReport || [];
    return products.slice(0, 5);
  };

  const stockSummary = getStockSummary();
  const transactionSummary = getTransactionSummary();
  const lowStockProducts = getLowStockProducts();
  const recentProducts = getRecentProducts();

  return (
    <>
      <CRow>
        <CCol>
          <CBreadcrumb className="mb-3">
            <CBreadcrumbItem href="#">Home</CBreadcrumbItem>
            <CBreadcrumbItem active>Dashboard</CBreadcrumbItem>
          </CBreadcrumb>
        </CCol>
      </CRow>

      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <div className="d-flex justify-content-between align-items-center">
                <h4>Inventory Management Dashboard</h4>
                <CButton color="secondary" onClick={handleRefresh}>
                  <CIcon icon={cilReload} className="me-1" />
                  Refresh
                </CButton>
              </div>
            </CCardHeader>
            <CCardBody>
              {error && (
                <CAlert
                  color="danger"
                  dismissible
                  onClose={() => setError(null)}
                  className="mb-3"
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
                  {/* Statistics Cards */}
                  <CRow className="mb-4">
                    <CCol sm={6} lg={3}>
                      <CCard className="mb-3">
                        <CCardBody className="text-center">
                          <CIcon
                            icon={cilCart}
                            size="3xl"
                            className="text-primary mb-2"
                          />
                          <h3 className="text-primary">{stockSummary.total}</h3>
                          <p className="text-medium-emphasis mb-0">
                            Total Products
                          </p>
                          <CButton
                            color="primary"
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={handleViewProducts}
                          >
                            View Products
                          </CButton>
                        </CCardBody>
                      </CCard>
                    </CCol>
                    <CCol sm={6} lg={3}>
                      <CCard className="mb-3">
                        <CCardBody className="text-center">
                          <CIcon
                            icon={cilBarChart}
                            size="3xl"
                            className="text-success mb-2"
                          />
                          <h3 className="text-success">
                            {transactionSummary.total}
                          </h3>
                          <p className="text-medium-emphasis mb-0">
                            Total Transactions
                          </p>
                          <CButton
                            color="success"
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={handleViewTransactions}
                          >
                            View Transactions
                          </CButton>
                        </CCardBody>
                      </CCard>
                    </CCol>
                    <CCol sm={6} lg={3}>
                      <CCard className="mb-3">
                        <CCardBody className="text-center">
                          <CIcon
                            icon={cilWarning}
                            size="3xl"
                            className="text-warning mb-2"
                          />
                          <h3 className="text-warning">
                            {stockSummary.lowStock}
                          </h3>
                          <p className="text-medium-emphasis mb-0">
                            Low Stock Alert
                          </p>
                          <CBadge color="warning" className="mt-2">
                            Needs Attention
                          </CBadge>
                        </CCardBody>
                      </CCard>
                    </CCol>
                    <CCol sm={6} lg={3}>
                      <CCard className="mb-3">
                        <CCardBody className="text-center">
                          <CIcon
                            icon={cilGraph}
                            size="3xl"
                            className="text-info mb-2"
                          />
                          <h3 className="text-info">
                            {stockSummary.outOfStock}
                          </h3>
                          <p className="text-medium-emphasis mb-0">
                            Out of Stock
                          </p>
                          <CBadge color="danger" className="mt-2">
                            Critical
                          </CBadge>
                        </CCardBody>
                      </CCard>
                    </CCol>
                  </CRow>

                  {/* Reports Summary */}
                  <CRow className="mb-4">
                    <CCol sm={6} lg={3}>
                      <CCard className="mb-3">
                        <CCardBody className="text-center">
                          <h6 className="text-medium-emphasis">EOQ Report</h6>
                          <CBadge
                            color={
                              dashboardData.eoqReport ? "success" : "secondary"
                            }
                          >
                            {dashboardData.eoqReport ? "Available" : "No Data"}
                          </CBadge>
                        </CCardBody>
                      </CCard>
                    </CCol>
                    <CCol sm={6} lg={3}>
                      <CCard className="mb-3">
                        <CCardBody className="text-center">
                          <h6 className="text-medium-emphasis">ROP Report</h6>
                          <CBadge
                            color={
                              dashboardData.ropReport ? "success" : "secondary"
                            }
                          >
                            {dashboardData.ropReport ? "Available" : "No Data"}
                          </CBadge>
                        </CCardBody>
                      </CCard>
                    </CCol>
                    <CCol sm={12} lg={6}>
                      <CCard className="mb-3">
                        <CCardBody className="text-center">
                          <CButton
                            color="info"
                            variant="outline"
                            onClick={handleViewReports}
                          >
                            <CIcon icon={cilBarChart} className="me-1" />
                            View Detailed Reports
                          </CButton>
                        </CCardBody>
                      </CCard>
                    </CCol>
                  </CRow>

                  {/* Low Stock Products Alert */}
                  {lowStockProducts.length > 0 && (
                    <CRow className="mb-4">
                      <CCol xs={12}>
                        <CCard>
                          <CCardHeader>
                            <h5 className="text-warning">
                              <CIcon icon={cilWarning} className="me-2" />
                              Low Stock Alert
                            </h5>
                          </CCardHeader>
                          <CCardBody>
                            <CTable hover responsive>
                              <CTableHead color="light">
                                <CTableRow>
                                  <CTableHeaderCell scope="col">
                                    Product Name
                                  </CTableHeaderCell>
                                  <CTableHeaderCell scope="col">
                                    Category
                                  </CTableHeaderCell>
                                  <CTableHeaderCell scope="col">
                                    Current Stock
                                  </CTableHeaderCell>
                                  <CTableHeaderCell scope="col">
                                    Status
                                  </CTableHeaderCell>
                                </CTableRow>
                              </CTableHead>
                              <CTableBody>
                                {lowStockProducts.map((product) => (
                                  <CTableRow key={product._id}>
                                    <CTableDataCell>
                                      {product.name}
                                    </CTableDataCell>
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
                                      <CBadge color="warning">Low Stock</CBadge>
                                    </CTableDataCell>
                                  </CTableRow>
                                ))}
                              </CTableBody>
                            </CTable>
                            <div className="text-center mt-3">
                              <CButton
                                color="warning"
                                variant="outline"
                                onClick={handleViewProducts}
                              >
                                View All Products
                              </CButton>
                            </div>
                          </CCardBody>
                        </CCard>
                      </CCol>
                    </CRow>
                  )}

                  {/* Recent Transactions */}
                  {transactionSummary.recent.length > 0 && (
                    <CRow className="mb-4">
                      <CCol xs={12}>
                        <CCard>
                          <CCardHeader>
                            <h5>Recent Transactions</h5>
                          </CCardHeader>
                          <CCardBody>
                            <CTable hover responsive>
                              <CTableHead color="light">
                                <CTableRow>
                                  <CTableHeaderCell scope="col">
                                    Type
                                  </CTableHeaderCell>
                                  <CTableHeaderCell scope="col">
                                    Product
                                  </CTableHeaderCell>
                                  <CTableHeaderCell scope="col">
                                    Quantity
                                  </CTableHeaderCell>
                                  <CTableHeaderCell scope="col">
                                    Date
                                  </CTableHeaderCell>
                                </CTableRow>
                              </CTableHead>
                              <CTableBody>
                                {transactionSummary.recent.map(
                                  (transaction, index) => (
                                    <CTableRow key={transaction._id || index}>
                                      <CTableDataCell>
                                        <CBadge
                                          color={
                                            transaction.type === "in"
                                              ? "success"
                                              : "primary"
                                          }
                                        >
                                          {transaction.type === "in"
                                            ? "Stock In"
                                            : "Stock Out"}
                                        </CBadge>
                                      </CTableDataCell>
                                      <CTableDataCell>
                                        {transaction.product?.name ||
                                          transaction.productName ||
                                          "N/A"}
                                      </CTableDataCell>
                                      <CTableDataCell>
                                        {transaction.quantity}
                                      </CTableDataCell>
                                      <CTableDataCell>
                                        {transaction.date
                                          ? new Date(
                                              transaction.date
                                            ).toLocaleDateString()
                                          : "N/A"}
                                      </CTableDataCell>
                                    </CTableRow>
                                  )
                                )}
                              </CTableBody>
                            </CTable>
                            <div className="text-center mt-3">
                              <CButton
                                color="success"
                                variant="outline"
                                onClick={handleViewTransactions}
                              >
                                View All Transactions
                              </CButton>
                            </div>
                          </CCardBody>
                        </CCard>
                      </CCol>
                    </CRow>
                  )}

                  {/* Stock Overview */}
                  <CRow>
                    <CCol xs={12}>
                      <CCard>
                        <CCardHeader>
                          <h5>Stock Overview</h5>
                        </CCardHeader>
                        <CCardBody>
                          {recentProducts.length > 0 ? (
                            <CTable hover responsive>
                              <CTableHead color="light">
                                <CTableRow>
                                  <CTableHeaderCell scope="col">
                                    Name
                                  </CTableHeaderCell>
                                  <CTableHeaderCell scope="col">
                                    Category
                                  </CTableHeaderCell>
                                  <CTableHeaderCell scope="col">
                                    Stock
                                  </CTableHeaderCell>
                                  <CTableHeaderCell scope="col">
                                    Price
                                  </CTableHeaderCell>
                                </CTableRow>
                              </CTableHead>
                              <CTableBody>
                                {recentProducts.map((product) => (
                                  <CTableRow key={product._id}>
                                    <CTableDataCell>
                                      {product.name}
                                    </CTableDataCell>
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
                                      {product.price
                                        ? new Intl.NumberFormat("id-ID", {
                                            style: "currency",
                                            currency: "IDR",
                                          }).format(product.price)
                                        : "N/A"}
                                    </CTableDataCell>
                                  </CTableRow>
                                ))}
                              </CTableBody>
                            </CTable>
                          ) : (
                            <div className="text-center text-medium-emphasis py-4">
                              <p>No stock data available</p>
                              <CButton
                                color="primary"
                                onClick={handleViewProducts}
                              >
                                Manage Products
                              </CButton>
                            </div>
                          )}
                        </CCardBody>
                      </CCard>
                    </CCol>
                  </CRow>
                </>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  );
};

export default Dashboard;
