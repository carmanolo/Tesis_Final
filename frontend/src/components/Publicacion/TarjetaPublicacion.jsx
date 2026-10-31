import { useState } from "react";
import { getImageUrl } from "../../utils/publicacion.utils.js";

export function TarjetaPublicacion({ publicacion, canGestionar, onEditar, onEliminar }) {
    const [imagenActual, setImagenActual] = useState(0);
    const imagenes = Array.isArray(publicacion.imagenes) ? publicacion.imagenes : [];

    // Evita índice fuera de rango si se eliminan imágenes
    const indice = Math.min(imagenActual, Math.max(imagenes.length - 1, 0));

    const fecha = publicacion.createdAt
        ? new Date(publicacion.createdAt).toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" })
        : "";

    return (
        <div className="card bg-base-100 shadow-md border border-base-200 overflow-hidden">
            {/* Galería de imágenes */}
            {imagenes.length > 0 && (
                <figure className="relative bg-base-200 h-52">
                    <img
                        src={getImageUrl(imagenes[indice])}
                        alt={`imagen-${indice}`}
                        className="w-full h-full object-cover"
                        onError={e => { e.target.src = ""; e.target.alt = "Imagen no disponible"; }}
                    />
                    {imagenes.length > 1 && (
                        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                            {imagenes.map((_, i) => (
                                <button
                                    key={i}
                                    className={`w-2 h-2 rounded-full border border-white transition-colors ${i === indice ? "bg-white" : "bg-white/40"}`}
                                    onClick={() => setImagenActual(i)}
                                />
                            ))}
                        </div>
                    )}
                    {imagenes.length > 1 && (
                        <>
                            <button
                                className="absolute left-1 top-1/2 -translate-y-1/2 btn btn-circle btn-xs bg-black/40 text-white border-0 hover:bg-black/60"
                                onClick={() => setImagenActual((indice - 1 + imagenes.length) % imagenes.length)}
                            >‹</button>
                            <button
                                className="absolute right-1 top-1/2 -translate-y-1/2 btn btn-circle btn-xs bg-black/40 text-white border-0 hover:bg-black/60"
                                onClick={() => setImagenActual((indice + 1) % imagenes.length)}
                            >›</button>
                        </>
                    )}
                    <div className="absolute top-2 right-2 badge badge-neutral badge-sm">
                        {indice + 1}/{imagenes.length}
                    </div>
                </figure>
            )}

            <div className="card-body p-4">
                <h2 className="card-title text-base font-semibold">{publicacion.titulo}</h2>
                <p className="text-sm text-base-content/80 line-clamp-3">{publicacion.descripcion}</p>

                <div className="flex items-center justify-between mt-2 text-xs text-base-content/60">
                    <span>{publicacion.carrera?.nombre_carrera || publicacion.carrera?.sigla || ""}</span>
                    <span>{fecha}</span>
                </div>
                {publicacion.creador && (
                    <p className="text-xs text-base-content/50">Por: {publicacion.creador?.username || ""}</p>
                )}

                {canGestionar && (
                    <div className="card-actions justify-end mt-2">
                        <button className="btn btn-outline btn-xs" onClick={() => onEditar(publicacion)}>Editar</button>
                        <button className="btn btn-error btn-xs text-white" onClick={() => onEliminar(publicacion.id_publicacion)}>Eliminar</button>
                    </div>
                )}
            </div>
        </div>
    );
}