import { useEffect, useState } from "react";
import { getContenidoActaService } from "@services/reunion.service.js";
import { formatearFechaDDMMAAAA } from "../../utils/calendar.utils.js";
import "@styles/editorActa.css";

//Modal de Lectura que muestra el contenido HTML del acta finalizada.
export const VisorActa = ({ reunion, onCerrar }) => {
    const [contenido, setContenido] = useState("");
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelado = false;
        (async () => {
            try {
                const data = await getContenidoActaService(reunion.id_reunion);
                if (!cancelado) setContenido(data?.contenido || "");
            } catch (err) {
                if (!cancelado)
                    setError(
                        err?.response?.data?.message || "No se pudo cargar el acta"
                    );
            } finally {
                if (!cancelado) setCargando(false);
            }
        })();
        return () => { cancelado = true; };
    }, [reunion.id_reunion]);

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
                {/* Encabezado */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-base-content/10">
                    <div className="min-w-0">
                        <h3 className="text-lg font-bold">Acta de la reunión</h3>
                        <p className="text-xs text-base-content/60 truncate">
                            {formatearFechaDDMMAAAA(reunion.fecha_reunion)} · {reunion.descripcion}
                        </p>
                    </div>
                    <button
                        className="btn btn-sm btn-circle btn-ghost"
                        onClick={onCerrar}
                    >
                        ✕
                    </button>
                </div>

                {/* Cuerpo */}
                <div className="acta-editor flex-1 overflow-y-auto">
                    {cargando ? (
                        <div className="flex justify-center py-16">
                            <span className="loading loading-spinner loading-lg" />
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-base-content/60">
                            <p className="text-sm">{error}</p>
                        </div>
                    ) : !contenido.trim() ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-base-content/60">
                            <p className="text-sm">Esta reunión aún no tiene acta redactada.</p>
                        </div>
                    ) : (
                        // Renderiza el HTML sanitizado en solo lectura
                        <div
                            className="tiptap"
                            dangerouslySetInnerHTML={{ __html: contenido }}
                        />
                    )}
                </div>

                {/* Pie */}
                <div className="flex justify-end px-6 py-3 border-t border-base-content/10">
                    <button className="btn btn-neutral btn-sm" onClick={onCerrar}>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VisorActa;

