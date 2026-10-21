import { formatearFechaDDMMAAAA } from "../../utils/calendar.utils.ts";
import { ESTADO_ESTILOS } from "../../constants/material.constants.jsx";

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
    const prestamosActivos = prestamos.filter((p) => String(p.estado_prestamo).toLowerCase() === "prestado");

    const estilo = tieneStock ? ESTADO_ESTILOS.disponible : ESTADO_ESTILOS.prestado;
    const badgeLabel = tieneStock
        ? `${stock} disponible${stock === 1 ? "" : "s"}`
        : "Sin stock";

    return (
        <div className={`collapse collapse-arrow border ${estilo.card} rounded-xl shadow-xs transition-colors duration-200`}>
            <input type="checkbox" aria-label={`Ver detalle de ${material.nombre_material}`} />

            <div className="collapse-title flex items-center gap-3 font-semibold pr-12">
                <span className="truncate text-base">{material.nombre_material}</span>

                {material.tipo_material && (
                    <span
                        className={`badge badge-sm badge-outline capitalize opacity-90 ${
                            tieneStock
                                ? "border-green-600 text-green-950 bg-green-200/40"
                                : "border-red-600 text-red-950 bg-red-200/40"
                        }`}
                    >
                        {material.tipo_material}
                    </span>
                )}

                <span className={`badge badge-sm ml-auto mr-2 ${estilo.badge}`}>
                    {badgeLabel}
                </span>
            </div>

            <div className="collapse-content space-y-4">
                {/* Resumen de inventario */}
                <div
                    className={`grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 pb-3 border-b ${
                        tieneStock ? "border-green-300" : "border-red-300"
                    } text-sm`}
                >
                    <div>
                        <p className="text-xs uppercase opacity-70">Tipo de material</p>
                        <p className="font-semibold capitalize">{material.tipo_material || "—"}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase opacity-70">Stock disponible</p>
                        <p className="font-bold">{stock} {stock === 1 ? "unidad" : "unidades"}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase opacity-70">Préstamos activos</p>
                        <p className="font-bold">{prestamosActivos.length}</p>
                    </div>
                </div>

                {/* Sección de Préstamos */}
                <div className="bg-white/70 backdrop-blur-xs rounded-xl p-3 shadow-2xs border border-black/5">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider opacity-80 text-base-content">
                            Préstamos de este material
                        </h4>
                        {canCrudMaterial && (
                            <button
                                type="button"
                                className="btn btn-xs btn-primary gap-1"
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
                        <p className="text-xs text-base-content/60 italic py-2 text-center">
                            Aún no se han registrado préstamos para este material.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table table-xs w-full">
                                <thead>
                                    <tr className="bg-base-200/70 text-base-content/70">
                                        <th>Estudiante (Prestatario)</th>
                                        <th>Fecha préstamo</th>
                                        <th>¿TNE?</th>
                                        <th>Estado</th>
                                        {canCrudMaterial && <th className="text-right">Acción</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {prestamos.map((p) => {
                                        const esPrestado = String(p.estado_prestamo).toLowerCase() === "prestado";
                                        return (
                                            <tr key={p.id_prestamo} className="hover:bg-base-200/50">
                                                <td className="font-medium text-base-content">{p.prestatario}</td>
                                                <td className="text-base-content/80">{formatearFechaDDMMAAAA(p.fecha_prestamo)}</td>
                                                <td className="text-base-content/80">{p.tne_entregada ? "Sí" : "No"}</td>
                                                <td>
                                                    <span
                                                        className={`badge badge-xs font-medium ${
                                                            esPrestado
                                                                ? "badge-warning text-yellow-950"
                                                                : "badge-success text-white"
                                                        }`}
                                                    >
                                                        {esPrestado ? "Prestado" : "Devuelto"}
                                                    </span>
                                                </td>
                                                {canCrudMaterial && (
                                                    <td className="text-right space-x-1">
                                                        {esPrestado && (
                                                            <button
                                                                type="button"
                                                                className="btn btn-xs btn-success text-white"
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
                                                            className="btn btn-xs btn-ghost text-error"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeletePrestamo(p.id_prestamo);
                                                            }}
                                                            title="Eliminar registro de préstamo"
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
                </div>

                {/* Acciones del Material */}
                {canCrudMaterial && (
                    <div
                        className={`pt-3 border-t ${
                            tieneStock ? "border-green-300" : "border-red-300"
                        } flex justify-end gap-2`}
                    >
                        <button
                            type="button"
                            className="btn btn-xs btn-outline bg-white/60 hover:bg-white"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleEditMateriales(material.id_material ?? material.id, material);
                            }}
                        >
                            Editar inventario
                        </button>
                        <button
                            type="button"
                            className="btn btn-xs btn-error btn-outline bg-white/60 hover:bg-error hover:text-white"
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
        return <p className="py-6 text-center opacity-70">No hay materiales para mostrar.</p>;
    }
    return (
        <div className="flex flex-col gap-2">
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