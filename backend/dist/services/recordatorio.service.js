import cron from "node-cron";
import { AppDataSource } from "../config/configDb.js";
import { ReunionEntity } from "../entity/reunion.entity.js";
import { UserEntity } from "../entity/user.entity.js";
import { enviarCorreo } from "./mail.service.js";
import { TZ } from "../constants/ajustes.constants.js";
function fechaDeManana() {
    const hoy = new Date().toLocaleDateString("en-CA", { timeZone: TZ });
    const d = new Date(`${hoy}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
}
export async function enviarRecordatoriosDeManana() {
    const reunionRepo = AppDataSource.getRepository(ReunionEntity);
    const userRepo = AppDataSource.getRepository(UserEntity);
    const reuniones = await reunionRepo.find({
        where: { fecha_reunion: fechaDeManana(), recordatorio_enviado: false }
    });
    for (const reunion of reuniones) {
        if (!reunion.carreraId)
            continue;
        const estudiantes = await userRepo.find({
            where: { carreraId: reunion.carreraId },
            select: { id: true, email: true, username: true },
        });
        for (const est of estudiantes) {
            await enviarCorreo(est.email, "Recordatorio: reunión mañana", `Hola ${est.username}, mañana tienes una reunión: ${reunion.descripcion}`);
        }
        reunion.recordatorio_enviado = true;
        await reunionRepo.save(reunion);
    }
}
export function iniciarCronRecordatorios() {
    cron.schedule("0 10 * * *", () => {
        enviarRecordatoriosDeManana().catch((e) => console.error("Error en cron de recordatorios", e));
    }, { timezone: TZ });
}
