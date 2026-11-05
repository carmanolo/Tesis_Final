import path from "path";
import fs from "fs";
import { getReunionSer, getReunionesSer, createReunionSer, patchReunionSer, deleteReunionSer, subirActaSer, obtenerActaSer } from "../services/reunion.service.js";
import { createValidation, integrityValidation, updateValidation } from "../validations/reunion.validations.js";
import { idValidation } from "../validations/modules/id.validation.js";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";
import { REUNION_NO_ENCONTRADA, ACTA_NO_PROPORCIONADA } from "../constants/reunion.constants.js";
import { SHOW_ERRORS } from "../constants/ajustes.constants.js";
import { AppDataSource } from "../config/configDb.js";
import UserEntity from "../entity/user.entity.js";
import CarreraEntity from "../entity/carrera.entity.js";
export async function createReunion(req, res) {
    try {
        const { id, carreraId: userCarreraId } = req.user || {};
        if (!req.body) {
            return handleErrorClient(res, 400, "datos no proporcionados");
        }
        const { error } = integrityValidation.validate(req.body);
        if (error) {
            return handleErrorClient(res, 400, "parametros invalidos", error.message);
        }
        const result = createValidation.validate(req.body);
        if (result.error) {
            return handleErrorClient(res, 400, "faltan parametros", result.error.message);
        }
        if (!id) {
            return handleErrorClient(res, 401, "usuario no autenticado");
        }
        const { fecha_reunion, descripcion, carreraId, id_carrera } = req.body;
        // Asociar internamente la carrera del usuario creador
        let targetCarreraId = userCarreraId || carreraId || id_carrera;
        if (!targetCarreraId && id) {
            const userRepo = AppDataSource.getRepository(UserEntity);
            const user = await userRepo.findOne({ where: { id } });
            if (user?.carreraId) {
                targetCarreraId = user.carreraId;
            }
        }
        // Si aún no tiene carrera (ej. administrador sin carrera asignada), tomar la primera carrera registrada
        if (!targetCarreraId) {
            const carreraRepo = AppDataSource.getRepository(CarreraEntity);
            const primerCarrera = await carreraRepo.findOne({ where: {} });
            if (primerCarrera) {
                targetCarreraId = primerCarrera.id_carrera;
            }
        }
        if (!targetCarreraId) {
            return handleErrorClient(res, 400, "No se encontró ninguna carrera disponible para asociar a la reunión");
        }
        const { data, error: errSer } = await createReunionSer(fecha_reunion, descripcion, id, Number(targetCarreraId));
        if (errSer || !data) {
            return handleErrorClient(res, 400, errSer || "error al registrar la reunión");
        }
        return handleSuccess(res, 201, "Reunión registrada exitosamente", data);
    }
    catch (error) {
        console.error("error en registro de reunión");
        return handleErrorServer(res, 500, "error interno del servidor", error.message);
    }
}
export async function getReuniones(req, res) {
    try {
        const { carreraId, rol, role } = req.user || {};
        const userRole = rol || role;
        const queryCarreraId = req.query.carreraId ? Number(req.query.carreraId) : carreraId;
        const reuniones = await getReunionesSer(queryCarreraId, userRole);
        if (!reuniones) {
            return handleErrorServer(res, 500, "Error interno del servidor");
        }
        return handleSuccess(res, 200, "Reuniones obtenidas exitosamente", reuniones);
    }
    catch (error) {
        console.error("Error en reunion.controller.ts -> getReuniones(): ", error);
        return handleErrorServer(res, 500, "Error interno del servidor", error.message);
    }
}
export async function getReunionById(req, res) {
    try {
        const { carreraId, rol, role } = req.user || {};
        const userRole = rol || role;
        const { id_reunion } = req.params;
        if (!id_reunion || isNaN(Number(id_reunion))) {
            return handleErrorClient(res, 400, "el id de la reunión es inválido");
        }
        const reunion = await getReunionSer(Number(id_reunion), carreraId, userRole);
        if (!reunion) {
            return handleErrorClient(res, 404, "Reunión no encontrada");
        }
        return handleSuccess(res, 200, "Reunión encontrada", reunion);
    }
    catch (error) {
        return handleErrorServer(res, 500, "Error interno del servidor", error.message);
    }
}
export async function patchReunionById(req, res) {
    try {
        const { carreraId, rol, role } = req.user || {};
        const userRole = rol || role;
        if (!req.params || !req.body) {
            return handleErrorClient(res, 400, "datos no proporcionados");
        }
        const { id_reunion } = req.params;
        if (!id_reunion) {
            return handleErrorClient(res, 400, "el id de la reunión es obligatorio");
        }
        const validateId = idValidation.validate({ id: id_reunion });
        if (validateId.error) {
            if (SHOW_ERRORS) {
                console.error(validateId?.error?.cause || JSON.stringify(validateId?.error));
            }
            return handleErrorClient(res, 400, validateId?.error?.message || "Error desconocido");
        }
        const { error } = integrityValidation.validate(req.body);
        if (error) {
            return handleErrorClient(res, 400, "Parámetros invalidos", error.message);
        }
        const result = updateValidation.validate(req.body);
        if (result.error) {
            return handleErrorClient(res, 400, "faltó actualizar parametros", result.error.message);
        }
        const reunionUpdate = await getReunionSer(Number(id_reunion), carreraId, userRole);
        if (!reunionUpdate) {
            return handleErrorClient(res, 404, "Reunión no encontrada");
        }
        const fechaAnterior = String(reunionUpdate.fecha_reunion).slice(0, 10);
        const { carreraId: newCarreraId, id_carrera: newIdCarrera, ...restData } = req.body;
        Object.assign(reunionUpdate, restData);
        if (newCarreraId || newIdCarrera) {
            reunionUpdate.carreraId = Number(newCarreraId || newIdCarrera);
            reunionUpdate.carrera = { id_carrera: reunionUpdate.carreraId };
        }
        //verifica en caso de que el atributo modificado sea la fecha de reunion
        if (req.body.fecha_reunion && String(req.body.fecha_reunion).slice(0, 10) !== fechaAnterior) {
            reunionUpdate.recordatorio_enviado = false;
        }
        const updateReunion = await patchReunionSer(reunionUpdate);
        if (!updateReunion.data) {
            return handleErrorClient(res, 400, updateReunion.message);
        }
        return handleSuccess(res, 200, "Reunión actualizada con éxito", updateReunion.data);
    }
    catch (error) {
        return handleErrorServer(res, 500, "Error interno del servidor", error.message);
    }
}
export async function deleteReunionById(req, res) {
    try {
        const { carreraId, rol, role } = req.user || {};
        const userRole = rol || role;
        const { id_reunion } = req.params;
        if (!id_reunion || isNaN(Number(id_reunion))) {
            return handleErrorClient(res, 400, "El id de la reunión es inválido");
        }
        // Primero verifica que la pueda ver / pertenezca a su carrera
        const reunion = await getReunionSer(Number(id_reunion), carreraId, userRole);
        if (!reunion) {
            return handleErrorClient(res, 404, "Reunión no encontrada");
        }
        const result = await deleteReunionSer(Number(id_reunion));
        if (result && result.result && result.result.affected >= 1) {
            return handleSuccess(res, 200, "Reunión eliminada exitosamente");
        }
        if (result.message === REUNION_NO_ENCONTRADA) {
            return handleErrorClient(res, 404, result.message);
        }
        return handleErrorClient(res, 400, result.message, result.result);
    }
    catch (error) {
        return handleErrorServer(res, 500, "Error al eliminar la reunión", error.message);
    }
}
// ---------------------------------------------------------------------------
// Acta (PDF / Word): subida (importación) y descarga
// ---------------------------------------------------------------------------
export async function subirActa(req, res) {
    try {
        const { carreraId, rol, role } = req.user || {};
        const userRole = rol || role;
        const { id_reunion } = req.params;
        if (!id_reunion || isNaN(Number(id_reunion))) {
            return handleErrorClient(res, 400, "el id de la reunión es inválido");
        }
        // Verificar permiso por carrera
        const reunion = await getReunionSer(Number(id_reunion), carreraId, userRole);
        if (!reunion) {
            if (req.file?.path && fs.existsSync(req.file.path))
                fs.unlinkSync(req.file.path);
            return handleErrorClient(res, 404, "Reunión no encontrada");
        }
        if (!req.file) {
            return handleErrorClient(res, 400, ACTA_NO_PROPORCIONADA);
        }
        const result = await subirActaSer(Number(id_reunion), req.file);
        if (!result.data) {
            return handleErrorClient(res, 400, result.message);
        }
        return handleSuccess(res, 200, result.message, result.data);
    }
    catch (error) {
        return handleErrorServer(res, 500, "Error interno del servidor", error.message);
    }
}
export async function descargarActa(req, res) {
    try {
        const { carreraId, rol, role } = req.user || {};
        const userRole = rol || role;
        const { id_reunion } = req.params;
        if (!id_reunion || isNaN(Number(id_reunion))) {
            return handleErrorClient(res, 400, "el id de la reunión es inválido");
        }
        // Verificar pertenencia a carrera
        const reunion = await getReunionSer(Number(id_reunion), carreraId, userRole);
        if (!reunion) {
            return handleErrorClient(res, 404, "Reunión no encontrada");
        }
        const result = await obtenerActaSer(Number(id_reunion));
        if (!result.data) {
            return handleErrorClient(res, 404, result.message);
        }
        const { ruta_archivo, nombre_original } = result.data;
        const absolutePath = path.resolve(ruta_archivo);
        return res.download(absolutePath, nombre_original, (err) => {
            if (err && !res.headersSent) {
                console.error("Error al descargar el acta", err);
                handleErrorServer(res, 500, "Error al descargar el acta");
            }
        });
    }
    catch (error) {
        return handleErrorServer(res, 500, "Error interno del servidor", error.message);
    }
}
