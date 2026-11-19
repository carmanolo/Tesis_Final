import { useState } from "react";
import {getImageUrl} from "../../utils/respaldo.utils.ts"

export function TarjetaRespaldo({ respaldo, canGestionar, onEditar, onEliminar, onVer }) {
    const [imagenActual, setImagenActual] = useState(0);
    const imagenes = Array.isArray(respaldo.imagenes) ? respaldo.imagenes : [];

    // Evita índice fuera de rango si se eliminan imágenes
    const indice = Math.min(imagenActual, Math.max(imagenes.length - 1, 0));

    const fecha = respaldo.createdAt
        ? new Date(respaldo.createdAt).toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" })
        : "";

    return (
        <div className="card bg-base-100 shadow-md border border-base-200 overflow-hidden">
            {/* Galería de imágenes */}
            {imagenes.length > 0 && (
                <figure className="relative bg-base-200 h-52 cursor-pointer" onClick={() => onVer?.(respaldo)}>
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
                                    type="button"
                                    className={`w-2 h-2 rounded-full border border-white transition-colors ${i === indice ? "bg-white" : "bg-white/40"}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setImagenActual(i);
                                    }}
                                />
                            ))}
                        </div>
                    )}
                    {imagenes.length > 1 && (
                        <>
                            <button
                                type="button"
                                className="absolute left-1 top-1/2 -translate-y-1/2 btn btn-circle btn-xs bg-black/40 text-white border-0 hover:bg-black/60"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setImagenActual((indice - 1 + imagenes.length) % imagenes.length);
                                }}
                            >‹</button>
                            <button
                                type="button"
                                className="absolute right-1 top-1/2 -translate-y-1/2 btn btn-circle btn-xs bg-black/40 text-white border-0 hover:bg-black/60"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setImagenActual((indice + 1) % imagenes.length);
                                }}
                            >›</button>
                        </>
                    )}
                    <div className="absolute top-2 right-2 badge badge-neutral badge-sm">
                        {indice + 1}/{imagenes.length}
                    </div>
                </figure>
            )}

            <div className="card-body p-4">
                <h2 className="card-title text-base font-semibold cursor-pointer hover:underline" onClick={() => onVer?.(respaldo)}>
                    {respaldo.titulo}
                </h2>
                <p className="text-sm text-base-content/80 line-clamp-3">{respaldo.descripcion}</p>

                <div className="flex items-center justify-between mt-2 text-xs text-base-content/60">
                    <span>{respaldo.carrera?.nombre_carrera || respaldo.carrera?.sigla || ""}</span>
                    <span>{fecha}</span>
                </div>
                {respaldo.creador && (
                    <p className="text-xs text-base-content/50">Por: {respaldo.creador?.username || ""}</p>
                )}

                {canGestionar && (
                    <div className="card-actions justify-end mt-2">
                        <button className="btn btn-outline btn-xs" onClick={() => onEditar(respaldo)}>Editar</button>
                        <button className="btn btn-error btn-xs text-white" onClick={() => onEliminar(respaldo.id_respaldo)}>Eliminar</button>
                    </div>
                )}
            </div>
        </div>
    );
}