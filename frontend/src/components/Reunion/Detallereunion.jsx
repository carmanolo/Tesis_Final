import { useEffect, useState } from "react";

export const DetalleReunion = ({
    reunion,
    puedeGestionarActas,
    onSubirActa,
    onEditar,
    onEliminar,
    onDescargar,
    onCerrar,
}) => {
    const [editando, setEditando] = useState(false);
    const [fecha, setFecha] = useState("");
    const [descripcion, setDescripcion] = useState("");

    // Sincroniza los campos de edición cada vez que cambia la reunión seleccionada
    useEffect(() => {
        if (reunion) {
            setFecha(reunion.fecha_reunion || "");
            setDescripcion(reunion.descripcion || "");
        }
        setEditando(false);
    }, [reunion]);

    if (!reunion) return null;

    const tieneActa = Boolean(reunion.ruta_archivo);

    const handleGuardar = async () => {
        if (!fecha || !descripcion.trim()) return;
        await onEditar(reunion.id_reunion, {
            fecha_reunion: fecha,
            descripcion: descripcion.trim(),
        });
        setEditando(false);
    };

    const handleCancelarEdicion = () => {
        setFecha(reunion.fecha_reunion || "");
        setDescripcion(reunion.descripcion || "");
        setEditando(false);
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={onCerrar}
        >
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    className="btn btn-sm btn-circle btn-ghost absolute right-6 top-6"
                    onClick={onCerrar}
                >
                    ✕
                </button>

                <h3 className="text-2xl font-bold text-center w-full mb-6">
                    {editando ? "Editar Reunión" : "Detalle Reunión"}
                </h3>

                <div className="space-y-4 mb-6">
                    <div className="border border-base-content/20 rounded-lg px-4 py-3">
                        <label className="text-sm text-base-content/60 block mb-1">Fecha:</label>
                        {editando ? (
                            <input
                                type="date"
                                className="input input-bordered w-full"
                                value={fecha}
                                onChange={(e) => setFecha(e.target.value)}
                            />
                        ) : (
                            <p className="font-medium">{reunion.fecha_reunion}</p>
                        )}
                    </div>

                    <div className="border border-base-content/20 rounded-lg px-4 py-3">
                        <label className="text-sm text-base-content/60 block mb-1">Descripción:</label>
                        {editando ? (
                            <textarea
                                className="textarea textarea-bordered w-full"
                                value={descripcion}
                                onChange={(e) => setDescripcion(e.target.value)}
                            />
                        ) : (
                            <p className="font-medium">{reunion.descripcion}</p>
                        )}
                    </div>

                    {!editando && !tieneActa && (
                        <p className="text-xs text-warning">
                            Esta reunión aún no tiene un acta subida.
                        </p>
                    )}
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                    {editando ? (
                        <>
                            <button className="btn btn-primary" onClick={handleGuardar}>
                                💾 Guardar
                            </button>
                            <button className="btn btn-neutral" onClick={handleCancelarEdicion}>
                                Cancelar
                            </button>
                        </>
                    ) : (
                        <>
                            {/* Disponible para todos los roles (estudiantes incluidos) */}
                            <button
                                className="btn btn-success"
                                onClick={() => onDescargar(reunion)}
                                disabled={!tieneActa}
                                title={tieneActa ? "Descargar acta" : "Aún no hay acta subida"}
                            >
                                ⬇️ Descargar acta
                            </button>

                            {/* Solo miembros del CEE / admin */}
                            {puedeGestionarActas && (
                                <>
                                    <button className="btn btn-primary" onClick={() => onSubirActa(reunion)}>
                                        📤 {tieneActa ? "Reemplazar acta" : "Subir acta"}
                                    </button>
                                    <button className="btn btn-info" onClick={() => setEditando(true)}>
                                        ✏️ Editar
                                    </button>
                                    <button
                                        className="btn btn-error"
                                        onClick={() => onEliminar(reunion.id_reunion)}
                                    >
                                        🗑️ Eliminar
                                    </button>
                                </>
                            )}

                            <button className="btn btn-neutral" onClick={onCerrar}>
                                Cerrar
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DetalleReunion;