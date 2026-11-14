import { AppDataSource } from "../config/configDb.js";
import PublicacionEntity from "../entity/publicacion.entity.js";
import CarreraEntity from "../entity/carrera.entity.js";
import CompromisoEntity from "../entity/compromiso.entity.js";
import { isAdminRole } from "../utils/publicacion.utils.js";

const repo = () => AppDataSource.getRepository(PublicacionEntity as any);

const withTitulo = (pub: any) => {
    if (!pub) return pub;
    return {
        ...pub,
        titulo: pub.compromiso?.descripcion_compromiso ?? "",
    };
};

export async function createPublicacionSer(
    compromisoId: number,
    descripcion: string,
    imagenes: string[],
    creadorId: number,
    carreraId: number,
): Promise<{ data: any | null; error: string | null }> {
    try {
        const carreraRepo = AppDataSource.getRepository(CarreraEntity as any);
        const carrera = await carreraRepo.findOneBy({ id_carrera: carreraId });

        if (!carrera) {
            return { data: null, error: "La carrera especificada no existe" };
        }

        const compromisoRepo = AppDataSource.getRepository(CompromisoEntity as any);
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
            where: { id_publicacion: saved.id_publicacion },
            relations: { carrera: true, creador: true, compromiso: true },
        });

        return { data: withTitulo(completada ?? saved), error: null };
    } catch (error) {
        console.error("Error al crear la Publicación:", error);
        return { data: null, error: "Error interno al crear la Publicación" };
    }
}

// Devuelve las Publicaciones de la carrera o todas si es administrador
export async function getPublicacionesSer(carreraId?: number, role?: string): Promise<any[] | null> {
    try {
        if (!isAdminRole(role) && !carreraId) return [];

        const whereCondition: any = {};
        if (!isAdminRole(role) || carreraId) {
            whereCondition.carreraId = carreraId;
        }

        const publicaciones = await repo().find({
            where: Object.keys(whereCondition).length > 0 ? whereCondition : undefined,
            relations: { carrera: true, creador: true, compromiso: true },
            order: { createdAt: "DESC" },
        });

        return publicaciones.map(withTitulo);
    } catch (error) {
        console.error("error al obtener Publicaciones: ", error);
        return null;
    }
}

// Devuelve la Publicación si pertenece a la carrera
export async function getPublicacionSer(id_publicacion: number, carreraId?: number, role?: string): Promise<any | null> {
    try {
        const whereCondition: any = { id_publicacion };
        if (!isAdminRole(role)) {
            if (!carreraId) return null;
            whereCondition.carreraId = carreraId;
        }

        const publicacion = await repo().findOne({
            where: whereCondition,
            relations: { carrera: true, creador: true, compromiso: true },
        });

        return publicacion ? withTitulo(publicacion) : null;
    } catch (error) {
        console.error("Error al obtener la Publicación", error);
        throw error;
    }
}

export async function patchPublicacionSer(publicacion: any): Promise<any> {
    try {
        const saved = await repo().save(publicacion);
        const completada = await repo().findOne({
            where: { id_publicacion: saved.id_publicacion },
            relations: { carrera: true, creador: true, compromiso: true },
        });

        return {
            data: withTitulo(completada ?? saved),
            message: "Publicación actualizada con éxito",
        };
    } catch (error) {
        console.error("Error al actualizar Publicación", error);
        return { data: null, message: "Error interno del servidor" };
    }
}

export async function deletePublicacionSer(id_publicacion: number): Promise<any> {
    try {
        const result = await repo().delete({ id_publicacion });
        return { result, message: "Publicación eliminada exitosamente" };
    } catch (error) {
        console.error(error);
        return { result: null, message: "Error al eliminar la publicación" };
    }
}
