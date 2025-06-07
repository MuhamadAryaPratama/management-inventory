import React from "react";
import CIcon from "@coreui/icons-react";
import {
  cilHome,
  cilPuzzle,
  cilTags,
  cilFactory,
  cilDrop,
  cilStorage,
  cilCursor,
  cilArrowCircleBottom,
  cilArrowCircleTop,
  cilHistory,
  cilCalculator,
  cilChartLine,
  cilBell,
  cilChartPie,
  cilList,
  cilChart,
  cilUser,
  cilLibraryAdd,
  cilTask,
  cilStar,
} from "@coreui/icons";
import { CNavGroup, CNavItem, CNavTitle } from "@coreui/react";
import { PERMISSIONS } from "../../hooks/useAuth";

const Sidebar = [
  {
    component: CNavItem,
    name: "Dashboard",
    to: "/dashboard",
    icon: <CIcon icon={cilHome} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: "Manajemen Barang",
  },
  {
    component: CNavGroup,
    name: "Produk",
    to: "/product-management",
    icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: "Data Barang",
        to: "/product-management/items",
        icon: <CIcon icon={cilList} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: "Kategori Barang",
        to: "/product-management/categories",
        icon: <CIcon icon={cilTags} customClassName="nav-icon" />,
      },
    ],
  },
  {
    component: CNavGroup,
    name: "Supplier",
    to: "/supplier",
    icon: <CIcon icon={cilDrop} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: "Data Supplier",
        to: "/suplier/suppliers",
        icon: <CIcon icon={cilFactory} customClassName="nav-icon" />,
      },
    ],
  },
  {
    component: CNavTitle,
    name: "Transaksi Barang",
  },
  {
    component: CNavGroup,
    name: "Transaksi Persediaan",
    to: "/inventory-transactions",
    icon: <CIcon icon={cilCursor} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: "Barang Masuk",
        to: "/inventory-transactions/incoming",
        icon: <CIcon icon={cilArrowCircleBottom} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: "Barang Keluar",
        to: "/inventory-transactions/outgoing",
        icon: <CIcon icon={cilArrowCircleTop} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: "Histori Transaksi",
        to: "/inventory-transactions/history",
        icon: <CIcon icon={cilHistory} customClassName="nav-icon" />,
      },
    ],
  },
  {
    component: CNavTitle,
    name: "Perhitungan EOQ & ROP",
  },
  {
    component: CNavGroup,
    name: "EOQ",
    to: "/eoq",
    icon: <CIcon icon={cilCalculator} customClassName="nav-icon" />,
    roles: PERMISSIONS.EOQ_ACCESS,
    items: [
      {
        component: CNavItem,
        name: "Kalkulator EOQ",
        to: "/eoq/calculator",
        icon: <CIcon icon={cilChartLine} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: "Data EOQ Barang",
        to: "/eoq/data",
        icon: <CIcon icon={cilStorage} customClassName="nav-icon" />,
      },
    ],
  },
  {
    component: CNavGroup,
    name: "ROP",
    to: "/rop",
    icon: <CIcon icon={cilBell} customClassName="nav-icon" />,
    roles: PERMISSIONS.ROP_ACCESS,
    items: [
      {
        component: CNavItem,
        name: "Kalkulator ROP",
        to: "/rop/calculator",
        icon: <CIcon icon={cilChart} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: "Data ROP Barang",
        to: "/rop/data",
        icon: <CIcon icon={cilStorage} customClassName="nav-icon" />,
      },
    ],
  },
  {
    component: CNavTitle,
    name: "Laporan",
  },
  {
    component: CNavGroup,
    name: "Laporan",
    to: "/reports",
    icon: <CIcon icon={cilChartPie} customClassName="nav-icon" />,
    roles: PERMISSIONS.REPORT_ACCESS,
    items: [
      {
        component: CNavItem,
        name: "Laporan Stok Barang",
        to: "/reports/stock",
        icon: <CIcon icon={cilList} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: "Laporan Transaksi",
        to: "/reports/transactions",
        icon: <CIcon icon={cilHistory} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: "Laporan EOQ & ROP",
        to: "/reports/eoq-rop",
        icon: <CIcon icon={cilChart} customClassName="nav-icon" />,
      },
    ],
  },
  {
    component: CNavTitle,
    name: "Manajemen Pengguna",
  },
  {
    component: CNavGroup,
    name: "Pengguna",
    to: "/user-management",
    icon: <CIcon icon={cilStar} customClassName="nav-icon" />,
    roles: PERMISSIONS.USER_MANAGEMENT,
    items: [
      {
        component: CNavItem,
        name: "Data Pengguna",
        to: "/user-management/users",
        icon: <CIcon icon={cilUser} customClassName="nav-icon" />,
      },
    ],
  },
  {
    component: CNavTitle,
    name: "Log Aktivitas",
  },
  {
    component: CNavGroup,
    name: "Log",
    to: "/logs",
    icon: <CIcon icon={cilHistory} customClassName="nav-icon" />,
    roles: PERMISSIONS.LOG_ACCESS,
    items: [
      {
        component: CNavItem,
        name: "Log Pengguna",
        to: "/logs/users",
        icon: <CIcon icon={cilUser} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: "Log Barang",
        to: "/logs/items",
        icon: <CIcon icon={cilLibraryAdd} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: "Log Transaksi",
        to: "/logs/transactions",
        icon: <CIcon icon={cilHistory} customClassName="nav-icon" />,
      },
    ],
  },
];

export default Sidebar;
