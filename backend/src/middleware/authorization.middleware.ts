import UserEntity from "../entity/user.entity.js";
import { AppDataSource } from "../config/configDb.js";
import { handleErrorClient, handleErrorServer } from "../handlers/responseHandlers.js";
import { Request, Response, NextFunction, RequestHandler } from "express";

export function authorizeRoles(...rolesPermitidos: string[]): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        try {
            const userRepository = AppDataSource.getRepository(UserEntity);

            if (!req.user || !req.user.email) {
                return handleErrorClient(res, 401, "No autorizado: token faltante o incompleto");
            }

            const userFound = await userRepository.findOneBy({ email: req.user.email });

            if (!userFound) {
                return handleErrorClient(res, 404, "Usuario no encontrado en la base de datos");
            }

            const rolActual = userFound.role;

            if (!rolesPermitidos.includes(rolActual)) {
                return handleErrorClient(
                    res, 
                    403, 
                    "Acceso denegado: no se tienen permiso",
                    `Se requiere uno de los siguientes roles: ${rolesPermitidos.join(", ")}`
                );
            }

            req.user.rol = rolActual;
            next();
        } catch (error: any) {
            return handleErrorServer(res, 500, "Error en verificación de rol", error.message);
        }
    };
}