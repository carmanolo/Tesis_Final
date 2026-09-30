import { Request, Response } from "express";
import { getActividadesSer, getActividadSer, createActividadSer, patchActividadSer, deleteActividadSer } from "../services/actividad.service.js";
import { createValidation, integrityValidation, updateValidation } from "../validations/actividad.validations.js";
import { idValidation } from "../validations/modules/id.validation.js";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";
import { ACTIVIDAD_NO_ENCONTRADA } from "../constants/actividad.constants.js";
import { SHOW_ERRORS } from "../constants/ajustes.constants.js";

export async function createActividad(req: Request, res: Response): Promise<any> {
  try {
    if (!req.body) {
      return handleErrorClient(res, 400, "datos no proporcionados");
    }

    const { nombre_actividad, fecha_actividad, procedencia, monto } = req.body;

    const { error } = integrityValidation.validate(req.body);
    if (error) {
      return handleErrorClient(res, 400, "parametros invalidos", error.message);
    }

    const result = createValidation.validate(req.body);
    if (result.error) {
      return handleErrorClient(res, 400, "faltan parametros", result.error.message);
    }

    const newActividad = await createActividadSer(nombre_actividad, fecha_actividad, procedencia, monto);
    if (newActividad) {
      return handleSuccess(res, 201, "Actividad registrada exitosamente", newActividad.data || newActividad);
    } else {
      return handleErrorServer(res, 500, "error al registrar la Actividad");
    }
  } catch (error: any) {
    console.error("error en registro de Actividad");
    return handleErrorServer(res, 500, "error interno del servidor", error.message);
  }
}

export async function getActividades(req: Request, res: Response): Promise<any> {
  try {
    const actividadData = await getActividadesSer();

    if (!actividadData) {
      return handleErrorClient(res, 400, "Actividades no encontradas");
    }

    return handleSuccess(res, 200, "Actividades obtenidas exitosamente", actividadData[0] || actividadData);
  } catch (error: any) {
    console.error("Error en actividad.controller.ts -> getActividades(): ", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
}

export async function getActividadById(req: Request, res: Response): Promise<any> {
  try {
    const { id_actividad } = req.params;

    if (!id_actividad || isNaN(Number(id_actividad))) {
      return handleErrorClient(res, 400, "el id de la actividad es inválido");
    }

    const reunion = await getActividadSer(Number(id_actividad));

    if (!reunion) {
      return handleErrorClient(res, 404, "Actividad no encontrada");
    }

    return handleSuccess(res, 200, "Actividad encontrada", reunion);
  } catch (error: any) {
    return handleErrorServer(res, 500, "Error interno del servidor", error.message);
  }
}

export async function patchActividadById(req: Request, res: Response): Promise<any> {
  try {
    if (!req.params || !req.body) {
      return handleErrorClient(res, 400, "datos no proporcionados");
    }
    const { id_actividad } = req.params;
    if (!id_actividad) {
      return handleErrorClient(res, 400, "el id de la actividad es obligatorio");
    }

    const validateId = idValidation.validate({ id: id_actividad });
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

    const actividadUpdate = await getActividadSer(Number(id_actividad));

    if (!actividadUpdate) {
      return handleErrorClient(res, 404, "Actividad no encontrada");
    }

    Object.assign(actividadUpdate, req.body);

    const updateReunion = await patchActividadSer(actividadUpdate);
    if (!updateReunion.data) {
      return handleErrorClient(res, 400, updateReunion.message);
    }

    return handleSuccess(res, 200, "Actividad actualizada con éxito", updateReunion.data);
  } catch (error: any) {
    return handleErrorServer(res, 500, "Error interno del servidor", error.message);
  }
}

export async function deleteActividadById(req: Request, res: Response): Promise<any> {
  try {
    const { id_actividad } = req.params;
    if (!id_actividad) {
      return handleErrorClient(res, 400, "El id de la actividad es obligatorio");
    }

    const result = await deleteActividadSer(Number(id_actividad));

    if (result && result.result && result.result.affected >= 1) {
      return handleSuccess(res, 200, "Actividad eliminada exitosamente");
    }

    if (result.message === ACTIVIDAD_NO_ENCONTRADA) {
      return handleSuccess(res, 404, result.message, result.result);
    }

    return handleErrorClient(res, 400, result.message, result.result);
  } catch (error: any) {
    return handleErrorServer(res, 500, "Error al eliminar la actividad", error.message);
  }
}