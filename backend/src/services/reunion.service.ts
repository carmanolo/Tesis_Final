import fs from "fs";
import { AppDataSource } from "../config/configDb.js";
import { ReunionEntity, Reunion } from "../entity/reunion.entity.js";

export async function createReunionSer(
    fecha_reunion: Date | string,
    descripcion: string
): Promise<any | null> {
    const reunionRepository = AppDataSource.getRepository(ReunionEntity as any);

    try {
        if (!fecha_reunion || !descripcion) {
            throw new Error("Funcion mal llamada");
        }

        const newReunion = reunionRepository.create({
            fecha_reunion,
            descripcion
        });
        await reunionRepository.save(newReunion);

        return newReunion;
    } catch (error) {
        console.error(error);
        return null;
    }
}

export async function getReunionesSer(): Promise<any> {
    try {
        const reunionRepository = AppDataSource.getRepository(ReunionEntity as any);
        const reuniones = await reunionRepository.find();

        if (!reuniones || reuniones.length === 0) return { message: "Arreglo vacío" };
        return [reuniones, null];
    } catch (error) {
        console.error("error al obtener reuniones: ", error);
        return null;
    }
}

export async function getReunionSer(id_reunion: number): Promise<any> {
    try {
        const reunionRepository = AppDataSource.getRepository(ReunionEntity as any);
        const reunion = await reunionRepository.findOne({
            where: { id_reunion }
        });
        return reunion;
    } catch (error) {
        console.error("Error al obtener la reunión", error);
        return [null, "Error interno del servidor"];
    }
}

export async function patchReunionSer(reunion: Partial<any>): Promise<any> {
    const reunionRepository = AppDataSource.getRepository(ReunionEntity as any);
    try {
        if (!reunion) {
            throw new Error("Funcion mal llamada");
        }

        const savedReunion = await reunionRepository.save(reunion as any);

        return { data: savedReunion, message: "Reunión actualizada con éxito", error: null };
    } catch (error) {
        console.error("Error al actualizar reunión", error);
        return { data: null, message: "error interno del servidor" };
    }
}

export async function deleteReunionSer(id_reunion: number): Promise<any> {
    try {
        const reunionRepository = AppDataSource.getRepository(ReunionEntity as any);
        const reunion: any = await reunionRepository.findOne({ where: { id_reunion } });

        if (!reunion) {
            return { result: null, message: "reunión no encontrada" };
        }

        // Si tiene un acta asociada, se elimina también el archivo físico
        if (reunion.ruta_archivo && fs.existsSync(reunion.ruta_archivo)) {
            fs.unlinkSync(reunion.ruta_archivo);
        }

        return {
            result: await reunionRepository.delete({ id_reunion: reunion.id_reunion }),
            message: "reunión eliminada exitosamente"
        };
    } catch (error) {
        console.error(error);
        return { result: null, message: "Error al eliminar la reunión" };
    }
}


export async function subirActaSer(
    id_reunion: number,
    file: Express.Multer.File
): Promise<any> {
    const reunionRepository = AppDataSource.getRepository(ReunionEntity as any);
    try {
        const reunion: any = await reunionRepository.findOne({ where: { id_reunion } });

        if (!reunion) {
            // Si la reunión no existe, se elimina el archivo que multer ya guardó en disco
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
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

        const savedReunion = await reunionRepository.save(reunion);

        return { data: savedReunion, message: "Acta subida exitosamente" };
    } catch (error) {
        console.error("Error al subir el acta", error);
        if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
        return { data: null, message: "Error interno del servidor" };
    }
}

export async function obtenerActaSer(id_reunion: number): Promise<any> {
    try {
        const reunionRepository = AppDataSource.getRepository(ReunionEntity as any);
        const reunion: any = await reunionRepository.findOne({ where: { id_reunion } });

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
    } catch (error) {
        console.error("Error al obtener el acta", error);
        return { data: null, message: "Error interno del servidor" };
    }
}