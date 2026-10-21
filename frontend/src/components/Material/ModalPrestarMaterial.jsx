import { useEffect, useState } from "react";

const hoyISO = () => new Date().toLocaleDateString("en-CA");

export const ModalPrestarMaterial = ({
    abierto,
    material,
    onPrestar,
    onCerrar,
}) => {
    const [prestatario, setPrestatario] = useState("");
    const [fechaPrestamo, setFechaPrestamo] = useState(hoyISO());
    const [tneEntregada, setTneEntregada] = useState("false");
    const [errores, setErrores] = useState({});
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        if (abierto) {
            setPrestatario("");
            setFechaPrestamo(hoyISO());
            setTneEntregada("false");
            setErrores({});
            setGuardando(false);
        }
    }, [abierto, material]);

    if (!abierto || !material) return null;

    const handleSubmit = async (e) => {
        e?.preventDefault();
        const err = {};
        const nombre = prestatario.trim();

        if (!nombre) {
            err.prestatario = "El nombre del estudiante es obligatorio";
        } else if (nombre.length < 3 || nombre.length > 60) {
            err.prestatario = "Debe tener entre 3 y 60 caracteres";
        }

        if (!fechaPrestamo) {
            err.fechaPrestamo = "Selecciona la fecha del préstamo";
        }

        setErrores(err);
        if (Object.keys(err).length > 0) return;

        setGuardando(true);
        const ok = await onPrestar({
            materialId: material.id_material ?? material.id,
            prestatario: nombre,
            fecha_prestamo: fechaPrestamo,
            tne_entregada: tneEntregada === "true",
        });
        setGuardando(false);

        if (ok) {
            onCerrar();
        }
    };

    const stockDisponible = Number(material.stock ?? 0);

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4"
            onClick={onCerrar}
        >
            <div
                className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto border border-base-300"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
                    onClick={onCerrar}
                    aria-label="Cerrar modal"
                >
                    ✕
                </button>

                <h3 className="text-xl font-bold text-center w-full mb-2 text-base-content">
                    Prestar material
                </h3>

                <div className="bg-base-200 rounded-lg p-3 mb-4 text-center">
                    <p className="font-semibold text-primary">{material.nombre_material}</p>
                    <p className="text-xs text-base-content/70">
                        Stock disponible: <span className="font-bold">{stockDisponible}</span> {stockDisponible === 1 ? "unidad" : "unidades"}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-semibold">
                                Nombre del estudiante (Prestatario) <span className="text-error">*</span>
                            </span>
                        </label>
                        <input
                            type="text"
                            placeholder="Nombre y apellido del alumno"
                            className={`input input-bordered w-full ${errores.prestatario ? "input-error" : ""}`}
                            value={prestatario}
                            onChange={(e) => {
                                setPrestatario(e.target.value);
                                if (errores.prestatario) setErrores((prev) => ({ ...prev, prestatario: null }));
                            }}
                            autoFocus
                        />
                        {errores.prestatario && (
                            <span className="text-xs text-error mt-1">{errores.prestatario}</span>
                        )}
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-semibold">
                                Fecha de préstamo <span className="text-error">*</span>
                            </span>
                        </label>
                        <input
                            type="date"
                            className="input input-bordered w-full"
                            value={fechaPrestamo}
                            onChange={(e) => setFechaPrestamo(e.target.value)}
                        />
                        {errores.fechaPrestamo && (
                            <span className="text-xs text-error mt-1">{errores.fechaPrestamo}</span>
                        )}
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-semibold">¿TNE entregada en garantía?</span>
                        </label>
                        <select
                            className="select select-bordered w-full"
                            value={tneEntregada}
                            onChange={(e) => setTneEntregada(e.target.value)}
                        >
                            <option value="false">No</option>
                            <option value="true">Sí</option>
                        </select>
                    </div>

                    <p className="text-xs text-base-content/70 italic">
                        * Al registrar el préstamo, se descontará automáticamente 1 unidad del stock disponible.
                    </p>

                    <div className="flex justify-end gap-3 pt-3 border-t border-base-300">
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={onCerrar}
                            disabled={guardando}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary btn-sm"
                            disabled={guardando || stockDisponible < 1}
                        >
                            {guardando ? (
                                <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                                "Registrar préstamo"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalPrestarMaterial;
