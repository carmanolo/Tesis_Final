import { getCarreraSer, getCarrerasSer, createCarreraSer, patchCarreraSer, deleteCarreraSer, obtenerListaCarreras } from "../services/carrera.service.js";
import { createValidation, integrityValidation, updateValidation } from "../validations/carrera.validations.js";
import { idValidation } from "../validations/modules/id.validation.js";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";
import { CARRERA_NO_ENCONTRADA } from "../constants/carrera.constants.js";
import { SHOW_ERRORS } from "../constants/ajustes.constants.js";
import { processCarreras } from "../utils/carrera.utils.js";
export async function createCarrera(req, res) {
    try {
        let newCarrera = null;
        if (!req.body || !req.params) {
            return handleErrorClient(res, 400, "datos no proporcionados");
        }
        const { nombre_carrera, sigla } = req.body;
        const { error } = integrityValidation.validate(req.body);
        if (error) {
            return handleErrorClient(res, 400, "parametros invalidos", error.message);
        }
        let result = createValidation.validate(req.body);
        if (result.error) {
            return handleErrorClient(res, 400, "faltan parametros", result.error.message);
        }
        newCarrera = await createCarreraSer(nombre_carrera, sigla);
        if (newCarrera) {
            return handleSuccess(res, 201, "Carrera registrada exitosamente", newCarrera.data || newCarrera);
        }
        else {
            return handleErrorServer(res, 500, "error al registrar Carrera");
        }
    }
    catch (error) {
        console.error("error en registro de Carrera");
        return handleErrorServer(res, 500, "error interno del servidor", error.message);
    }
}
export async function getCarreras(req, res) {
    try {
        const carreraData = await getCarrerasSer();
        if (!carreraData) {
            return handleErrorClient(res, 400, "Carreras no encontradas");
        }
        return handleSuccess(res, 200, "Carreras obtenidas exitosamnete", carreraData[0]);
    }
    catch (error) {
        console.error("Error en carrera.controller.ts -> getCarreras(): ", error);
        return res.status(500).json({ message: "Error interno del servidor." });
    }
}
export async function getCarreraById(req, res) {
    try {
        const { id_carrera } = req.params;
        if (!id_carrera || isNaN(Number(id_carrera))) {
            return handleErrorClient(res, 400, "el id de carrera es inválido");
        }
        const carrera = await getCarreraSer(Number(id_carrera));
        if (!carrera) {
            return handleErrorClient(res, 404, "Carrera no encontrada");
        }
        return handleSuccess(res, 200, "Carrera encontrada", carrera);
    }
    catch (error) {
        return handleErrorServer(res, 500, "Error interno del servidor", error.message);
    }
}
export async function patchCarreraById(req, res) {
    try {
        if (!req.params || !req.body) {
            return handleErrorClient(res, 400, "datos no proporcionados");
        }
        const { id_carrera } = req.params;
        if (!id_carrera) {
            return handleErrorClient(res, 400, "el id de carrera es obligatorio");
        }
        let validateId = idValidation.validate({ id: id_carrera });
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
        let result = updateValidation.validate(req.body);
        if (result.error) {
            return handleErrorClient(res, 400, "falto actualizar parametros", result.error.message);
        }
        const carreraUpdate = await getCarreraSer(Number(id_carrera));
        if (!carreraUpdate) {
            return handleErrorClient(res, 404, "Carrera no encontrada");
        }
        Object.assign(carreraUpdate, req.body);
        const updateCarrera = await patchCarreraSer(carreraUpdate);
        if (!(updateCarrera.data)) {
            return handleErrorClient(res, 400, updateCarrera.message);
        }
        return handleSuccess(res, 200, "Carrera actualizada con éxito", updateCarrera.data);
    }
    catch (error) {
        return handleErrorServer(res, 500, "Error interno del servidor", error.message);
    }
}
export async function deleteCarreraById(req, res) {
    try {
        const { id_carrera } = req.params;
        if (!id_carrera) {
            return handleErrorClient(res, 400, "El id de la carrera es obligatorio");
        }
        const result = await deleteCarreraSer(Number(id_carrera));
        if (result && result.result && result.result.affected >= 1) {
            return handleSuccess(res, 200, "Carrera elimnadA exitosamnete");
        }
        if (result.message === CARRERA_NO_ENCONTRADA) {
            return handleSuccess(res, 404, result.message, result.result);
        }
        return handleErrorClient(res, 400, result.message, result.result);
    }
    catch (error) {
        return handleErrorServer(res, 500, "Error al eliminar la carrera", error.message);
    }
}
export async function getCarreraList(req, res) {
    const DEFAULT_ARRAY = [];
    try {
        let carreraList = await obtenerListaCarreras();
        carreraList = processCarreras(carreraList);
        return handleSuccess(res, 200, "Vehiculos encontrados con éxito", carreraList);
    }
    catch (error) {
        console.error(error);
        return handleSuccess(res, 200, "Error al obtener vehiculos; disimular", DEFAULT_ARRAY);
    }
}
