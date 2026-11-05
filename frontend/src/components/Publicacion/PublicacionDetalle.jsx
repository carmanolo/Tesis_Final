import { useEffect, useState } from "react";
import { getImageUrl } from "../../utils/publicacion.utils.js";

export function PublicacionDetalle({ publicacion }) {
    const [indice, setIndice] = useState(0);
    const imagenes = Array.isArray(publicacion?.imagenes) ? publicacion.imagenes : [];

    // Al cambiar de publicación vuelve a la primera imagen
    useEffect(() => {
        setIndice(0);
    }, [publicacion?.id_publicacion]);

    if (!publicacion) return null;

    const actual = Math.min(indice, Math.max(imagenes.length - 1, 0));
    const anterior = () => setIndice((actual - 1 + imagenes.length) % imagenes.length);
    const siguiente = () => setIndice((actual + 1) % imagenes.length);

    const fecha = publicacion.createdAt
        ? new Date(publicacion.createdAt).toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" })
        : "";
    const carrera = publicacion.carrera?.nombre_carrera || publicacion.carrera?.sigla || "";
    const autor = publicacion.creador?.username || "";

    return (
        <article className="w-full max-w-4xl mx-auto">
            {/* Título */}
            <header className="mb-5">
                {carrera && (
                    <span className="badge badge-primary badge-outline badge-sm mb-3">{carrera}</span>
                )}
                <h1 className="text-3xl md:text-4xl font-bold leading-tight">{publicacion.titulo}</h1>
                <p className="mt-3 text-sm text-base-content/60">
                    {autor && <span>Por {autor}</span>}
                    {autor && fecha && <span className="mx-2">·</span>}
                    {fecha && <time dateTime={publicacion.createdAt}>{fecha}</time>}
                </p>
            </header>

            {/* Imagen principal */}
            {imagenes.length > 0 && (
                <figure className="flex flex-col w-full mx-0 mb-6">
                    <div className="relative w-full flex items-center justify-center overflow-hidden rounded-xl bg-base-200">
                        <img
                            src={getImageUrl(imagenes[actual])}
                            alt={`${publicacion.titulo} (imagen ${actual + 1})`}
                            className="block w-auto h-auto max-w-full max-h-[70vh] object-contain"
                            onError={(e) => { e.target.src = ""; e.target.alt = "Imagen no disponible"; }}
                        />

                        {imagenes.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    aria-label="Imagen anterior"
                                    className="absolute left-3 top-1/2 -translate-y-1/2 btn btn-circle btn-sm bg-black/40 text-white border-0 hover:bg-black/60"
                                    onClick={anterior}
                                >‹</button>
                                <button
                                    type="button"
                                    aria-label="Imagen siguiente"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-circle btn-sm bg-black/40 text-white border-0 hover:bg-black/60"
                                    onClick={siguiente}
                                >›</button>
                                <div className="absolute top-3 right-3 badge badge-neutral">
                                    {actual + 1}/{imagenes.length}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Pie de foto con la esquina característica */}
                    <figcaption className="mt-2 w-full flex items-end gap-3 text-sm text-base-content/70">
                        <span className="inline-block w-4 h-4 shrink-0 border-l-2 border-b-2 border-info" aria-hidden="true" />
                        <span>
                            {carrera ? `${carrera} · ` : ""}
                            {imagenes.length > 1 ? `Imagen ${actual + 1} de ${imagenes.length}` : "Imagen de la publicación"}
                        </span>
                    </figcaption>

                    {/* Miniaturas (solo si hay varias) */}
                    {imagenes.length > 1 && (
                        <div className="mt-3 w-full flex gap-2 overflow-x-auto pb-1">
                            {imagenes.map((img, i) => (
                                <button
                                    key={img}
                                    type="button"
                                    aria-label={`Ver imagen ${i + 1}`}
                                    onClick={() => setIndice(i)}
                                    className={`shrink-0 w-20 h-14 rounded-md overflow-hidden border-2 transition-opacity ${
                                        i === actual ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
                                    }`}
                                >
                                    <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </figure>
            )}

            {/* Descripción */}
            <div className="text-lg leading-relaxed whitespace-pre-line">
                {publicacion.descripcion}
            </div>
        </article>
    );
}

/**
 * Misma vista dentro de un modal grande. Cierra con Esc, con el fondo o con el botón.
 */
export function ModalPublicacionDetalle({ abierto, publicacion, onCerrar }) {
    useEffect(() => {
        if (!abierto) return;
        const onKey = (e) => { if (e.key === "Escape") onCerrar(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [abierto, onCerrar]);

    if (!abierto || !publicacion) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box w-11/12 max-w-5xl max-h-[92vh] p-6 md:p-10">
                <button
                    type="button"
                    aria-label="Cerrar"
                    className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3"
                    onClick={onCerrar}
                >✕</button>
                <PublicacionDetalle publicacion={publicacion} />
            </div>
            <div className="modal-backdrop" onClick={onCerrar}></div>
        </div>
    );
}