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
  CBadge,
  CProgress,
  CNav,
  CNavItem,
  CNavLink,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
} from "@coreui/react";
import {
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Package,
  Plus,
  FileText,
  ArrowUpCircle,
  ArrowDownCircle,
  Activity,
  Calendar,
  Clock,
  DollarSign,
} from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    currentProducts: [],
    previousProducts: [],
    transactions: [],
    statistics: {
      totalProducts: 0,
      totalStock: 0,
      lowStockProducts: 0,
      outOfStockProducts: 0,
      newProducts: 0,
      stockChanges: 0,
      averageStock: 0,
    },
    transactionStats: {
      totalTransactions: 0,
      todayTransactions: 0,
      incomingTransactions: 0,
      outgoingTransactions: 0,
      totalIncomingQty: 0,
      totalOutgoingQty: 0,
      netMovement: 0,
      recentTransactions: [],
      thisWeekTransactions: 0,
      thisMonthTransactions: 0,
      averageTransactionsPerDay: 0,
      totalValue: 0,
      todayValue: 0,
    },
    trends: {
      productGrowth: 0,
      stockGrowth: 0,
      lowStockTrend: 0,
      transactionGrowth: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const navigate = useNavigate();

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem("userToken") || localStorage.getItem("token");
  };

  // Create axios instance
  const createAxiosInstance = () => {
    const token = getAuthToken();
    return axios.create({
      baseURL: "http://localhost:5000/api",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      timeout: 15000,
    });
  };

  // Calculate product statistics and trends
  const calculateProductStatistics = (
    currentProducts,
    previousProducts = []
  ) => {
    const stats = {
      totalProducts: currentProducts.length,
      totalStock: currentProducts.reduce(
        (sum, product) => sum + (product.currentStock || 0),
        0
      ),
      lowStockProducts: currentProducts.filter(
        (product) => product.currentStock > 0 && product.currentStock < 10
      ).length,
      outOfStockProducts: currentProducts.filter(
        (product) => product.currentStock <= 0
      ).length,
      newProducts: 0,
      stockChanges: 0,
      averageStock: 0,
    };

    // Calculate average stock
    if (currentProducts.length > 0) {
      stats.averageStock = Math.round(
        stats.totalStock / currentProducts.length
      );
    }

    // Calculate trends if we have previous data
    const trends = {
      productGrowth: 0,
      stockGrowth: 0,
      lowStockTrend: 0,
    };

    if (previousProducts.length > 0) {
      const prevStats = {
        totalProducts: previousProducts.length,
        totalStock: previousProducts.reduce(
          (sum, product) => sum + (product.currentStock || 0),
          0
        ),
        lowStockProducts: previousProducts.filter(
          (product) => product.currentStock > 0 && product.currentStock < 10
        ).length,
      };

      // Calculate percentage changes
      trends.productGrowth =
        prevStats.totalProducts > 0
          ? Math.round(
              ((stats.totalProducts - prevStats.totalProducts) /
                prevStats.totalProducts) *
                100
            )
          : 0;

      trends.stockGrowth =
        prevStats.totalStock > 0
          ? Math.round(
              ((stats.totalStock - prevStats.totalStock) /
                prevStats.totalStock) *
                100
            )
          : 0;

      trends.lowStockTrend =
        prevStats.lowStockProducts > 0
          ? Math.round(
              ((stats.lowStockProducts - prevStats.lowStockProducts) /
                prevStats.lowStockProducts) *
                100
            )
          : 0;

      // Find new products
      const previousIds = new Set(previousProducts.map((p) => p._id));
      stats.newProducts = currentProducts.filter(
        (product) => !previousIds.has(product._id)
      ).length;

      // Calculate stock changes
      const currentProductMap = new Map(
        currentProducts.map((p) => [p._id, p.currentStock || 0])
      );
      const previousProductMap = new Map(
        previousProducts.map((p) => [p._id, p.currentStock || 0])
      );

      stats.stockChanges = Array.from(currentProductMap.keys()).reduce(
        (changes, id) => {
          const currentStock = currentProductMap.get(id) || 0;
          const previousStock = previousProductMap.get(id) || 0;
          return changes + Math.abs(currentStock - previousStock);
        },
        0
      );
    }

    return { statistics: stats, trends };
  };

  // Calculate transaction statistics with enhanced real-time data
  const calculateTransactionStatistics = (transactions) => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);

    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    // Filter transactions by time periods
    const todayTransactions = transactions.filter((t) => {
      const transactionDate = new Date(t.createdAt);
      transactionDate.setHours(0, 0, 0, 0);
      return transactionDate.getTime() === today.getTime();
    });

    const thisWeekTransactions = transactions.filter((t) => {
      const transactionDate = new Date(t.createdAt);
      return transactionDate >= thisWeekStart;
    });

    const thisMonthTransactions = transactions.filter((t) => {
      const transactionDate = new Date(t.createdAt);
      return transactionDate >= thisMonthStart;
    });

    // Categorize transactions
    const incomingTransactions = transactions.filter(
      (t) => t.type === "pembelian"
    );
    const outgoingTransactions = transactions.filter(
      (t) => t.type === "penjualan"
    );

    // Calculate quantities
    const totalIncomingQty = incomingTransactions.reduce(
      (sum, t) => sum + (t.quantity || 0),
      0
    );
    const totalOutgoingQty = outgoingTransactions.reduce(
      (sum, t) => sum + (t.quantity || 0),
      0
    );

    // Calculate values (if price data available)
    const totalValue = transactions.reduce(
      (sum, t) => sum + (t.price || 0) * (t.quantity || 0),
      0
    );
    const todayValue = todayTransactions.reduce(
      (sum, t) => sum + (t.price || 0) * (t.quantity || 0),
      0
    );

    // Calculate average transactions per day
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate();
    const averageTransactionsPerDay =
      thisMonthTransactions.length > 0
        ? Math.round((thisMonthTransactions.length / now.getDate()) * 10) / 10
        : 0;

    // Get recent transactions (last 10 for better real-time view)
    const recentTransactions = transactions
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    return {
      totalTransactions: transactions.length,
      todayTransactions: todayTransactions.length,
      thisWeekTransactions: thisWeekTransactions.length,
      thisMonthTransactions: thisMonthTransactions.length,
      incomingTransactions: incomingTransactions.length,
      outgoingTransactions: outgoingTransactions.length,
      totalIncomingQty,
      totalOutgoingQty,
      netMovement: totalIncomingQty - totalOutgoingQty,
      recentTransactions,
      averageTransactionsPerDay,
      totalValue,
      todayValue,
    };
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const api = createAxiosInstance();

      // Fetch products and transactions in parallel
      const [productsResponse, transactionsResponse] = await Promise.all([
        api.get("/products"),
        api.get("/transactions"),
      ]);

      const currentProducts = productsResponse.data || [];
      const transactions = transactionsResponse.data?.data || [];

      // For demo purposes, simulate previous data
      const previousProducts = currentProducts.map((product) => ({
        ...product,
        currentStock: Math.max(
          0,
          product.currentStock - Math.floor(Math.random() * 5)
        ),
      }));

      const { statistics, trends } = calculateProductStatistics(
        currentProducts,
        previousProducts
      );

      const transactionStats = calculateTransactionStatistics(transactions);

      // Calculate transaction growth trend (simplified)
      const transactionGrowth =
        transactions.length > 0 ? Math.floor(Math.random() * 20) - 10 : 0; // Mock growth percentage

      setDashboardData({
        currentProducts,
        previousProducts,
        transactions,
        statistics,
        transactionStats,
        trends: {
          ...trends,
          transactionGrowth,
        },
      });

      setLastUpdate(new Date());
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

    // Set up auto-refresh every 15 seconds for more real-time updates
    const interval = setInterval(fetchDashboardData, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchDashboardData();
  };

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

  const getStockHealthPercentage = () => {
    const { totalProducts, lowStockProducts, outOfStockProducts } =
      dashboardData.statistics;
    if (totalProducts === 0) return 0;
    const healthyProducts =
      totalProducts - lowStockProducts - outOfStockProducts;
    return Math.round((healthyProducts / totalProducts) * 100);
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
      return "Invalid Date";
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getTransactionTypeDisplay = (type) => {
    switch (type) {
      case "pembelian":
        return { label: "Masuk", color: "success", icon: ArrowUpCircle };
      case "penjualan":
        return { label: "Keluar", color: "danger", icon: ArrowDownCircle };
      default:
        return { label: type || "N/A", color: "secondary", icon: Activity };
    }
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const transactionDate = new Date(dateString);
    const diffInMinutes = Math.floor((now - transactionDate) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

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
                <h4>Inventory & Transaction Dashboard</h4>
                <div className="d-flex gap-2 align-items-center">
                  <small className="text-muted">
                    <Clock size={14} className="me-1" />
                    Last update: {formatDate(lastUpdate)}
                  </small>
                  <CBadge color="info" className="me-2">
                    Auto-refresh: 15s
                  </CBadge>
                  <CButton
                    color="secondary"
                    onClick={handleRefresh}
                    disabled={loading}
                  >
                    <RefreshCw
                      className={`me-1 ${loading ? "fa-spin" : ""}`}
                      size={16}
                    />
                    Refresh
                  </CButton>
                </div>
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
                  {/* Navigation Tabs */}
                  <CNav variant="tabs" className="mb-4">
                    <CNavItem>
                      <CNavLink
                        active={activeTab === "overview"}
                        onClick={() => setActiveTab("overview")}
                        style={{ cursor: "pointer" }}
                      >
                        Overview
                      </CNavLink>
                    </CNavItem>
                    <CNavItem>
                      <CNavLink
                        active={activeTab === "products"}
                        onClick={() => setActiveTab("products")}
                        style={{ cursor: "pointer" }}
                      >
                        Products
                      </CNavLink>
                    </CNavItem>
                    <CNavItem>
                      <CNavLink
                        active={activeTab === "transactions"}
                        onClick={() => setActiveTab("transactions")}
                        style={{ cursor: "pointer" }}
                      >
                        Transactions
                      </CNavLink>
                    </CNavItem>
                  </CNav>

                  {/* Overview Tab */}
                  {activeTab === "overview" && (
                    <>
                      {/* Key Metrics Row */}
                      <CRow className="mb-4">
                        <CCol sm={6} lg={3}>
                          <CCard className="mb-3">
                            <CCardBody className="text-center">
                              <ShoppingCart
                                size={32}
                                className="text-primary mb-2"
                              />
                              <h4 className="text-primary">
                                {dashboardData.statistics.totalProducts}
                              </h4>
                              <p className="text-medium-emphasis mb-1">
                                Total Products
                              </p>
                              <CBadge
                                color={getTrendColor(
                                  dashboardData.trends.productGrowth
                                )}
                              >
                                {dashboardData.trends.productGrowth > 0
                                  ? "+"
                                  : ""}
                                {dashboardData.trends.productGrowth}%
                              </CBadge>
                            </CCardBody>
                          </CCard>
                        </CCol>

                        <CCol sm={6} lg={3}>
                          <CCard className="mb-3">
                            <CCardBody className="text-center">
                              <Package size={32} className="text-info mb-2" />
                              <h4 className="text-info">
                                {dashboardData.statistics.totalStock}
                              </h4>
                              <p className="text-medium-emphasis mb-1">
                                Total Stock
                              </p>
                              <CBadge
                                color={getTrendColor(
                                  dashboardData.trends.stockGrowth
                                )}
                              >
                                {dashboardData.trends.stockGrowth > 0
                                  ? "+"
                                  : ""}
                                {dashboardData.trends.stockGrowth}%
                              </CBadge>
                            </CCardBody>
                          </CCard>
                        </CCol>

                        <CCol sm={6} lg={3}>
                          <CCard className="mb-3">
                            <CCardBody className="text-center">
                              <Activity
                                size={32}
                                className="text-success mb-2"
                              />
                              <h4 className="text-success">
                                {
                                  dashboardData.transactionStats
                                    .totalTransactions
                                }
                              </h4>
                              <p className="text-medium-emphasis mb-1">
                                Total Transactions
                              </p>
                              <CBadge
                                color={getTrendColor(
                                  dashboardData.trends.transactionGrowth
                                )}
                              >
                                {dashboardData.trends.transactionGrowth > 0
                                  ? "+"
                                  : ""}
                                {dashboardData.trends.transactionGrowth}%
                              </CBadge>
                            </CCardBody>
                          </CCard>
                        </CCol>

                        <CCol sm={6} lg={3}>
                          <CCard className="mb-3">
                            <CCardBody className="text-center">
                              <Calendar
                                size={32}
                                className="text-warning mb-2"
                              />
                              <h4 className="text-warning">
                                {
                                  dashboardData.transactionStats
                                    .todayTransactions
                                }
                              </h4>
                              <p className="text-medium-emphasis mb-1">
                                Today's Transactions
                              </p>
                              <CBadge color="info">Real-time</CBadge>
                            </CCardBody>
                          </CCard>
                        </CCol>
                      </CRow>

                      {/* Stock Health & Movement */}
                      <CRow className="mb-4">
                        <CCol md={6}>
                          <CCard className="h-100">
                            <CCardHeader>
                              <h6>Stock Health Status</h6>
                            </CCardHeader>
                            <CCardBody>
                              <div className="d-flex justify-content-between mb-3">
                                <span>Overall Health</span>
                                <strong>{getStockHealthPercentage()}%</strong>
                              </div>
                              <CProgress
                                value={getStockHealthPercentage()}
                                color="success"
                                height={12}
                                className="mb-3"
                              />
                              <div className="row text-center">
                                <div className="col">
                                  <div className="text-warning">
                                    <AlertTriangle size={20} />
                                  </div>
                                  <div className="fw-bold">
                                    {dashboardData.statistics.lowStockProducts}
                                  </div>
                                  <small className="text-muted">
                                    Low Stock
                                  </small>
                                </div>
                                <div className="col">
                                  <div className="text-danger">
                                    <CheckCircle size={20} />
                                  </div>
                                  <div className="fw-bold">
                                    {
                                      dashboardData.statistics
                                        .outOfStockProducts
                                    }
                                  </div>
                                  <small className="text-muted">
                                    Out of Stock
                                  </small>
                                </div>
                              </div>
                            </CCardBody>
                          </CCard>
                        </CCol>

                        <CCol md={6}>
                          <CCard className="h-100">
                            <CCardHeader>
                              <h6>Stock Movement</h6>
                            </CCardHeader>
                            <CCardBody>
                              <div className="row text-center">
                                <div className="col">
                                  <div className="text-success">
                                    <ArrowUpCircle size={24} />
                                  </div>
                                  <div className="fw-bold text-success">
                                    +
                                    {
                                      dashboardData.transactionStats
                                        .totalIncomingQty
                                    }
                                  </div>
                                  <small className="text-muted">Items In</small>
                                </div>
                                <div className="col">
                                  <div className="text-danger">
                                    <ArrowDownCircle size={24} />
                                  </div>
                                  <div className="fw-bold text-danger">
                                    -
                                    {
                                      dashboardData.transactionStats
                                        .totalOutgoingQty
                                    }
                                  </div>
                                  <small className="text-muted">
                                    Items Out
                                  </small>
                                </div>
                                <div className="col">
                                  <div className="text-info">
                                    <BarChart3 size={24} />
                                  </div>
                                  <div className="fw-bold text-info">
                                    {dashboardData.transactionStats
                                      .netMovement > 0
                                      ? "+"
                                      : ""}
                                    {dashboardData.transactionStats.netMovement}
                                  </div>
                                  <small className="text-muted">
                                    Net Movement
                                  </small>
                                </div>
                              </div>
                            </CCardBody>
                          </CCard>
                        </CCol>
                      </CRow>

                      {/* Recent Transactions - Real-time */}
                      <CRow className="mb-4">
                        <CCol xs={12}>
                          <CCard>
                            <CCardHeader>
                              <div className="d-flex justify-content-between align-items-center">
                                <h6>Recent Transactions (Real-time)</h6>
                                <div className="d-flex align-items-center">
                                  <CBadge color="success" className="me-2">
                                    <div
                                      className="rounded-circle bg-light me-1"
                                      style={{
                                        width: "8px",
                                        height: "8px",
                                        display: "inline-block",
                                      }}
                                    ></div>
                                    Live
                                  </CBadge>
                                  <CButton
                                    color="primary"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate("/history")}
                                  >
                                    View All
                                  </CButton>
                                </div>
                              </div>
                            </CCardHeader>
                            <CCardBody>
                              {dashboardData.transactionStats.recentTransactions
                                .length === 0 ? (
                                <p className="text-muted text-center mb-0">
                                  No recent transactions
                                </p>
                              ) : (
                                <div className="row">
                                  {dashboardData.transactionStats.recentTransactions.map(
                                    (transaction) => {
                                      const typeDisplay =
                                        getTransactionTypeDisplay(
                                          transaction.type
                                        );
                                      return (
                                        <div
                                          key={transaction._id}
                                          className="col-md-12 mb-2"
                                        >
                                          <div className="d-flex justify-content-between align-items-center p-2 border-start border-3 border-primary">
                                            <div className="d-flex align-items-center">
                                              <CBadge
                                                color={typeDisplay.color}
                                                className="me-2"
                                              >
                                                {React.createElement(
                                                  typeDisplay.icon,
                                                  {
                                                    size: 12,
                                                    className: "me-1",
                                                  }
                                                )}
                                                {typeDisplay.label}
                                              </CBadge>
                                              <div>
                                                <div className="fw-bold">
                                                  {transaction.product?.name ||
                                                    "N/A"}
                                                </div>
                                                <small className="text-muted">
                                                  Qty: {transaction.quantity} |{" "}
                                                  {formatDate(
                                                    transaction.createdAt
                                                  )}
                                                </small>
                                              </div>
                                            </div>
                                            <div className="text-end">
                                              <small className="text-success">
                                                {getTimeAgo(
                                                  transaction.createdAt
                                                )}
                                              </small>
                                              {transaction.price && (
                                                <div className="small text-muted">
                                                  {formatCurrency(
                                                    transaction.price *
                                                      transaction.quantity
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              )}
                            </CCardBody>
                          </CCard>
                        </CCol>
                      </CRow>
                    </>
                  )}

                  {/* Products Tab */}
                  {activeTab === "products" && (
                    <>
                      {/* Product Statistics Cards */}
                      <CRow className="mb-4">
                        <CCol sm={6} lg={3}>
                          <CCard className="mb-3">
                            <CCardBody className="text-center">
                              <ShoppingCart
                                size={48}
                                className="text-primary mb-2"
                              />
                              <h3 className="text-primary">
                                {dashboardData.statistics.totalProducts}
                              </h3>
                              <p className="text-medium-emphasis mb-1">
                                Total Products
                              </p>
                              <div className="d-flex align-items-center justify-content-center">
                                {React.createElement(
                                  getTrendIcon(
                                    dashboardData.trends.productGrowth
                                  ),
                                  {
                                    className: `text-${getTrendColor(
                                      dashboardData.trends.productGrowth
                                    )} me-1`,
                                    size: 16,
                                  }
                                )}
                                <CBadge
                                  color={getTrendColor(
                                    dashboardData.trends.productGrowth
                                  )}
                                >
                                  {dashboardData.trends.productGrowth > 0
                                    ? "+"
                                    : ""}
                                  {dashboardData.trends.productGrowth}%
                                </CBadge>
                              </div>
                            </CCardBody>
                          </CCard>
                        </CCol>

                        <CCol sm={6} lg={3}>
                          <CCard className="mb-3">
                            <CCardBody className="text-center">
                              <Package size={48} className="text-info mb-2" />
                              <h3 className="text-info">
                                {dashboardData.statistics.totalStock}
                              </h3>
                              <p className="text-medium-emphasis mb-1">
                                Total Stock
                              </p>
                              <div className="d-flex align-items-center justify-content-center">
                                {React.createElement(
                                  getTrendIcon(
                                    dashboardData.trends.stockGrowth
                                  ),
                                  {
                                    className: `text-${getTrendColor(
                                      dashboardData.trends.stockGrowth
                                    )} me-1`,
                                    size: 16,
                                  }
                                )}
                                <CBadge
                                  color={getTrendColor(
                                    dashboardData.trends.stockGrowth
                                  )}
                                >
                                  {dashboardData.trends.stockGrowth > 0
                                    ? "+"
                                    : ""}
                                  {dashboardData.trends.stockGrowth}%
                                </CBadge>
                              </div>
                            </CCardBody>
                          </CCard>
                        </CCol>

                        <CCol sm={6} lg={3}>
                          <CCard className="mb-3">
                            <CCardBody className="text-center">
                              <AlertTriangle
                                size={48}
                                className="text-warning mb-2"
                              />
                              <h3 className="text-warning">
                                {dashboardData.statistics.lowStockProducts}
                              </h3>
                              <p className="text-medium-emphasis mb-1">
                                Low Stock Items
                              </p>
                              <div className="d-flex align-items-center justify-content-center">
                                {React.createElement(
                                  getTrendIcon(
                                    dashboardData.trends.lowStockTrend
                                  ),
                                  {
                                    className: `text-${getTrendColor(
                                      -dashboardData.trends.lowStockTrend
                                    )} me-1`,
                                    size: 16,
                                  }
                                )}
                                <CBadge
                                  color={getTrendColor(
                                    -dashboardData.trends.lowStockTrend
                                  )}
                                >
                                  {dashboardData.trends.lowStockTrend > 0
                                    ? "+"
                                    : ""}
                                  {dashboardData.trends.lowStockTrend}%
                                </CBadge>
                              </div>
                            </CCardBody>
                          </CCard>
                        </CCol>

                        <CCol sm={6} lg={3}>
                          <CCard className="mb-3">
                            <CCardBody className="text-center">
                              <CheckCircle
                                size={48}
                                className="text-danger mb-2"
                              />
                              <h3 className="text-danger">
                                {dashboardData.statistics.outOfStockProducts}
                              </h3>
                              <p className="text-medium-emphasis mb-1">
                                Out of Stock
                              </p>
                              <CBadge color="secondary">No trend data</CBadge>
                            </CCardBody>
                          </CCard>
                        </CCol>
                      </CRow>

                      {/* Product List */}
                      <CRow>
                        <CCol xs={12}>
                          <CCard>
                            <CCardHeader>
                              <div className="d-flex justify-content-between align-items-center">
                                <h6>Product Inventory</h6>
                                <CButton
                                  color="primary"
                                  size="sm"
                                  onClick={() => navigate("/products")}
                                >
                                  <Plus size={16} className="me-1" />
                                  Manage Products
                                </CButton>
                              </div>
                            </CCardHeader>
                            <CCardBody>
                              <CTable striped hover responsive>
                                <CTableHead>
                                  <CTableRow>
                                    <CTableHeaderCell>Product</CTableHeaderCell>
                                    <CTableHeaderCell>
                                      Category
                                    </CTableHeaderCell>
                                    <CTableHeaderCell className="text-end">
                                      Current Stock
                                    </CTableHeaderCell>
                                    <CTableHeaderCell className="text-end">
                                      Price
                                    </CTableHeaderCell>
                                    <CTableHeaderCell>Status</CTableHeaderCell>
                                  </CTableRow>
                                </CTableHead>
                                <CTableBody>
                                  {dashboardData.currentProducts.length ===
                                  0 ? (
                                    <CTableRow>
                                      <CTableDataCell
                                        colSpan={5}
                                        className="text-center"
                                      >
                                        No products found
                                      </CTableDataCell>
                                    </CTableRow>
                                  ) : (
                                    dashboardData.currentProducts
                                      .slice(0, 10)
                                      .map((product) => (
                                        <CTableRow key={product._id}>
                                          <CTableDataCell>
                                            <div className="fw-bold">
                                              {product.name}
                                            </div>
                                            <small className="text-muted">
                                              {product.code}
                                            </small>
                                          </CTableDataCell>
                                          <CTableDataCell>
                                            {product.category || "-"}
                                          </CTableDataCell>
                                          <CTableDataCell className="text-end">
                                            {product.currentStock}
                                            {product.currentStock <= 0 && (
                                              <CBadge
                                                color="danger"
                                                className="ms-2"
                                              >
                                                OUT
                                              </CBadge>
                                            )}
                                            {product.currentStock > 0 &&
                                              product.currentStock < 10 && (
                                                <CBadge
                                                  color="warning"
                                                  className="ms-2"
                                                >
                                                  LOW
                                                </CBadge>
                                              )}
                                          </CTableDataCell>
                                          <CTableDataCell className="text-end">
                                            {product.price
                                              ? formatCurrency(product.price)
                                              : "-"}
                                          </CTableDataCell>
                                          <CTableDataCell>
                                            {product.status === "active" ? (
                                              <CBadge color="success">
                                                Active
                                              </CBadge>
                                            ) : (
                                              <CBadge color="secondary">
                                                Inactive
                                              </CBadge>
                                            )}
                                          </CTableDataCell>
                                        </CTableRow>
                                      ))
                                  )}
                                </CTableBody>
                              </CTable>
                            </CCardBody>
                          </CCard>
                        </CCol>
                      </CRow>
                    </>
                  )}

                  {/* Transactions Tab */}
                  {activeTab === "transactions" && (
                    <>
                      {/* Transaction Statistics Cards */}
                      <CRow className="mb-4">
                        <CCol sm={6} lg={3}>
                          <CCard className="mb-3">
                            <CCardBody className="text-center">
                              <FileText
                                size={48}
                                className="text-primary mb-2"
                              />
                              <h3 className="text-primary">
                                {
                                  dashboardData.transactionStats
                                    .totalTransactions
                                }
                              </h3>
                              <p className="text-medium-emphasis mb-1">
                                Total Transactions
                              </p>
                              <div className="d-flex align-items-center justify-content-center">
                                {React.createElement(
                                  getTrendIcon(
                                    dashboardData.trends.transactionGrowth
                                  ),
                                  {
                                    className: `text-${getTrendColor(
                                      dashboardData.trends.transactionGrowth
                                    )} me-1`,
                                    size: 16,
                                  }
                                )}
                                <CBadge
                                  color={getTrendColor(
                                    dashboardData.trends.transactionGrowth
                                  )}
                                >
                                  {dashboardData.trends.transactionGrowth > 0
                                    ? "+"
                                    : ""}
                                  {dashboardData.trends.transactionGrowth}%
                                </CBadge>
                              </div>
                            </CCardBody>
                          </CCard>
                        </CCol>

                        <CCol sm={6} lg={3}>
                          <CCard className="mb-3">
                            <CCardBody className="text-center">
                              <Calendar size={48} className="text-info mb-2" />
                              <h3 className="text-info">
                                {
                                  dashboardData.transactionStats
                                    .todayTransactions
                                }
                              </h3>
                              <p className="text-medium-emphasis mb-1">
                                Today's Transactions
                              </p>
                              <CBadge color="info">Real-time</CBadge>
                            </CCardBody>
                          </CCard>
                        </CCol>

                        <CCol sm={6} lg={3}>
                          <CCard className="mb-3">
                            <CCardBody className="text-center">
                              <ArrowUpCircle
                                size={48}
                                className="text-success mb-2"
                              />
                              <h3 className="text-success">
                                {
                                  dashboardData.transactionStats
                                    .incomingTransactions
                                }
                              </h3>
                              <p className="text-medium-emphasis mb-1">
                                Incoming (Purchases)
                              </p>
                              <small className="text-muted">
                                {
                                  dashboardData.transactionStats
                                    .totalIncomingQty
                                }{" "}
                                items
                              </small>
                            </CCardBody>
                          </CCard>
                        </CCol>

                        <CCol sm={6} lg={3}>
                          <CCard className="mb-3">
                            <CCardBody className="text-center">
                              <ArrowDownCircle
                                size={48}
                                className="text-danger mb-2"
                              />
                              <h3 className="text-danger">
                                {
                                  dashboardData.transactionStats
                                    .outgoingTransactions
                                }
                              </h3>
                              <p className="text-medium-emphasis mb-1">
                                Outgoing (Sales)
                              </p>
                              <small className="text-muted">
                                {
                                  dashboardData.transactionStats
                                    .totalOutgoingQty
                                }{" "}
                                items
                              </small>
                            </CCardBody>
                          </CCard>
                        </CCol>
                      </CRow>

                      {/* Transaction Value Summary */}
                      <CRow className="mb-4">
                        <CCol md={6}>
                          <CCard>
                            <CCardHeader>
                              <h6>Transaction Value</h6>
                            </CCardHeader>
                            <CCardBody>
                              <div className="d-flex justify-content-between mb-3">
                                <span>Total Value</span>
                                <strong>
                                  {formatCurrency(
                                    dashboardData.transactionStats.totalValue
                                  )}
                                </strong>
                              </div>
                              <div className="d-flex justify-content-between">
                                <span>Today's Value</span>
                                <strong className="text-success">
                                  {formatCurrency(
                                    dashboardData.transactionStats.todayValue
                                  )}
                                </strong>
                              </div>
                            </CCardBody>
                          </CCard>
                        </CCol>

                        <CCol md={6}>
                          <CCard>
                            <CCardHeader>
                              <h6>Transaction Frequency</h6>
                            </CCardHeader>
                            <CCardBody>
                              <div className="d-flex justify-content-between mb-3">
                                <span>This Week</span>
                                <strong>
                                  {
                                    dashboardData.transactionStats
                                      .thisWeekTransactions
                                  }
                                </strong>
                              </div>
                              <div className="d-flex justify-content-between">
                                <span>Average Per Day</span>
                                <strong>
                                  {
                                    dashboardData.transactionStats
                                      .averageTransactionsPerDay
                                  }
                                </strong>
                              </div>
                            </CCardBody>
                          </CCard>
                        </CCol>
                      </CRow>

                      {/* Detailed Transaction Table */}
                      <CRow>
                        <CCol xs={12}>
                          <CCard>
                            <CCardHeader>
                              <div className="d-flex justify-content-between align-items-center">
                                <h6>Recent Transaction Details</h6>
                                <div className="d-flex align-items-center">
                                  <CBadge color="success" className="me-2">
                                    <div
                                      className="rounded-circle bg-light me-1"
                                      style={{
                                        width: "8px",
                                        height: "8px",
                                        display: "inline-block",
                                      }}
                                    ></div>
                                    Live Updates
                                  </CBadge>
                                  <CButton
                                    color="primary"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate("/history")}
                                  >
                                    View All
                                  </CButton>
                                </div>
                              </div>
                            </CCardHeader>
                            <CCardBody>
                              <CTable striped hover responsive>
                                <CTableHead>
                                  <CTableRow>
                                    <CTableHeaderCell>Time</CTableHeaderCell>
                                    <CTableHeaderCell>Type</CTableHeaderCell>
                                    <CTableHeaderCell>Product</CTableHeaderCell>
                                    <CTableHeaderCell className="text-end">
                                      Qty
                                    </CTableHeaderCell>
                                    <CTableHeaderCell className="text-end">
                                      Price
                                    </CTableHeaderCell>
                                    <CTableHeaderCell className="text-end">
                                      Total
                                    </CTableHeaderCell>
                                  </CTableRow>
                                </CTableHead>
                                <CTableBody>
                                  {dashboardData.transactionStats
                                    .recentTransactions.length === 0 ? (
                                    <CTableRow>
                                      <CTableDataCell
                                        colSpan={6}
                                        className="text-center"
                                      >
                                        No transactions found
                                      </CTableDataCell>
                                    </CTableRow>
                                  ) : (
                                    dashboardData.transactionStats.recentTransactions.map(
                                      (transaction) => {
                                        const typeDisplay =
                                          getTransactionTypeDisplay(
                                            transaction.type
                                          );
                                        return (
                                          <CTableRow key={transaction._id}>
                                            <CTableDataCell>
                                              <div>
                                                {getTimeAgo(
                                                  transaction.createdAt
                                                )}
                                              </div>
                                              <small className="text-muted">
                                                {formatDate(
                                                  transaction.createdAt
                                                )}
                                              </small>
                                            </CTableDataCell>
                                            <CTableDataCell>
                                              <CBadge color={typeDisplay.color}>
                                                {typeDisplay.label}
                                              </CBadge>
                                            </CTableDataCell>
                                            <CTableDataCell>
                                              {transaction.product?.name ||
                                                "N/A"}
                                              <small className="text-muted d-block">
                                                {transaction.product?.code ||
                                                  ""}
                                              </small>
                                            </CTableDataCell>
                                            <CTableDataCell className="text-end">
                                              {transaction.quantity}
                                            </CTableDataCell>
                                            <CTableDataCell className="text-end">
                                              {transaction.price
                                                ? formatCurrency(
                                                    transaction.price
                                                  )
                                                : "-"}
                                            </CTableDataCell>
                                            <CTableDataCell className="text-end">
                                              {transaction.price
                                                ? formatCurrency(
                                                    transaction.price *
                                                      transaction.quantity
                                                  )
                                                : "-"}
                                            </CTableDataCell>
                                          </CTableRow>
                                        );
                                      }
                                    )
                                  )}
                                </CTableBody>
                              </CTable>
                            </CCardBody>
                          </CCard>
                        </CCol>
                      </CRow>
                    </>
                  )}
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
