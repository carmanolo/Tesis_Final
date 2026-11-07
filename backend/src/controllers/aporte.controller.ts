import { Request, Response } from "express";
import { getAportesSer, getAporteSer, createAporteSer, patchAporteSer, deleteAporteSer, getAportesReporteSer } from "../services/aporte.service.js";
import { createValidation, integrityValidation, updateValidation } from "../validations/aporte.validations.js";
import { FECHA_ISO } from "../constants/aporte.constants.js";
import { calcularResumen, formatearFecha, generarExcelAportes, generarPdfAportes } from "../utils/aporte.utils.js";
import { idValidation } from "../validations/modules/id.validation.js";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";
import { AppDataSource } from "../config/configDb.js";
import UserEntity from "../entity/user.entity.js";
import CarreraEntity from "../entity/carrera.entity.js";

export async function createAporte(req: Request, res: Response): Promise<any> {
  try {
    const { id, carreraId: userCarreraId, rol, role } = (req.user as any) || {};
    const admin = ["admin", "administrador"].includes(String(rol || role).toLowerCase());

    if (!req.body) return handleErrorClient(res, 400, "datos no proporcionados");

    const { error } = integrityValidation.validate(req.body);
    if (error) return handleErrorClient(res, 400, "parametros invalidos", error.message);

    const result = createValidation.validate(req.body);
    if (result.error) return handleErrorClient(res, 400, "faltan parametros", result.error.message);

    const { descripcion_aporte, fecha_aporte, procedencia, monto, tipo, comprobante, id_carrera } = req.body;

    // Asociar internamente la carrera del usuario creador
    let targetCarreraId = admin ? (id_carrera || userCarreraId) : userCarreraId;
    if (!targetCarreraId && admin) {
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

    const { data, error: errSer } = await createAporteSer(
      descripcion_aporte, fecha_aporte, procedencia, monto, Number(targetCarreraId), tipo, comprobante ?? null,
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
    const esAdmin = ["admin", "administrador"].includes(String(userRole).toLowerCase());

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
    const nuevaCarrera = newCarreraId || newIdCarrera;

    // Solo un administrador puede mover un aporte a otra carrera
    if (nuevaCarrera && !esAdmin && Number(nuevaCarrera) !== Number(carreraId)) {
      return handleErrorClient(res, 403, "No tienes permiso para cambiar la carrera de un aporte");
    }

    Object.assign(Aporte, restData);

    if (nuevaCarrera && esAdmin) {
      Aporte.carreraId = Number(nuevaCarrera);
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
 
async function cargarDatosReporte(req: Request, res: Response,): Promise<{ aportes: any[]; periodo: string } | null> {
  const { carreraId, rol, role } = (req.user as any) || {};
  const userRole = rol || role;
  const { desde, hasta, carreraId: queryCarrera } = req.query;
 
  if (desde !== undefined && (typeof desde !== "string" || !FECHA_ISO.test(desde))) {
    handleErrorClient(res, 400, "El parámetro 'desde' debe tener formato YYYY-MM-DD");
    return null;
  }
  if (hasta !== undefined && (typeof hasta !== "string" || !FECHA_ISO.test(hasta))) {
    handleErrorClient(res, 400, "El parámetro 'hasta' debe tener formato YYYY-MM-DD");
    return null;
  }
  if (desde && hasta && desde > hasta) {
    handleErrorClient(res, 400, "'desde' no puede ser posterior a 'hasta'");
    return null;
  }
 
  let carreraFiltro: number | undefined;
  if (queryCarrera !== undefined) {
    carreraFiltro = Number(queryCarrera);
    if (!Number.isInteger(carreraFiltro) || carreraFiltro <= 0) {
      handleErrorClient(res, 400, "El parámetro 'carreraId' es inválido");
      return null;
    }
  }
 
  const aportes = await getAportesReporteSer(carreraId, userRole, {
    carreraId: carreraFiltro,
    desde: desde as string | undefined,
    hasta: hasta as string | undefined,
  });
  if (!aportes) {
    handleErrorServer(res, 500, "Error interno del servidor");
    return null;
  }
 
  const periodo =
    desde || hasta
      ? `Período: ${desde ? formatearFecha(desde as string) : "inicio"} al ${hasta ? formatearFecha(hasta as string) : "hoy"}`
      : "Período: todos los movimientos";
 
  return { aportes, periodo };
}
 
export async function getSaldoAportes(req: Request, res: Response): Promise<any> {
  try {
    const datos = await cargarDatosReporte(req, res);
    if (!datos) return;
 
    return handleSuccess(res, 200, "Saldo calculado exitosamente", calcularResumen(datos.aportes));
  } catch (error: any) {
    return handleErrorServer(res, 500, "Error interno del servidor", error.message);
  }
}
 
export async function descargarReportePdf(req: Request, res: Response): Promise<any> {
  try {
    const datos = await cargarDatosReporte(req, res);
    if (!datos) return;
 
    const buffer = await generarPdfAportes(datos.aportes, { periodo: datos.periodo });
    const nombre = `aportes_${new Date().toISOString().slice(0, 10)}.pdf`;
 
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${nombre}"`);
    return res.status(200).send(buffer);
  } catch (error: any) {
    return handleErrorServer(res, 500, "Error al generar el reporte PDF", error.message);
  }
}
 
export async function descargarReporteExcel(req: Request, res: Response): Promise<any> {
  try {
    const datos = await cargarDatosReporte(req, res);
    if (!datos) return;
 
    const buffer = await generarExcelAportes(datos.aportes, { periodo: datos.periodo });
    const nombre = `aportes_${new Date().toISOString().slice(0, 10)}.xlsx`;
 
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${nombre}"`);
    return res.status(200).send(buffer);
  } catch (error: any) {
    return handleErrorServer(res, 500, "Error al generar el reporte Excel", error.message);
  }
}
 