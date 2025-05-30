import React, { useState, useEffect } from "react";
import {
  CSidebar,
  CSidebarNav,
  CSidebarBrand,
  CSidebarToggler,
  CContainer,
  CHeader,
  CHeaderNav,
  CHeaderToggler,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilMenu } from "@coreui/icons";
import { AppHeaderDropdown } from "../components/header";
import SidebarContent from "../components/sidebar/SidebarContent";
import { Outlet } from "react-router-dom";

const Layout = () => {
  const [sidebarShow, setSidebarShow] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);
      // Auto-hide sidebar on mobile, show on desktop
      if (mobile) {
        setSidebarShow(false);
      } else {
        setSidebarShow(true);
      }
    };

    handleResize(); // Set initial state
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="d-flex">
      {/* Mobile overlay to close sidebar when clicked outside */}
      {sidebarShow && isMobile && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarShow(false)}
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0, // Changed from "250px" to 0 to cover entire screen
            zIndex: 1025,
            backgroundColor: "rgba(0,0,0,0.3)",
          }}
        />
      )}

      {/* Sidebar */}
      <CSidebar
        position="fixed"
        visible={sidebarShow}
        onVisibleChange={(visible) => {
          setSidebarShow(visible);
        }}
        className={sidebarShow && isMobile ? "c-sidebar-show" : ""}
        style={{
          zIndex: 1030, // Ensure sidebar is above overlay
          width: "250px", // Explicit width for sidebar
        }}
      >
        <CSidebarBrand className="d-none d-md-flex" to="/">
          <div className="sidebar-brand-full">Inventory System</div>
          <div className="sidebar-brand-narrow">IS</div>
        </CSidebarBrand>
        <CSidebarNav>
          <SidebarContent />
        </CSidebarNav>
        <CSidebarToggler
          className="d-none d-lg-flex"
          onClick={() => setSidebarShow(!sidebarShow)}
        />
      </CSidebar>

      {/* Main content area */}
      <div
        className="wrapper d-flex flex-column min-vh-100 bg-light"
        style={{
          marginLeft: sidebarShow && !isMobile ? "250px" : "0",
          transition: "margin-left 0.3s",
          width: "100%", // Ensure content area takes full width
        }}
      >
        {/* Header with hamburger menu */}
        <CHeader position="sticky" className="mb-4">
          <CContainer fluid>
            <CHeaderToggler
              className="ps-1"
              onClick={() => setSidebarShow(!sidebarShow)}
            >
              <CIcon icon={cilMenu} size="lg" />
            </CHeaderToggler>
            <CHeaderNav className="ms-auto">
              <AppHeaderDropdown />
            </CHeaderNav>
          </CContainer>
        </CHeader>

        {/* Content */}
        <div className="body flex-grow-1 px-3">
          <CContainer fluid>
            <Outlet />
          </CContainer>
        </div>

        {/* Footer */}
        <CContainer fluid>
          <div className="footer d-flex flex-wrap justify-content-between align-items-center py-2 my-4 border-top">
            <p className="col-md-4 mb-0 text-muted">
              © 2025 Inventory Management System
            </p>
          </div>
        </CContainer>
      </div>
    </div>
  );
};

export default Layout;
