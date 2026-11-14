import { useEffect, useMemo, useState } from "react";
import { useGetPublicaciones } from "../hooks/publicaciones/useGetPublicaciones.jsx";
import { useGetPublicacionById } from "../hooks/publicaciones/UseGetPublicacionbyid.jsx";
import { useGetCompromisoList } from "../hooks/listas/useGetCompromisoList.jsx";
import { useCreatePublicacion } from "../hooks/publicaciones/useCreatePublicacion.jsx";
import { useEditPublicacion } from "../hooks/publicaciones/useEditPublicacion.jsx";
import { useDeletePublicacion } from "../hooks/publicaciones/useDeletePublicacion.jsx";
import { useDeleteImagenPublicacion } from "../hooks/publicaciones/UseDeleteImagenPublicacion.jsx";

import { ModalPublicacion } from "../components/Publicacion/ModalPublicacion.jsx";
import { ModalPublicacionDetalle } from "../components/Publicacion/PublicacionDetalle.jsx";
import { TarjetaPublicacion } from "../components/Publicacion/TarjetaPublicacion.jsx";
import { DUPageBrowser } from "../components/daisyUI/DUPageBrowser.jsx";
import { getUserRole } from "../services/user.service.js";
import { PUEDE_GESTIONAR_PUBLICACION } from "../constants/publicacion.constants.jsx";
import { getCompromisoId, getCompromisoTitulo } from "../utils/publicacion.utils.js";

const POSTS_PER_PAGE = 6;

const Publicaciones = () => {
    const userRole = getUserRole();
    const canGestionar = PUEDE_GESTIONAR_PUBLICACION.includes(userRole);

    const [compromisos, setCompromisos] = useState([]);
    const [compromisoList, fetchCompromisoList] = useGetCompromisoList(compromisos, setCompromisos);

    const [modalAbierto, setModalAbierto] = useState(false);
    const [publicacionSeleccionada, setPublicacionSeleccionada] = useState(null);
    const [buscar, setBuscar] = useState("");
    const [compromisoFiltro, setCompromisoFiltro] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [detalle, setDetalle] = useState(null);

    const { publicaciones, loading, fetchPublicaciones } = useGetPublicaciones();
    const { fetchPublicacion } = useGetPublicacionById();
    const { handleCreatePublicacion } = useCreatePublicacion(fetchPublicaciones);
    const { handleEditPublicacion } = useEditPublicacion(fetchPublicaciones);
    const { handleDeletePublicacion } = useDeletePublicacion(fetchPublicaciones);

    // Tras borrar una imagen: refresca la publicación abierta en el modal y la lista
    const { handleDeleteImagen } = useDeleteImagenPublicacion(async () => {
        if (publicacionSeleccionada) {
            const fresca = await fetchPublicacion(publicacionSeleccionada.id_publicacion);
            if (fresca) setPublicacionSeleccionada(fresca);
        }
        fetchPublicaciones();
    });

    useEffect(() => {
        fetchPublicaciones();
        if (typeof fetchCompromisoList === "function") {
            fetchCompromisoList();
        }
    }, [fetchPublicaciones]);

    const opcionesCompromiso = useMemo(() => {
        const lista = Array.isArray(compromisoList) ? compromisoList : [];
        return lista
            .filter((c) => typeof c === "string" && c.trim().length > 0)
            .map((c) => ({
                id: getCompromisoId(c),
                titulo: getCompromisoTitulo(c),
                raw: c,
            }))
            .filter((o) => o.id !== null);
    }, [compromisoList]);

    const abrirCrear = () => {
        setPublicacionSeleccionada(null);
        setModalAbierto(true);
    };

    // Carga la publicación fresca desde el backend; si falla, usa la de la lista
    const abrirEditar = async (pub) => {
        const fresca = await fetchPublicacion(pub.id_publicacion);
        setPublicacionSeleccionada(fresca ?? pub);
        setModalAbierto(true);
    };

    const cerrarModal = () => {
        setModalAbierto(false);
        setPublicacionSeleccionada(null);
    };

    // Filtra por búsqueda de texto y por selector de compromiso
    const publicacionesFiltradas = useMemo(() => {
        const lista = Array.isArray(publicaciones) ? publicaciones : [];
        const q = buscar.trim().toLowerCase();
        const cFiltroId = compromisoFiltro ? Number(compromisoFiltro) : null;

        return lista.filter((p) => {
            const coincideCompromiso =
                !cFiltroId ||
                Number(p.compromisoId) === cFiltroId ||
                Number(p.compromiso?.id_compromiso) === cFiltroId;

            if (!coincideCompromiso) return false;

            if (!q) return true;
            return [
                p.titulo,
                p.descripcion,
                p.carrera?.nombre_carrera,
                p.compromiso?.descripcion_compromiso,
            ].some((campo) => String(campo ?? "").toLowerCase().includes(q));
        });
    }, [publicaciones, buscar, compromisoFiltro]);

    const lastIdx = currentPage * POSTS_PER_PAGE;
    const firstIdx = lastIdx - POSTS_PER_PAGE;
    const currentPageContent = publicacionesFiltradas.slice(firstIdx, lastIdx);
    const pageAmount = Math.ceil(publicacionesFiltradas.length / POSTS_PER_PAGE) || 0;

    return (
        <div className="Clase-page">
            {/* Header */}
            <div className="flex flex-wrap gap-4 mb-4 items-center justify-between">
                <div className="flex flex-wrap gap-3 items-center">
                    <h2 className="text-xl font-semibold">Publicaciones del Centro de Estudiantes</h2>
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

                    {/* Selector de filtro por compromiso */}
                    {opcionesCompromiso.length > 0 && (
                        <select
                            className="select select-bordered select-sm max-w-xs"
                            value={compromisoFiltro}
                            onChange={(e) => {
                                setCompromisoFiltro(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="">Todos los compromisos</option>
                            {opcionesCompromiso.map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                    {opt.titulo}
                                </option>
                            ))}
                        </select>
                    )}

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
                        Nueva publicación
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
                        <p className="text-lg font-medium">No hay publicaciones</p>
                        <p className="text-sm">
                            {canGestionar
                                ? "Crea la primera publicación para tu carrera."
                                : "Aún no hay publicaciones para tu carrera."}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {currentPageContent.map((pub) => (
                            <TarjetaPublicacion
                                key={pub.id_publicacion}
                                publicacion={pub}
                                canGestionar={canGestionar}
                                onEditar={abrirEditar}
                                onEliminar={handleDeletePublicacion}
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

            <ModalPublicacion
                abierto={modalAbierto}
                publicacion={publicacionSeleccionada}
                compromisoList={compromisoList}
                onCrear={handleCreatePublicacion}
                onEditar={handleEditPublicacion}
                onEliminarImagen={handleDeleteImagen}
                onCerrar={cerrarModal}
            />
            <ModalPublicacionDetalle
                abierto={!!detalle}
                publicacion={detalle}
                onCerrar={() => setDetalle(null)}
            />
        </div>
    );
};

export default Publicaciones;
