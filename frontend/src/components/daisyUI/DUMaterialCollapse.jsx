import { formatearFechaDDMMAAAA } from "../../utils/calendar.utils.ts";

export const DUMaterialCollapse = ({
    material,
    canCrudMaterial,
    handleEditMateriales,
    handleDeleteMateriales,
    onAbrirPrestar,
    handleDevolverPrestamo,
    handleDeletePrestamo,
}) => {
    const stock = Number(material.stock ?? 0);
    const tieneStock = stock > 0;
    const prestamos = Array.isArray(material.prestamos) ? material.prestamos : [];
    const prestamosActivos = prestamos.filter(
        (p) => String(p.estado_prestamo).toLowerCase() === "prestado"
    );

    const badgeLabel = tieneStock
        ? `${stock} disponible${stock === 1 ? "" : "s"}`
        : "Sin stock";

    // Único elemento con color de estado: badge compacto + punto indicador
    const badgeClass = tieneStock
        ? "bg-primary/10 text-primary"
        : "bg-error/10 text-error";
    const dotClass = tieneStock ? "bg-primary" : "bg-error";

    return (
        <div className="collapse collapse-arrow bg-white border border-base-200 rounded-xl shadow-xs hover:border-base-300 transition-colors duration-200">
            <input type="checkbox" aria-label={`Ver detalle de ${material.nombre_material}`} />

            {/* Cabecera: nombre + categoría (texto secundario) + estado */}
            <div className="collapse-title flex items-center gap-3 pr-12">
                <div className="flex flex-col min-w-0">
                    <span className="truncate text-base font-semibold text-base-content">
                        {material.nombre_material}
                    </span>
                    {material.tipo_material && (
                        <span className="text-xs font-normal capitalize text-base-content/60">
                            {material.tipo_material}
                        </span>
                    )}
                </div>

                <span
                    className={`ml-auto mr-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${badgeClass}`}
                >
                    <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
                    {badgeLabel}
                </span>
            </div>

            <div className="collapse-content">
                {/* Metadatos: sin cajas, separados por divisor sutil */}
                <dl className="flex gap-10 pt-4 border-t border-base-200 text-sm">
                    <div>
                        <dt className="text-xs uppercase tracking-wide text-base-content/60">
                            Stock disponible
                        </dt>
                        <dd className="mt-0.5 font-semibold text-base-content">
                            {stock} {stock === 1 ? "unidad" : "unidades"}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-xs uppercase tracking-wide text-base-content/60">
                            Préstamos activos
                        </dt>
                        <dd className="mt-0.5 font-semibold text-base-content">
                            {prestamosActivos.length}
                        </dd>
                    </div>
                </dl>

                {/* Sección de préstamos */}
                <section className="mt-5 pt-4 border-t border-base-200">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-base-content/60">
                            Préstamos de este material
                        </h4>
                        {canCrudMaterial && (
                            <button
                                type="button"
                                className="btn btn-sm btn-primary"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAbrirPrestar(material);
                                }}
                                disabled={!tieneStock}
                                title={!tieneStock ? "No hay stock disponible" : "Prestar este material"}
                            >
                                + Prestar a estudiante
                            </button>
                        )}
                    </div>

                    {prestamos.length === 0 ? (
                        <p className="py-4 text-center text-sm italic text-base-content/50">
                            Aún no se han registrado préstamos para este material.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table table-sm w-full">
                                <thead>
                                    <tr className="border-b border-base-200 text-xs uppercase tracking-wide text-base-content/60">
                                        <th className="font-medium">Estudiante</th>
                                        <th className="font-medium">Fecha préstamo</th>
                                        <th className="font-medium">¿TNE?</th>
                                        <th className="font-medium">Estado</th>
                                        {canCrudMaterial && (
                                            <th className="text-right font-medium">Acción</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {prestamos.map((p) => {
                                        const esPrestado =
                                            String(p.estado_prestamo).toLowerCase() === "prestado";
                                        return (
                                            <tr
                                                key={p.id_prestamo}
                                                className="border-b border-base-200/60 last:border-0 hover:bg-base-200/30"
                                            >
                                                <td className="font-medium text-base-content">
                                                    {p.prestatario}
                                                </td>
                                                <td className="text-base-content/70">
                                                    {formatearFechaDDMMAAAA(p.fecha_prestamo)}
                                                </td>
                                                <td className="text-base-content/70">
                                                    {p.tne_entregada ? "Sí" : "No"}
                                                </td>
                                                <td>
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                                            esPrestado
                                                                ? "bg-warning/20 text-yellow-900"
                                                                : "bg-base-200 text-base-content/70"
                                                        }`}
                                                    >
                                                        {esPrestado ? "Prestado" : "Devuelto"}
                                                    </span>
                                                </td>
                                                {canCrudMaterial && (
                                                    <td className="text-right whitespace-nowrap">
                                                        {esPrestado && (
                                                            <button
                                                                type="button"
                                                                className="btn btn-xs btn-ghost border border-base-300 text-base-content hover:bg-base-200"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDevolverPrestamo(p.id_prestamo);
                                                                }}
                                                            >
                                                                Devolver
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            className="btn btn-xs btn-ghost btn-square ml-1 text-base-content/40 hover:bg-error/10 hover:text-error"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeletePrestamo(p.id_prestamo);
                                                            }}
                                                            title="Eliminar registro de préstamo"
                                                            aria-label="Eliminar registro de préstamo"
                                                        >
                                                            ✕
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {/* Acciones del material: secundaria + destructiva de baja prominencia */}
                {canCrudMaterial && (
                    <div className="mt-5 pt-4 border-t border-base-200 flex justify-end gap-2">
                        <button
                            type="button"
                            className="btn btn-sm btn-ghost border border-base-300 text-base-content hover:bg-base-200"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleEditMateriales(material.id_material ?? material.id, material);
                            }}
                        >
                            Editar inventario
                        </button>
                        <button
                            type="button"
                            className="btn btn-sm btn-ghost border border-error/30 text-error hover:bg-error/10 hover:border-error/50"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMateriales(material.id_material ?? material.id);
                            }}
                        >
                            Eliminar material
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export const DUMaterialList = ({ data = [], ...props }) => {
    if (!data.length) {
        return (
            <p className="py-6 text-center text-base-content/60">
                No hay materiales para mostrar.
            </p>
        );
    }
    return (
        <div className="flex flex-col gap-3">
            {data.map((material) => (
                <DUMaterialCollapse
                    key={material.id_material ?? material.id ?? material.nombre_material}
                    material={material}
                    {...props}
                />
            ))}
        </div>
    );
};

export default DUMaterialList;