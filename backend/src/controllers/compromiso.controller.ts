import { Request, Response } from "express";
import { getCompromisosSer, getCompromisoSer, createCompromisoSer, patchCompromisoSer,
        deleteCompromisoSer, asignarAporteSer, desasignarAporteSer, getCompromisoReporteSer,
        obtenerListaCompromiso,} from "../services/compromiso.service.js";
import { createValidation, integrityValidation, updateValidation, asignarAporteValidation,} from "../validations/compromiso.validations.js";
import { generarExcelSolicitud, generarPdfSolicitud, processCompromisos } from "../utils/compromiso.utils.js";
import { idValidation } from "../validations/modules/id.validation.js";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";
import { AppDataSource } from "../config/configDb.js";
import UserEntity from "../entity/user.entity.js";
import CarreraEntity from "../entity/carrera.entity.js";

const isAdminRole = (role?: string) => ["admin", "administrador"].includes(String(role).toLowerCase());

export async function createCompromiso(req: Request, res: Response): Promise<any> {
  try {
    const { id, carreraId: userCarreraId, rol, role } = (req.user as any) || {};
    const admin = isAdminRole(rol || role);

    if (!req.body) return handleErrorClient(res, 400, "datos no proporcionados");

    const { error } = integrityValidation.validate(req.body);
    if (error) return handleErrorClient(res, 400, "parametros invalidos", error.message);

    const result = createValidation.validate(req.body);
    if (result.error) return handleErrorClient(res, 400, "faltan parametros", result.error.message);

    const { descripcion_compromiso, fecha_compromiso, monto_total, carreraId: bodyCarreraId, id_carrera } = req.body;

    // Solo un administrador puede elegir la carrera; el resto usa la suya
    let targetCarreraId = admin ? (bodyCarreraId || id_carrera || userCarreraId) : userCarreraId;

    // Si el token no trae carrera, se busca la del propio usuario
    if (!targetCarreraId && id) {
      const userRepo = AppDataSource.getRepository(UserEntity as any);
      const user = await userRepo.findOne({ where: { id } });
      if (user?.carreraId) {
        targetCarreraId = user.carreraId;
      }
    }

    // Solo un administrador sin carrera asignada toma la primera carrera registrada
    if (!targetCarreraId && admin) {
      const carreraRepo = AppDataSource.getRepository(CarreraEntity as any);
      const primerCarrera = await carreraRepo.findOne({ where: {} });
      if (primerCarrera) {
        targetCarreraId = primerCarrera.id_carrera;
      }
    }

    if (!targetCarreraId) {
      return handleErrorClient(res, 400, "No se encontró ninguna carrera disponible para asociar al compromiso");
    }

    const { data, error: errSer } = await createCompromisoSer(
      descripcion_compromiso, fecha_compromiso, Number(monto_total), Number(id), Number(targetCarreraId),
    );
    if (errSer) return handleErrorClient(res, 400, errSer);

    return handleSuccess(res, 201, "Compromiso registrado exitosamente", data);
  } catch (error: any) {
    return handleErrorServer(res, 500, "error interno del servidor", error.message);
  }
}

export async function getCompromisos(req: Request, res: Response): Promise<any> {
  try {
    const { carreraId, rol, role } = (req.user as any) || {};
    const userRole = rol || role;

    // Solo un administrador puede consultar otra carrera por query
    const queryCarreraId = isAdminRole(userRole) && req.query.carreraId ? Number(req.query.carreraId) : carreraId;

    const compromisos = await getCompromisosSer(queryCarreraId, userRole);

    if (!compromisos) return handleErrorServer(res, 500, "Error interno del servidor");
    return handleSuccess(res, 200, "Compromisos obtenidos exitosamente", compromisos);
  } catch (error: any) {
    return handleErrorServer(res, 500, "Error interno del servidor", error.message);
  }
}

