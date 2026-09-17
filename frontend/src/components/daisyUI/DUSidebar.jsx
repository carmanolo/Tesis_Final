import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "@services/auth.service.js";
import {
  FaHome,
  FaUsers,
  FaSignOutAlt,
  FaSearch,
  FaAngleDoubleLeft,
  FaGraduationCap,
  FaCalendarAlt,
  FaUserCircle,
} from "react-icons/fa";
import { DUSidebarItem } from "./DUSidebarItem";
import marcaUbb from "../../assets/escudo-color-gradiente.svg";

export const DUSidebar = ({ PageContent, SidebarTitle }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const user = JSON.parse(sessionStorage.getItem("usuario")) || "";
  const userRole = user?.role;

  const logoutSubmit = () => {
    try {
      logout();
      navigate("/login");
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

  const menuItems = [
    {
      icon: FaHome,
      label: "Inicio",
      destination: "/home",
      iconColor: "text-[#4a5568]",
    },
    {
      icon: FaUsers,
      label: "Usuarios",
      destination: "/users",
      iconColor: "text-[#0284c7]",
      roles: ["administrador"],
    },
    {
      icon: FaGraduationCap,
      label: "Carreras",
      destination: "/carreras",
      iconColor: "text-[#eab308]",
      roles: ["administrador"],
    },
    {
      icon: FaCalendarAlt,
      label: "Reuniones",
      destination: "/reuniones",
      iconColor: "text-[#16a34a]",
    },
    {
      icon: FaUserCircle,
      label: "Perfil",
      destination: "/profile",
      iconColor: "text-[#ea580c]",
    },
  ];

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.label.toLowerCase().includes(searchTerm.toLowerCase().trim());
    const matchesRole = !item.roles || item.roles.includes(userRole);
    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <div className="drawer lg:drawer-open">
        <input id="my-drawer-4" type="checkbox" className="drawer-toggle" />

        {/* Main Content Area */}
        <div className="drawer-content flex flex-col">
          {/* Header / Navbar */}
          <nav className="navbar w-full bg-[#2F4697] text-white shadow-sm px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label
                htmlFor="my-drawer-4"
                aria-label="open sidebar"
                className="btn btn-square btn-ghost text-white lg:hidden"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeWidth="2"
                  fill="none"
                  stroke="currentColor"
                  className="size-5"
                >
                  <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"></path>
                  <path d="M9 4v16"></path>
                  <path d="M14 10l2 2l-2 2"></path>
                </svg>
              </label>

              <span className="truncate font-medium text-base text-white">
                {String(SidebarTitle)}
              </span>
            </div>

            {/* Marca Institucional UBB */}
            <div className="bg-white/95 px-2.5 py-1 rounded-md shadow-xs shrink-0">
              <img
                src={marcaUbb}
                alt="Universidad del Bío-Bío"
                className="h-8 w-auto shrink-0"
              />
            </div>
          </nav>

          {/* Page content */}
          <main className="p-4 grow">
            {PageContent && <PageContent />}
          </main>
        </div>

        {/* Sidebar Drawer */}
        <div className="drawer-side is-drawer-close:overflow-visible z-40">
          <label htmlFor="my-drawer-4" aria-label="close sidebar" className="drawer-overlay"></label>

          <aside className="flex min-h-full flex-col bg-[#f8f9fa] border-r border-[#e2e8f0] is-drawer-close:w-16 is-drawer-open:w-64 w-64 shadow-xs">
            {/* Top Search Input matching Intranet UBB */}
            <div className="p-2.5 border-b border-[#e5e7eb] bg-[#f8f9fa] is-drawer-close:hidden">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Busca en este sitio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-[#5dade2] text-xs text-[#333333] placeholder-[#888888] pl-2.5 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#3498db] focus:border-[#3498db] rounded-xs shadow-inner"
                />
                <FaSearch className="absolute right-2.5 text-[#3498db] text-xs pointer-events-none" />
              </div>
            </div>

            {/* Menu items list */}
            <ul className="w-full grow flex flex-col p-0 m-0">
              {filteredItems.map((item) => (
                <DUSidebarItem
                  key={item.destination}
                  icon={item.icon}
                  label={item.label}
                  destination={item.destination}
                  iconColor={item.iconColor}
                />
              ))}

              {/* Cerrar Sesión */}
              <DUSidebarItem
                icon={FaSignOutAlt}
                label="Cerrar Sesión"
                destination="/login"
                logoutSubmit={logoutSubmit}
                iconColor="text-[#dc2626]"
              />
            </ul>

            {/* Bottom Collapse Toggle Button */}
            <div className="mt-auto w-full py-2.5 bg-[#f8f9fa] border-t border-[#e2e8f0] flex items-center justify-center relative">
              <div className="absolute inset-x-0 top-1/2 h-[1px] bg-[#e2e8f0] -z-0"></div>
              <label
                htmlFor="my-drawer-4"
                className="z-10 w-6 h-6 rounded-full border border-[#cbd5e1] bg-[#f8f9fa] hover:bg-white text-[#64748b] hover:text-[#334155] flex items-center justify-center cursor-pointer shadow-xs transition-colors"
                title="Contraer / Expandir"
              >
                <FaAngleDoubleLeft className="text-[10px]" />
              </label>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default DUSidebar;