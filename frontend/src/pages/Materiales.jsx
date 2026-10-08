import { useEffect, useState } from "react";

import { useCreateMaterial } from "../hooks/materiales/useCreateMaterial.jsx"
import { usePatchMaterial } from "../hooks/materiales/usePatchMaterial.jsx";
import { useDeleteMateriales } from "../hooks/materiales/useDeleteMaterial.jsx";
import { useGetMateriales } from "../hooks/materiales/useGetMaterial.jsx"
import { DUPageBrowser } from "../components/daisyUI/DUPageBrowser.jsx";

import { getUserRole } from "../services/user.service.js";
import { PUEDE_EDITAR_MATERIAL } from "../constants/material.constants.jsx";
import { formatearFechaDDMMAAAA } from "../utils/calendar.utils.js";


const formatoCLP = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
});

const Material = () => {

    const userRole = getUserRole();
    console.log("userRole:", userRole);
    console.log("PERMISOS:", PUEDE_EDITAR_MATERIAL);
    const canCrudMaterial = PUEDE_EDITAR_MATERIAL.includes(userRole);

    const [materialData, setMaterialData] = useState([]);

    const [Materiales, fetchMaterial] = useGetMateriales(materialData, setMaterialData);

    const { handleCreateMaterial } = useCreateMaterial(fetchMaterial);
    const { handleEditMateriales } = usePatchMaterial(fetchMaterial);
    const { handleDeleteMateriales } = useDeleteMateriales(fetchMaterial);

    const [buscar, setBuscar] = useState("");

    useEffect(() => {
        if (typeof(fetchMaterial) === "function") {
            fetchMaterial();
        }

    }, []);

    const limpiarFiltros = () => {
        setBuscar("");
    };

    //paginacion
    const POSTS_PER_PAGE = 4;
    const [currentPage, setCurrentPage] = useState(1);

    const lastPostIndex  = currentPage * POSTS_PER_PAGE;
    const firstPostIndex = lastPostIndex - POSTS_PER_PAGE;
    const currentPageContent = (Array.isArray(Materiales) && Materiales.slice(firstPostIndex, lastPostIndex)) || [];
    const pageAmount = Math.abs(Math.ceil((Array.isArray(Materiales) && Materiales?.length) / POSTS_PER_PAGE)) || 0;

    return (
        <div className="Clase-page">
            <div className="flex gap-4 mb-4">
                <h2 className="text-xl font-semibold">Lista de materiales</h2>
                {canCrudMaterial && (<button className="btn btn-primary ml-auto" onClick={() => handleCreateMaterial()}>Crear Carrera</button>)}
                {(buscar ) && (
                    <button className="solicitud-limpiar-btn btn" onClick={limpiarFiltros}>
                        Limpiar
                    </button>
                )}
            </div>
            <div className="Clase2-page">
                <DUCarreraTable data={currentPageContent || []}  
                    handleEditMateriales={handleEditMateriales} 
                    handleDeleteMateriales={handleDeleteMateriales} 
                    canCrudMaterial={canCrudMaterial} />
            </div>
            <DUPageBrowser setCurrentPageNumber={setCurrentPage} currentPageNumber={currentPage} pageAmount={pageAmount}></DUPageBrowser>
        </div>
    );
};

export default Material;