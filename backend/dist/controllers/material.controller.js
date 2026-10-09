import { getMaterialSer, getMaterialesSer, createMaterialSer, patchMaterialSer, deleteMaterialSer } from "../services/material.service.js";
import { createValidation, integrityValidation, updateValidation } from "../validations/material.validation.js";
import { idValidation } from "../validations/modules/id.validation.js";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";
import { AppDataSource } from "../config/configDb.js";
import UserEntity from "../entity/user.entity.js";
import CarreraEntity from "../entity/carrera.entity.js";
import { MATERIAL_NO_ENCONTRADO } from "../constants/material.constants.js";
export async function createMaterial(req, res) {
    try {
        const { id, carreraId: userCarreraId } = req.user || {};
        if (!req.body) {
            return handleErrorClient(res, 400, "Datos no proporcionados");
        }
        const { error } = integrityValidation.validate(req.body);
        if (error) {
            return handleErrorClient(res, 400, "Parámetros inválidos", error.message);
        }
        const result = createValidation.validate(req.body);
        if (result.error) {
            return handleErrorClient(res, 400, "Faltan parámetros requeridos", result.error.message);
        }
        const { nombre_material, fecha_prestamo, nombre_prestamo, prestatario, stock, estado_prestamo = "prestado", tne_entregada, paso_tne, carreraId, id_carrera } = req.body;
        const finalNombrePrestamo = String(nombre_prestamo || prestatario || "").trim();
        const finalFecha = fecha_prestamo ? fecha_prestamo : null;
        let parsedStock = Number(stock);
        if (isNaN(parsedStock) || parsedStock < 0) {
            return handleErrorClient(res, 400, "El stock debe ser un número entero mayor o igual a 0");
        }
        // Si se crea en estado 'prestado', se reduce el stock en 1 unidad
        if (estado_prestamo === "prestado") {
            if (parsedStock < 1) {
                return handleErrorClient(res, 400, "No es posible registrar en estado prestado con stock menor a 1");
            }
            parsedStock = parsedStock - 1;
        }
        // Asociar internamente la carrera del usuario creador o la indicada
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
            return handleErrorClient(res, 400, "No se encontró ninguna carrera disponible para asociar al material");
        }
        const finalTne = tne_entregada !== undefined ? Boolean(tne_entregada) : (paso_tne !== undefined ? Boolean(paso_tne) : false);
        const { data, error: errSer } = await createMaterialSer(nombre_material, finalFecha, finalNombrePrestamo, parsedStock, Number(targetCarreraId), estado_prestamo, finalTne);
        if (errSer || !data) {
            return handleErrorClient(res, 400, errSer || "Error al registrar el material");
        }
        return handleSuccess(res, 201, "Material registrado exitosamente", data);
    }
    catch (error) {
        return handleErrorServer(res, 500, "Error interno del servidor", error.message);
    }
}
export async function getMateriales(req, res) {
    try {
        const { carreraId, rol, role } = req.user || {};
        const userRole = rol || role;
        const queryCarreraId = req.query.carreraId ? Number(req.query.carreraId) : carreraId;
        const materiales = await getMaterialesSer(queryCarreraId, userRole);
        if (materiales === null) {
            return handleErrorServer(res, 500, "Error interno del servidor al obtener los materiales");
        }
        return handleSuccess(res, 200, "Materiales obtenidos exitosamente", materiales);
    }
    catch (error) {
        return handleErrorServer(res, 500, "Error interno del servidor", error.message);
    }
}
export async function getMaterialById(req, res) {
    try {
        const { carreraId, rol, role } = req.user || {};
        const userRole = rol || role;
        const { id_material } = req.params;
        if (!id_material || isNaN(Number(id_material))) {
            return handleErrorClient(res, 400, "El id del material es inválido");
        }
        const material = await getMaterialSer(Number(id_material), carreraId, userRole);
        if (!material) {
            return handleErrorClient(res, 404, MATERIAL_NO_ENCONTRADO);
        }
        return handleSuccess(res, 200, "Material encontrado", material);
    }
    catch (error) {
        return handleErrorServer(res, 500, "Error interno del servidor", error.message);
    }
}
export async function patchMaterialById(req, res) {
    try {
        const { carreraId, rol, role } = req.user || {};
        const userRole = rol || role;
        if (!req.body) {
            return handleErrorClient(res, 400, "Datos no proporcionados");
        }
        const { id_material } = req.params;
        const validateId = idValidation.validate({ id: id_material });
        if (validateId.error) {
            return handleErrorClient(res, 400, validateId.error.message);
        }
        const { error } = integrityValidation.validate(req.body);
        if (error) {
            return handleErrorClient(res, 400, "Parámetros inválidos", error.message);
        }
        const result = updateValidation.validate(req.body);
        if (result.error) {
            return handleErrorClient(res, 400, "Faltó actualizar parámetros", result.error.message);
        }
        const material = await getMaterialSer(Number(id_material), carreraId, userRole);
        if (!material) {
            return handleErrorClient(res, 404, MATERIAL_NO_ENCONTRADO);
        }
        const prevEstado = material.estado_prestamo;
        const newEstado = req.body.estado_prestamo !== undefined ? req.body.estado_prestamo : prevEstado;
        let targetStock = req.body.stock !== undefined ? Number(req.body.stock) : Number(material.stock);
        // Si cambia a "prestado" desde otro estado, se reduce 1 unidad del stock
        if (newEstado === "prestado" && prevEstado !== "prestado") {
            if (targetStock < 1) {
                return handleErrorClient(res, 400, "No hay stock disponible para prestar este material");
            }
            targetStock = targetStock - 1;
        }
        // Si cambia de "prestado" a "devuelto" o "disponible", se reincorpora 1 unidad al stock
        else if (prevEstado === "prestado" && (newEstado === "devuelto" || newEstado === "disponible")) {
            targetStock = targetStock + 1;
        }
        const { carreraId: newCarreraId, id_carrera: newIdCarrera, paso_tne, prestatario, ...restData } = req.body;
        if (prestatario !== undefined && restData.nombre_prestamo === undefined) {
            restData.nombre_prestamo = prestatario;
        }
        Object.assign(material, restData);
        material.stock = targetStock;
        if (paso_tne !== undefined && restData.tne_entregada === undefined) {
            material.tne_entregada = Boolean(paso_tne);
        }
        if (restData.tne_entregada !== undefined) {
            material.tne_entregada = Boolean(restData.tne_entregada);
        }
        if (newCarreraId || newIdCarrera) {
            material.carreraId = Number(newCarreraId || newIdCarrera);
            material.carrera = { id_carrera: material.carreraId };
        }
        const actualizado = await patchMaterialSer(material);
        if (!actualizado.data) {
            return handleErrorClient(res, 400, actualizado.message);
        }
        return handleSuccess(res, 200, actualizado.message, actualizado.data);
    }
    catch (error) {
        return handleErrorServer(res, 500, "Error interno del servidor", error.message);
    }
}
export async function deleteMaterialById(req, res) {
    try {
        const { carreraId, rol, role } = req.user || {};
        const userRole = rol || role;
        const { id_material } = req.params;
        if (!id_material || isNaN(Number(id_material))) {
            return handleErrorClient(res, 400, "El id del material es inválido");
        }
        const material = await getMaterialSer(Number(id_material), carreraId, userRole);
        if (!material) {
            return handleErrorClient(res, 404, MATERIAL_NO_ENCONTRADO);
        }
        const result = await deleteMaterialSer(Number(id_material));
        if (!result.result || result.result.affected < 1) {
            return handleErrorClient(res, 400, result.message);
        }
        return handleSuccess(res, 200, result.message);
    }
    catch (error) {
        return handleErrorServer(res, 500, "Error al eliminar el material", error.message);
    }
}
