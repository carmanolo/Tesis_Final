import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_APP_PASSWORD },
});

export async function enviarCorreo(to: string, subject: string, text: string): Promise<boolean> {
    try {
        await transporter.sendMail({
            from: `"Recordatorios" <${process.env.MAIL_USER}>`,
            to, subject, text,
        });
        return true;
    } catch (error) {
        console.error(`Error al enviar correo a ${to}`, error);
        return false;
    }
}