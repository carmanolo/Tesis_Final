// import "@styles/Clase.css";
import useGetCarrera from "@hooks/carreras/useConseguirCarrera.jsx";
import useCreateCarrera from "@hooks/carreras/useCrearCarrera.jsx"
import useEditCarrera from "@hooks/carreras/useActualizarCarrera.jsx";
import useDeleteCarreras from "@hooks/carreras/useEliminarCarrera.jsx"
import { useEffect, useState } from "react";

import { DUCarreraTable } from "../components/daisyUI/DUCarreraTable.jsx";
import { getUserRole } from "../services/user.service.js";
import { DUPageBrowser } from "../components/daisyui/DUPageBrowser.jsx";
import { PERMISOS } from "../constants/user.constants.jsx";

const Clase = () => {

    const userRole = getUserRole();
    const canCrudCarreras = PERMISOS.includes(userRole);

    const [carreraData, setCarreraData] = useState([]);

    const [Carreras, fetchCarrera] = useGetCarrera(carreraData, setCarreraData);

    const { handleCreateCarrera } = useCreateCarrera(fetchCarrera);
    const { handleEditCarrera } = useEditCarrera(fetchCarrera);
    const { handleDeleteCarrera } = useDeleteCarreras(fetchCarrera);

    const [buscar, setBuscar] = useState("");

    useEffect(() => {
        if (typeof(fetchCarrera) === "function") {
            fetchCarrera();
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
    const currentPageContent = (Array.isArray(Carreras) && Carreras.slice(firstPostIndex, lastPostIndex)) || [];
    const pageAmount = Math.abs(Math.ceil((Array.isArray(Carreras) && Carreras?.length) / POSTS_PER_PAGE)) || 0;

    return (
        <div className="Clase-page">
            <div className="flex gap-4 mb-4">
                {canCrudCarreras && (<button className="btn btn-primary" onClick={() => handleCreateCarrera()}>Crear Clase</button>)}
                {(buscar ) && (
                    <button className="solicitud-limpiar-btn btn" onClick={limpiarFiltros}>
                        Limpiar
                    </button>
                )}
            </div>
            <div className="Clase2-page">
                <DUCarreraTable data={currentPageContent || []}  
                    handleEditClase={handleEditCarrera} 
                    handleDeleteClase={handleDeleteCarrera} 
                    canCrudCarreras={canCrudCarreras} />
            </div>
            <DUPageBrowser setCurrentPageNumber={setCurrentPage} currentPageNumber={currentPage} pageAmount={pageAmount}></DUPageBrowser>
        </div>
    );
};

export default Clase;