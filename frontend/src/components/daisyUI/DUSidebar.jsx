import { useNavigate } from "react-router-dom";
import { logout } from "@services/auth.service.js";
import { FaHome, FaUsers, FaSignOutAlt } from "react-icons/fa";
import { CgProfile } from "react-icons/cg";
import { DUSidebarItem } from "./DUSidebarItem";

export const DUSidebar = ({PageContent, SidebarTitle}) => {
    const navigate = useNavigate();

    const user = JSON.parse(sessionStorage.getItem("usuario")) || "";
    const userRole = user?.rol;

    const logoutSubmit = () => {
        try {
        logout();
        navigate("/login");
        } catch (error) {
        console.error("Error al cerrar sesión", error);
        }
    };

    return (
        <div>
            <div className="drawer lg:drawer-open">
            <input id="my-drawer-4" type="checkbox" className="drawer-toggle" />
            <div className="drawer-content">
                {/* Navbar */}
                <nav className="navbar w-full bg-base-300">
                <label htmlFor="my-drawer-4" aria-label="open sidebar" className="btn btn-square btn-ghost">
                    {/* Sidebar toggle icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" fill="none" stroke="currentColor" className="my-1.5 inline-block size-4"><path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"></path><path d="M9 4v16"></path><path d="M14 10l2 2l-2 2"></path></svg>
                </label>
                <div className="px-4">{String(SidebarTitle)}</div>
                </nav>
                {/* Page content here */}
                <div className="p-4">
                    {PageContent && (<PageContent></PageContent>)}
                </div>
            </div>

            <div className="drawer-side is-drawer-close:overflow-visible">
                <label htmlFor="my-drawer-4" aria-label="close sidebar" className="drawer-overlay"></label>
                <div className="flex min-h-full flex-col items-start bg-base-200 is-drawer-close:w-14 is-drawer-open:w-64">
                {/* Sidebar content here */}
                <ul className="menu w-full grow">
                    {DUSidebarItem((FaHome), "Inicio", "/home")}
                    {DUSidebarItem((FaUsers), "Usuarios", "/users")}
                    {DUSidebarItem((CgProfile), "Perfil", "/profile")}
                    {DUSidebarItem((FaSignOutAlt), "Cerrar Sesión", "/login", logoutSubmit)}
                </ul>
                </div>
            </div>
            </div>
        </div>
    )
}