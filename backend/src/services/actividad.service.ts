import { AppDataSource } from "../config/configDb.js";
import ActividadEntity from "../entity/actividad.entity.js";


export async function createActividadSer(
    nombre_actividad: String,
    fecha_actividad: Date,
    procedencia: string,
    monto: number
): Promise<{ data: any | null; error: string | null }>  {
    const actividadRepository = AppDataSource.getRepository(ActividadEntity as any);

    try {
        if (!nombre_actividad || !fecha_actividad || !procedencia || !monto ) {
            throw new Error("Funcion mal llamada");
        }

        const newActividad = actividadRepository.create({
            nombre_actividad,
            fecha_actividad,
            procedencia,
            monto,
        });

        return { data: newActividad, error: null };
    } catch (error: any) {
        console.error(error);
        return { data: null, error: "Error interno al crear la actividad" };
    }
}

export async function getActividadesSer(): Promise<any> {
    try {
        const actividadRepository = AppDataSource.getRepository(ActividadEntity as any);
        const actividades = await actividadRepository.find({relations: {users: true}});
        
        if (!actividades || actividades.length === 0) return { message: "no hay aportes registrados" };
        return [actividades, null];
    } catch (error) {
        console.error("error al obtener actividades: ", error);
        return null;
    }
}

export async function getActividadSer(id_actividad: number): Promise<any> {
    try {
        const actividadRepository = AppDataSource.getRepository(ActividadEntity as any);
        const actividad = await actividadRepository.findOne({
            where: { id_actividad: id_actividad },
            relations: {carreras:true}
        });
        return actividad;
    } catch (error) {
        console.error("Error al obtener la actividad", error);
        return [null, "Error interno del servidor"];
    }
}

export async function patchActividadSer(actividad: Partial<any>): Promise<any> {
    const actividadRepository = AppDataSource.getRepository(ActividadEntity as any);
    try {
        if (!actividad) {
            throw new Error("Funcion mal llamada");
        }

        const savedActividad = await actividadRepository.save(actividad as any);

        return { data: savedActividad, message: "Actividad actualizada con éxito", error: null };
    } catch (error) {
        console.error("Error al actualizar actividad", error);
        return { data: null, message: "error interno del servidor" };
    }
}
export async function deleteActividadSer(id_actividad: number): Promise<any> {
    try {
        const actividadRepository = AppDataSource.getRepository(ActividadEntity);
        const actividad = await actividadRepository.findOne({ where: { id_actividad: id_actividad }, relations: {carreras:true} });

        if (!actividad) {
            return { result: null, message: "actividad no encontrada" };
        }

        return {
            result: await actividadRepository.delete({ id_actividad: actividad.id_actividad }),
            message: "actividad eliminado exitosamente"
        };
    } catch (error) {
        console.error(error);
        return { result: null, message: "Error al eliminar la actividad" };
    }
}