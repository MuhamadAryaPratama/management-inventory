import React from "react";
import { Navigate } from "react-router-dom";
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CAlert,
  CButton,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilLockLocked, cilArrowLeft } from "@coreui/icons";

const RoleBasedRoute = ({
  children,
  allowedRoles = [],
  redirectTo = "/dashboard",
}) => {
  // Get user role from localStorage
  const getUserRole = () => {
    try {
      // First try to get from userData
      const userData = localStorage.getItem("userData");
      if (userData) {
        const parsedData = JSON.parse(userData);
        return parsedData.role || null;
      }

      // Alternative: if role is stored separately
      const userRole = localStorage.getItem("userRole");
      return userRole;
    } catch (error) {
      console.error("Error getting user role:", error);
      return null;
    }
  };

  const userRole = getUserRole();

  // If no role found, redirect to login
  if (!userRole) {
    return <Navigate to="/login" replace />;
  }

  // If user role is not in allowed roles, show access denied page
  if (!allowedRoles.includes(userRole)) {
    return (
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader className="bg-danger text-white">
              <div className="d-flex align-items-center">
                <CIcon icon={cilLockLocked} className="me-2" />
                <strong>Akses Ditolak</strong>
              </div>
            </CCardHeader>
            <CCardBody className="text-center py-5">
              <CIcon
                icon={cilLockLocked}
                size="4xl"
                className="text-danger mb-4"
              />

              <h4 className="text-danger mb-3">Akses Tidak Diizinkan</h4>

              <CAlert color="warning" className="mb-4">
                <strong>Maaf!</strong> Anda tidak memiliki izin untuk mengakses
                halaman ini.
                <br />
                <small>
                  Role Anda: <strong>{userRole}</strong>
                  <br />
                  Role yang diizinkan:{" "}
                  <strong>{allowedRoles.join(", ")}</strong>
                </small>
              </CAlert>

              <div className="mb-4">
                <p className="text-muted mb-3">
                  Halaman ini hanya dapat diakses oleh:
                </p>
                <ul className="list-unstyled">
                  {allowedRoles.map((role) => (
                    <li key={role} className="mb-1">
                      <span className="badge bg-primary me-2">✓</span>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="d-flex justify-content-center gap-3">
                <CButton
                  color="primary"
                  onClick={() => window.history.back()}
                  className="px-4"
                >
                  <CIcon icon={cilArrowLeft} className="me-1" />
                  Kembali
                </CButton>

                <CButton
                  color="secondary"
                  variant="outline"
                  onClick={() => (window.location.href = "/dashboard")}
                  className="px-4"
                >
                  Dashboard
                </CButton>
              </div>

              <div className="mt-4 pt-4 border-top">
                <small className="text-muted">
                  Jika Anda merasa ini adalah kesalahan, silakan hubungi
                  administrator sistem.
                </small>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    );
  }

  // If user has required role, render the protected component
  return children;
};

export default RoleBasedRoute;
