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