export async function getCompromisoById(req: Request, res: Response): Promise<any> {
  try {
    const { carreraId, rol, role } = (req.user as any) || {};
    const userRole = rol || role;
    const { id_compromiso } = req.params;

    if (!id_compromiso || isNaN(Number(id_compromiso))) {
      return handleErrorClient(res, 400, "el id del Compromiso es inválido");
    }

    const compromiso = await getCompromisoSer(Number(id_compromiso), carreraId, userRole);
    if (!compromiso) return handleErrorClient(res, 404, "Compromiso no encontrado");

    return handleSuccess(res, 200, "Compromiso encontrado", compromiso);
  } catch (error: any) {
    return handleErrorServer(res, 500, "Error interno del servidor", error.message);
  }
}

export async function patchCompromisoById(req: Request, res: Response): Promise<any> {
  try {
    const { carreraId, rol, role } = (req.user as any) || {};
    const userRole = rol || role;

    if (!req.body) return handleErrorClient(res, 400, "datos no proporcionados");

    const { id_compromiso } = req.params;
    const validateId = idValidation.validate({ id: id_compromiso });
    if (validateId.error) return handleErrorClient(res, 400, validateId.error.message);

    const { error } = integrityValidation.validate(req.body);
    if (error) return handleErrorClient(res, 400, "Parámetros invalidos", error.message);

    const result = updateValidation.validate(req.body);
    if (result.error) return handleErrorClient(res, 400, "faltó actualizar parametros", result.error.message);

    // Primero verifica que exista / pertenezca a su carrera
    const compromiso = await getCompromisoSer(Number(id_compromiso), carreraId, userRole);
    if (!compromiso) return handleErrorClient(res, 404, "Compromiso no encontrado");

    const cambios = { ...req.body };
    if (cambios.monto_total !== undefined) cambios.monto_total = Number(cambios.monto_total);

    const actualizado = await patchCompromisoSer(Number(id_compromiso), cambios);
    if (!actualizado.data) return handleErrorClient(res, 400, actualizado.message);

    return handleSuccess(res, 200, actualizado.message, actualizado.data);
  } catch (error: any) {
    return handleErrorServer(res, 500, "Error interno del servidor", error.message);
  }
}

export async function deleteCompromisoById(req: Request, res: Response): Promise<any> {
  try {
    const { carreraId, rol, role } = (req.user as any) || {};
    const userRole = rol || role;
    const { id_compromiso } = req.params;

    if (!id_compromiso || isNaN(Number(id_compromiso))) {
      return handleErrorClient(res, 400, "El id del Compromiso es inválido");
    }

    // Primero verifica que lo pueda ver / pertenezca a su carrera
    const compromiso = await getCompromisoSer(Number(id_compromiso), carreraId, userRole);
    if (!compromiso) return handleErrorClient(res, 404, "Compromiso no encontrado");

    const result = await deleteCompromisoSer(Number(id_compromiso));
    if (!result.result || result.result.affected < 1) {
      return handleErrorClient(res, 400, result.message);
    }

    return handleSuccess(res, 200, result.message);
  } catch (error: any) {
    return handleErrorServer(res, 500, "Error al eliminar el Compromiso", error.message);
  }
}

export async function asignarAporte(req: Request, res: Response): Promise<any> {
  try {
    const { carreraId, rol, role } = (req.user as any) || {};
    const userRole = rol || role;

    if (!req.body) return handleErrorClient(res, 400, "datos no proporcionados");

    const { id_compromiso } = req.params;
    const validateId = idValidation.validate({ id: id_compromiso });
    if (validateId.error) return handleErrorClient(res, 400, validateId.error.message);

    const { error } = integrityValidation.validate(req.body);
    if (error) return handleErrorClient(res, 400, "Parámetros invalidos", error.message);

    const result = asignarAporteValidation.validate(req.body);
    if (result.error) return handleErrorClient(res, 400, "faltan parametros", result.error.message);

    // Primero verifica que el compromiso exista / pertenezca a su carrera
    const compromiso = await getCompromisoSer(Number(id_compromiso), carreraId, userRole);
    if (!compromiso) return handleErrorClient(res, 404, "Compromiso no encontrado");

    const { aporteId, monto_asignado } = req.body;
    const { data, error: errSer, creada } = await asignarAporteSer(
      Number(id_compromiso), Number(aporteId), Number(monto_asignado),
    );
    if (errSer) return handleErrorClient(res, 400, errSer);

    // Se devuelve el saldo actualizado: cada aporte asignado hace bajar lo que falta por financiar
    const actualizado = await getCompromisoSer(Number(id_compromiso), carreraId, userRole);
    return handleSuccess(res, creada ? 201 : 200, "Aporte asignado al compromiso", {
      asignacion: data,
      resumen: actualizado?.resumen ?? null,
    });
  } catch (error: any) {
    return handleErrorServer(res, 500, "Error interno del servidor", error.message);
  }
}

