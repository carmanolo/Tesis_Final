import { listarHistorialService, eliminarRegistroHistorialService, eliminarLoteHistorialService, } from "../services/historialActividad.service.js";
import { handleSuccess, handleErrorClient, handleErrorServer } from "../handlers/responseHandlers.js";
export async function getHistorial(req, res) {
    try {
        const { buscar, soloSospechosos, fecha, modulo } = req.query;
        const [actividades, error] = await listarHistorialService({
            buscar: typeof buscar === "string" ? buscar : undefined,
            soloSospechosos: soloSospechosos === "true",
            fecha: typeof fecha === "string" ? fecha : undefined,
            modulo: typeof modulo === "string" ? modulo : undefined,
        });
        if (error) {
            return handleErrorClient(res, 400, error);
        }
        return handleSuccess(res, 200, "Historial de actividades obtenido con éxito", actividades);
    }
    catch (error) {
        return handleErrorServer(res, 500, "Error al obtener historial", error.message);
    }
}
export async function deleteHistorialItem(req, res) {
    try {
        const { id } = req.params;
        const [eliminado, error] = await eliminarRegistroHistorialService(Number(id));
        if (error) {
            return handleErrorClient(res, 404, error);
        }
        return handleSuccess(res, 200, "Registro de actividad descartado", eliminado);
    }
    catch (error) {
        return handleErrorServer(res, 500, "Error al eliminar registro", error.message);
    }
}
export async function deleteHistorialLote(req, res) {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return handleErrorClient(res, 400, "Debe seleccionar al menos un registro para eliminar.");
        }
        const [resultado, error] = await eliminarLoteHistorialService(ids.map(Number));
        if (error) {
            return handleErrorClient(res, 400, error);
        }
        return handleSuccess(res, 200, `${ids.length} registro(s) eliminados exitosamente`, resultado);
    }
    catch (error) {
        return handleErrorServer(res, 500, "Error al eliminar lote de registros", error.message);
    }
}
