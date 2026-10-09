import { AppDataSource } from "../config/configDb.js";
import MaterialEntity from "../entity/material.entity.js";
import CarreraEntity from "../entity/carrera.entity.js";
import { isAdminRole } from "../utils/user.utils.js";

export async function createMaterialSer(
    nombre_material: string,
    fecha_prestamo: Date | string | null | undefined,
    nombre_prestamo: string | null | undefined,
    stock: number,
    carreraId: number,
    estado_prestamo: "pendiente" | "devuelto" | "prestado" | string = "prestado",
    tne_entregada: boolean = false
): Promise<{ data: any | null; error: string | null }> {
    try {
        if (!nombre_material || stock === undefined || stock === null || !carreraId) {
            return { data: null, error: "Faltan parámetros requeridos para crear el material" };
        }

        const carreraRepository = AppDataSource.getRepository(CarreraEntity as any);
        const carrera = await carreraRepository.findOneBy({ id_carrera: carreraId });

        if (!carrera) {
            return { data: null, error: "La carrera especificada no existe" };
        }

        const materialRepository = AppDataSource.getRepository(MaterialEntity as any);
        const newMaterial = materialRepository.create({
            nombre_material,
            fecha_prestamo: fecha_prestamo ? (new Date(fecha_prestamo) as any) : null,
            nombre_prestamo: nombre_prestamo || "",
            stock,
            estado_prestamo: estado_prestamo,
            tne_entregada: Boolean(tne_entregada),
            carreraId,
            carrera: { id_carrera: carreraId },
        });

        const saved = await materialRepository.save(newMaterial);
        return { data: saved, error: null };
    } catch (error) {
        console.error("Error al crear material: ", error);
        return { data: null, error: "Error interno al crear el material" };
    }
}

// Devuelve los materiales de la carrera o todos si es administrador
export async function getMaterialesSer(carreraId?: number, role?: string): Promise<any[] | null> {
    try {
        const whereCondition: any = {};
        if (!isAdminRole(role) || carreraId) {
            whereCondition.carreraId = carreraId;
        }

        const materialRepository = AppDataSource.getRepository(MaterialEntity as any);
        const materiales = await materialRepository.find({
            where: Object.keys(whereCondition).length > 0 ? whereCondition : undefined,
            relations: { carrera: true },
            order: { fecha_prestamo: "DESC" },
        });

        return materiales;
    } catch (error) {
        console.error("Error al obtener materiales: ", error);
        return null;
    }
}

// Devuelve el material si pertenece a la carrera del usuario o si es administrador
export async function getMaterialSer(id_material: number, carreraId?: number, role?: string): Promise<any | null> {
    try {
        const whereCondition: any = { id_material };
        if (!isAdminRole(role)) {
            whereCondition.carreraId = carreraId;
        }

        const materialRepository = AppDataSource.getRepository(MaterialEntity as any);
        const material = await materialRepository.findOne({
            where: whereCondition,
            relations: { carrera: true },
        });

        return material;
    } catch (error) {
        console.error("Error al obtener el material: ", error);
        return null;
    }
}

export async function patchMaterialSer(material: Partial<any>): Promise<{ data: any | null; message: string; error?: string | null }> {
    try {
        if (!material) {
            return { data: null, message: "No se proporcionaron datos para actualizar", error: "Datos vacíos" };
        }

        const materialRepository = AppDataSource.getRepository(MaterialEntity as any);
        const savedMaterial = await materialRepository.save(material as any);

        return { data: savedMaterial, message: "Material actualizado con éxito", error: null };
    } catch (error) {
        console.error("Error al actualizar material: ", error);
        return { data: null, message: "Error interno del servidor al actualizar el material" };
    }
}

export async function deleteMaterialSer(id_material: number): Promise<{ result: any | null; message: string }> {
    try {
        const materialRepository = AppDataSource.getRepository(MaterialEntity as any);
        const material = await materialRepository.findOne({ where: { id_material } });

        if (!material) {
            return { result: null, message: "Material no encontrado" };
        }

        const result = await materialRepository.delete({ id_material });
        return {
            result,
            message: "Material eliminado exitosamente"
        };
    } catch (error) {
        console.error("Error al eliminar el material: ", error);
        return { result: null, message: "Error al eliminar el material" };
    }
}