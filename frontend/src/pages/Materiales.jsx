import { useEffect, useMemo, useState } from "react";

import { useCreateMaterial } from "../hooks/materiales/useCreateMaterial.jsx";
import { usePatchMaterial } from "../hooks/materiales/usePatchMaterial.jsx";
import { useDeleteMateriales } from "../hooks/materiales/useDeleteMaterial.jsx";
import { useGetMateriales } from "../hooks/materiales/useGetMaterial.jsx";
import { DUPageBrowser } from "../components/daisyUI/DUPageBrowser.jsx";
import { DUMaterialList } from "../components/daisyUI/DUMaterialCollapse.jsx";
import { ModalMaterial } from "../components/Material/ModalMaterial.jsx";
import { ModalPrestarMaterial } from "../components/Material/ModalPrestarMaterial.jsx";
import { usePrestamo } from "../hooks/materiales/usePrestamo.jsx";

import { getUserRole } from "../services/user.service.js";
import { PUEDE_EDITAR_MATERIAL, TIPO_MATERIAL } from "../constants/material.constants.jsx";

const POSTS_PER_PAGE = 4;

const Material = () => {
    const userRole = getUserRole();
    const canCrudMaterial = PUEDE_EDITAR_MATERIAL.includes(userRole);

    const [materialData, setMaterialData] = useState([]);
    const [materiales, fetchMaterial] = useGetMateriales(materialData, setMaterialData);

    const { handleCreateMaterial } = useCreateMaterial(fetchMaterial);
    const { handleEditMateriales } = usePatchMaterial(fetchMaterial);
    const { handleDeleteMateriales } = useDeleteMateriales(fetchMaterial);
    const { handleCreatePrestamo, handleDevolverPrestamo, handleDeletePrestamo } = usePrestamo(fetchMaterial);

    const [modalAbierto, setModalAbierto] = useState(false);
    const [materialSeleccionado, setMaterialSeleccionado] = useState(null);

    const [modalPrestarAbierto, setModalPrestarAbierto] = useState(false);
    const [materialAPrestar, setMaterialAPrestar] = useState(null);

    const [buscar, setBuscar] = useState("");
    const [tipoFiltro, setTipoFiltro] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const abrirCrearMaterial = () => {
        setMaterialSeleccionado(null);
        setModalAbierto(true);
    };

    const abrirEditarMaterial = (_id, material) => {
        setMaterialSeleccionado(material);
        setModalAbierto(true);
    };

    const cerrarModal = () => {
        setModalAbierto(false);
        setMaterialSeleccionado(null);
    };

    const abrirPrestar = (material) => {
        setMaterialAPrestar(material);
        setModalPrestarAbierto(true);
    };

    const cerrarPrestar = () => {
        setModalPrestarAbierto(false);
        setMaterialAPrestar(null);
    };

    useEffect(() => {
        if (typeof fetchMaterial === "function") {
            fetchMaterial();
        }
    }, []);

    const limpiarFiltros = () => {
        setBuscar("");
        setTipoFiltro("");
        setCurrentPage(1);
    };

    // Filtro por texto (nombre material, tipo o prestatarios de préstamos) y tipo de material
    const materialesFiltrados = useMemo(() => {
        const lista = Array.isArray(materiales) ? materiales : [];
        const q = buscar.trim().toLowerCase();
        const tipo = tipoFiltro.trim().toLowerCase();

        return lista.filter((m) => {
            const prestamos = Array.isArray(m.prestamos) ? m.prestamos : [];
            const nombresPrestatarios = prestamos.map((p) => p.prestatario).join(" ");

            const coincideTexto = !q || [
                m.nombre_material,
                m.tipo_material,
                m.prestatario,
                m.nombre_prestamo,
                nombresPrestatarios,
            ].some((campo) => String(campo ?? "").toLowerCase().includes(q));

            const coincideTipo = !tipo || String(m.tipo_material ?? "").trim().toLowerCase() === tipo;
            return coincideTexto && coincideTipo;
        });
    }, [materiales, buscar, tipoFiltro]);

    // Paginación sobre la lista filtrada
    const lastPostIndex = currentPage * POSTS_PER_PAGE;
    const firstPostIndex = lastPostIndex - POSTS_PER_PAGE;
    const currentPageContent = materialesFiltrados.slice(firstPostIndex, lastPostIndex);
    const pageAmount = Math.ceil(materialesFiltrados.length / POSTS_PER_PAGE) || 0;

    return (
        <div className="Clase-page">
            <div className="flex flex-wrap gap-4 mb-4 items-center justify-between">
                <div className="flex flex-wrap gap-3 items-center">
                    <h2 className="text-xl font-semibold">Lista de materiales</h2>

                    <div className="join">
                        <div>
                            <div>
                                <input
                                    className="input input-bordered input-sm join-item w-[300px]"
                                    placeholder="Buscar material o prestatario..."
                                    value={buscar}
                                    onChange={(e) => {
                                        setBuscar(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>
                        </div>
                        <select
                            className="select select-bordered select-sm join-item"
                            value={tipoFiltro}
                            onChange={(e) => {
                                setTipoFiltro(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="">Todos los tipos</option>
                            {TIPO_MATERIAL.map((tipo) => (
                                <option key={tipo} value={tipo}>
                                    {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                                </option>
                            ))}
                        </select>
                        <div className="indicator">
                            <button
                                type="button"
                                className="btn btn-sm join-item"
                                onClick={() => setCurrentPage(1)}
                            >
                                Buscar
                            </button>
                        </div>
                    </div>

                    {(buscar || tipoFiltro) && (
                        <button className="solicitud-limpiar-btn btn btn-sm btn-outline" onClick={limpiarFiltros}>
                            Limpiar
                        </button>
                    )}
                </div>

                {canCrudMaterial && (
                    <button className="btn btn-primary btn-sm ml-auto" onClick={abrirCrearMaterial}>
                        Registrar material
                    </button>
                )}
            </div>

            <div className="Clase2-page mb-6">
                <DUMaterialList
                    data={currentPageContent}
                    handleEditMateriales={abrirEditarMaterial}
                    handleDeleteMateriales={handleDeleteMateriales}
                    onAbrirPrestar={abrirPrestar}
                    handleDevolverPrestamo={handleDevolverPrestamo}
                    handleDeletePrestamo={handleDeletePrestamo}
                    canCrudMaterial={canCrudMaterial}
                />
            </div>

            {pageAmount > 0 && (
                <div className="flex justify-start mt-6 mb-4">
                    <DUPageBrowser
                        setCurrentPageNumber={setCurrentPage}
                        currentPageNumber={currentPage}
                        pageAmount={pageAmount}
                    />
                </div>
            )}

            <ModalMaterial
                abierto={modalAbierto}
                material={materialSeleccionado}
                onCrear={handleCreateMaterial}
                onEditar={handleEditMateriales}
                onCerrar={cerrarModal}
            />

            <ModalPrestarMaterial
                abierto={modalPrestarAbierto}
                material={materialAPrestar}
                onPrestar={handleCreatePrestamo}
                onCerrar={cerrarPrestar}
            />
        </div>
    );
};

export default Material;