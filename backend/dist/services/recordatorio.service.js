import cron from "node-cron";
import { LessThan } from "typeorm";
import { AppDataSource } from "../config/configDb.js";
import { ReunionEntity } from "../entity/reunion.entity.js";
import { UserEntity } from "../entity/user.entity.js";
import PrestamoEntity from "../entity/prestamo.entity.js";
import MaterialEntity from "../entity/material.entity.js";
import { enviarCorreo } from "./mail.service.js";
import { TZ } from "../constants/ajustes.constants.js";
function fechaDeManana() {
    const hoy = new Date().toLocaleDateString("en-CA", { timeZone: TZ });
    const d = new Date(`${hoy}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
}
function fechaHoyChile() {
    return new Date().toLocaleDateString("en-CA", { timeZone: TZ });
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
/**
 * Revisa préstamos activos cuyo día de préstamo ya pasó (más de 1 día de préstamo transcurrido).
 * 1. Cambia el estado del préstamo a "pendiente".
 * 2. Cambia el estado del material a "pendiente".
 * 3. Notifica por correo al estudiante con su nombre y el material que debe.
 */
export async function verificarPrestamosVencidos() {
    try {
        const prestamoRepo = AppDataSource.getRepository(PrestamoEntity);
        const materialRepo = AppDataSource.getRepository(MaterialEntity);
        const userRepo = AppDataSource.getRepository(UserEntity);
        const hoy = fechaHoyChile();
        // Buscar préstamos en estado "prestado" cuya fecha_prestamo sea anterior a hoy
        const prestamosVencidos = await prestamoRepo.find({
            where: {
                estado_prestamo: "prestado",
                fecha_prestamo: LessThan(hoy),
            },
            relations: { material: true },
        });
        if (!prestamosVencidos.length) {
            return;
        }
        console.log(`[Cron Préstamos] Se encontraron ${prestamosVencidos.length} préstamo(s) con más de 1 día sin devolver.`);
        for (const prestamo of prestamosVencidos) {
            // 1. Cambiar estado del préstamo a 'pendiente'
            prestamo.estado_prestamo = "pendiente";
            await prestamoRepo.save(prestamo);
            // 2. Cambiar estado del material asociado a 'pendiente' si aún no está devuelto
            if (prestamo.material) {
                prestamo.material.estado_prestamo = "pendiente";
                await materialRepo.save(prestamo.material);
            }
            const nombreEstudiante = prestamo.prestatario;
            const nombreMaterial = prestamo.material?.nombre_material || "Material del Centro de Estudiantes";
            // 3. Buscar al estudiante en la base de datos por nombre de usuario o coincidencia de nombre
            const estudiante = await userRepo.findOne({
                where: { username: nombreEstudiante },
                select: { id: true, email: true, username: true },
            });
            if (estudiante && estudiante.email) {
                const asunto = "Notificación: Préstamo de material pendiente de devolución";
                const mensaje = `Estimado/a ${estudiante.username},

Le informamos que ha transcurrido el plazo de devolución para el siguiente material prestado por el Centro de Estudiantes:

Material: ${nombreMaterial}
Estado actual: PENDIENTE

Por favor, acérquese a la brevedad a devolver el material para liberar su estado y retirar su garantía/TNE.

Saludos cordiales,
Centro de Estudiantes.`;
                await enviarCorreo(estudiante.email, asunto, mensaje);
                console.log(`[Cron Préstamos] Correo de notificación enviado a ${estudiante.email} por material "${nombreMaterial}".`);
            }
            else {
                console.warn(`[Cron Préstamos] No se encontró correo para el estudiante "${nombreEstudiante}". Préstamo actualizado a pendiente.`);
            }
        }
    }
    catch (error) {
        console.error("Error al verificar préstamos vencidos en cron: ", error);
    }
}
export function iniciarCronRecordatorios() {
    // 1. Recordatorio diario de reuniones a las 10:00 AM
    cron.schedule("0 10 * * *", () => {
        enviarRecordatoriosDeManana().catch((e) => console.error("Error en cron de recordatorios de reuniones", e));
    }, { timezone: TZ });
    // 2. Verificación de préstamos vencidos (se ejecuta a las 08:00 AM y a las 18:00 PM todos los días)
    cron.schedule("0 11,18 * * *", () => {
        verificarPrestamosVencidos().catch((e) => console.error("Error en cron de préstamos vencidos", e));
    }, { timezone: TZ });
    // Ejecución inicial al levantar el servidor para actualizar préstamos pendientes de inmediato
    verificarPrestamosVencidos().catch((e) => console.error("Error en verificación inicial de préstamos", e));
}