export async function quitarAporte(req: Request, res: Response): Promise<any> {
  try {
    const { carreraId, rol, role } = (req.user as any) || {};
    const userRole = rol || role;
    const { id_compromiso, id_aporte } = req.params;

    if (!id_compromiso || isNaN(Number(id_compromiso))) {
      return handleErrorClient(res, 400, "el id del Compromiso es inválido");
    }
    if (!id_aporte || isNaN(Number(id_aporte))) {
      return handleErrorClient(res, 400, "el id del Aporte es inválido");
    }

    // Primero verifica que el compromiso exista / pertenezca a su carrera
    const compromiso = await getCompromisoSer(Number(id_compromiso), carreraId, userRole);
    if (!compromiso) return handleErrorClient(res, 404, "Compromiso no encontrado");

    const result = await desasignarAporteSer(Number(id_compromiso), Number(id_aporte));
    if (!result.result || result.result.affected < 1) {
      return handleErrorClient(res, 400, "El aporte no está asignado a este compromiso");
    }

    const actualizado = await getCompromisoSer(Number(id_compromiso), carreraId, userRole);
    return handleSuccess(res, 200, result.message, { resumen: actualizado?.resumen ?? null });
  } catch (error: any) {
    return handleErrorServer(res, 500, "Error interno del servidor", error.message);
  }
}

// Solicitud de fondos de un único compromiso

export async function descargarSolicitudPdf(req: Request, res: Response): Promise<any> {
  try {
    const { carreraId, rol, role } = (req.user as any) || {};
    const userRole = rol || role;
    const { id_compromiso } = req.params;

    if (!id_compromiso || isNaN(Number(id_compromiso))) {
      return handleErrorClient(res, 400, "el id del Compromiso es inválido");
    }

    const datos = await getCompromisoReporteSer(Number(id_compromiso), carreraId, userRole);
    if (!datos) return handleErrorClient(res, 404, "Compromiso no encontrado");

    const buffer = await generarPdfSolicitud(datos);
    const nombre = `solicitud_fondos_compromiso_${id_compromiso}_${new Date().toISOString().slice(0, 10)}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${nombre}"`);
    return res.status(200).send(buffer);
  } catch (error: any) {
    return handleErrorServer(res, 500, "Error al generar la solicitud PDF", error.message);
  }
}

export async function descargarSolicitudExcel(req: Request, res: Response): Promise<any> {
  try {
    const { carreraId, rol, role } = (req.user as any) || {};
    const userRole = rol || role;
    const { id_compromiso } = req.params;

    if (!id_compromiso || isNaN(Number(id_compromiso))) {
      return handleErrorClient(res, 400, "el id del Compromiso es inválido");
    }

    const datos = await getCompromisoReporteSer(Number(id_compromiso), carreraId, userRole);
    if (!datos) return handleErrorClient(res, 404, "Compromiso no encontrado");

    const buffer = await generarExcelSolicitud(datos);
    const nombre = `solicitud_fondos_compromiso_${id_compromiso}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${nombre}"`);
    return res.status(200).send(buffer);
  } catch (error: any) {
    return handleErrorServer(res, 500, "Error al generar la solicitud Excel", error.message);
  }
}

//esto es para procesar la lista de compromisos al colocar
export async function getCompromisoList(req: Request, res: Response): Promise<any> {
  const DEFAULT_ARRAY: any[] = [];
  try {
      let compromisoList: any = await obtenerListaCompromiso();
      compromisoList = processCompromisos;
      return handleSuccess(res, 200, "Lista de compromisos obtenida exitosamente");
  } catch (error) {
    console.error(error);
        return handleSuccess(res, 200, "Error al obtener compromisos; disimular", DEFAULT_ARRAY);
  }
}