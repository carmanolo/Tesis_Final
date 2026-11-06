import { Request, Response } from "express";
import { getPublicacionesSer, getPublicacionSer, createPublicacionSer, patchPublicacionSer, deletePublicacionSer,} from "../services/publicacion.service.js";
import { createValidation, integrityValidation, updateValidation } from "../validations/publicacion.validations.js";
import { idValidation } from "../validations/modules/id.validation.js";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";
import { AppDataSource } from "../config/configDb.js";
import UserEntity from "../entity/user.entity.js";
import { PUBLICACION_NO_ENCONTRADA } from "../constants/publicacion.constants.js";
import {
  isAdminRole,
  mergeImagenes,
  removeImagen,
  deleteUploadedFiles,
  deleteImagenesFromDisk,
} from "../utils/publicacion.utils.js";

export async function createPublicacion(req: Request, res: Response): Promise<any> {
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

    const { titulo, descripcion, carreraId, id_carrera } = req.body;

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

    const imagenes = files ? files.map((f) => f.path) : [];

    const { data, error: errSer } = await createPublicacionSer(
      titulo, descripcion, imagenes, id, Number(targetCarreraId)
    );
    if (errSer) return rechazar(400, errSer);

    return handleSuccess(res, 201, "Publicación creada exitosamente", data);
  } catch (error: any) {
    deleteUploadedFiles(files);
    return handleErrorServer(res, 500, "error interno del servidor", error.message);
  }
}

export async function getPublicaciones(req: Request, res: Response): Promise<any> {
  try {
    const { carreraId, rol, role } = (req.user as any) || {};
    const userRole = rol || role;

    // Solo el administrador puede consultar otra carrera mediante query
    const queryCarreraId = isAdminRole(userRole) && req.query.carreraId
      ? Number(req.query.carreraId)
      : carreraId;

    const Publicaciones = await getPublicacionesSer(queryCarreraId, userRole);

    if (!Publicaciones) return handleErrorServer(res, 500, "Error interno del servidor");
    return handleSuccess(res, 200, "Publicaciones obtenidas exitosamente", Publicaciones);
  } catch (error: any) {
    return handleErrorServer(res, 500, "Error interno del servidor", error.message);
  }
}

export async function getPublicacionById(req: Request, res: Response): Promise<any> {
  try {
    const { carreraId, rol, role } = (req.user as any) || {};
    const userRole = rol || role;
    const { id_publicacion } = req.params;

    if (!id_publicacion || isNaN(Number(id_publicacion))) {
      return handleErrorClient(res, 400, "el id de la publicación es inválido");
    }

    const Publicacion = await getPublicacionSer(Number(id_publicacion), carreraId, userRole);
    if (!Publicacion) return handleErrorClient(res, 404, PUBLICACION_NO_ENCONTRADA);

    return handleSuccess(res, 200, "Publicación encontrada", Publicacion);
  } catch (error: any) {
    return handleErrorServer(res, 500, "Error interno del servidor", error.message);
  }
}

