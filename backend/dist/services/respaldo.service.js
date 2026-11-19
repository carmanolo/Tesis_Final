import { AppDataSource } from "../config/configDb.js";
import RespaldoEntity from "../entity/respaldo.entity.js";
import CarreraEntity from "../entity/carrera.entity.js";
import CompromisoEntity from "../entity/compromiso.entity.js";
import { isAdminRole } from "../utils/respaldo.utils.js";
const repo = () => AppDataSource.getRepository(RespaldoEntity);
const withTitulo = (pub) => {
    if (!pub)
        return pub;
    return {
        ...pub,
        titulo: pub.compromiso?.descripcion_compromiso ?? "",
    };
};
export async function createRespaldoSer(compromisoId, descripcion, imagenes, creadorId, carreraId) {
    try {
        const carreraRepo = AppDataSource.getRepository(CarreraEntity);
        const carrera = await carreraRepo.findOneBy({ id_carrera: carreraId });
        if (!carrera) {
            return { data: null, error: "La carrera especificada no existe" };
        }
        const compromisoRepo = AppDataSource.getRepository(CompromisoEntity);
        const compromiso = await compromisoRepo.findOneBy({ id_compromiso: compromisoId });
        if (!compromiso) {
            return { data: null, error: "El compromiso especificado no existe" };
        }
        const nueva = repo().create({
            compromisoId,
            descripcion,
            imagenes,
            creadorId,
            carreraId,
            creador: { id: creadorId },
            carrera: { id_carrera: carreraId },
            compromiso: { id_compromiso: compromisoId },
        });
        const saved = await repo().save(nueva);
        const completada = await repo().findOne({
            where: { id_respaldo: saved.id_respaldo },
            relations: { carrera: true, creador: true, compromiso: true },
        });
        return { data: withTitulo(completada ?? saved), error: null };
    }
    catch (error) {
        console.error("Error al crear el respaldo:", error);
        return { data: null, error: "Error interno al crear el respaldo" };
    }
}
// Devuelve los respaldo de la carrera
export async function getRespaldosSer(carreraId, role) {
    try {
        if (!isAdminRole(role) && !carreraId)
            return [];
        const whereCondition = {};
        if (!isAdminRole(role) || carreraId) {
            whereCondition.carreraId = carreraId;
        }
        const respaldos = await repo().find({
            where: Object.keys(whereCondition).length > 0 ? whereCondition : undefined,
            relations: { carrera: true, creador: true, compromiso: true },
            order: { createdAt: "DESC" },
        });
        return respaldos.map(withTitulo);
    }
    catch (error) {
        console.error("error al obtener Respaldos: ", error);
        return null;
    }
}
// Devuelve el Respaldo si pertenece a la carrera
export async function getRespaldoSer(id_respaldo, carreraId, role) {
    try {
        const whereCondition = { id_respaldo };
        if (!isAdminRole(role)) {
            if (!carreraId)
                return null;
            whereCondition.carreraId = carreraId;
        }
        const respaldo = await repo().findOne({
            where: whereCondition,
            relations: { carrera: true, creador: true, compromiso: true },
        });
        return respaldo ? withTitulo(respaldo) : null;
    }
    catch (error) {
        console.error("Error al obtener el respaldo", error);
        throw error;
    }
}
export async function patchRespaldoSer(respaldo) {
    try {
        const saved = await repo().save(respaldo);
        const completada = await repo().findOne({
            where: { id_respaldo: saved.id_respaldo },
            relations: { carrera: true, creador: true, compromiso: true },
        });
        return {
            data: withTitulo(completada ?? saved),
            message: "Respaldo actualizado con éxito",
        };
    }
    catch (error) {
        console.error("Error al actualizar respaldo", error);
        return { data: null, message: "Error interno del servidor" };
    }
}
export async function deleteRespaldoSer(id_respaldo) {
    try {
        const result = await repo().delete({ id_respaldo });
        return { result, message: "Respaldo eliminado exitosamente" };
    }
    catch (error) {
        console.error(error);
        return { result: null, message: "Error al eliminar el respaldo" };
    }
}
