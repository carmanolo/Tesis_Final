// import "@styles/Clase.css";
import useGetCarrera from "@hooks/carreras/useConseguirCarrera.jsx";
import useCreateCarrera from "@hooks/carreras/useCrearCarrera.jsx"
import { useEditCarrera } from "@hooks/carreras/useActualizarCarrera.jsx";
import useDeleteCarreras from "@hooks/carreras/useEliminarCarrera.jsx"
import { useEffect, useState, useMemo } from "react";
import { norm } from "../utils/user.utils.js";
import { DUCarreraTable } from "../components/daisyUI/DUCarreraTable.jsx";
import { getUserRole } from "../services/user.service.js";
import { DUPageBrowser } from "../components/daisyUI/DUPageBrowser.jsx";
import { PERMISOS } from "../constants/user.constants.jsx";

const Carrera = () => {

    const userRole = getUserRole();
    console.log("userRole:", userRole);
    console.log("PERMISOS:", PERMISOS);
    const canCrudCarreras = PERMISOS.includes(userRole);

    const [carreraData, setCarreraData] = useState([]);

    const [Carreras, fetchCarrera] = useGetCarrera(carreraData, setCarreraData);

    const { handleCreateCarrera } = useCreateCarrera(fetchCarrera);
    const { handleEditCarreras } = useEditCarrera(fetchCarrera);
    const { handleDeleteCarreras } = useDeleteCarreras(fetchCarrera);

    const [buscar, setBuscar] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        if (typeof(fetchCarrera) === "function") {
            fetchCarrera();
        }

    }, []);

    const POSTS_PER_PAGE = 4;

    const limpiarFiltros = () => {
        setBuscar("");
        setCurrentPage(1);
    };

    // Filtro por nombre de carrera
    const carrerasFiltradas = useMemo(() => {
        const lista = Array.isArray(Carreras) ? Carreras : [];
        const q = norm(buscar);

        return lista.filter(
            (c) =>
                !q ||
                [c.nombre_carrera, c.sigla].some((campo) => norm(campo).includes(q))
        );
    }, [Carreras, buscar]);

    const lastPostIndex = currentPage * POSTS_PER_PAGE;
    const firstPostIndex = lastPostIndex - POSTS_PER_PAGE;
    const currentPageContent = carrerasFiltradas.slice(firstPostIndex, lastPostIndex);
    const pageAmount = Math.ceil(carrerasFiltradas.length / POSTS_PER_PAGE) || 0;

    useEffect(() => {
        setCurrentPage(1);
    }, [buscar]);

    return (
        <div className="Clase-page p-4">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Lista de carreras</h2>

                {canCrudCarreras && (
                    <button className="btn btn-primary" onClick={() => handleCreateCarrera()}>
                        Crear Carrera
                    </button>
                )}
            </div>
            <div className="flex items-center gap-3 mb-6">
                <input
                    type="text"
                    className="input input-bordered w-full max-w-sm"
                    placeholder="Buscar por nombre o sigla..."
                    value={buscar}
                    onChange={(e) => setBuscar(e.target.value)}
                />

                {buscar && (
                    <button className="btn" onClick={limpiarFiltros}>
                        Limpiar
                    </button>
                )}
            </div>
            <div className="Clase2-page mb-6">
                <DUCarreraTable data={currentPageContent || []}  
                    handleEditCarreras={handleEditCarreras} 
                    handleDeleteCarreras={handleDeleteCarreras} 
                    canCrudCarreras={canCrudCarreras} />
            </div>
            <DUPageBrowser setCurrentPageNumber={setCurrentPage} currentPageNumber={currentPage} pageAmount={pageAmount}></DUPageBrowser>
        </div>
    );
};

export default Carrera;