import { useEffect, useState } from "react";
import { TIPO_MATERIAL } from "../../constants/material.constants.jsx";
import { normalizarFechaISO } from "../../utils/calendar.utils.ts";

const valoresIniciales = (mat) => ({
    nombre_material: mat?.nombre_material || "",
    tipo_material: mat?.tipo_material || "",
    stock: mat?.stock !== undefined && mat?.stock !== null ? String(mat.stock) : "1",
    fecha_prestamo: mat?.fecha_prestamo ? normalizarFechaISO(mat.fecha_prestamo) : "",
    prestatario: mat?.prestatario ?? mat?.nombre_prestamo ?? "",
    estado_prestamo: mat?.estado_prestamo || "disponible",
    tne_entregada: mat?.tne_entregada === true ? "true" : "false",
});

const validar = (form, isEdit, materialOriginal) => {
    const errores = {};
    const nombre = form.nombre_material.trim();
    const prestatario = form.prestatario.trim();
    const stockNum = Number(form.stock);

    if (!nombre) {
        errores.nombre_material = "El nombre del material es obligatorio";
    } else if (nombre.length < 3 || nombre.length > 60) {
        errores.nombre_material = "El nombre debe tener entre 3 y 60 caracteres";
    }

    if (!form.tipo_material) {
        errores.tipo_material = "Selecciona un tipo de material";
    }

    if (!form.estado_prestamo) {
        errores.estado_prestamo = "Selecciona un estado de préstamo";
    }

    if (form.stock === "" || !Number.isInteger(stockNum) || stockNum < 0) {
        errores.stock = "El stock debe ser un número entero mayor o igual a 0";
    } else {
        if (!isEdit && form.estado_prestamo === "prestado" && stockNum < 1) {
            errores.stock = "Para registrar en estado Prestado, el stock debe ser al menos 1";
        }
        if (isEdit) {
            const estadoAnterior = String(materialOriginal?.estado_prestamo || "").toLowerCase();
            if (form.estado_prestamo === "prestado" && estadoAnterior !== "prestado" && stockNum < 1) {
                errores.stock = "No hay stock suficiente para cambiar el estado a Prestado";
            }
        }
    }

    if (prestatario && (prestatario.length < 3 || prestatario.length > 50)) {
        errores.prestatario = "El prestatario debe tener entre 3 y 50 caracteres si se especifica";
    }

    return errores;
};

