import { Request, Response } from "express";
import { getRespaldosSer, getRespaldoSer, createRespaldoSer, patchRespaldoSer, deleteRespaldoSer} from "../services/respaldo.service.js";
import { createValidation, integrityValidation, updateValidation } from "../validations/respaldo.validations.js";
import { idValidation } from "../validations/modules/id.validation.js";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";
import { AppDataSource } from "../config/configDb.js";
import UserEntity from "../entity/user.entity.js";
import CompromisoEntity from "../entity/compromiso.entity.js";
import { RESPALDO_NO_ENCONTRADO } from "../constants/respaldo.constants.js";
import { isAdminRole, mergeImagenes, removeImagen, deleteUploadedFiles, deleteImagenesFromDisk,} from "../utils/respaldo.utils.js";

export async function createRespaldo(req: Request, res: Response): Promise<any> {
  const files = req.files as Express.Multer.File[] | undefined;

  // Rechaza la petición y limpia las imágenes que multer ya guardó en disco
  const rechazar = (status: number, message: string, details?: string) => {
    deleteUploadedFiles(files);
    return handleErrorClient(res, status, message, details);
  };

  try {
    const { id, carreraId: userCarreraId } = (req.user as any) || {};

    if (!req.body) return rechazar(400, "datos no proporcionados");

    const { error } = integrityValidation.validate(req.body);
    if (error) return rechazar(400, "parametros invalidos", error.message);

    const result = createValidation.validate(req.body);
    if (result.error) return rechazar(400, "faltan parametros", result.error.message);

    const { compromisoId, id_compromiso, descripcion, carreraId, id_carrera } = req.body;
    let targetCompromisoId = Number(compromisoId || id_compromiso);

    // Asociar internamente la carrera del usuario creador
    let targetCarreraId = userCarreraId || carreraId || id_carrera;
    if (!targetCarreraId && id) {
      const userRepo = AppDataSource.getRepository(UserEntity as any);
      const user = await userRepo.findOne({ where: { id } });
      if (user?.carreraId) {
        targetCarreraId = user.carreraId;
      }
    }

    if (!targetCarreraId) {
      return rechazar(400, "No se encontró ninguna carrera disponible para asociar a la publicación");
    }

    // Si no se proporcionó compromisoId, asociar al último compromiso disponible para la carrera
    if (!targetCompromisoId || isNaN(targetCompromisoId)) {
      const compromisoRepo = AppDataSource.getRepository(CompromisoEntity as any);
      const ultimoCompromiso = await compromisoRepo.findOne({
        where: { carreraId: targetCarreraId },
        order: { id_compromiso: "DESC" },
      });
      if (ultimoCompromiso) {
        targetCompromisoId = ultimoCompromiso.id_compromiso;
      }
    }

    if (!targetCompromisoId || isNaN(targetCompromisoId)) {
      return rechazar(400, "El compromiso asociado es obligatorio. Debe existir al menos un compromiso para asociar a la publicación.");
    }

    const imagenes = files ? files.map((f) => f.path) : [];

    const { data, error: errSer } = await createRespaldoSer(
      targetCompromisoId, descripcion, imagenes, id, Number(targetCarreraId)
    );
    if (errSer) return rechazar(400, errSer);

    return handleSuccess(res, 201, "Respaldo creado exitosamente", data);
  } catch (error: any) {
    deleteUploadedFiles(files);
    return handleErrorServer(res, 500, "error interno del servidor", error.message);
  }
}

export async function getRespaldos(req: Request, res: Response): Promise<any> {
  try {
    const { carreraId, rol, role } = (req.user as any) || {};
    const userRole = rol || role;

    // Solo el administrador puede consultar otra carrera mediante query
    const queryCarreraId = isAdminRole(userRole) && req.query.carreraId
      ? Number(req.query.carreraId)
      : carreraId;

    const Respaldos = await getRespaldosSer(queryCarreraId, userRole);

    if (!Respaldos) return handleErrorServer(res, 500, "Error interno del servidor");
    return handleSuccess(res, 200, "Respaldos obtenidos exitosamente", Respaldos);
  } catch (error: any) {
    return handleErrorServer(res, 500, "Error interno del servidor", error.message);
  }
}

export async function getRespaldoById(req: Request, res: Response): Promise<any> {
  try {
    const { carreraId, rol, role } = (req.user as any) || {};
    const userRole = rol || role;
    const { id_respaldo } = req.params;

    if (!id_respaldo || isNaN(Number(id_respaldo))) {
      return handleErrorClient(res, 400, "el id del respaldo es inválido");
    }

    const Respaldo = await getRespaldoSer(Number(id_respaldo), carreraId, userRole);
    if (!Respaldo) return handleErrorClient(res, 404, RESPALDO_NO_ENCONTRADO);

    return handleSuccess(res, 200, "Publicación encontrada", Respaldo);
  } catch (error: any) {
    return handleErrorServer(res, 500, "Error interno del servidor", error.message);
  }
}

