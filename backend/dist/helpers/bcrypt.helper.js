import bcrypt from "bcrypt";
export async function encryptPassword(password) {
    try {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    }
    catch (error) {
        console.error("Error en bcrypt.helper.ts -> encryptPassword(): ", error);
        throw new Error("Error al encriptar la contraseña");
    }
}
export async function comparePassword(password, receivedPassword) {
    try {
        return await bcrypt.compare(password, receivedPassword);
    }
    catch (error) {
        console.error("Error en bcrypt.helper.ts -> comparePassword(): ", error);
        throw new Error("Error al comparar las contraseñas");
    }
}
