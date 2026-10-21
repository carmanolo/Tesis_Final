import fs from "fs";
import { AppDataSource } from "../config/configDb.js";
import { ReunionEntity } from "../entity/reunion.entity.js";
import CarreraEntity from "../entity/carrera.entity.js";
import { isAdminRole } from "../utils/user.utils.js";
import { crearEventoReunion, actualizarEventoReunion, eliminarEventoReunion } from "./googleCalendar.service.js";
const repo = () => AppDataSource.getRepository(ReunionEntity);
export async function createReunionSer(fecha_reunion, descripcion, creadorId, carreraId) {
    try {
        if (!fecha_reunion || !descripcion || !creadorId) {
            return { data: null, error: "Funcion mal llamada" };
        }
        const carreraRepo = AppDataSource.getRepository(CarreraEntity);
        const carrera = await carreraRepo.findOneBy({ id_carrera: carreraId });
        if (!carrera) {
            return { data: null, error: "La carrera especificada no existe" };
        }
        const nueva = repo().create({
            fecha_reunion,
            descripcion,
            creadorId,
            carreraId,
            creador: { id: creadorId },
            carrera: { id_carrera: carreraId },
        });
        const saved = await repo().save(nueva);
        try {
            const eventId = await crearEventoReunion(fecha_reunion, descripcion);
            if (eventId) {
                saved.google_event_id = eventId;
                await repo().save(saved);
            }
        }
        catch (calError) {
            console.error("Error al crear evento de Google Calendar:", calError);
        }
        return { data: saved, error: null };
    }
    catch (error) {
        console.error("Error al crear reunión: ", error);
        return { data: null, error: "Error interno al crear la reunión" };
    }
}
// Devuelve las reuniones de la carrera o todas si es administrador
export async function getReunionesSer(carreraId, role) {
    try {
        const whereCondition = {};
        if (!isAdminRole(role) || carreraId) {
            whereCondition.carreraId = carreraId;
        }
        const reuniones = await repo().find({
            where: Object.keys(whereCondition).length > 0 ? whereCondition : undefined,
            relations: { carrera: true, creador: true },
            order: { fecha_reunion: "DESC" },
        });
        return reuniones;
    }
    catch (error) {
        console.error("error al obtener reuniones: ", error);
        return null;
    }
}
// Devuelve la reunión si pertenece a la carrera del usuario o si es administrador
export async function getReunionSer(id_reunion, carreraId, role) {
    try {
        const whereCondition = { id_reunion };
        if (!isAdminRole(role)) {
            whereCondition.carreraId = carreraId;
        }
        const reunion = await repo().findOne({
            where: whereCondition,
            relations: { carrera: true, creador: true },
        });
        return reunion;
    }
    catch (error) {
        console.error("Error al obtener la reunión", error);
        throw error;
    }
}
export async function patchReunionSer(reunion) {
    try {
        if (!reunion) {
            throw new Error("Funcion mal llamada");
        }
        const savedReunion = await repo().save(reunion);
        if (savedReunion.google_event_id) {
            try {
                await actualizarEventoReunion(savedReunion.google_event_id, savedReunion.fecha_reunion, savedReunion.descripcion);
            }
            catch (calError) {
                console.error("Error al actualizar evento de Google Calendar:", calError);
            }
        }
        return { data: savedReunion, message: "Reunión actualizada con éxito", error: null };
    }
    catch (error) {
        console.error("Error al actualizar reunión", error);
        return { data: null, message: "error interno del servidor" };
    }
}
export async function deleteReunionSer(id_reunion) {
    try {
        const reunion = await repo().findOne({ where: { id_reunion } });
        if (!reunion) {
            return { result: null, message: "reunión no encontrada" };
        }
        // Si tiene un acta asociada, se elimina también el archivo físico
        if (reunion.ruta_archivo && fs.existsSync(reunion.ruta_archivo)) {
            fs.unlinkSync(reunion.ruta_archivo);
        }
        // eliminar recordatorio asociado
        if (reunion.google_event_id) {
            try {
                await eliminarEventoReunion(reunion.google_event_id);
            }
            catch (calError) {
                console.error("Error al eliminar evento de Google Calendar:", calError);
            }
        }
        const result = await repo().delete({ id_reunion: reunion.id_reunion });
        return {
            result,
            message: "reunión eliminada exitosamente"
        };
    }
    catch (error) {
        console.error(error);
        return { result: null, message: "Error al eliminar la reunión" };
    }
}
export async function subirActaSer(id_reunion, file) {
    try {
        const reunion = await repo().findOne({ where: { id_reunion } });
        if (!reunion) {
            // Si la reunión no existe, se elimina el archivo que multer ya guardó en disco
            if (fs.existsSync(file.path))
                fs.unlinkSync(file.path);
            return { data: null, message: "reunión no encontrada" };
        }
        // Si ya existía un acta previa asociada, se reemplaza y se borra la anterior
        if (reunion.ruta_archivo && fs.existsSync(reunion.ruta_archivo)) {
            fs.unlinkSync(reunion.ruta_archivo);
        }
        reunion.nombre_archivo = file.filename;
        reunion.nombre_original = file.originalname;
        reunion.tipo_archivo = file.mimetype;
        reunion.ruta_archivo = file.path;
        reunion.fecha_subida = new Date();
        const savedReunion = await repo().save(reunion);
        return { data: savedReunion, message: "Acta subida exitosamente" };
    }
    catch (error) {
        console.error("Error al subir el acta", error);
        if (file?.path && fs.existsSync(file.path))
            fs.unlinkSync(file.path);
        return { data: null, message: "Error interno del servidor" };
    }
}
export async function obtenerActaSer(id_reunion) {
    try {
        const reunion = await repo().findOne({ where: { id_reunion } });
        if (!reunion || !reunion.ruta_archivo) {
            return { data: null, message: "acta no encontrada" };
        }
        if (!fs.existsSync(reunion.ruta_archivo)) {
            return { data: null, message: "el archivo del acta no existe en el servidor" };
        }
        return {
            data: {
                ruta_archivo: reunion.ruta_archivo,
                nombre_original: reunion.nombre_original,
                tipo_archivo: reunion.tipo_archivo
            },
            message: "acta encontrada"
        };
    }
    catch (error) {
        console.error("Error al obtener el acta", error);
        return { data: null, message: "Error interno del servidor" };
    }
}
