import { useEffect, useMemo, useState } from "react";
import { getUserRole } from "../services/user.service.js";
import { ACCESO_GESTION_ACTAS } from "../constants/reunion.constants.jsx";

import { ReunionesLista } from "../components/Reunion/ReunionesLista.jsx";
import { DetalleReunion } from "../components/Reunion/Detallereunion.jsx";
import { EditorActa } from "../components/Reunion/EditorActa.jsx";
import { VisorActa } from "../components/Reunion/VisorActa.jsx";

import { useGetReuniones } from "@hooks/reuniones/useGetReuniones.jsx";
import { useCreateReunion } from "@hooks/reuniones/useCreateReunion.jsx";
import { usePatchReunion } from "@hooks/reuniones/usePatchReunion.jsx";
import { useDeleteReunion } from "@hooks/reuniones/useDeleteReunion.jsx";
import { normalizarFechaISO } from "../utils/calendar.utils.js";
import { hoyISOLocal } from "../utils/calendar.utils.js";




const Reunion = () => {
    const [reunionData, setReunionData] = useState([]);
    const [reuniones, fetchReuniones] = useGetReuniones(reunionData, setReunionData);
    const [reunionSeleccionada, setReunionSeleccionada] = useState(null);
    const [reunionEditando, setReunionEditando] = useState(null);
    const [reunionViendo, setReunionViendo] = useState(null);

    const userRole = getUserRole();
    const puedeGestionarActas = ACCESO_GESTION_ACTAS.includes(userRole);

    // Separa: la más próxima, el resto de próximas (asc) y las anteriores (desc)
    const { proxima, otrasProximas, anteriores } = useMemo(() => {
        const hoy = hoyISOLocal();
        const conFecha = (Array.isArray(reuniones) ? reuniones : [])
            .map((r) => ({ r, f: normalizarFechaISO(r.fecha_reunion) }))
            .filter(({ f }) => f);

        const futuras = conFecha
            .filter(({ f }) => f >= hoy)
            .sort((a, b) => a.f.localeCompare(b.f))
            .map(({ r }) => r);
        const pasadas = conFecha
            .filter(({ f }) => f < hoy)
            .sort((a, b) => b.f.localeCompare(a.f))
            .map(({ r }) => r);

        return {
            proxima: futuras[0] || null,
            otrasProximas: futuras.slice(1),
            anteriores: pasadas,
        };
    }, [reuniones]);

    const { handleCreateReunion } = useCreateReunion(fetchReuniones);
    const { handleEditReunion } = usePatchReunion(fetchReuniones);
    const { handleDeleteReunion } = useDeleteReunion(fetchReuniones);

    useEffect(() => {
        if (typeof fetchReuniones === "function") {
            fetchReuniones();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Mantiene sincronizado el panel de detalle cuando la lista se refresca
    useEffect(() => {
        if (!reunionSeleccionada) return;
        const actualizada = (Array.isArray(reuniones) ? reuniones : []).find(
            (r) => r.id_reunion === reunionSeleccionada.id_reunion
        );
        setReunionSeleccionada(actualizada || null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reuniones]);

    const handleEliminarSeleccionada = (idReunion) => {
        handleDeleteReunion(idReunion);
        setReunionSeleccionada(null);
    };

    return (
        <div className="Reunion-page p-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Reuniones</h2>
                {puedeGestionarActas && (
                    <button className="btn btn-primary" onClick={() => handleCreateReunion()}>
                        Crear Reunión
                    </button>
                )}
            </div>

            <ReunionesLista
                proxima={proxima}
                otrasProximas={otrasProximas}
                anteriores={anteriores}
                onClickReunion={setReunionSeleccionada}
            />

            <DetalleReunion
                reunion={reunionSeleccionada}
                puedeGestionarActas={puedeGestionarActas}
                onEditar={handleEditReunion}
                onEliminar={handleEliminarSeleccionada}
                onCerrar={() => setReunionSeleccionada(null)}
                onRedactarActa={(r) => setReunionEditando(r)}
                onVerActa={(r) => setReunionViendo(r)}
            />
            {reunionEditando && (
                <EditorActa
                    reunion={reunionEditando}
                    onCerrar={() => setReunionEditando(null)}
                    onActualizado={fetchReuniones}
                />
            )}
            {reunionViendo && (
                <VisorActa
                    reunion={reunionViendo}
                    onCerrar={() => setReunionViendo(null)}
                />
            )}
        </div>
    );
};

export default Reunion;