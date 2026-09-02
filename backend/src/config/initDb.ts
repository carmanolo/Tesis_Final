import User from "../entity/user.entity.js";
import { AppDataSource } from "../config/configDb.js";
import { encryptPassword } from "../helpers/bcrypt.helper.js";

export async function createUsers(): Promise<void> {
    try {
        const userRepository = AppDataSource.getRepository(User);

        const count = await userRepository.count();
        if (count > 0) return;

        const users = [
            {
                username: "Rodrigo",
                rut: "12345678-9",
                email: "admin@gmail.com",
                password: await encryptPassword("admin123"),
                role: "administrador"
            },
            {
                username: "JuanitoPerez" ,
                rut: "98765432-1",
                email: "mailto@gmail.com",
                password: await encryptPassword("estudiante123"),
                role: "presidente cee"
            }
        ];

        console.log("Creando usuarios...");

        for (const user of users) {
            await userRepository.save(
                userRepository.create(user)
            );
            console.log(`Usuario '${user.username}' creado exitosamente.`);
        }
    } catch (error) {
        console.error("Error al crear usuarios: ", error);
        process.exit(1);
    }
}