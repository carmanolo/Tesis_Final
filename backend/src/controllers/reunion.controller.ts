import { Request, Response } from "express";
import path from "path";
import {
    getReunionSer,
    getReunionesSer,
    createReunionSer,
    patchReunionSer,
    deleteReunionSer,
    subirActaSer,
    obtenerActaSer
} from "../services/reunion.service.js";
import { createValidation, integrityValidation, updateValidation } from "../validations/reunion.validations.js";
import { idValidation } from "../validations/modules/id.validation.js";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";
import { REUNION_NO_ENCONTRADA, ACTA_NO_PROPORCIONADA } from "../constants/reunion.constants.js";
import { SHOW_ERRORS } from "../constants/ajustes.constants.js";

export async function createReunion(req: Request, res: Response): Promise<any> {
  try {
    if (!req.body) {
      return handleErrorClient(res, 400, "datos no proporcionados");
    }

    const { fecha_reunion, descripcion } = req.body;

    const { error } = integrityValidation.validate(req.body);
    if (error) {
      return handleErrorClient(res, 400, "parametros invalidos", error.message);
    }

    const result = createValidation.validate(req.body);
    if (result.error) {
      return handleErrorClient(res, 400, "faltan parametros", result.error.message);
    }

    const newReunion = await createReunionSer(fecha_reunion, descripcion);
    if (newReunion) {
      return handleSuccess(res, 201, "Reunión registrada exitosamente", newReunion.data || newReunion);
    } else {
      return handleErrorServer(res, 500, "error al registrar la reunión");
    }
  } catch (error: any) {
    console.error("error en registro de reunión");
    return handleErrorServer(res, 500, "error interno del servidor", error.message);
  }
}

export async function getReuniones(req: Request, res: Response): Promise<any> {
  try {
    const reunionData = await getReunionesSer();

    if (!reunionData) {
      return handleErrorClient(res, 400, "Reuniones no encontradas");
    }

    return handleSuccess(res, 200, "Reuniones obtenidas exitosamente", reunionData[0] || reunionData);
  } catch (error: any) {
    console.error("Error en reunion.controller.ts -> getReuniones(): ", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
}

export async function getReunionById(req: Request, res: Response): Promise<any> {
  try {
    const { id_reunion } = req.params;

    if (!id_reunion || isNaN(Number(id_reunion))) {
      return handleErrorClient(res, 400, "el id de la reunión es inválido");
    }

    const reunion = await getReunionSer(Number(id_reunion));

    if (!reunion) {
      return handleErrorClient(res, 404, "Reunión no encontrada");
    }

    return handleSuccess(res, 200, "Reunión encontrada", reunion);
  } catch (error: any) {
    return handleErrorServer(res, 500, "Error interno del servidor", error.message);
  }
}

export async function patchReunionById(req: Request, res: Response): Promise<any> {
  try {
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

    const reunionUpdate = await getReunionSer(Number(id_reunion));

    if (!reunionUpdate) {
      return handleErrorClient(res, 404, "Reunión no encontrada");
    }

    Object.assign(reunionUpdate, req.body);

    const updateReunion = await patchReunionSer(reunionUpdate);
    if (!updateReunion.data) {
      return handleErrorClient(res, 400, updateReunion.message);
    }

    return handleSuccess(res, 200, "Reunión actualizada con éxito", updateReunion.data);
  } catch (error: any) {
    return handleErrorServer(res, 500, "Error interno del servidor", error.message);
  }
}

export async function deleteReunionById(req: Request, res: Response): Promise<any> {
  try {
    const { id_reunion } = req.params;
    if (!id_reunion) {
      return handleErrorClient(res, 400, "El id de la reunión es obligatorio");
    }

    const result = await deleteReunionSer(Number(id_reunion));

    if (result && result.result && result.result.affected >= 1) {
      return handleSuccess(res, 200, "Reunión eliminada exitosamente");
    }

    if (result.message === REUNION_NO_ENCONTRADA) {
      return handleSuccess(res, 404, result.message, result.result);
    }

    return handleErrorClient(res, 400, result.message, result.result);
  } catch (error: any) {
    return handleErrorServer(res, 500, "Error al eliminar la reunión", error.message);
  }
}

// ---------------------------------------------------------------------------
// Acta (PDF / Word): subida (importación) y descarga
// ---------------------------------------------------------------------------

export async function subirActa(req: Request, res: Response): Promise<any> {
  try {
    const { id_reunion } = req.params;

    if (!id_reunion || isNaN(Number(id_reunion))) {
      return handleErrorClient(res, 400, "el id de la reunión es inválido");
    }

    if (!req.file) {
      return handleErrorClient(res, 400, ACTA_NO_PROPORCIONADA);
    }

    const result = await subirActaSer(Number(id_reunion), req.file);

    if (!result.data) {
      return handleErrorClient(res, 400, result.message);
    }

    return handleSuccess(res, 200, result.message, result.data);
  } catch (error: any) {
    return handleErrorServer(res, 500, "Error interno del servidor", error.message);
  }
}

export async function descargarActa(req: Request, res: Response): Promise<any> {
  try {
    const { id_reunion } = req.params;

    if (!id_reunion || isNaN(Number(id_reunion))) {
      return handleErrorClient(res, 400, "el id de la reunión es inválido");
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
  } catch (error: any) {
    return handleErrorServer(res, 500, "Error interno del servidor", error.message);
  }
}