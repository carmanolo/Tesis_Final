import { getAporteesSer, getAporteSer, createAporteSer, patchAporteSer, deleteAporteSer } from "../services/Aporte.service.js";
import { createValidation, integrityValidation, updateValidation } from "../validations/Aporte.validations.js";
import { idValidation } from "../validations/modules/id.validation.js";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";
export async function createAporte(req, res) {
    try {
        const { id, carreraId: userCarreraId, rol, role } = req.user || {};
        const userRole = rol || role;
        const isAdmin = userRole === "admin" || userRole === "administrador";
        if (!req.body)
            return handleErrorClient(res, 400, "datos no proporcionados");
        const { error } = integrityValidation.validate(req.body);
        if (error)
            return handleErrorClient(res, 400, "parametros invalidos", error.message);
        const result = createValidation.validate(req.body);
        if (result.error)
            return handleErrorClient(res, 400, "faltan parametros", result.error.message);
        const { nombre_Aporte, fecha_Aporte, procedencia, monto, carreraId, id_carrera } = req.body;
        // Admin puede indicar la carrera o usar la suya; usuario normal usa la suya o la indicada en el body
        const targetCarreraId = isAdmin ? (carreraId || id_carrera || userCarreraId) : (userCarreraId || carreraId || id_carrera);
        if (!targetCarreraId) {
            return handleErrorClient(res, 400, "Debes indicar la carrera de la Aporte");
        }
        const { data, error: errSer } = await createAporteSer(id, Number(targetCarreraId), nombre_Aporte, fecha_Aporte, procedencia, monto);
        if (errSer)
            return handleErrorClient(res, 400, errSer);
        return handleSuccess(res, 201, "Aporte registrada exitosamente", data);
    }
    catch (error) {
        return handleErrorServer(res, 500, "error interno del servidor", error.message);
    }
}
export async function getAportees(req, res) {
    try {
        const { carreraId, rol, role } = req.user || {};
        const userRole = rol || role;
        const queryCarreraId = req.query.carreraId ? Number(req.query.carreraId) : carreraId;
        const Aportees = await getAporteesSer(queryCarreraId, userRole);
        if (!Aportees)
            return handleErrorServer(res, 500, "Error interno del servidor");
        return handleSuccess(res, 200, "Aportees obtenidas exitosamente", Aportees);
    }
    catch (error) {
        return handleErrorServer(res, 500, "Error interno del servidor", error.message);
    }
}
export async function getAporteById(req, res) {
    try {
        const { carreraId, rol, role } = req.user || {};
        const userRole = rol || role;
        const { id_Aporte } = req.params;
        if (!id_Aporte || isNaN(Number(id_Aporte))) {
            return handleErrorClient(res, 400, "el id de la Aporte es inválido");
        }
        const Aporte = await getAporteSer(Number(id_Aporte), carreraId, userRole);
        if (!Aporte)
            return handleErrorClient(res, 404, "Aporte no encontrada");
        return handleSuccess(res, 200, "Aporte encontrada", Aporte);
    }
    catch (error) {
        return handleErrorServer(res, 500, "Error interno del servidor", error.message);
    }
}
export async function patchAporteById(req, res) {
    try {
        const { carreraId, rol, role } = req.user || {};
        const userRole = rol || role;
        if (!req.body)
            return handleErrorClient(res, 400, "datos no proporcionados");
        const { id_Aporte } = req.params;
        const validateId = idValidation.validate({ id: id_Aporte });
        if (validateId.error)
            return handleErrorClient(res, 400, validateId.error.message);
        const { error } = integrityValidation.validate(req.body);
        if (error)
            return handleErrorClient(res, 400, "Parámetros invalidos", error.message);
        const result = updateValidation.validate(req.body);
        if (result.error)
            return handleErrorClient(res, 400, "faltó actualizar parametros", result.error.message);
        const Aporte = await getAporteSer(Number(id_Aporte), carreraId, userRole);
        if (!Aporte)
            return handleErrorClient(res, 404, "Aporte no encontrada");
        const { carreraId: newCarreraId, id_carrera: newIdCarrera, ...restData } = req.body;
        Object.assign(Aporte, restData);
        if (newCarreraId || newIdCarrera) {
            Aporte.carreraId = Number(newCarreraId || newIdCarrera);
            Aporte.carrera = { id_carrera: Aporte.carreraId };
        }
        const actualizada = await patchAporteSer(Aporte);
        if (!actualizada.data)
            return handleErrorClient(res, 400, actualizada.message);
        return handleSuccess(res, 200, actualizada.message, actualizada.data);
    }
    catch (error) {
        return handleErrorServer(res, 500, "Error interno del servidor", error.message);
    }
}
export async function deleteAporteById(req, res) {
    try {
        const { carreraId, rol, role } = req.user || {};
        const userRole = rol || role;
        const { id_Aporte } = req.params;
        if (!id_Aporte || isNaN(Number(id_Aporte))) {
            return handleErrorClient(res, 400, "El id de la Aporte es inválido");
        }
        // Primero verifica que la pueda ver / pertenezca a su carrera
        const Aporte = await getAporteSer(Number(id_Aporte), carreraId, userRole);
        if (!Aporte)
            return handleErrorClient(res, 404, "Aporte no encontrada");
        const result = await deleteAporteSer(Number(id_Aporte));
        if (!result.result || result.result.affected < 1) {
            return handleErrorClient(res, 400, result.message);
        }
        return handleSuccess(res, 200, result.message);
    }
    catch (error) {
        return handleErrorServer(res, 500, "Error al eliminar la Aporte", error.message);
    }
}