export async function patchRespaldoById(req: Request, res: Response): Promise<any> {
  const files = req.files as Express.Multer.File[] | undefined;

  const rechazar = (status: number, message: string, details?: string) => {
    deleteUploadedFiles(files);
    return handleErrorClient(res, status, message, details);
  };

  try {
    const { carreraId, rol, role } = (req.user as any) || {};
    const userRole = rol || role;
    if (!req.body) return rechazar(400, "datos no proporcionados");

    const { id_respaldo } = req.params;
    const validateId = idValidation.validate({ id: id_respaldo });
    if (validateId.error) return rechazar(400, validateId.error.message);

    const { error } = integrityValidation.validate(req.body);
    if (error) return rechazar(400, "Parámetros invalidos", error.message);

    const result = updateValidation.validate(req.body);
    if (result.error) return rechazar(400, "faltó actualizar parametros", result.error.message);

    const nuevasImagenes = files ? files.map((f) => f.path) : [];
    if (Object.keys(req.body).length === 0 && nuevasImagenes.length === 0) {
      return rechazar(400, "Debe proporcionar al menos un campo o una imagen para actualizar");
    }

    const Respaldo = await getRespaldoSer(Number(id_respaldo), carreraId, userRole);
    if (!Respaldo) return rechazar(404, RESPALDO_NO_ENCONTRADO);

    const { carreraId: newCarreraId, id_carrera: newIdCarrera, compromisoId, id_compromiso, ...restData } = req.body;
    Object.assign(Respaldo, restData);

    const targetCompromisoId = compromisoId || id_compromiso;
    if (targetCompromisoId !== undefined) {
      const parsedCompromisoId = Number(targetCompromisoId);
      if (!isNaN(parsedCompromisoId) && parsedCompromisoId > 0) {
        Respaldo.compromisoId = parsedCompromisoId;
        Respaldo.compromiso = { id_compromiso: parsedCompromisoId };
      }
    }

    if (isAdminRole(userRole) && (newCarreraId || newIdCarrera)) {
      Respaldo.carreraId = Number(newCarreraId || newIdCarrera);
      Respaldo.carrera = { id_carrera: Respaldo.carreraId };
    }

    // Las imágenes nuevas se agregan a las existentes
    if (nuevasImagenes.length > 0) {
      Respaldo.imagenes = mergeImagenes(Respaldo.imagenes, nuevasImagenes);
    }

    const actualizado = await patchRespaldoSer(Respaldo);
    if (!actualizado.data) return rechazar(400, actualizado.message);

    return handleSuccess(res, 200, actualizado.message, actualizado.data);
  } catch (error: any) {
    deleteUploadedFiles(files);
    return handleErrorServer(res, 500, "Error interno del servidor", error.message);
  }
}

export async function deleteRespaldoById(req: Request, res: Response): Promise<any> {
  try {
    const { carreraId, rol, role } = (req.user as any) || {};
    const userRole = rol || role;
    const { id_respaldo } = req.params;

    if (!id_respaldo || isNaN(Number(id_respaldo))) {
      return handleErrorClient(res, 400, "El id del respaldo es inválido");
    }

    // Primero verifica que la pueda ver / pertenezca a su carrera
    const Respaldo = await getRespaldoSer(Number(id_respaldo), carreraId, userRole);
    if (!Respaldo) return handleErrorClient(res, 404, RESPALDO_NO_ENCONTRADO);

    const result = await deleteRespaldoSer(Number(id_respaldo));
    if (!result.result || result.result.affected < 1) {
      return handleErrorClient(res, 400, result.message);
    }

    // Borrar imágenes del disco solo si se eliminó el registro
    deleteImagenesFromDisk(Respaldo.imagenes);

    return handleSuccess(res, 200, result.message);
  } catch (error: any) {
    return handleErrorServer(res, 500, "Error al eliminar el respaldo", error.message);
  }
}

export async function deleteImagenPublicacion(req: Request, res: Response): Promise<any> {
  try {
    const { carreraId, rol, role } = (req.user as any) || {};
    const userRole = rol || role;
    const { id_publicacion } = req.params;
    const { imagenUrl } = req.body ?? {};

    if (!id_publicacion || isNaN(Number(id_publicacion))) {
      return handleErrorClient(res, 400, "El id del respaldo es inválido");
    }

    if (!imagenUrl) {
      return handleErrorClient(res, 400, "Debe proporcionar la URL de la imagen a eliminar");
    }

    const Respaldo = await getRespaldoSer(Number(id_publicacion), carreraId, userRole);
    if (!Respaldo) return handleErrorClient(res, 404, RESPALDO_NO_ENCONTRADO);

    const { imagenes, encontrada } = removeImagen(Respaldo.imagenes, imagenUrl);
    if (!encontrada) {
      return handleErrorClient(res, 404, "La imagen especificada no pertenece a esta publicación");
    }

    Respaldo.imagenes = imagenes;

    const actualizado = await patchRespaldoSer(Respaldo);
    if (!actualizado.data) return handleErrorClient(res, 400, actualizado.message);

    // Borrar el archivo del disco solo si se actualizó el registro
    deleteImagenesFromDisk([imagenUrl]);

    return handleSuccess(res, 200, "Imagen eliminada exitosamente", actualizado.data);
  } catch (error: any) {
    return handleErrorServer(res, 500, "Error interno del servidor", error.message);
  }
}