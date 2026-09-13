import { AppDataSource } from "../config/configDb.js";
import {CarreraEntity, Carrera} from "../entity/carrera.entity.js";
import { SHOW_ERRORS } from "../constants/ajustes.constants.js";

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
        const carreras = await carreraRepository.find({relations: {users: true}});
        
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
            relations: {users: true}
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
        const carrera = await carreraRepository.findOne({ where: { id_carrera: id_carrera }, relations: {users:true} });

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

// Agrega 'typeof' antes del nombre
export async function obtenerListaCarreras(): Promise<Carrera[]> {
  try {
    const carreraRepository = AppDataSource.getRepository(CarreraEntity);
    const carreras = await carreraRepository.find();
    return carreras;
  } catch (error) {
    console.error("Error al obtener la lista de carreras:", error);
    return [];
  }
}

export async function obtenerCarreraPorSigla(sigla: string) { 
  try {
    if (SHOW_ERRORS) {
      console.log("SIGLA DADA: ", sigla);
    }
    const carreraRepository = AppDataSource.getRepository(CarreraEntity);
    const carrera = await carreraRepository.findOne({where: { sigla: sigla}});
    if (SHOW_ERRORS) {
      // console.log("¿Encontró al auto?:", JSON.stringify(vehiculo));
    }
    if (!carrera) {
      return null;
    }
    return carrera;
  } catch (error) {
    console.error(error);
    return null;
  }
}
