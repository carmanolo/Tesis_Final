import { Request, Response } from "express";
import User from "../entity/user.entity.js";
import { createUserSer, getUsersSer, patchUserSer, deleteUserSer, getUserSer } from "../services/user.service.js";
import { AppDataSource } from "../config/configDb.js";
import { createValidation, integrityValidation, updateValidation } from "../validations/user.validations.js"
import { SHOW_ERRORS } from "../constants/ajustes.constants.js"
import { idValidation } from "../validations/modules/id.validation.js";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";
import { USER_NO_ENCONTRADO } from "../constants/user.constants.js";

export async function createUser(req: Request, res: Response): Promise<any> {
  try {
    let newUser: any = null;
    if (!req.body || !req.params) {
      return handleErrorClient(res, 400, "datos no proporcionados");
    }

    const { username, email, password, role } = req.body;

    const { error } = integrityValidation.validate(req.body);
    if (error) {
      return handleErrorClient(res, 400, "parametros invalidos", error.message);
    }

    let result = createValidation.validate(req.body);
    if (result.error) {
      return handleErrorClient(res, 400, "faltan parametros", result.error.message);
    }

    newUser = await createUserSer(username, email, password, role);
    if (newUser) {
      newUser.password = undefined;
      return handleSuccess(res, 201, "Usuario registrado exitosamente", newUser.data || newUser);
    } else {
      return handleErrorServer(res, 500, "error al registrar usuario");
    }
  } catch (error: any) {
    console.error("error en registro de usuario");
    return handleErrorServer(res, 500, "error interno del servidor", error.message);
  }
}

export async function getUsers(req: Request, res: Response): Promise<any> {
  try {
    const userData = await getUsersSer();

    if (!userData) {
      return handleErrorClient(res, 400, "Usuarios no encontrados");
    }

    return handleSuccess(res, 200, "Usuarios obtenidos exitosamnete", userData[0]);
  } catch (error: any) {
    console.error("Error en user.controller.ts -> getUsers(): ", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
}

export async function getUserById(req: Request, res: Response): Promise<any> {
  try {
    const userRepository = AppDataSource.getRepository(User as any);
    const { id } = req.params;
    const user = await userRepository.findOne({ where: { id: Number(id) } });

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    return res.status(200).json({ message: "Usuario encontrado: ", data: user });
  } catch (error: any) {
    console.error("Error en user.controller.ts -> getUserById(): ", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
}

export async function patchUserById(req: Request, res: Response): Promise<any> {
  try {
    if (!req.params || !req.body) {
      return handleErrorClient(res, 400, "datos no prporcionados");
    }
    const { id } = req.params;
    if (!id) {
      return handleErrorClient(res, 400, "el id de usuario es obligatorio");
    }

    let validateId = idValidation.validate({ id: id });
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

    let result = updateValidation.validate(req.body);
    if (result.error) {
      return handleErrorClient(res, 400, "falto actualizar parametros", result.error.message);
    }

    const userUpdate = await getUserSer(Number(id));

    if (!userUpdate) {
      return handleErrorClient(res, 404, "Usuario no encontrado");
    }

    Object.assign(userUpdate, req.body);

    const updateUser = await patchUserSer(userUpdate);
    if (!(updateUser.data)) {
      return handleErrorClient(res, 400, updateUser.message);
    }

    return handleSuccess(res, 200, "Usuario actualizado con éxito", updateUser.data);
  } catch (error: any) {
    return handleErrorServer(res, 500, "Error interno del servidor", error.message);
  }
}

export async function deleteUserById(req: Request, res: Response): Promise<any> {
  try {
    const { id } = req.params;
    if (!id) {
      return handleErrorClient(res, 400, "El id del usuario es obligatorio");
    }

    const result = await deleteUserSer(Number(id));
    
    if (result && result.result && result.result.affected >= 1) {
      return handleSuccess(res, 200, "Usuario elimnado exitosamnete");
    }

    if (result.message === USER_NO_ENCONTRADO) {
      return handleSuccess(res, 404, result.message, result.result);
    }

    return handleErrorClient(res, 400, result.message, result.result);
  } catch (error: any) {
    return handleErrorServer(res, 500, "Error al elimar el usuario", error.message);
  }
}

export async function getProfile(req: Request, res: Response): Promise<any> {
  try {
    const userRepository = AppDataSource.getRepository(User as any);
    const userEmail = req.user?.email; // Tipado gracias a tu archivo types/express.d.ts
    
    const user = await userRepository.findOne({ where: { email: userEmail } });

    if (!user) {
      return res.status(404).json({ message: "Perfil no encontrado." });
    }

    const formattedUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      rut: user.rut,
      role: user.role
    };

    return res.status(200).json({ message: "Perfil encontrado: ", data: formattedUser });
  } catch (error: any) {
    console.error("Error en user.controller -> getProfile(): ", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}

export async function getUserStats(req: Request, res: Response): Promise<any> {
  try {
    const userRepository = AppDataSource.getRepository(User as any);
    const usuariosCreados = await userRepository.count();
    const usuarios = await userRepository.count({ where: { role: "usuario" } });
    const admninistradores = await userRepository.count({ where: { role: "administrador" } });
    
    return res.status(200).json({
      usuariosCreados: Number(usuariosCreados || 0),
      usuarios: Number(usuarios || 0),
      admninistradores: Number(admninistradores || 0),
    });
  } catch (error: any) {
    console.error("Error en user.controller.ts -> getUserStats(): ", error);
    return res.status(200).json({
      usuariosCreados: 0,
      usuarios: 0,
      admninistradores: 0,
    });
  }
}