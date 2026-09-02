import { Outlet } from "react-router-dom";
import { AuthProvider } from "@context/AuthContext";
import { DUSidebar } from "../components/daisyUI/DUSidebar.jsx";
import DUGenericCard from "../components/daisyUI/DUGenericCard.jsx";

function Root() {
  return (
    <AuthProvider>
      <PageRoot />
    </AuthProvider>
  );
}

function PageRoot() {
  const pageContent = () => {
    return (
      <div className="page-content h-screen">
        {DUGenericCard(<Outlet></Outlet>, "")}
      </div>
    )
  }

  return (
    <div className="page-root h-fit">
      <DUSidebar PageContent={pageContent} SidebarTitle={"Sistema de Gestión"}></DUSidebar>
    </div>
  );
}

export default Root;
