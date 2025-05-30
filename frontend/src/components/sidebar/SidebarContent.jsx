import React from "react";
import { useLocation, NavLink } from "react-router-dom";
import { CSidebarNav, CNavItem, CNavGroup, CNavTitle } from "@coreui/react";
import Sidebar from "./Sidebar";
import SimpleBar from "simplebar-react";

const SidebarContent = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const renderSidebarItems = (items) => {
    return items.map((item, index) => {
      if (item.component === CNavTitle) {
        return <CNavTitle key={index}>{item.name}</CNavTitle>;
      } else if (item.component === CNavGroup) {
        return (
          <CNavGroup
            key={index}
            toggler={
              <>
                {item.icon && <span className="nav-icon">{item.icon}</span>}
                {item.name}
              </>
            }
            visible={item.items.some(
              (subItem) =>
                isActive(subItem.to) || location.pathname.startsWith(subItem.to)
            )}
          >
            {renderSidebarItems(item.items)}
          </CNavGroup>
        );
      } else if (item.component === CNavItem) {
        return (
          <CNavItem key={index} active={isActive(item.to)}>
            <NavLink
              to={item.to}
              className="nav-link"
              style={{
                display: "flex",
                alignItems: "center",
                padding: "0.75rem 1rem",
                textDecoration: "none",
                color: "inherit",
                minHeight: "44px", // Minimum touch target size for mobile
                touchAction: "manipulation", // Optimize for touch
                WebkitTapHighlightColor: "transparent", // Remove tap highlight on iOS
              }}
              onClick={(e) => {
                // Ensure click event propagates properly on mobile
                e.stopPropagation();
              }}
            >
              {item.icon && (
                <span
                  className="nav-icon"
                  style={{
                    marginRight: "0.5rem",
                    pointerEvents: "none", // Prevent icon from blocking clicks
                  }}
                >
                  {item.icon}
                </span>
              )}
              <span style={{ pointerEvents: "none" }}>{item.name}</span>
              {item.badge && (
                <span
                  className={`badge ms-auto badge-${item.badge.color}`}
                  style={{ pointerEvents: "none" }}
                >
                  {item.badge.text}
                </span>
              )}
            </NavLink>
          </CNavItem>
        );
      }
      return null;
    });
  };

  return (
    <SimpleBar
      style={{
        // Ensure SimpleBar doesn't interfere with touch events
        touchAction: "pan-y",
        overscrollBehavior: "contain",
      }}
    >
      <CSidebarNav
        style={{
          // Ensure proper touch handling on mobile
          touchAction: "manipulation",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {renderSidebarItems(Sidebar)}
      </CSidebarNav>
    </SimpleBar>
  );
};

export default SidebarContent;
