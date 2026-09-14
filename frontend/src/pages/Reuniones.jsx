import { useEffect, useState } from "react";
import { getUserRole } from "../services/user.service.js";
import { ACCESO_GESTION_ACTAS } from "../constants/reunion.constants.jsx";

import { CalendarioReuniones } from "../components/Reunion/CalendarReuniones.jsx";
import { DetalleReunion } from "../components/Reunion/DetalleReunion.jsx";

import { useGetReuniones } from "@hooks/reuniones/useGetReuniones.jsx";
import { useCalendarioReuniones } from "@hooks/reuniones/useCalendarioReuniones.jsx";
import { useCreateReunion } from "@hooks/reuniones/useCreateReunion.jsx";
import { usePatchReunion } from "@hooks/reuniones/usePatchReunion.jsx";
import { useDeleteReunion } from "@hooks/reuniones/useDeleteReunion.jsx";
import { useSubirActa } from "@hooks/reuniones/useSubirActa.jsx";
import { useDescargarActa } from "@hooks/reuniones/useDescargarActa.jsx";
import { obtenerFechaKey } from "../utils/calendar.utils.js";

const Reunion = () => {
    const [reunionData, setReunionData] = useState([]);
    const [reuniones, fetchReuniones] = useGetReuniones(reunionData, setReunionData);

    // Rol del usuario logeado: define si puede subir/editar/eliminar o solo descargar
    const userRole = getUserRole();
    const puedeGestionarActas = ACCESO_GESTION_ACTAS.includes(userRole);

    const hoy = new Date();
    const [anio, setAnio] = useState(hoy.getFullYear());
    const [mes, setMes] = useState(hoy.getMonth());
    const [reunionSeleccionada, setReunionSeleccionada] = useState(null);

    const { reunionesPorFecha } = useCalendarioReuniones(reuniones);

    const { handleCreateReunion } = useCreateReunion(fetchReuniones);
    const { handleEditReunion } = usePatchReunion(fetchReuniones);
    const { handleDeleteReunion } = useDeleteReunion(fetchReuniones);
    const { handleSubirActa } = useSubirActa(fetchReuniones);
    const { handleDescargarActa } = useDescargarActa();

    useEffect(() => {
        if (typeof fetchReuniones === "function") {
            fetchReuniones();
        }
    }, []);

    // Mantiene sincronizado el panel de detalle cuando la lista se refresca
    // (por ejemplo, tras subir un acta o editar la reunión seleccionada)
    useEffect(() => {
        if (!reunionSeleccionada) return;
        const key = obtenerFechaKey(reunionSeleccionada.fecha_reunion);
        const actualizada = (reunionesPorFecha[key] || []).find(
            (r) => r.id_reunion === reunionSeleccionada.id_reunion
        );
        setReunionSeleccionada(actualizada || null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reunionesPorFecha]);

    const cambiarMes = (delta) => {
        let nuevoMes = mes + delta;
        let nuevoAnio = anio;
        if (nuevoMes < 0) {
            nuevoMes = 11;
            nuevoAnio -= 1;
        } else if (nuevoMes > 11) {
            nuevoMes = 0;
            nuevoAnio += 1;
        }
        setMes(nuevoMes);
        setAnio(nuevoAnio);
    };

    const irHoy = () => {
        setAnio(hoy.getFullYear());
        setMes(hoy.getMonth());
    };

    const handleEliminarSeleccionada = (idReunion) => {
        handleDeleteReunion(idReunion);
        setReunionSeleccionada(null);
    };

    return (
        <div className="Reunion-page p-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Calendario de Reuniones</h2>
                {puedeGestionarActas && (
                    <button className="btn btn-primary" onClick={() => handleCreateReunion()}>
                        Crear Reunión
                    </button>
                )}
            </div>

            <CalendarioReuniones
                anio={anio}
                mes={mes}
                onCambiarMes={cambiarMes}
                onIrHoy={irHoy}
                reunionesPorFecha={reunionesPorFecha}
                onClickReunion={setReunionSeleccionada}
            />

            <DetalleReunion
                reunion={reunionSeleccionada}
                puedeGestionarActas={puedeGestionarActas}
                onSubirActa={handleSubirActa}
                onEditar={handleEditReunion}
                onEliminar={handleEliminarSeleccionada}
                onDescargar={handleDescargarActa}
                onCerrar={() => setReunionSeleccionada(null)}
            />
        </div>
    );
};

export default Reunion;