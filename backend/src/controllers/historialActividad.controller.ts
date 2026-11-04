import { Request, Response } from "express";
import {
  listarHistorialService,
  eliminarRegistroHistorialService,
} from "../services/historialActividad.service.js";
import { handleSuccess, handleErrorClient, handleErrorServer } from "../handlers/responseHandlers.js";

export async function getHistorial(req: Request, res: Response): Promise<any> {
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
  } catch (error: any) {
    return handleErrorServer(res, 500, "Error al obtener historial", error.message);
  }
}

export async function deleteHistorialItem(req: Request, res: Response): Promise<any> {
  try {
    const { id } = req.params;
    const [eliminado, error] = await eliminarRegistroHistorialService(Number(id));

    if (error) {
      return handleErrorClient(res, 404, error);
    }

    return handleSuccess(res, 200, "Registro de actividad descartado", eliminado);
  } catch (error: any) {
    return handleErrorServer(res, 500, "Error al eliminar registro", error.message);
  }
}

