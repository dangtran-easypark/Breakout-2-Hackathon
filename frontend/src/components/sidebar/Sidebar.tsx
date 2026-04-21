import React from "react";

import useSidebar from "../../hooks/useSidebar";
import SidebarNav from "./SidebarNav";
import Logo from "../../assets/img/logo.svg?react";

import { SidebarItemsType } from "../../types/sidebar";

interface SidebarProps {
  items: {
    title: string;
    pages: SidebarItemsType[];
  }[];
  open?: boolean;
}

const Sidebar = ({ items }: SidebarProps) => {
  const { isOpen } = useSidebar();

  return (
    <nav className={`sidebar ${!isOpen ? "collapsed" : ""}`}>
      <div className="sidebar-content">
          <a className="sidebar-brand" href="/">
            <div style={{ background: "#fff", borderRadius: 8, padding: "8px 16px", display: "inline-flex" }}>
              <Logo style={{ width: "140px", height: "auto" }} />
            </div>
          </a>

          <SidebarNav items={items} />
      </div>
    </nav>
  );
};

export default Sidebar;
