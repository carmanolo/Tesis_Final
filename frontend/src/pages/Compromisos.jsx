import { useEffect, useMemo, useState } from "react";

import { useCreateCompromiso } from "../hooks/compromisos/useCreateCompromiso.jsx";
import { usePatchCompromiso } from "../hooks/compromisos/usePatchCompromiso.jsx";
import { useDeleteCompromiso } from "../hooks/compromisos/useDeleteCompromiso.jsx";
import { useGetCompromiso } from "../hooks/compromisos/useGetCompromiso.jsx";
import { useAsignarAporte } from "../hooks/compromisos/useAsignarAporte.jsx";
import { useDownloadSolicitud } from "../hooks/compromisos/useDownloadSolicitud.jsx";
import { useGetAporte } from "../hooks/aportes/useGetAporte.jsx";
import { ProximoCompromiso } from "../components/Compromiso/ProximoCompromiso.jsx";
import { DetalleCompromiso } from "../components/Compromiso/DetalleCompromiso.jsx";
import { DUPageBrowser } from "../components/daisyUI/DUPageBrowser.jsx";

import { getUserRole } from "../services/user.service.js";
import { PUEDE_EDITAR_COMPROMISO } from "../constants/compromiso.constants.jsx";
import { formatearFechaDDMMAAAA } from "../utils/calendar.utils.js";
import { formatoCLP } from "../utils/aporte.utils.js";
import { obtenerProximoCompromiso, estadoFinanciamiento, resumenDe } from "../utils/compromiso.utils.js";

const POSTS_PER_PAGE = 5;

