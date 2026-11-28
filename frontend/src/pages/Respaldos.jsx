import { useEffect, useMemo, useState } from "react";
import { useGetRespaldos } from "../hooks/respaldos/useGetRespaldos.jsx";
import { useGetRespaldoById } from "../hooks/respaldos/UseGetRespaldobyid.jsx";
import { useGetCompromisoList } from "../hooks/listas/useGetCompromisoList.jsx";
import { useCreateRespaldo } from "../hooks/respaldos/useCreateRespaldo.jsx";
import { useEditRespaldo } from "../hooks/respaldos/useEditRespaldo.jsx";
import { useDeleteRespaldo } from "../hooks/respaldos/useDeleteRespaldo.jsx";
import { useDeleteImagenPublicacion } from "../hooks/respaldos/UseDeleteImagenPublicacion.jsx";

import { ModalRespaldo } from "../components/Respaldo/ModalRespaldo.jsx";
import { ModalRespaldoDetalle} from "../components/Respaldo/RespaldoDetalle.jsx";
import { TarjetaRespaldo } from "../components/Respaldo/TarjetaRespaldo.jsx";
import { DUPageBrowser } from "../components/daisyUI/DUPageBrowser.jsx";
import { getUserRole } from "../services/user.service.js";
import { PUEDE_GESTIONAR_PUBLICACION } from "../constants/respaldo.constants.jsx";

const POSTS_PER_PAGE = 6;

const Respaldos = () => {
    const userRole = getUserRole();
    const canGestionar = PUEDE_GESTIONAR_PUBLICACION.includes(userRole);

    const [compromisos, setCompromisos] = useState([]);
    const [compromisoList, fetchCompromisoList] = useGetCompromisoList(compromisos, setCompromisos);

    const [modalAbierto, setModalAbierto] = useState(false);
    const [respaldoSeleccionado, setRespaldoSeleccionado] = useState(null);
    const [buscar, setBuscar] = useState("");
    const [compromisoFiltro, setCompromisoFiltro] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [detalle, setDetalle] = useState(null);

    const { respaldos, loading, fetchRespaldos } = useGetRespaldos();
    const { fetchRespaldo } = useGetRespaldoById();
    const { handleCreateRespaldo } = useCreateRespaldo(fetchRespaldos);
    const { handleEditRespaldo } = useEditRespaldo(fetchRespaldos);
    const { handleDeleteRespaldo } = useDeleteRespaldo(fetchRespaldos);

    // Tras borrar una imagen: refresca la publicación abierta en el modal y la lista
    const { handleDeleteImagen } = useDeleteImagenPublicacion(async () => {
        if (respaldoSeleccionado) {
            const fresca = await fetchRespaldo(respaldoSeleccionado.id_respaldo);
            if (fresca) setRespaldoSeleccionado(fresca);
        }
        fetchRespaldos();
    });

    useEffect(() => {
        fetchRespaldos();
        if (typeof fetchCompromisoList === "function") {
            fetchCompromisoList();
        }
    }, [fetchRespaldos, fetchCompromisoList]);


    const abrirCrear = () => {
        setRespaldoSeleccionado(null);
        setModalAbierto(true);
    };

    // Carga la publicación fresca desde el backend; si falla, usa la de la lista
    const abrirEditar = async (pub) => {
        const fresca = await fetchRespaldo(pub.id_respaldo);
        setRespaldoSeleccionado(fresca ?? pub);
        setModalAbierto(true);
    };

    const cerrarModal = () => {
        setModalAbierto(false);
        setRespaldoSeleccionado(null);
    };

    // Filtra por búsqueda de texto y por selector de compromiso
    const respaldosFiltradas = useMemo(() => {
        const lista = Array.isArray(respaldos) ? respaldos : [];
        const q = buscar.trim().toLowerCase();
        const cFiltroId = compromisoFiltro ? Number(compromisoFiltro) : null;

        return lista.filter((p) => {
            const coincideCompromiso =
                !cFiltroId ||
                Number(p.compromisoId) === cFiltroId ||
                Number(p.compromiso?.id_compromiso) === cFiltroId ||
                Number(p.id_compromiso) === cFiltroId;

            if (!coincideCompromiso) return false;

            if (!q) return true;
            return [
                p.titulo,
                p.descripcion,
                p.carrera?.nombre_carrera,
                p.compromiso?.descripcion_compromiso,
            ].some((campo) => String(campo ?? "").toLowerCase().includes(q));
        });
    }, [respaldos, buscar, compromisoFiltro]);

    const lastIdx = currentPage * POSTS_PER_PAGE;
    const firstIdx = lastIdx - POSTS_PER_PAGE;
    const currentPageContent = respaldosFiltradas.slice(firstIdx, lastIdx);
    const pageAmount = Math.ceil(respaldosFiltradas.length / POSTS_PER_PAGE) || 0;

    return (
        <div className="Clase-page">
            {/* Header */}
            <div className="flex flex-wrap gap-4 mb-4 items-center justify-between">
                <div className="flex flex-wrap gap-3 items-center">
                    <h2 className="text-xl font-semibold">Respaldos del Centro de Estudiantes</h2>
                    <div className="join">
                        <input
                            className="input input-bordered input-sm join-item w-[240px] sm:w-[280px]"
                            placeholder="Buscar publicación..."
                            value={buscar}
                            onChange={(e) => {
                                setBuscar(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                        <button className="btn btn-sm join-item" onClick={() => setCurrentPage(1)}>
                            Buscar
                        </button>
                    </div>
                    {(buscar || compromisoFiltro) && (
                        <button
                            className="btn btn-sm btn-outline"
                            onClick={() => {
                                setBuscar("");
                                setCompromisoFiltro("");
                                setCurrentPage(1);
                            }}
                        >
                            Limpiar
                        </button>
                    )}
                </div>
                {canGestionar && (
                    <button className="btn btn-primary btn-sm ml-auto" onClick={abrirCrear}>
                        Nuevo respaldo
                    </button>
                )}
            </div>

            {/* Grid de publicaciones */}
            <div className="Clase2-page mb-6">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <span className="loading loading-spinner loading-lg text-primary"></span>
                    </div>
                ) : currentPageContent.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-base-content/50">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-16 w-16 mb-4 opacity-30"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                        <p className="text-lg font-medium">No hay respaldos</p>
                        <p className="text-sm">
                            {canGestionar
                                ? "Crea el primer respaldo para tu carrera."
                                : "Aún no hay respaldos para tu carrera."}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {currentPageContent.map((pub) => (
                            <TarjetaRespaldo
                                key={pub.id_respaldo}
                                respaldo={pub}
                                canGestionar={canGestionar}
                                onEditar={abrirEditar}
                                onEliminar={handleDeleteRespaldo}
                                onVer={setDetalle}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Paginación */}
            {pageAmount > 1 && (
                <div className="flex justify-start mt-6 mb-4">
                    <DUPageBrowser
                        setCurrentPageNumber={setCurrentPage}
                        currentPageNumber={currentPage}
                        pageAmount={pageAmount}
                    />
                </div>
            )}

            <ModalRespaldo
                abierto={modalAbierto}
                respaldo={respaldoSeleccionado}
                compromisoList={compromisoList}
                onCrear={handleCreateRespaldo}
                onEditar={handleEditRespaldo}
                onEliminarImagen={handleDeleteImagen}
                onCerrar={cerrarModal}
            />
            <ModalRespaldoDetalle
                abierto={!!detalle}
                respaldo={detalle}
                onCerrar={() => setDetalle(null)}
            />
        </div>
    );
};

export default Respaldos;
