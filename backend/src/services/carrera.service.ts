import { AppDataSource } from "../config/configDb.js";
import CarreraEntity from "../entity/carrera.entity.js";

export async function createCarreraSer(
    nombre_carrera: string,
    sigla: string
): Promise<any | null>  {
    const carreraRepository = AppDataSource.getRepository(CarreraEntity as any);

    try {
        if (!nombre_carrera || ! sigla) {
            throw new Error("Funcion mal llamada");
        }

        const newCarrera = carreraRepository.create({
           nombre_carrera,
           sigla
        });
        await carreraRepository.save(newCarrera);

        return newCarrera;
    } catch (error) {
        console.error(error);
        return null;
    }
}

export async function getCarrerasSer(): Promise<any> {
    try {
        const carreraRepository = AppDataSource.getRepository(CarreraEntity as any);
        const carreras = await carreraRepository.find();
        
        if (!carreras || carreras.length === 0) return { message: "Arreglo vacío" };
        return [carreras, null];
    } catch (error) {
        console.error("error al obtener carreras: ", error);
        return null;
    }
}

export async function getCarreraSer(id_carrera: number): Promise<any> {
    try {
        const carreraRepository = AppDataSource.getRepository(CarreraEntity as any);
        const carrera = await carreraRepository.findOne({
            where: { id_carrera: id_carrera },
        });
        return carrera;
    } catch (error) {
        console.error("Error al obtener la carrera", error);
        return [null, "Error interno del servidor"];
    }
}

export async function patchCarreraSer(carrera: Partial<any>): Promise<any> {
    const userRepository = AppDataSource.getRepository(CarreraEntity as any);
    try {
        if (!carrera) {
            throw new Error("Funcion mal llamada");
        }
        
        const savedCarrera = await userRepository.save(carrera as any);

        return { data: savedCarrera, message: "Carrera actualizada con exito", error: null };
    } catch (error) {
        console.error("Error al actualizar carrera", error);
        return { data: 500, message: "error interno del servidor" };
    }
}
export async function deleteCarreraSer(id_carrera: number): Promise<any> {
    try {
        const carreraRepository = AppDataSource.getRepository(CarreraEntity);
        const carrera = await carreraRepository.findOne({ where: { id_carrera: id_carrera } });

        if (!carrera) {
            return { result: null, message: "carrera no encontrada" };
        }

        return {
            result: await carreraRepository.delete({ id_carrera: carrera.id_carrera }),
            message: "carrera eliminada exitosamente"
        };
    } catch (error) {
        console.error(error);
        return { result: null, message: "Error al eliminar la carrera" };
    }
}