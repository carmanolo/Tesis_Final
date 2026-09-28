import { AppDataSource } from "../config/configDb.js";
import UserEntity from "../entity/user.entity.js";
import { encryptPassword } from "../helpers/bcrypt.helper.js";
export async function createUserSer(username, email, password, role, carreraId) {
    const userRepository = AppDataSource.getRepository(UserEntity);
    try {
        if (!username || !email || !password || !role || !carreraId) {
            throw new Error("Funcion mal llamada");
        }
        console.log(carreraId);
        const existingEmail = await userRepository.findOne({ where: { email } });
        if (existingEmail) {
            return { data: null, error: "Ya existe un usuario con ese correo electrónico" };
        }
        const existingUsername = await userRepository.findOne({ where: { username } });
        if (existingUsername) {
            return { data: null, error: "Ya existe un usuario con ese nombre de usuario" };
        }
        const newUser = userRepository.create({
            username,
            email,
            password,
            role,
            carreraId
        });
        newUser.password = await encryptPassword(newUser.password);
        await userRepository.save(newUser);
        // Asignamos undefined asegurando que sea compatible con el tipo string de la entidad si es requerido
        newUser.password = undefined;
        return { data: newUser, error: null };
    }
    catch (error) {
        console.error(error);
        const isDuplicate = error?.code === "23505" || error?.code === "ER_DUP_ENTRY" || String(error?.message).includes("duplicate key") || String(error?.message).includes("UNIQUE");
        if (isDuplicate) {
            const detail = (error?.detail || error?.sqlMessage || error?.message || "").toLowerCase();
            let campo = "usuario";
            if (detail.includes("username") || detail.includes("nombre"))
                campo = "nombre de usuario";
            else if (detail.includes("email") || detail.includes("correo"))
                campo = "correo electrónico";
            return { data: null, error: `Ya existe un usuario con ese ${campo}` };
        }
        return { data: null, error: "Error interno al crear el usuario" };
    }
}
export async function getUsersSer() {
    try {
        const userRepository = AppDataSource.getRepository(UserEntity);
        const users = await userRepository.find({ relations: { carreras: true } });
        if (!users || users.length === 0)
            return { message: "Arreglo vacío" };
        return [users, null];
    }
    catch (error) {
        console.error("error al obtener usuarios: ", error);
        return null;
    }
}
export async function getUserSer(id) {
    try {
        const userRepository = AppDataSource.getRepository(UserEntity);
        const user = await userRepository.findOne({
            where: { id: id },
            relations: { carreras: true }
        });
        return user;
    }
    catch (error) {
        console.error("Error al obtener la user", error);
        return [null, "Error interno del servidor"];
    }
}
export async function patchUserSer(user) {
    const userRepository = AppDataSource.getRepository(UserEntity);
    try {
        if (!user || !user.id) {
            throw new Error("Funcion mal llamada");
        }
        if (user.email) {
            const existingEmail = await userRepository.findOne({
                where: { email: user.email }
            });
            if (existingEmail && Number(existingEmail.id) !== Number(user.id)) {
                return { data: null, message: "Ya existe un usuario con ese correo electrónico", error: "Ya existe un usuario con ese correo electrónico" };
            }
        }
        if (user.username) {
            const existingUsername = await userRepository.findOne({
                where: { username: user.username }
            });
            if (existingUsername && Number(existingUsername.id) !== Number(user.id)) {
                return { data: null, message: "Ya existe un usuario con ese nombre de usuario", error: "Ya existe un usuario con ese nombre de usuario" };
            }
        }
        await userRepository.save(user);
        const savedUser = await userRepository.findOne({
            where: { id: user.id },
            relations: { carreras: true }
        });
        if (savedUser && savedUser.password) {
            delete savedUser.password;
        }
        return { data: savedUser, message: "Usuario actualizado con éxito", error: null };
    }
    catch (error) {
        console.error("Error al actualizar el usuario", error);
        const isDuplicate = error?.code === "23505" || error?.code === "ER_DUP_ENTRY" || String(error?.message).includes("duplicate key") || String(error?.message).includes("UNIQUE");
        if (isDuplicate) {
            const detail = (error?.detail || error?.sqlMessage || error?.message || "").toLowerCase();
            let campo = "usuario";
            if (detail.includes("username") || detail.includes("nombre"))
                campo = "nombre de usuario";
            else if (detail.includes("email") || detail.includes("correo"))
                campo = "correo electrónico";
            return { data: null, message: `Ya existe un usuario con ese ${campo}`, error: `Ya existe un usuario con ese ${campo}` };
        }
        return { data: null, message: "Error interno del servidor", error: error?.message };
    }
}
export async function deleteUserSer(id) {
    try {
        const userRepository = AppDataSource.getRepository(UserEntity);
        const user = await userRepository.findOne({ where: { id: id }, relations: { carreras: true } });
        if (!user) {
            return { result: null, message: "usuario no encontrado" };
        }
        return {
            result: await userRepository.delete({ id: user.id }),
            message: "user eliminado exitosamente"
        };
    }
    catch (error) {
        console.error(error);
        return { result: null, message: "Error al eliminar el usuario" };
    }
}