export const ModalMaterial = ({
    abierto,
    material,
    onCrear,
    onEditar,
    onCerrar,
}) => {
    const esNuevo = !material;
    const [form, setForm] = useState(valoresIniciales(null));
    const [errores, setErrores] = useState({});
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        if (abierto) {
            setForm(valoresIniciales(material));
            setErrores({});
        }
    }, [material, abierto]);

    if (!abierto) return null;

    const cambiar = (campo) => (e) => {
        setForm((prev) => ({ ...prev, [campo]: e.target.value }));
        if (errores[campo]) {
            setErrores((prev) => ({ ...prev, [campo]: null }));
        }
    };

    const handleGuardar = async (e) => {
        e?.preventDefault();
        const erroresForm = validar(form, !esNuevo, material);
        setErrores(erroresForm);
        if (Object.keys(erroresForm).length > 0) return;

        const datos = {
            nombre_material: form.nombre_material.trim(),
            tipo_material: form.tipo_material,
            stock: Number(form.stock),
            fecha_prestamo: form.fecha_prestamo || null,
            prestatario: form.prestatario.trim(),
            nombre_prestamo: form.prestatario.trim(),
            estado_prestamo: form.estado_prestamo,
            tne_entregada: form.tne_entregada === "true",
        };

        setGuardando(true);
        let ok = false;
        if (esNuevo) {
            ok = await onCrear(datos);
        } else {
            const id = material?.id_material ?? material?.id;
            ok = await onEditar(id, datos);
        }
        setGuardando(false);

        if (ok) {
            onCerrar();
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4"
            onClick={onCerrar}
        >
            <div
                className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-lg p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto border border-base-300"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
                    onClick={onCerrar}
                    aria-label="Cerrar modal"
                >
                    ✕
                </button>

                <h3 className="text-xl sm:text-2xl font-bold text-center w-full mb-6 text-base-content">
                    {esNuevo ? "Registrar nuevo material" : "Editar material"}
                </h3>

                <form onSubmit={handleGuardar} className="space-y-4">
                    {/* Nombre del material */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-semibold">
                                Nombre del material <span className="text-error">*</span>
                            </span>
                        </label>
                        <input
                            type="text"
                            placeholder="Ej. Calculadora científica, Balón de fútbol..."
                            className={`input input-bordered w-full ${errores.nombre_material ? "input-error" : ""}`}
                            value={form.nombre_material}
                            onChange={cambiar("nombre_material")}
                        />
                        {errores.nombre_material && (
                            <span className="text-xs text-error mt-1">{errores.nombre_material}</span>
                        )}
                    </div>

                    {/* Fila: Tipo de material y Stock */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-semibold">
                                    Tipo de material <span className="text-error">*</span>
                                </span>
                            </label>
                            <select
                                className={`select select-bordered w-full ${errores.tipo_material ? "select-error" : ""}`}
                                value={form.tipo_material}
                                onChange={cambiar("tipo_material")}
                            >
                                <option value="" disabled>Selecciona un tipo</option>
                                {TIPO_MATERIAL.map((t) => (
                                    <option key={t} value={t}>
                                        {t.charAt(0).toUpperCase() + t.slice(1)}
                                    </option>
                                ))}
                            </select>
                            {errores.tipo_material && (
                                <span className="text-xs text-error mt-1">{errores.tipo_material}</span>
                            )}
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-semibold">
                                    Stock <span className="text-error">*</span>
                                </span>
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="1"
                                placeholder="1"
                                className={`input input-bordered w-full ${errores.stock ? "input-error" : ""}`}
                                value={form.stock}
                                onChange={cambiar("stock")}
                            />
                            {errores.stock && (
                                <span className="text-xs text-error mt-1">{errores.stock}</span>
                            )}
                        </div>
                    </div>

                    {/* Fila: Fecha y Prestatario */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-semibold">Fecha de préstamo</span>
                            </label>
                            <input
                                type="date"
                                className="input input-bordered w-full"
                                value={form.fecha_prestamo}
                                onChange={cambiar("fecha_prestamo")}
                            />
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-semibold">Prestatario (opcional)</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Nombre del solicitante"
                                className={`input input-bordered w-full ${errores.prestatario ? "input-error" : ""}`}
                                value={form.prestatario}
                                onChange={cambiar("prestatario")}
                            />
                            {errores.prestatario && (
                                <span className="text-xs text-error mt-1">{errores.prestatario}</span>
                            )}
                        </div>
                    </div>

                    {/* Fila: Estado préstamo y TNE */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-semibold">
                                    Estado préstamo <span className="text-error">*</span>
                                </span>
                            </label>
                            <select
                                className="select select-bordered w-full"
                                value={form.estado_prestamo}
                                onChange={cambiar("estado_prestamo")}
                            >
                                <option value="disponible">Disponible</option>
                                <option value="prestado">Prestado</option>
                                <option value="pendiente">Pendiente</option>
                                <option value="devuelto">Devuelto</option>
                            </select>
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-semibold">¿TNE entregada?</span>
                            </label>
                            <select
                                className="select select-bordered w-full"
                                value={form.tne_entregada}
                                onChange={cambiar("tne_entregada")}
                            >
                                <option value="false">No</option>
                                <option value="true">Sí</option>
                            </select>
                        </div>
                    </div>

                    {/* Nota explicativa sobre el stock */}
                    <p className="text-xs text-base-content/70 italic mt-2">
                        {esNuevo
                            ? "Nota: Si el estado es Prestado, se descontará automáticamente 1 unidad del stock ingresado al crearlo."
                            : "Nota: Si cambias el estado a Prestado se descontará 1 unidad. Si cambia a Devuelto/Disponible se recuperará 1 unidad."}
                    </p>

                    {/* Botones de acción */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-base-300">
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={onCerrar}
                            disabled={guardando}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={guardando}
                        >
                            {guardando ? (
                                <span className="loading loading-spinner loading-sm"></span>
                            ) : esNuevo ? (
                                "Registrar material"
                            ) : (
                                "Guardar cambios"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalMaterial;
