import { useEffect, useState } from "react";
import { formatearFechaDDMMAAAA } from "../../utils/calendar.utils.js";
import {
    APORTE_DESCRIPCION_MIN,
    APORTE_DESCRIPCION_MAX,
    MONTO_MINIMO,
    OPCIONES_PROCEDENCIA,
    OPCIONES_DESCRIPCION,
    OPCIONES_TIPO,
} from "../../constants/aporte.constants.jsx";
import { formatoCLP, valoresIniciales } from "../../utils/aporte.utils.js";

const validar = ({ descripcion_aporte, otra_descripcion, fecha_aporte, procedencia, otra_procedencia, monto, tipo }) => {
    const errores = {};

    if (!descripcion_aporte) {
        errores.descripcion_aporte = "Selecciona una descripción";
    } else if (descripcion_aporte.toLowerCase() === "otro") {
        const descripcionTrim = (otra_descripcion || "").trim();
        if (!descripcionTrim) {
            errores.descripcion_aporte = "Debes ingresar la nueva descripción";
        } else if (descripcionTrim.length < APORTE_DESCRIPCION_MIN || descripcionTrim.length > APORTE_DESCRIPCION_MAX) {
            errores.descripcion_aporte = `La descripción debe tener entre ${APORTE_DESCRIPCION_MIN} y ${APORTE_DESCRIPCION_MAX} caracteres`;
        }
    }

    if (!fecha_aporte) errores.fecha_aporte = "Selecciona una fecha";
    if (!tipo) errores.tipo = "Selecciona un tipo";

    if (!procedencia) {
        errores.procedencia = "Selecciona una procedencia";
    } else if (procedencia.toLowerCase() === "otro" && !otra_procedencia?.trim()) {
        errores.procedencia = "Debes ingresar la nueva procedencia";
    }

    // El backend exige un entero >= MONTO_MINIMO
    const numero = Number(monto);
    if (!Number.isInteger(numero) || numero < MONTO_MINIMO) {
        errores.monto = `El monto debe ser un número entero de al menos ${formatoCLP.format(MONTO_MINIMO)}`;
    }

    return errores;
};

