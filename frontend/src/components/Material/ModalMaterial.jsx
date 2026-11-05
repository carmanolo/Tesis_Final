import { useEffect, useState } from "react";
import { TIPO_MATERIAL } from "../../constants/material.constants.jsx";

const valoresIniciales = (mat) => ({
    nombre_material: mat?.nombre_material || "",
    tipo_material: mat?.tipo_material || "",
    stock: mat?.stock !== undefined && mat?.stock !== null ? String(mat.stock) : "1",
});

const validar = (form) => {
    const errores = {};
    const nombre = form.nombre_material.trim();
    const stockNum = Number(form.stock);

    if (!nombre) {
        errores.nombre_material = "El nombre del material es obligatorio";
    } else if (nombre.length < 3 || nombre.length > 60) {
        errores.nombre_material = "El nombre debe tener entre 3 y 60 caracteres";
    }

    if (!form.tipo_material) {
        errores.tipo_material = "Selecciona un tipo de material";
    }

    if (form.stock === "" || !Number.isInteger(stockNum) || stockNum < 0) {
        errores.stock = "El stock debe ser un número entero mayor o igual a 0";
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
        const erroresForm = validar(form);
        setErrores(erroresForm);
        if (Object.keys(erroresForm).length > 0) return;

        const stockNum = Number(form.stock);
        const datos = {
            nombre_material: form.nombre_material.trim(),
            tipo_material: form.tipo_material,
            stock: stockNum,
            estado_prestamo: stockNum > 0 ? "disponible" : "prestado",
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
                className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto border border-base-300"
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
                            autoFocus
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
                                    Stock disponible <span className="text-error">*</span>
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

                    <p className="text-xs text-base-content/70 italic mt-2">
                        * Los préstamos a estudiantes se gestionan individualmente desde la tarjeta del material.
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
