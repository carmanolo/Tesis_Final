import { Request, Response } from "express";
import { getAportesSer, getAporteSer, createAporteSer, patchAporteSer, deleteAporteSer } from "../services/aporte.service.js";
import { createValidation, integrityValidation, updateValidation } from "../validations/aporte.validations.js";
import { idValidation } from "../validations/modules/id.validation.js";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";

export async function createAporte(req: Request, res: Response): Promise<any> {
  try {
    const { id, carreraId: userCarreraId, rol, role } = (req.user as any) || {};
    const userRole = rol || role;
    const isAdmin = userRole === "admin" || userRole === "administrador";

    if (!req.body) return handleErrorClient(res, 400, "datos no proporcionados");

    const { error } = integrityValidation.validate(req.body);
    if (error) return handleErrorClient(res, 400, "parametros invalidos", error.message);

    const result = createValidation.validate(req.body);
    if (result.error) return handleErrorClient(res, 400, "faltan parametros", result.error.message);

    const { descripcion_aporte, fecha_aporte, procedencia, monto, carreraId, id_carrera } = req.body;

    // Admin puede indicar la carrera o usar la suya; usuario normal usa la suya o la indicada en el body
    const targetCarreraId = isAdmin ? (carreraId || id_carrera || userCarreraId) : (userCarreraId || carreraId || id_carrera);

    if (!targetCarreraId) {
      return handleErrorClient(res, 400, "Debes indicar la carrera de la Aporte");
    }

    const { data, error: errSer } = await createAporteSer(
       descripcion_aporte, fecha_aporte, procedencia, monto, id, Number(targetCarreraId)
    );
    if (errSer) return handleErrorClient(res, 400, errSer);

    return handleSuccess(res, 201, "Aporte registrado exitosamente", data);
  } catch (error: any) {
    return handleErrorServer(res, 500, "error interno del servidor", error.message);
  }
}

export async function getAportes(req: Request, res: Response): Promise<any> {
  try {
    const { carreraId, rol, role } = (req.user as any) || {};
    const userRole = rol || role;
    const queryCarreraId = req.query.carreraId ? Number(req.query.carreraId) : carreraId;

    const Aportes = await getAportesSer(queryCarreraId, userRole);

    if (!Aportes) return handleErrorServer(res, 500, "Error interno del servidor");
    return handleSuccess(res, 200, "Aportees obtenidas exitosamente", Aportes);
  } catch (error: any) {
    return handleErrorServer(res, 500, "Error interno del servidor", error.message);
  }
}

export async function getAporteById(req: Request, res: Response): Promise<any> {
  try {
    const { carreraId, rol, role } = (req.user as any) || {};
    const userRole = rol || role;
    const { id_aporte } = req.params;

    if (!id_aporte || isNaN(Number(id_aporte))) {
      return handleErrorClient(res, 400, "el id de la Aporte es inválido");
    }

    const Aporte = await getAporteSer(Number(id_aporte), carreraId, userRole);
    if (!Aporte) return handleErrorClient(res, 404, "Aporte no encontrado");

    return handleSuccess(res, 200, "Aporte encontrado", Aporte);
  } catch (error: any) {
    return handleErrorServer(res, 500, "Error interno del servidor", error.message);
  }
}

export async function patchAporteById(req: Request, res: Response): Promise<any> {
  try {
    const { carreraId, rol, role } = (req.user as any) || {};
    const userRole = rol || role;
    if (!req.body) return handleErrorClient(res, 400, "datos no proporcionados");

    const { id_aporte } = req.params;
    const validateId = idValidation.validate({ id: id_aporte });
    if (validateId.error) return handleErrorClient(res, 400, validateId.error.message);

    const { error } = integrityValidation.validate(req.body);
    if (error) return handleErrorClient(res, 400, "Parámetros invalidos", error.message);

    const result = updateValidation.validate(req.body);
    if (result.error) return handleErrorClient(res, 400, "faltó actualizar parametros", result.error.message);

    const Aporte = await getAporteSer(Number(id_aporte), carreraId, userRole);
    if (!Aporte) return handleErrorClient(res, 404, "Aporte no encontrada");

    const { carreraId: newCarreraId, id_carrera: newIdCarrera, ...restData } = req.body;
    Object.assign(Aporte, restData);

    if (newCarreraId || newIdCarrera) {
      Aporte.carreraId = Number(newCarreraId || newIdCarrera);
      Aporte.carrera = { id_carrera: Aporte.carreraId };
    }

    const actualizado = await patchAporteSer(Aporte);
    if (!actualizado.data) return handleErrorClient(res, 400, actualizado.message);

    return handleSuccess(res, 200, actualizado.message, actualizado.data);
  } catch (error: any) {
    return handleErrorServer(res, 500, "Error interno del servidor", error.message);
  }
}

export async function deleteAporteById(req: Request, res: Response): Promise<any> {
  try {
    const { carreraId, rol, role } = (req.user as any) || {};
    const userRole = rol || role;
    const { id_aporte } = req.params;

    if (!id_aporte || isNaN(Number(id_aporte))) {
      return handleErrorClient(res, 400, "El id del Aporte es inválido");
    }

    // Primero verifica que la pueda ver / pertenezca a su carrera
    const Aporte = await getAporteSer(Number(id_aporte), carreraId, userRole);
    if (!Aporte) return handleErrorClient(res, 404, "Aporte no encontrada");

    const result = await deleteAporteSer(Number(id_aporte));
    if (!result.result || result.result.affected < 1) {
      return handleErrorClient(res, 400, result.message);
    }

    return handleSuccess(res, 200, result.message);
  } catch (error: any) {
    return handleErrorServer(res, 500, "Error al eliminar el Aporte", error.message);
  }
}