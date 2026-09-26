import UserEntity from "../entity/user.entity.js";
import { AppDataSource } from "../config/configDb.js";
import { handleErrorClient, handleErrorServer } from "../handlers/responseHandlers.js";
export function authorizeRoles(...rolesPermitidos) {
    return async (req, res, next) => {
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
                return handleErrorClient(res, 403, "Acceso denegado: no se tienen permiso", `Se requiere uno de los siguientes roles: ${rolesPermitidos.join(", ")}`);
            }
            req.user.rol = rolActual;
            next();
        }
        catch (error) {
            return handleErrorServer(res, 500, "Error en verificación de rol", error.message);
        }
    };
}
