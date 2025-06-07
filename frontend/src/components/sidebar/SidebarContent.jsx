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
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              {item.icon && <span className="nav-icon">{item.icon}</span>}
              <span>{item.name}</span>
              {item.badge && (
                <span className={`badge ms-auto badge-${item.badge.color}`}>
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
    <SimpleBar>
      <CSidebarNav>{renderSidebarItems(Sidebar)}</CSidebarNav>
    </SimpleBar>
  );
};

export default SidebarContent;
