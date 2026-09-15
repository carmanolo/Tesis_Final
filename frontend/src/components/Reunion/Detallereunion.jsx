export const DetalleReunion = ({
    reunion,
    puedeGestionarActas,
    onSubirActa,
    onEditar,
    onEliminar,
    onDescargar,
    onCerrar,
}) => {
    if (!reunion) return null;

    const tieneActa = Boolean(reunion.ruta_archivo);

    return (
        <div className="rounded-box border border-base-content/10 bg-base-100 p-4 mt-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">Reunión</h3>
                <button className="btn btn-sm btn-circle btn-ghost" onClick={onCerrar}>✕</button>
            </div>

            <p className="text-sm text-base-content/70 mb-1">
                <span className="font-medium">Fecha:</span> {reunion.fecha_reunion}
            </p>
            <p className="text-sm mb-4">
                <span className="font-medium">Descripción:</span> {reunion.descripcion}
            </p>

            <div className="flex flex-wrap gap-2">
                {/* Disponible para todos los roles (estudiantes incluidos) */}
                <button
                    className="btn btn-sm btn-success"
                    onClick={() => onDescargar(reunion)}
                    disabled={!tieneActa}
                    title={tieneActa ? "Descargar acta" : "Aún no hay acta subida"}
                >
                    ⬇️ Descargar acta
                </button>

                {/* Solo miembros del CEE / admin */}
                {puedeGestionarActas && (
                    <>
                        <button className="btn btn-sm btn-primary" onClick={() => onSubirActa(reunion)}>
                            📤 {tieneActa ? "Reemplazar acta" : "Subir acta"}
                        </button>
                        <button className="btn btn-sm btn-info" onClick={() => onEditar(reunion.id_reunion, reunion)}>
                            ✏️ Editar
                        </button>
                        <button className="btn btn-sm btn-error" onClick={() => onEliminar(reunion.id_reunion)}>
                            🗑️ Eliminar
                        </button>
                    </>
                )}
            </div>

            {!tieneActa && (
                <p className="text-xs text-warning mt-2">Esta reunión aún no tiene un acta subida.</p>
            )}
        </div>
    );
};

export default DetalleReunion;