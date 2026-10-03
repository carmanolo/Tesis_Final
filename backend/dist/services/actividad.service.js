import { In } from "typeorm";
import { AppDataSource } from "../config/configDb.js";
import ActividadEntity from "../entity/actividad.entity.js";
import CarreraEntity from "../entity/carrera.entity.js";
const repo = () => AppDataSource.getRepository(ActividadEntity);
// ¿Puede este usuario ver esta actividad?
const puedeVer = (actividad, carreraId, role) => role === "admin" || actividad.carreras?.some((c) => c.id_carrera === carreraId);
export async function createActividadSer(creadorId, nombre_actividad, fecha_actividad, procedencia, monto, carrerasIds) {
    try {
        const carreras = await AppDataSource.getRepository(CarreraEntity)
            .findBy({ id_carrera: In(carrerasIds) });
        if (carreras.length !== carrerasIds.length) {
            return { data: null, error: "Alguna de las carreras no existe" };
        }
        const nueva = repo().create({
            nombre_actividad, fecha_actividad, procedencia, monto,
            creador: { id: creadorId },
            carreras,
        });
        return { data: await repo().save(nueva), error: null };
    }
    catch (error) {
        console.error(error);
        return { data: null, error: "Error interno al crear la actividad" };
    }
}
// Solo devuelve las actividades que incluyen la carrera del usuario
export async function getActividadesSer(carreraId, role) {
    try {
        const actividades = await repo().find({ relations: { carreras: true } });
        return actividades.filter((a) => puedeVer(a, carreraId, role));
    }
    catch (error) {
        console.error("error al obtener actividades: ", error);
        return null;
    }
}
// Si existe pero no es de su carrera, devuelve null (igual que si no existiera)
export async function getActividadSer(id_actividad, carreraId, role) {
    try {
        const actividad = await repo().findOne({
            where: { id_actividad },
            relations: { carreras: true },
        });
        return actividad && puedeVer(actividad, carreraId, role) ? actividad : null;
    }
    catch (error) {
        console.error("Error al obtener la actividad", error);
        throw error;
    }
}
export async function patchActividadSer(actividad) {
    try {
        const saved = await repo().save(actividad);
        return { data: saved, message: "Actividad actualizada con éxito" };
    }
    catch (error) {
        console.error("Error al actualizar actividad", error);
        return { data: null, message: "Error interno del servidor" };
    }
}
export async function deleteActividadSer(id_actividad) {
    try {
        const result = await repo().delete({ id_actividad });
        return { result, message: "Actividad eliminada exitosamente" };
    }
    catch (error) {
        console.error(error);
        return { result: null, message: "Error al eliminar la actividad" };
    }
}
