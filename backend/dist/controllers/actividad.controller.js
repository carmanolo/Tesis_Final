import { getActividadesSer, getActividadSer, createActividadSer, patchActividadSer, deleteActividadSer } from "../services/actividad.service.js";
import { createValidation, integrityValidation, updateValidation } from "../validations/actividad.validations.js";
import { idValidation } from "../validations/modules/id.validation.js";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";
export async function createActividad(req, res) {
    try {
        const { id, carreraId, rol } = req.user;
        if (!req.body)
            return handleErrorClient(res, 400, "datos no proporcionados");
        const { error } = integrityValidation.validate(req.body);
        if (error)
            return handleErrorClient(res, 400, "parametros invalidos", error.message);
        const result = createValidation.validate(req.body);
        if (result.error)
            return handleErrorClient(res, 400, "faltan parametros", result.error.message);
        const { nombre_actividad, fecha_actividad, procedencia, monto, carreras } = req.body;
        // Usuario normal: siempre su propia carrera. Admin: la que indique.
        const carrerasIds = rol === "admin" ? carreras : [carreraId];
        if (!carrerasIds?.length || carrerasIds.includes(null)) {
            return handleErrorClient(res, 400, "Debes indicar la carrera de la actividad");
        }
        const { data, error: errSer } = await createActividadSer(id, nombre_actividad, fecha_actividad, procedencia, monto, carrerasIds);
        if (errSer)
            return handleErrorClient(res, 400, errSer);
        return handleSuccess(res, 201, "Actividad registrada exitosamente", data);
    }
    catch (error) {
        return handleErrorServer(res, 500, "error interno del servidor", error.message);
    }
}
export async function getActividades(req, res) {
    try {
        const { carreraId, rol } = req.user;
        const actividades = await getActividadesSer(carreraId, rol);
        if (!actividades)
            return handleErrorServer(res, 500, "Error interno del servidor");
        return handleSuccess(res, 200, "Actividades obtenidas exitosamente", actividades);
    }
    catch (error) {
        return handleErrorServer(res, 500, "Error interno del servidor", error.message);
    }
}
export async function getActividadById(req, res) {
    try {
        const { carreraId, rol } = req.user;
        const { id_actividad } = req.params;
        if (!id_actividad || isNaN(Number(id_actividad))) {
            return handleErrorClient(res, 400, "el id de la actividad es inválido");
        }
        const actividad = await getActividadSer(Number(id_actividad), carreraId, rol);
        if (!actividad)
            return handleErrorClient(res, 404, "Actividad no encontrada");
        return handleSuccess(res, 200, "Actividad encontrada", actividad);
    }
    catch (error) {
        return handleErrorServer(res, 500, "Error interno del servidor", error.message);
    }
}
export async function patchActividadById(req, res) {
    try {
        const { carreraId, rol } = req.user;
        if (!req.body)
            return handleErrorClient(res, 400, "datos no proporcionados");
        const { id_actividad } = req.params;
        const validateId = idValidation.validate({ id: id_actividad });
        if (validateId.error)
            return handleErrorClient(res, 400, validateId.error.message);
        const { error } = integrityValidation.validate(req.body);
        if (error)
            return handleErrorClient(res, 400, "Parámetros invalidos", error.message);
        const result = updateValidation.validate(req.body);
        if (result.error)
            return handleErrorClient(res, 400, "faltó actualizar parametros", result.error.message);
        const actividad = await getActividadSer(Number(id_actividad), carreraId, rol);
        if (!actividad)
            return handleErrorClient(res, 404, "Actividad no encontrada");
        Object.assign(actividad, req.body);
        const actualizada = await patchActividadSer(actividad);
        if (!actualizada.data)
            return handleErrorClient(res, 400, actualizada.message);
        return handleSuccess(res, 200, actualizada.message, actualizada.data);
    }
    catch (error) {
        return handleErrorServer(res, 500, "Error interno del servidor", error.message);
    }
}
export async function deleteActividadById(req, res) {
    try {
        const { carreraId, rol } = req.user;
        const { id_actividad } = req.params;
        if (!id_actividad || isNaN(Number(id_actividad))) {
            return handleErrorClient(res, 400, "El id de la actividad es inválido");
        }
        // Primero verifica que la pueda ver
        const actividad = await getActividadSer(Number(id_actividad), carreraId, rol);
        if (!actividad)
            return handleErrorClient(res, 404, "Actividad no encontrada");
        const result = await deleteActividadSer(Number(id_actividad));
        if (!result.result || result.result.affected < 1) {
            return handleErrorClient(res, 400, result.message);
        }
        return handleSuccess(res, 200, result.message);
    }
    catch (error) {
        return handleErrorServer(res, 500, "Error al eliminar la actividad", error.message);
    }
}
