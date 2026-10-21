import { Request, Response } from "express";
import { createPrestamoSer, devolverPrestamoSer, deletePrestamoSer } from "../services/prestamo.service.js";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";

export async function createPrestamo(req: Request, res: Response): Promise<any> {
    try {
        if (!req.body) {
            return handleErrorClient(res, 400, "Datos no proporcionados");
        }

        const { materialId, id_material, prestatario, fecha_prestamo, tne_entregada } = req.body;
        const targetMaterialId = Number(materialId || id_material);

        if (!targetMaterialId || isNaN(targetMaterialId) || targetMaterialId <= 0) {
            return handleErrorClient(res, 400, "El id del material es inválido o no fue especificado");
        }

        const nombrePrestatario = String(prestatario || "").trim();
        if (!nombrePrestatario || nombrePrestatario.length < 3 || nombrePrestatario.length > 60) {
            return handleErrorClient(res, 400, "El nombre del prestatario debe tener entre 3 y 60 caracteres");
        }

        const fechaFinal = fecha_prestamo ? fecha_prestamo : new Date();

        const { data, error } = await createPrestamoSer(
            targetMaterialId,
            nombrePrestatario,
            fechaFinal,
            Boolean(tne_entregada)
        );

        if (error || !data) {
            return handleErrorClient(res, 400, error || "No se pudo registrar el préstamo");
        }

        return handleSuccess(res, 201, "Préstamo registrado exitosamente", data);
    } catch (error: any) {
        return handleErrorServer(res, 500, "Error interno del servidor al crear préstamo", error.message);
    }
}

export async function devolverPrestamo(req: Request, res: Response): Promise<any> {
    try {
        const { id_prestamo } = req.params;
        const id = Number(id_prestamo);

        if (!id || isNaN(id) || id <= 0) {
            return handleErrorClient(res, 400, "El id del préstamo es inválido");
        }

        const { data, error } = await devolverPrestamoSer(id);

        if (error || !data) {
            return handleErrorClient(res, 400, error || "No se pudo procesar la devolución");
        }

        return handleSuccess(res, 200, "Devolución registrada exitosamente", data);
    } catch (error: any) {
        return handleErrorServer(res, 500, "Error interno del servidor al devolver préstamo", error.message);
    }
}

export async function deletePrestamo(req: Request, res: Response): Promise<any> {
    try {
        const { id_prestamo } = req.params;
        const id = Number(id_prestamo);

        if (!id || isNaN(id) || id <= 0) {
            return handleErrorClient(res, 400, "El id del préstamo es inválido");
        }

        const { result, error } = await deletePrestamoSer(id);

        if (error || !result) {
            return handleErrorClient(res, 400, error || "No se pudo eliminar el préstamo");
        }

        return handleSuccess(res, 200, "Préstamo eliminado exitosamente", result);
    } catch (error: any) {
        return handleErrorServer(res, 500, "Error interno del servidor al eliminar préstamo", error.message);
    }
}
