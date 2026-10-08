import { Request, Response } from "express";
import { getMaterialSer, getMaterialesSer, createMaterialSer, patchMaterialSer, deleteMaterialSer } from "../services/material.service.js";
import { createValidation, integrityValidation, updateValidation } from "../validations/aporte.validations.js";
import { idValidation } from "../validations/modules/id.validation.js";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";
import { AppDataSource } from "../config/configDb.js";
import UserEntity from "../entity/user.entity.js";
import CarreraEntity from "../entity/carrera.entity.js";

export async function createMaterial(req: Request, res: Response): Promise<any> {
  try {
    const { id, carreraId: userCarreraId } = (req.user as any) || {};

    if (!req.body) return handleErrorClient(res, 400, "datos no proporcionados");

    const { error } = integrityValidation.validate(req.body);
    if (error) return handleErrorClient(res, 400, "parametros invalidos", error.message);

    const result = createValidation.validate(req.body);
    if (result.error) return handleErrorClient(res, 400, "faltan parametros", result.error.message);

    const { nombre_material, fecha_prestamo, nombre_prestamo, stock, carreraId, id_carrera } = req.body;

    // Asociar internamente la carrera del usuario creador
    let targetCarreraId = userCarreraId || carreraId || id_carrera;
    if (!targetCarreraId && id) {
      const userRepo = AppDataSource.getRepository(UserEntity as any);
      const user = await userRepo.findOne({ where: { id } });
      if (user?.carreraId) {
        targetCarreraId = user.carreraId;
      }
    }

    // Si aún no tiene carrera (ej. administrador sin carrera asignada), tomar la primera carrera registrada
    if (!targetCarreraId) {
      const carreraRepo = AppDataSource.getRepository(CarreraEntity as any);
      const primerCarrera = await carreraRepo.findOne({ where: {} });
      if (primerCarrera) {
        targetCarreraId = primerCarrera.id_carrera;
      }
    }

    if (!targetCarreraId) {
      return handleErrorClient(res, 400, "No se encontró ninguna carrera disponible para asociar al aporte");
    }

    const { data, error: errSer } = await createMaterialSer(
       nombre_material, fecha_prestamo, nombre_prestamo, stock, Number(targetCarreraId)
    );
    if (errSer) return handleErrorClient(res, 400, errSer);

    return handleSuccess(res, 201, "Aporte registrado exitosamente", data);
  } catch (error: any) {
    return handleErrorServer(res, 500, "error interno del servidor", error.message);
  }
}

export async function getMateriales(req: Request, res: Response): Promise<any> {
  try {
    const { carreraId, rol, role } = (req.user as any) || {};
    const userRole = rol || role;
    const queryCarreraId = req.query.carreraId ? Number(req.query.carreraId) : carreraId;

    const Materiales = await getMaterialesSer(queryCarreraId, userRole);

    if (!Materiales) return handleErrorServer(res, 500, "Error interno del servidor");
    return handleSuccess(res, 200, "Materiales obtenidos exitosamente", Materiales);
  } catch (error: any) {
    return handleErrorServer(res, 500, "Error interno del servidor", error.message);
  }
}

export async function getMaterialById(req: Request, res: Response): Promise<any> {
  try {
    const { carreraId, rol, role } = (req.user as any) || {};
    const userRole = rol || role;
    const { id_material } = req.params;

    if (!id_material || isNaN(Number(id_material))) {
      return handleErrorClient(res, 400, "el id del material es inválido");
    }

    const Material = await getMaterialById(id_material, carreraId);
    if (!Material) return handleErrorClient(res, 404, "Aporte no encontrado");

    return handleSuccess(res, 200, "Material encontrado", Material);
  } catch (error: any) {
    return handleErrorServer(res, 500, "Error interno del servidor", error.message);
  }
}

export async function patchMaterialById(req: Request, res: Response): Promise<any> {
  try {
    const { carreraId, rol, role } = (req.user as any) || {};
    const userRole = rol || role;
    if (!req.body) return handleErrorClient(res, 400, "datos no proporcionados");

    const { id_material } = req.params;
    const validateId = idValidation.validate({ id: id_material });
    if (validateId.error) return handleErrorClient(res, 400, validateId.error.message);

    const { error } = integrityValidation.validate(req.body);
    if (error) return handleErrorClient(res, 400, "Parámetros invalidos", error.message);

    const result = updateValidation.validate(req.body);
    if (result.error) return handleErrorClient(res, 400, "faltó actualizar parametros", result.error.message);

    const Material = await getMaterialSer(Number(id_material), carreraId, userRole);
    if (!Material) return handleErrorClient(res, 404, "Material no encontrado");

    const { carreraId: newCarreraId, id_carrera: newIdCarrera, ...restData } = req.body;
    Object.assign(Material, restData);

    if (newCarreraId || newIdCarrera) {
      Material.carreraId = Number(newCarreraId || newIdCarrera);
      Material.carrera = { id_carrera: Material.carreraId };
    }

    const actualizado = await patchMaterialSer(Material);
    if (!actualizado.data) return handleErrorClient(res, 400, actualizado.message);

    return handleSuccess(res, 200, actualizado.message, actualizado.data);
  } catch (error: any) {
    return handleErrorServer(res, 500, "Error interno del servidor", error.message);
  }
}

export async function deleteMaterialById(req: Request, res: Response): Promise<any> {
  try {
    const { carreraId, rol, role } = (req.user as any) || {};
    const userRole = rol || role;
    const { id_material } = req.params;

    if (!id_material || isNaN(Number(id_material))) {
      return handleErrorClient(res, 400, "El id del material es inválido");
    }

    // Primero verifica que la pueda ver / pertenezca a su carrera
    const Material = await getMaterialSer(Number(id_material), carreraId, userRole);
    if (!Material) return handleErrorClient(res, 404, "material no encontrada");

    const result = await deleteMaterialSer(Number(id_material));
    if (!result.result || result.result.affected < 1) {
      return handleErrorClient(res, 400, result.message);
    }

    return handleSuccess(res, 200, result.message);
  } catch (error: any) {
    return handleErrorServer(res, 500, "Error al eliminar el Material", error.message);
  }
}