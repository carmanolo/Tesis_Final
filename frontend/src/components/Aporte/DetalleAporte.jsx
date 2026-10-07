import { useEffect, useState } from "react";
import { formatearFechaDDMMAAAA, normalizarFechaISO } from "../../utils/calendar.utils.js";
import { APORTE_DESCRIPCION_MIN, APORTE_DESCRIPCION_MAX } from "../../constants/aporte.constants.jsx";

const formatoCLP = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
});

const hoyISO = () => new Date().toLocaleDateString("en-CA"); // AAAA-MM-DD en hora local

const valoresIniciales = (aporte) => ({
    descripcion_aporte: aporte?.descripcion_aporte || "",
    fecha_aporte: aporte ? normalizarFechaISO(aporte.fecha_aporte) : hoyISO(),
    procedencia: aporte?.procedencia || "",
    monto: aporte?.monto ?? "",
});

const validar = ({ descripcion_aporte, fecha_aporte, procedencia, monto }) => {
    const errores = {};
    const descripcion = descripcion_aporte.trim();

    if (descripcion.length < APORTE_DESCRIPCION_MIN || descripcion.length > APORTE_DESCRIPCION_MAX) {
        errores.descripcion_aporte = `La descripción debe tener entre ${APORTE_DESCRIPCION_MIN} y ${APORTE_DESCRIPCION_MAX} caracteres`;
    }
    if (!fecha_aporte) errores.fecha_aporte = "Selecciona una fecha";
    if (!procedencia.trim()) errores.procedencia = "Indica la procedencia";
    if (!(Number(monto) > 0)) errores.monto = "El monto debe ser mayor a 0";

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

    const cambiar = (campo) => (e) => setForm((prev) => ({ ...prev, [campo]: e.target.value }));

    const handleGuardar = async () => {
        const erroresForm = validar(form);
        setErrores(erroresForm);
        if (Object.keys(erroresForm).length > 0) return;

        const datos = {
            descripcion_aporte: form.descripcion_aporte.trim(),
            fecha_aporte: form.fecha_aporte,
            procedencia: form.procedencia.trim(),
            monto: Number(form.monto),
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
                        "Descripción:",
                        "descripcion_aporte",
                        aporte?.descripcion_aporte,
                        <textarea
                            className="textarea textarea-bordered w-full"
                            value={form.descripcion_aporte}
                            onChange={cambiar("descripcion_aporte")}
                        />
                    )}
                    {campoTexto(
                        "Fecha:",
                        "fecha_aporte",
                        aporte && formatearFechaDDMMAAAA(aporte.fecha_aporte),
                        <input
                            type="date"
                            className="input input-bordered w-full"
                            value={form.fecha_aporte}
                            onChange={cambiar("fecha_aporte")}
                        />
                    )}
                    {campoTexto(
                        "Procedencia:",
                        "procedencia",
                        aporte?.procedencia,
                        <input
                            type="text"
                            className="input input-bordered w-full"
                            value={form.procedencia}
                            onChange={cambiar("procedencia")}
                        />
                    )}
                    {campoTexto(
                        "Monto:",
                        "monto",
                        aporte && formatoCLP.format(Number(aporte.monto) || 0),
                        <input
                            type="number"
                            min="1"
                            step="1"
                            className="input input-bordered w-full"
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