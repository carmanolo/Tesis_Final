import { AppDataSource } from "../config/configDb.js";
import UserEntity from "../entity/user.entity.js";
import { encryptPassword } from "../helpers/bcrypt.helper.js";

export async function createUserSer(
    username: string,
    email: string,
    password: string,
    rol: string
): Promise<any | null>  {
    const userRepository = AppDataSource.getRepository(UserEntity as any);

    try {
        if (!username || !email || !password || !rol) {
            throw new Error("Funcion mal llamada");
        }

        const newUser = userRepository.create({
            username,
            email,
            password,
            rol,
        });

        newUser.password = await encryptPassword(newUser.password);
        await userRepository.save(newUser);
        
        // Asignamos undefined asegurando que sea compatible con el tipo string de la entidad si es requerido
        (newUser.password as string | undefined) = undefined;
        return newUser;
    } catch (error) {
        console.error(error);
        return null;
    }
}

export async function getUsersSer(): Promise<any> {
    try {
        const userRepository = AppDataSource.getRepository(UserEntity as any);
        const users = await userRepository.find();
        
        if (!users || users.length === 0) return { message: "Arreglo vacío" };
        return [users, null];
    } catch (error) {
        console.error("error al obtener usuarios: ", error);
        return null;
    }
}

export async function getUserSer(id: number): Promise<any> {
    try {
        const userRepository = AppDataSource.getRepository(UserEntity as any);
        const user = await userRepository.findOne({
            where: { id: id },
        });
        return user;
    } catch (error) {
        console.error("Error al obtener la user", error);
        return [null, "Error interno del servidor"];
    }
}

export async function patchUserSer(user: Partial<any>): Promise<any> {
    const userRepository = AppDataSource.getRepository(UserEntity as any);
    try {
        if (!user) {
            throw new Error("Funcion mal llamada");
        }
        
        const savedUser = await userRepository.save(user as any);

        return { data: savedUser, message: "Usuario actualizado por exito", error: null };
    } catch (error) {
        console.error("Error al actualizar el usuario", error);
        return { data: 500, message: "error interno del servidor" };
    }
}
export async function deleteUserSer(id: number): Promise<any> {
    try {
        const userRepository = AppDataSource.getRepository(UserEntity);
        const user = await userRepository.findOne({ where: { id: id } });

        if (!user) {
            return { result: null, message: "usuario no encontrado" };
        }

        return {
            result: await userRepository.delete({ id: user.id }),
            message: "user eliminado exitosamente"
        };
    } catch (error) {
        console.error(error);
        return { result: null, message: "Error al eliminar el usuario" };
    }
}