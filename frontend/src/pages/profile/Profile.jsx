import React, { useState, useEffect } from "react";
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CSpinner,
  CAlert,
  CCardImage,
  CCardTitle,
  CCardText,
  CListGroup,
  CListGroupItem,
  CButton,
} from "@coreui/react";
import { useNavigate } from "react-router-dom";
import CIcon from "@coreui/icons-react";
import {
  cilUser,
  cilEnvelopeClosed,
  cilPhone,
  cilLocationPin,
  cilCalendar,
  cilPencil,
} from "@coreui/icons";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("userToken");

        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch("http://localhost:5000/api/auth/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (response.status === 401) {
          // Token expired, try to refresh it
          const refreshResponse = await fetch(
            "http://localhost:5000/api/auth/refresh-token",
            {
              method: "POST",
              credentials: "include",
            }
          );

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            localStorage.setItem("userToken", refreshData.token);

            // Try to get user data again with new token
            const retryResponse = await fetch(
              "http://localhost:5000/api/auth/me",
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${refreshData.token}`,
                  "Content-Type": "application/json",
                },
              }
            );

            if (retryResponse.ok) {
              const userData = await retryResponse.json();
              const userInfo = userData.user || userData;
              setUser(userInfo);
              localStorage.setItem("userData", JSON.stringify(userInfo));
              return;
            }
          }

          // If refresh failed, redirect to login
          navigate("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch user profile");
        }

        const userData = await response.json();
        // Handle both response formats: {user: {...}} or direct user object
        const userInfo = userData.user || userData;
        setUser(userInfo);

        // Update localStorage with fresh data
        localStorage.setItem("userData", JSON.stringify(userInfo));
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile data. Please try again later.");

        // Try to load from localStorage as fallback
        const cachedData = localStorage.getItem("userData");
        if (cachedData) {
          try {
            const cachedUser = JSON.parse(cachedData);
            setUser(cachedUser);
            setError(""); // Clear error if we have cached data
          } catch (e) {
            console.error("Error parsing cached data:", e);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();

    // Listen for user data updates
    const handleUserUpdate = () => {
      const userData = localStorage.getItem("userData");
      if (userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (e) {
          console.error("Error parsing updated user data:", e);
        }
      }
    };

    window.addEventListener("userLoggedIn", handleUserUpdate);
    return () => {
      window.removeEventListener("userLoggedIn", handleUserUpdate);
    };
  }, [navigate]);

  const handleEditProfile = () => {
    navigate("/settings");
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    if (!dateString) return "Not available";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "300px" }}
      >
        <CSpinner color="primary" />
      </div>
    );
  }

  return (
    <>
      <CRow>
        <CCol>
          <h2 className="mb-4">User Profile</h2>
        </CCol>
      </CRow>

      {error && (
        <CAlert color="danger" className="mb-4">
          {error}
        </CAlert>
      )}

      <CRow>
        <CCol md={4}>
          <CCard className="mb-4">
            <CCardBody className="text-center">
              <div className="mb-3">
                <div
                  className="d-inline-flex justify-content-center align-items-center rounded-circle bg-primary text-white"
                  style={{ width: "80px", height: "80px", fontSize: "32px" }}
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
              </div>
              <CCardTitle className="mb-0 fs-4">
                {user?.name || "User"}
              </CCardTitle>
              <CCardText className="text-medium-emphasis">
                {user?.role || "User"}
              </CCardText>
              <CButton
                color="primary"
                className="mt-3"
                onClick={handleEditProfile}
              >
                <CIcon icon={cilPencil} className="me-2" />
                Edit Profile
              </CButton>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={8}>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>Personal Information</strong>
            </CCardHeader>
            <CCardBody>
              <CListGroup flush>
                <CListGroupItem className="d-flex align-items-center">
                  <CIcon icon={cilUser} className="me-3 text-primary" />
                  <div>
                    <div className="small text-medium-emphasis">Full Name</div>
                    <div className="fw-bold">
                      {user?.name || "Not available"}
                    </div>
                  </div>
                </CListGroupItem>

                <CListGroupItem className="d-flex align-items-center">
                  <CIcon
                    icon={cilEnvelopeClosed}
                    className="me-3 text-primary"
                  />
                  <div>
                    <div className="small text-medium-emphasis">Email</div>
                    <div className="fw-bold">
                      {user?.email || "Not available"}
                    </div>
                  </div>
                </CListGroupItem>

                <CListGroupItem className="d-flex align-items-center">
                  <CIcon icon={cilPhone} className="me-3 text-primary" />
                  <div>
                    <div className="small text-medium-emphasis">Phone</div>
                    <div className="fw-bold">
                      {user?.phone || "Not available"}
                    </div>
                  </div>
                </CListGroupItem>

                <CListGroupItem className="d-flex align-items-center">
                  <CIcon icon={cilLocationPin} className="me-3 text-primary" />
                  <div>
                    <div className="small text-medium-emphasis">Address</div>
                    <div className="fw-bold">
                      {user?.address || "Not available"}
                    </div>
                  </div>
                </CListGroupItem>

                <CListGroupItem className="d-flex align-items-center">
                  <CIcon icon={cilCalendar} className="me-3 text-primary" />
                  <div>
                    <div className="small text-medium-emphasis">Joined On</div>
                    <div className="fw-bold">
                      {user?.createdAt
                        ? formatDate(user.createdAt)
                        : "Not available"}
                    </div>
                  </div>
                </CListGroupItem>
              </CListGroup>
            </CCardBody>
          </CCard>

          <CCard className="mb-4">
            <CCardHeader>
              <strong>Account Details</strong>
            </CCardHeader>
            <CCardBody>
              <CListGroup flush>
                <CListGroupItem className="d-flex align-items-center">
                  <div className="ms-2">
                    <div className="small text-medium-emphasis">Role</div>
                    <div className="fw-bold">{user?.role || "User"}</div>
                  </div>
                </CListGroupItem>
              </CListGroup>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  );
};

export default Profile;
