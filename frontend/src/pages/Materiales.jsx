import { useEffect, useMemo, useState } from "react";

import { useCreateMaterial } from "../hooks/materiales/useCreateMaterial.jsx";
import { usePatchMaterial } from "../hooks/materiales/usePatchMaterial.jsx";
import { useDeleteMateriales } from "../hooks/materiales/useDeleteMaterial.jsx";
import { useGetMateriales } from "../hooks/materiales/useGetMaterial.jsx";
import { DUPageBrowser } from "../components/daisyUI/DUPageBrowser.jsx";
import { DUMaterialList } from "../components/daisyUI/DUMaterialCollapse.jsx";

import { getUserRole } from "../services/user.service.js";
import { PUEDE_EDITAR_MATERIAL } from "../constants/material.constants.jsx";

const POSTS_PER_PAGE = 4;

const Material = () => {
    const userRole = getUserRole();
    const canCrudMaterial = PUEDE_EDITAR_MATERIAL.includes(userRole);

    const [materialData, setMaterialData] = useState([]);
    const [materiales, fetchMaterial] = useGetMateriales(materialData, setMaterialData);

    const { handleCreateMaterial } = useCreateMaterial(fetchMaterial);
    const { handleEditMateriales } = usePatchMaterial(fetchMaterial);
    const { handleDeleteMateriales } = useDeleteMateriales(fetchMaterial);

    const [buscar, setBuscar] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        if (typeof fetchMaterial === "function") {
            fetchMaterial();
        }
    }, []);

    const limpiarFiltros = () => {
        setBuscar("");
        setCurrentPage(1);
    };

    // Filtro por nombre, prestatario o estado
    const materialesFiltrados = useMemo(() => {
        const lista = Array.isArray(materiales) ? materiales : [];
        const q = buscar.trim().toLowerCase();
        if (!q) return lista;
        return lista.filter((m) =>
            [m.nombre_material, m.prestatario ?? m.nombre_prestamo, m.estado_prestamo]
                .some((campo) => String(campo ?? "").toLowerCase().includes(q))
        );
    }, [materiales, buscar]);

    // Paginación sobre la lista filtrada
    const lastPostIndex = currentPage * POSTS_PER_PAGE;
    const firstPostIndex = lastPostIndex - POSTS_PER_PAGE;
    const currentPageContent = materialesFiltrados.slice(firstPostIndex, lastPostIndex);
    const pageAmount = Math.ceil(materialesFiltrados.length / POSTS_PER_PAGE) || 0;

    return (
        <div className="Clase-page">
            <div className="flex gap-4 mb-4 items-center">
                <h2 className="text-xl font-semibold">Lista de materiales</h2>
                <input
                    type="text"
                    className="input input-bordered input-sm ml-4"
                    placeholder="Buscar material, prestatario o estado"
                    value={buscar}
                    onChange={(e) => {
                        setBuscar(e.target.value);
                        setCurrentPage(1);
                    }}
                />
                {buscar && (
                    <button className="solicitud-limpiar-btn btn btn-sm" onClick={limpiarFiltros}>
                        Limpiar
                    </button>
                )}
                {canCrudMaterial && (
                    <button className="btn btn-primary ml-auto" onClick={() => handleCreateMaterial()}>
                        Registrar material
                    </button>
                )}
            </div>

            <div className="Clase2-page">
                <DUMaterialList
                    data={currentPageContent}
                    handleEditMateriales={handleEditMateriales}
                    handleDeleteMateriales={handleDeleteMateriales}
                    canCrudMaterial={canCrudMaterial}
                />
            </div>

            <DUPageBrowser
                setCurrentPageNumber={setCurrentPage}
                currentPageNumber={currentPage}
                pageAmount={pageAmount}
            />
        </div>
    );
};

export default Material;