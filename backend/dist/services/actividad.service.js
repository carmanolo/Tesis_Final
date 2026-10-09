import { AppDataSource } from "../config/configDb.js";
import AporteEntity from "../entity/Aporte.entity.js";
import CarreraEntity from "../entity/carrera.entity.js";
const repo = () => AppDataSource.getRepository(AporteEntity);
const isAdminRole = (role) => {
    const r = role?.toLowerCase();
    return r === "admin" || r === "administrador";
};
export async function createAporteSer(creadorId, carreraId, nombre_Aporte, fecha_Aporte, procedencia, monto) {
    try {
        const carreraRepo = AppDataSource.getRepository(CarreraEntity);
        const carrera = await carreraRepo.findOneBy({ id_carrera: carreraId });
        if (!carrera) {
            return { data: null, error: "La carrera especificada no existe" };
        }
        const nueva = repo().create({
            nombre_Aporte,
            fecha_Aporte,
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
        return { data: null, error: "Error interno al crear la Aporte" };
    }
}
// Devuelve las Aportees de la carrera o todas si es administrador
export async function getAporteesSer(carreraId, role) {
    try {
        const whereCondition = {};
        if (!isAdminRole(role) || carreraId) {
            whereCondition.carreraId = carreraId;
        }
        const Aportees = await repo().find({
            where: Object.keys(whereCondition).length > 0 ? whereCondition : undefined,
            relations: { carrera: true, creador: true },
            order: { fecha_Aporte: "DESC" },
        });
        return Aportees;
    }
    catch (error) {
        console.error("error al obtener Aportees: ", error);
        return null;
    }
}
// Devuelve la Aporte si pertenece a la carrera del usuario o si es administrador
export async function getAporteSer(id_Aporte, carreraId, role) {
    try {
        const whereCondition = { id_Aporte };
        if (!isAdminRole(role)) {
            whereCondition.carreraId = carreraId;
        }
        const Aporte = await repo().findOne({
            where: whereCondition,
            relations: { carrera: true, creador: true },
        });
        return Aporte;
    }
    catch (error) {
        console.error("Error al obtener la Aporte", error);
        throw error;
    }
}
export async function patchAporteSer(Aporte) {
    try {
        const saved = await repo().save(Aporte);
        return { data: saved, message: "Aporte actualizada con éxito" };
    }
    catch (error) {
        console.error("Error al actualizar Aporte", error);
        return { data: null, message: "Error interno del servidor" };
    }
}
export async function deleteAporteSer(id_Aporte) {
    try {
        const result = await repo().delete({ id_Aporte });
        return { result, message: "Aporte eliminada exitosamente" };
    }
    catch (error) {
        console.error(error);
        return { result: null, message: "Error al eliminar la Aporte" };
    }
}