export async function patchPublicacionById(req: Request, res: Response): Promise<any> {
  const files = req.files as Express.Multer.File[] | undefined;

  const rechazar = (status: number, message: string, details?: string) => {
    deleteUploadedFiles(files);
    return handleErrorClient(res, status, message, details);
  };

  try {
    const { carreraId, rol, role } = (req.user as any) || {};
    const userRole = rol || role;
    if (!req.body) return rechazar(400, "datos no proporcionados");

    const { id_publicacion } = req.params;
    const validateId = idValidation.validate({ id: id_publicacion });
    if (validateId.error) return rechazar(400, validateId.error.message);

    const { error } = integrityValidation.validate(req.body);
    if (error) return rechazar(400, "Parámetros invalidos", error.message);

    const result = updateValidation.validate(req.body);
    if (result.error) return rechazar(400, "faltó actualizar parametros", result.error.message);

    const nuevasImagenes = files ? files.map((f) => f.path) : [];
    if (Object.keys(req.body).length === 0 && nuevasImagenes.length === 0) {
      return rechazar(400, "Debe proporcionar al menos un campo o una imagen para actualizar");
    }

    const Publicacion = await getPublicacionSer(Number(id_publicacion), carreraId, userRole);
    if (!Publicacion) return rechazar(404, PUBLICACION_NO_ENCONTRADA);

    const { carreraId: newCarreraId, id_carrera: newIdCarrera, ...restData } = req.body;
    Object.assign(Publicacion, restData);

    if (isAdminRole(userRole) && (newCarreraId || newIdCarrera)) {
      Publicacion.carreraId = Number(newCarreraId || newIdCarrera);
      Publicacion.carrera = { id_carrera: Publicacion.carreraId };
    }

    // Las imágenes nuevas se agregan a las existentes
    if (nuevasImagenes.length > 0) {
      Publicacion.imagenes = mergeImagenes(Publicacion.imagenes, nuevasImagenes);
    }

    const actualizado = await patchPublicacionSer(Publicacion);
    if (!actualizado.data) return rechazar(400, actualizado.message);

    return handleSuccess(res, 200, actualizado.message, actualizado.data);
  } catch (error: any) {
    deleteUploadedFiles(files);
    return handleErrorServer(res, 500, "Error interno del servidor", error.message);
  }
}

export async function deletePublicacionById(req: Request, res: Response): Promise<any> {
  try {
    const { carreraId, rol, role } = (req.user as any) || {};
    const userRole = rol || role;
    const { id_publicacion } = req.params;

    if (!id_publicacion || isNaN(Number(id_publicacion))) {
      return handleErrorClient(res, 400, "El id de la publicación es inválido");
    }

    // Primero verifica que la pueda ver / pertenezca a su carrera
    const Publicacion = await getPublicacionSer(Number(id_publicacion), carreraId, userRole);
    if (!Publicacion) return handleErrorClient(res, 404, PUBLICACION_NO_ENCONTRADA);

    const result = await deletePublicacionSer(Number(id_publicacion));
    if (!result.result || result.result.affected < 1) {
      return handleErrorClient(res, 400, result.message);
    }

    // Borrar imágenes del disco solo si se eliminó el registro
    deleteImagenesFromDisk(Publicacion.imagenes);

    return handleSuccess(res, 200, result.message);
  } catch (error: any) {
    return handleErrorServer(res, 500, "Error al eliminar la Publicación", error.message);
  }
}

export async function deleteImagenPublicacion(req: Request, res: Response): Promise<any> {
  try {
    const { carreraId, rol, role } = (req.user as any) || {};
    const userRole = rol || role;
    const { id_publicacion } = req.params;
    const { imagenUrl } = req.body ?? {};

    if (!id_publicacion || isNaN(Number(id_publicacion))) {
      return handleErrorClient(res, 400, "El id de la publicación es inválido");
    }

    if (!imagenUrl) {
      return handleErrorClient(res, 400, "Debe proporcionar la URL de la imagen a eliminar");
    }

    const Publicacion = await getPublicacionSer(Number(id_publicacion), carreraId, userRole);
    if (!Publicacion) return handleErrorClient(res, 404, PUBLICACION_NO_ENCONTRADA);

    const { imagenes, encontrada } = removeImagen(Publicacion.imagenes, imagenUrl);
    if (!encontrada) {
      return handleErrorClient(res, 404, "La imagen especificada no pertenece a esta publicación");
    }

    Publicacion.imagenes = imagenes;

    const actualizado = await patchPublicacionSer(Publicacion);
    if (!actualizado.data) return handleErrorClient(res, 400, actualizado.message);

    // Borrar el archivo del disco solo si se actualizó el registro
    deleteImagenesFromDisk([imagenUrl]);

    return handleSuccess(res, 200, "Imagen eliminada exitosamente", actualizado.data);
  } catch (error: any) {
    return handleErrorServer(res, 500, "Error interno del servidor", error.message);
  }
}