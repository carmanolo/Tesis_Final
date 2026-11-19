import nodemailer from "nodemailer";
import { MAIL_USER, MAIL_APP_PASSWORD } from "../config/configEnv.js";
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: MAIL_USER, pass: MAIL_APP_PASSWORD },
});
export async function enviarCorreo(to, subject, text) {
    try {
        await transporter.sendMail({
            from: `"Recordatorios" <${MAIL_USER}>`,
            to, subject, text,
        });
        return true;
    }
    catch (error) {
        console.error(`Error al enviar correo a ${to}`, error);
        return false;
    }
}
// NUEVO: correo de confirmación de registro para miembros del CEE
export async function enviarCorreoRegistroCEE(to, nombre, cargo) {
    return enviarCorreo(to, "Registro exitoso en el CEE", `El alumno ${nombre} se ha registrado exitosamente como ${cargo} del CEE.`);
}
export async function enviarCorreoRecuperacion(to, nombre, codigo, minutos) {
    return enviarCorreo(to, "Código de recuperación de contraseña", `Hola ${nombre},

El administrador aprobó tu solicitud de recuperación de cuenta.

Tu código de recuperación es: ${codigo}

Vence en ${minutos} minutos. Ingresa a la pantalla de inicio de sesión, elige "¿Olvidaste tu contraseña?" > "Ya tengo un código" y escribe tu correo, este código y tu clave nueva.

Si no solicitaste este cambio, ignora este mensaje.

Centro de Estudiantes.`);
}
