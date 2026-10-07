import { useEffect, useMemo, useState } from "react";

import {useCreateAporte} from "../hooks/aportes/useCreateAporte.jsx"
import {usePatchAporte} from "../hooks/aportes/usePatchAporte.jsx";
import {useDeleteAporte} from "../hooks/aportes/useDeleteAporte.jsx";
import {useGetAporte} from "../hooks/aportes/useGetAporte.jsx"
import {GraficoAportes} from "../components/Aporte/GraficoAporte.jsx"
import { DetalleAporte } from "../components/Aporte/DetalleAporte.jsx"
import { DUPageBrowser } from "../components/daisyUI/DUPageBrowser.jsx";

import { getUserRole } from "../services/user.service.js";
import { PUEDE_EDITAR_APORTE } from "../constants/aporte.constants.jsx";
import { formatearFechaDDMMAAAA } from "../utils/calendar.utils.js";

const POSTS_PER_PAGE = 5;

const formatoCLP = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
});

const Aporte = () => {
    const userRole = getUserRole();
    const canCrudAportes = PUEDE_EDITAR_APORTE.includes(userRole);

    const [aporteData, setAporteData] = useState([]);
    const [aportes, fetchAporte] = useGetAporte(aporteData, setAporteData);

    const { handleCreateAporte } = useCreateAporte(fetchAporte);
    const { handleEditAporte } = usePatchAporte(fetchAporte);
    const { handleDeleteAporte } = useDeleteAporte(fetchAporte);

    const [creando, setCreando] = useState(false);
    const [aporteSeleccionadoId, setAporteSeleccionadoId] = useState(null);
    const [buscar, setBuscar] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        fetchAporte();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // El aporte abierto se busca en la lista para que el modal se actualice solo tras editar
    const aporteSeleccionado = useMemo(
        () => aportes.find((a) => a.id_aporte === aporteSeleccionadoId) || null,
        [aportes, aporteSeleccionadoId]
    );

    const aportesFiltrados = useMemo(() => {
        const texto = buscar.trim().toLowerCase();
        const ordenados = [...aportes].sort((a, b) =>
            String(b.fecha_aporte).localeCompare(String(a.fecha_aporte))
        );
        if (!texto) return ordenados;
        return ordenados.filter(
            (a) =>
                String(a.descripcion_aporte ?? "").toLowerCase().includes(texto) ||
                String(a.procedencia ?? "").toLowerCase().includes(texto)
        );
    }, [aportes, buscar]);

    // Paginación
    const pageAmount = Math.ceil(aportesFiltrados.length / POSTS_PER_PAGE);
    const lastPostIndex = currentPage * POSTS_PER_PAGE;
    const currentPageContent = aportesFiltrados.slice(lastPostIndex - POSTS_PER_PAGE, lastPostIndex);

    const handleBuscar = (e) => {
        setBuscar(e.target.value);
        setCurrentPage(1);
    };

    const limpiarFiltros = () => {
        setBuscar("");
        setCurrentPage(1);
    };

    const cerrarModal = () => {
        setCreando(false);
        setAporteSeleccionadoId(null);
    };

    const modalAbierto = creando || Boolean(aporteSeleccionado);

    return (
        <div className="Clase-page">
            <div className="flex gap-4 mb-4">
                <h2 className="text-xl font-semibold">Aportes</h2>
                {canCrudAportes && (
                    <button className="btn btn-primary ml-auto" onClick={() => setCreando(true)}>
                        Crear Aporte
                    </button>
                )}
            </div>

            <GraficoAportes aportes={aportes} />

            <div className="flex flex-wrap items-center gap-3 mt-6 mb-3">
                <h3 className="text-lg font-semibold">Lista de aportes</h3>
                <input
                    type="text"
                    className="input input-bordered input-sm ml-auto w-64"
                    placeholder="Buscar por descripción o procedencia"
                    value={buscar}
                    onChange={handleBuscar}
                />
                {buscar && (
                    <button className="btn btn-sm" onClick={limpiarFiltros}>
                        Limpiar
                    </button>
                )}
            </div>

            <div className="overflow-x-auto rounded-box border border-base-content/10 bg-base-100">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Descripción</th>
                            <th>Procedencia</th>
                            <th className="text-right">Monto</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {currentPageContent.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center text-base-content/60 py-6">
                                    {buscar ? "No hay aportes que coincidan con la búsqueda." : "Aún no hay aportes registrados."}
                                </td>
                            </tr>
                        ) : (
                            currentPageContent.map((aporte) => (
                                <tr key={aporte.id_aporte}>
                                    <td>{formatearFechaDDMMAAAA(aporte.fecha_aporte)}</td>
                                    <td>{aporte.descripcion_aporte}</td>
                                    <td>{aporte.procedencia}</td>
                                    <td className="text-right">{formatoCLP.format(Number(aporte.monto) || 0)}</td>
                                    <td className="text-right">
                                        <button
                                            className="btn btn-sm btn-primary"
                                            onClick={() => setAporteSeleccionadoId(aporte.id_aporte)}
                                        >
                                            {canCrudAportes ? "Ver / Editar" : "Ver"}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <DUPageBrowser
                setCurrentPageNumber={setCurrentPage}
                currentPageNumber={currentPage}
                pageAmount={pageAmount}
            />

            <DetalleAporte
                abierto={modalAbierto}
                aporte={aporteSeleccionado}
                puedeGestionar={canCrudAportes}
                onCrear={handleCreateAporte}
                onEditar={handleEditAporte}
                onEliminar={handleDeleteAporte}
                onCerrar={cerrarModal}
            />
        </div>
    );
};

export default Aporte;