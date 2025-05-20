import React from "react";
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CBreadcrumb,
  CBreadcrumbItem,
} from "@coreui/react";

const Dashboard = () => {
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
        <CCol>
          <CCard>
            <CCardHeader>
              <h4>Dashboard</h4>
            </CCardHeader>
            <CCardBody>
              <p>Welcome to the Inventory Management Dashboard</p>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  );
};

export default Dashboard;