// `aporte` null = modo crear. Con aporte = modo detalle (editable si puedeGestionar).
export const DetalleAporte = ({
    abierto,
    aporte,
    puedeGestionar,
    onCrear,
    onEditar,
    onEliminar,
    onCerrar,
}) => {
    const esNuevo = !aporte;
    const [editando, setEditando] = useState(false);
    const [form, setForm] = useState(valoresIniciales(null));
    const [errores, setErrores] = useState({});
    const [guardando, setGuardando] = useState(false);

    // Reinicia el formulario cada vez que se abre o cambia el aporte seleccionado
    useEffect(() => {
        setForm(valoresIniciales(aporte));
        setErrores({});
        setEditando(!aporte);
    }, [aporte, abierto]);

    if (!abierto) return null;

    const cambiar = (campo) => (e) => {
        const valor = e.target.value;
        setForm((prev) => ({ ...prev, [campo]: valor }));
        if (campo === "procedencia" || campo === "otra_procedencia") {
            setErrores((prev) => ({ ...prev, procedencia: undefined }));
        } else if (campo === "descripcion_aporte" || campo === "otra_descripcion") {
            setErrores((prev) => ({ ...prev, descripcion_aporte: undefined }));
        } else if (errores[campo]) {
            setErrores((prev) => ({ ...prev, [campo]: undefined }));
        }
    };

    const handleGuardar = async () => {
        const erroresForm = validar(form);
        setErrores(erroresForm);
        if (Object.keys(erroresForm).length > 0) return;

        const descripcionFinal =
            form.descripcion_aporte.toLowerCase() === "otro"
                ? form.otra_descripcion.trim()
                : form.descripcion_aporte.trim();

        const procedenciaFinal =
            form.procedencia.toLowerCase() === "otro"
                ? form.otra_procedencia.trim()
                : form.procedencia.trim();

        // Solo campos que el backend acepta (cualquier otro devuelve 400)
        const datos = {
            descripcion_aporte: descripcionFinal,
            fecha_aporte: form.fecha_aporte, // YYYY-MM-DD
            procedencia: procedenciaFinal,
            monto: Number(form.monto),
            tipo: form.tipo,
        };

        setGuardando(true);
        const ok = esNuevo ? await onCrear(datos) : await onEditar(aporte.id_aporte, datos);
        setGuardando(false);

        if (!ok) return;
        if (esNuevo) onCerrar();
        else setEditando(false);
    };

    const handleCancelar = () => {
        if (esNuevo) {
            onCerrar();
            return;
        }
        setForm(valoresIniciales(aporte));
        setErrores({});
        setEditando(false);
    };

    const handleEliminar = async () => {
        const ok = await onEliminar(aporte.id_aporte);
        if (ok) onCerrar();
    };

    const campoTexto = (etiqueta, campo, contenidoLectura, entrada) => (
        <div className="border border-base-content/20 rounded-lg px-4 py-3">
            <label className="text-sm text-base-content/60 block mb-1">{etiqueta}</label>
            {editando ? entrada : <p className="font-medium break-words">{contenidoLectura}</p>}
            {errores[campo] && <p className="text-xs text-error mt-1">{errores[campo]}</p>}
        </div>
    );

    const etiquetaTipo = OPCIONES_TIPO.find((t) => t.id === (aporte?.tipo || "ingreso"))?.etiqueta;

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={onCerrar}
        >
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative max-h-full overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    className="btn btn-sm btn-circle btn-ghost absolute right-6 top-6"
                    onClick={onCerrar}
                    aria-label="Cerrar"
                >
                    ✕
                </button>

                <h3 className="text-2xl font-bold text-center w-full mb-6">
                    {esNuevo ? "Crear Aporte" : editando ? "Editar Aporte" : "Detalle Aporte"}
                </h3>

                <div className="space-y-4 mb-6">
                    {campoTexto(
                        "Tipo:",
                        "tipo",
                        etiquetaTipo,
                        <select
                            className="select select-bordered w-full"
                            value={form.tipo}
                            onChange={cambiar("tipo")}
                        >
                            {OPCIONES_TIPO.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.etiqueta}
                                </option>
                            ))}
                        </select>
                    )}
                    {campoTexto(
                        "Descripción:",
                        "descripcion_aporte",
                        aporte?.descripcion_aporte,
                        <div className="space-y-2">
                            <select
                                className={`select select-bordered w-full ${errores.descripcion_aporte && !form.descripcion_aporte ? "select-error" : ""}`}
                                value={form.descripcion_aporte}
                                onChange={cambiar("descripcion_aporte")}
                            >
                                <option value="" disabled>
                                    Selecciona una descripción
                                </option>
                                {OPCIONES_DESCRIPCION.map((opcion) => (
                                    <option key={opcion} value={opcion}>
                                        {opcion}
                                    </option>
                                ))}
                            </select>
                            {form.descripcion_aporte?.toLowerCase() === "otro" && (
                                <input
                                    type="text"
                                    maxLength={APORTE_DESCRIPCION_MAX}
                                    className={`input input-bordered w-full ${errores.descripcion_aporte && (!form.otra_descripcion?.trim() || form.otra_descripcion.trim().length < APORTE_DESCRIPCION_MIN) ? "input-error" : ""}`}
                                    placeholder="Ingresa la nueva descripción *"
                                    value={form.otra_descripcion}
                                    onChange={cambiar("otra_descripcion")}
                                    autoFocus
                                />
                            )}
                        </div>
                    )}
                    {campoTexto(
                        "Fecha:",
                        "fecha_aporte",
                        aporte && formatearFechaDDMMAAAA(aporte.fecha_aporte),
                        <input
                            type="date"
                            className={`input input-bordered w-full ${errores.fecha_aporte ? "input-error" : ""}`}
                            value={form.fecha_aporte}
                            onChange={cambiar("fecha_aporte")}
                        />
                    )}
                    {campoTexto(
                        "Procedencia:",
                        "procedencia",
                        aporte?.procedencia,
                        <div className="space-y-2">
                            <select
                                className={`select select-bordered w-full ${errores.procedencia && !form.procedencia ? "select-error" : ""}`}
                                value={form.procedencia}
                                onChange={cambiar("procedencia")}
                            >
                                <option value="" disabled>
                                    Selecciona una procedencia
                                </option>
                                {OPCIONES_PROCEDENCIA.map((opcion) => (
                                    <option key={opcion} value={opcion}>
                                        {opcion}
                                    </option>
                                ))}
                            </select>
                            {form.procedencia?.toLowerCase() === "otro" && (
                                <input
                                    type="text"
                                    className={`input input-bordered w-full ${errores.procedencia && !form.otra_procedencia?.trim() ? "input-error" : ""}`}
                                    placeholder="Ingresa la nueva procedencia *"
                                    value={form.otra_procedencia}
                                    onChange={cambiar("otra_procedencia")}
                                    autoFocus
                                />
                            )}
                        </div>
                    )}
                    {campoTexto(
                        "Monto:",
                        "monto",
                        aporte && formatoCLP.format(Number(aporte.monto) || 0),
                        <input
                            type="number"
                            min={MONTO_MINIMO}
                            step="1"
                            className={`input input-bordered w-full ${errores.monto ? "input-error" : ""}`}
                            value={form.monto}
                            onChange={cambiar("monto")}
                        />
                    )}
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                    {editando ? (
                        <>
                            <button className="btn btn-primary" onClick={handleGuardar} disabled={guardando}>
                                {esNuevo ? "Crear" : "Guardar"}
                            </button>
                            <button className="btn btn-neutral" onClick={handleCancelar} disabled={guardando}>
                                Cancelar
                            </button>
                        </>
                    ) : (
                        <>
                            {puedeGestionar && (
                                <>
                                    <button className="btn btn-primary" onClick={() => setEditando(true)}>
                                        Editar
                                    </button>
                                    <button className="btn btn-error" onClick={handleEliminar}>
                                        Eliminar
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

export default DetalleAporte;