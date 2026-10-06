import { AppDataSource } from "../config/configDb.js";
import AporteEntity from "../entity/aporte.entity.js";
import CarreraEntity from "../entity/carrera.entity.js";

const repo = () => AppDataSource.getRepository(AporteEntity as any);

const isAdminRole = (role?: string) => {
    const r = role?.toLowerCase();
    return r === "admin" || r === "administrador";
};

export async function createAporteSer(
    creadorId: number,
    carreraId: number,
    descripcion: string,
    fecha_recepcion: Date,
    procedencia: string,
    monto: number
): Promise<{ data: any | null; error: string | null }> {
    try {
        const carreraRepo = AppDataSource.getRepository(CarreraEntity as any);
        const carrera = await carreraRepo.findOneBy({ id_carrera: carreraId });

        if (!carrera) {
            return { data: null, error: "La carrera especificada no existe" };
        }

        const nueva = repo().create({
            descripcion,
            fecha_recepcion,
            procedencia,
            monto,
            creadorId,
            carreraId,
            creador: { id: creadorId },
            carrera: { id_carrera: carreraId },
        });

        const saved = await repo().save(nueva);
        return { data: saved, error: null };
    } catch (error) {
        console.error(error);
        return { data: null, error: "Error interno al crear el Aporte" };
    }
}

// Devuelve las Aportes de la carrera o todas si es administrador
export async function getAportesSer(carreraId?: number, role?: string): Promise<any[] | null> {
    try {
        const whereCondition: any = {};
        if (!isAdminRole(role) || carreraId) {
            whereCondition.carreraId = carreraId;
        }

        const Aportes = await repo().find({
            where: Object.keys(whereCondition).length > 0 ? whereCondition : undefined,
            relations: { carrera: true, creador: true },
            order: { fecha_Aporte: "DESC" },
        });
        return Aportes;
    } catch (error) {
        console.error("error al obtener Aportees: ", error);
        return null;
    }
}

// Devuelve la Aporte si pertenece a la carrera del usuario o si es administrador
export async function getAporteSer(id_aporte: number, carreraId?: number, role?: string): Promise<any | null> {
    try {
        const whereCondition: any = { id_aporte };
        if (!isAdminRole(role)) {
            whereCondition.carreraId = carreraId;
        }

        const Aporte = await repo().findOne({
            where: whereCondition,
            relations: { carrera: true, creador: true },
        });
        return Aporte;
    } catch (error) {
        console.error("Error al obtener el Aporte", error);
        throw error;
    }
}

export async function patchAporteSer(aporte: any): Promise<any> {
    try {
        const saved = await repo().save(aporte);
        return { data: saved, message: "Aporte actualizado con éxito" };
    } catch (error) {
        console.error("Error al actualizar Aporte", error);
        return { data: null, message: "Error interno del servidor" };
    }
}

export async function deleteAporteSer(id_aporte: number): Promise<any> {
    try {
        const result = await repo().delete({ id_aporte });
        return { result, message: "Aporte eliminado exitosamente" };
    } catch (error) {
        console.error(error);
        return { result: null, message: "Error al eliminar el aporte" };
    }
}