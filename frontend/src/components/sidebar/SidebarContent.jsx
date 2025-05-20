import React from "react";
import { NavLink } from "react-router-dom";
import { CNavGroup, CNavItem, CNavTitle } from "@coreui/react";
import { CSidebarNav, CNavLink } from "@coreui/react";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import navigation from "./Sidebar";

const SidebarContent = () => {
  // Function to create nav items recursively
  const renderNavItems = (items) => {
    return items.map((item, index) => {
      // For nav group
      if (item.component === CNavGroup) {
        return (
          <CNavGroup
            key={index}
            toggler={
              <>
                {item.icon && item.icon}
                {item.name}
              </>
            }
          >
            {item.items && renderNavItems(item.items)}
          </CNavGroup>
        );
      }
      // For nav title
      else if (item.component === CNavTitle) {
        return <CNavTitle key={index}>{item.name}</CNavTitle>;
      }
      // For nav item
      else if (item.component === CNavItem) {
        return (
          <CNavItem key={index}>
            <CNavLink
              to={item.to}
              component={NavLink}
              end={item.end ? "true" : undefined}
            >
              {item.icon && item.icon}
              {item.name}
              {item.badge && (
                <span className={`ms-auto badge bg-${item.badge.color}`}>
                  {item.badge.text}
                </span>
              )}
            </CNavLink>
          </CNavItem>
        );
      }
      return null;
    });
  };

  return (
    <SimpleBar>
      <CSidebarNav>{renderNavItems(navigation)}</CSidebarNav>
    </SimpleBar>
  );
};

export default SidebarContent;
