import { getEstadoStyle } from "../../constants/material.constants.jsx"
import { formatearFechaDDMMAAAA } from "../../utils/calendar.utils.js";

const Dato = ({ titulo, children }) => (
    <div>
        <p className="text-xs uppercase opacity-70">{titulo}</p>
        <p className="font-medium">{children}</p>
    </div>
);

export const DUMaterialCollapse = ({ material, canCrudMaterial, handleEditMateriales, handleDeleteMateriales }) => {
    const estado = getEstadoStyle(material.estado_prestamo);
    const stock = Number(material.stock ?? 0);
    const tne = material.tne_entregada === true;
    const prestatario = material.prestatario ?? material.nombre_prestamo;

    return (
        <div className={`collapse collapse-arrow border ${estado.card}`}>
            <input type="checkbox" aria-label={`Ver detalle de ${material.nombre_material}`} />

            <div className="collapse-title flex items-center gap-3 font-semibold">
                <span className="truncate">{material.nombre_material}</span>
                <span className={`badge ml-auto mr-6 ${estado.badge}`}>{estado.label}</span>
            </div>

            <div className="collapse-content">
                <div className="grid grid-cols-2 gap-3 pt-2 md:grid-cols-4">
                    <Dato titulo="Fecha préstamo">
                        {material.fecha_prestamo ? formatearFechaDDMMAAAA(material.fecha_prestamo) : "—"}
                    </Dato>
                    <Dato titulo="Prestatario">{prestatario || "—"}</Dato>
                    <Dato titulo="Stock">{Number.isFinite(stock) ? stock : 0}</Dato>
                    <Dato titulo="TNE entregada">{tne ? "Sí" : "No"}</Dato>
                </div>

                {canCrudMaterial && (
                    <div className="mt-4 flex justify-end gap-2">
                        <button className="btn btn-sm btn-outline" onClick={() => handleEditMateriales(material.id_material ?? material.id, material)}>
                            Editar
                        </button>
                        <button className="btn btn-sm btn-error" onClick={() => handleDeleteMateriales(material.id_material ?? material.id)}>
                            Eliminar
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
                <DUMaterialCollapse key={material.id_material ?? material.id ?? material.nombre_material} material={material} {...props} />
            ))}
        </div>
    );
};

export default DUMaterialList;