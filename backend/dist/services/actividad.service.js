import { AppDataSource } from "../config/configDb.js";
import ActividadEntity from "../entity/actividad.entity.js";
import CarreraEntity from "../entity/carrera.entity.js";
const repo = () => AppDataSource.getRepository(ActividadEntity);
const isAdminRole = (role) => {
    const r = role?.toLowerCase();
    return r === "admin" || r === "administrador";
};
export async function createActividadSer(creadorId, carreraId, nombre_actividad, fecha_actividad, procedencia, monto) {
    try {
        const carreraRepo = AppDataSource.getRepository(CarreraEntity);
        const carrera = await carreraRepo.findOneBy({ id_carrera: carreraId });
        if (!carrera) {
            return { data: null, error: "La carrera especificada no existe" };
        }
        const nueva = repo().create({
            nombre_actividad,
            fecha_actividad,
            procedencia,
            monto,
            creadorId,
            carreraId,
            creador: { id: creadorId },
            carrera: { id_carrera: carreraId },
        });
        const saved = await repo().save(nueva);
        return { data: saved, error: null };
    }
    catch (error) {
        console.error(error);
        return { data: null, error: "Error interno al crear la actividad" };
    }
}
// Devuelve las actividades de la carrera o todas si es administrador
export async function getActividadesSer(carreraId, role) {
    try {
        const whereCondition = {};
        if (!isAdminRole(role) || carreraId) {
            whereCondition.carreraId = carreraId;
        }
        const actividades = await repo().find({
            where: Object.keys(whereCondition).length > 0 ? whereCondition : undefined,
            relations: { carrera: true, creador: true },
            order: { fecha_actividad: "DESC" },
        });
        return actividades;
    }
    catch (error) {
        console.error("error al obtener actividades: ", error);
        return null;
    }
}
// Devuelve la actividad si pertenece a la carrera del usuario o si es administrador
export async function getActividadSer(id_actividad, carreraId, role) {
    try {
        const whereCondition = { id_actividad };
        if (!isAdminRole(role)) {
            whereCondition.carreraId = carreraId;
        }
        const actividad = await repo().findOne({
            where: whereCondition,
            relations: { carrera: true, creador: true },
        });
        return actividad;
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