const Compromiso = () => {
    const userRole = getUserRole();
    const canCrudCompromisos = PUEDE_EDITAR_COMPROMISO.includes(userRole);

    const [compromisoData, setCompromisoData] = useState([]);
    const [compromisos, fetchCompromiso] = useGetCompromiso(compromisoData, setCompromisoData);

    // Los aportes se necesitan para mostrar sus nombres y elegir cuáles asignar
    const [aporteData, setAporteData] = useState([]);
    const [aportes, fetchAporte] = useGetAporte(aporteData, setAporteData);

    const { handleCreateCompromiso } = useCreateCompromiso(fetchCompromiso);
    const { handleEditCompromiso } = usePatchCompromiso(fetchCompromiso);
    const { handleDeleteCompromiso } = useDeleteCompromiso(fetchCompromiso);
    const { handleAsignarAporte, handleQuitarAporte } = useAsignarAporte(fetchCompromiso);
    const { handleDownloadSolicitud, descargando } = useDownloadSolicitud();

    const [creando, setCreando] = useState(false);
    const [compromisoSeleccionadoId, setCompromisoSeleccionadoId] = useState(null);
    const [buscar, setBuscar] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [listaAbierta, setListaAbierta] = useState(false);

    useEffect(() => {
        fetchCompromiso();
        fetchAporte();
    }, []);

    // El compromiso abierto se busca en la lista para que el modal se actualice solo tras asignar o editar
    const compromisoSeleccionado = useMemo(
        () => compromisos.find((c) => c.id_compromiso === compromisoSeleccionadoId) || null,
        [compromisos, compromisoSeleccionadoId]
    );

    const proximo = useMemo(() => obtenerProximoCompromiso(compromisos), [compromisos]);

    const compromisosFiltrados = useMemo(() => {
        const texto = buscar.trim().toLowerCase();
        const ordenados = [...compromisos].sort((a, b) =>
            String(b.fecha_compromiso).localeCompare(String(a.fecha_compromiso))
        );
        if (!texto) return ordenados;
        return ordenados.filter((c) => String(c.descripcion_compromiso ?? "").toLowerCase().includes(texto));
    }, [compromisos, buscar]);

    // Paginación
    const pageAmount = Math.ceil(compromisosFiltrados.length / POSTS_PER_PAGE);
    const lastPostIndex = currentPage * POSTS_PER_PAGE;
    const currentPageContent = compromisosFiltrados.slice(lastPostIndex - POSTS_PER_PAGE, lastPostIndex);

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
        setCompromisoSeleccionadoId(null);
    };

    const modalAbierto = creando || Boolean(compromisoSeleccionado);

    return (
        <div className="Clase-page">
            <div className="flex gap-4 mb-4">
                <h2 className="text-xl font-semibold">Compromisos</h2>
                {canCrudCompromisos && (
                    <button className="btn btn-primary ml-auto" onClick={() => setCreando(true)}>
                        Crear compromiso
                    </button>
                )}
            </div>

            <ProximoCompromiso compromiso={proximo} onVer={setCompromisoSeleccionadoId} />

            <div className="flex flex-wrap items-center gap-3 mt-6 mb-3">
                <button
                    type="button"
                    className="flex items-center gap-2 text-lg font-semibold"
                    onClick={() => setListaAbierta((abierta) => !abierta)}
                    aria-expanded={listaAbierta}
                    aria-controls="lista-compromisos"
                >
                    <svg
                        className={`h-5 w-5 transition-transform ${listaAbierta ? "rotate-90" : ""}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            fillRule="evenodd"
                            d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                            clipRule="evenodd"
                        />
                    </svg>
                    Lista de compromisos
                    <span className="badge badge-ghost">{compromisos.length}</span>
                </button>
                {listaAbierta && (
                <>
                <input
                    type="text"
                    className="input input-bordered input-sm ml-auto w-64"
                    placeholder="Buscar por descripción"
                    value={buscar}
                    onChange={handleBuscar}
                />
                {buscar && (
                    <button className="btn btn-sm" onClick={limpiarFiltros}>
                        Limpiar
                    </button>
                )}
                </>
                )}
            </div>

            {listaAbierta && (
            <div id="lista-compromisos">
            <div className="overflow-x-auto rounded-box border border-base-content/10 bg-base-100">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Descripción</th>
                            <th className="text-right">Monto total</th>
                            <th>Financiamiento</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {currentPageContent.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center text-base-content/60 py-6">
                                    {buscar
                                        ? "No hay compromisos que coincidan con la búsqueda."
                                        : "Aún no hay compromisos registrados."}
                                </td>
                            </tr>
                        ) : (
                            currentPageContent.map((compromiso) => {
                                const resumen = resumenDe(compromiso);
                                const estado = estadoFinanciamiento(compromiso);
                                return (
                                    <tr key={compromiso.id_compromiso}>
                                        <td>{formatearFechaDDMMAAAA(compromiso.fecha_compromiso)}</td>
                                        <td className="max-w-xs truncate">{compromiso.descripcion_compromiso}</td>
                                        <td className="text-right">{formatoCLP.format(resumen.montoTotal)}</td>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <progress
                                                    className={`progress hidden sm:block w-24 ${estado.id === "financiado" ? "progress-success" : "progress-primary"}`}
                                                    value={resumen.totalFinanciado}
                                                    max={resumen.montoTotal || 1}
                                                    aria-label="Porcentaje financiado"
                                                />
                                                <span className={`badge ${estado.clase}`}>{estado.etiqueta}</span>
                                            </div>
                                        </td>
                                        <td className="text-right">
                                            <button
                                                className="btn btn-sm btn-primary"
                                                onClick={() => setCompromisoSeleccionadoId(compromiso.id_compromiso)}
                                            >
                                                {canCrudCompromisos ? "Ver / Editar" : "Ver"}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <DUPageBrowser
                setCurrentPageNumber={setCurrentPage}
                currentPageNumber={currentPage}
                pageAmount={pageAmount}
            />
            </div>
            )}

            <DetalleCompromiso
                abierto={modalAbierto}
                compromiso={compromisoSeleccionado}
                compromisos={compromisos}
                aportes={aportes}
                puedeGestionar={canCrudCompromisos}
                onCrear={handleCreateCompromiso}
                onEditar={handleEditCompromiso}
                onEliminar={handleDeleteCompromiso}
                onAsignarAporte={handleAsignarAporte}
                onQuitarAporte={handleQuitarAporte}
                onDescargar={handleDownloadSolicitud}
                descargando={descargando}
                onCerrar={cerrarModal}
            />
        </div>
    );
};

export default Compromiso;