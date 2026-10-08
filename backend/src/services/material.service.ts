import { AppDataSource } from "../config/configDb.js";
import MaterialEntity from "../entity/material.entity.js";
import CarreraEntity from "../entity/carrera.entity.js";
import { isAdminRole } from "../utils/user.utils.js";


export async function createMaterialSer(
    nombre_material: string,
    fecha_prestamo: Date,
    nombre_prestamo: string,
    stock: number,
    carreraId: number,
): Promise<any | null> {
      try {
            if (!nombre_material || !fecha_prestamo || !nombre_prestamo || !stock || !carreraId) {
                throw new Error("Funcion mal llamada");
            }

            const materialRepository = AppDataSource.getRepository(MaterialEntity as any);
    
            const newMaterial = materialRepository.create({
                nombre_material,
                fecha_prestamo,
                nombre_prestamo,
                stock,
                carreraId,
                estudiante: { username: nombre_prestamo },
                carrera: { id_carrera: carreraId },
            });
            await materialRepository.save(newMaterial);
    
            return newMaterial;
        } catch (error) {
            console.error(error);
            return null;
        }
}

export async function getMaterialesSer(carreraId?: number, role?: string): Promise<any> {
    try {

        const whereCondition: any = {};
        if (!isAdminRole(role) || carreraId) {
            whereCondition.carreraId = carreraId;
        }
        const materialRepository = AppDataSource.getRepository(MaterialEntity as any);
        const materiales = await materialRepository.find({
            where: Object.keys(whereCondition).length > 0 ? whereCondition : undefined,
            relations: { carrera: true, estudiante: true },
            order: { fecha_prestamo: "DESC" },
        });

        if (!materiales || materiales.length === 0) return { message: "Arreglo vacío" };
        return [materiales , null];
    } catch (error) {
        console.error("error al obtener materiales: ", error);
        return null;
    }
}

export async function getMaterialSer(id_material: number, carreraId?: number, role?: string): Promise<any | null> {
    try {

        const whereCondition: any = { id_material };
        if (!isAdminRole(role)) {
            whereCondition.carreraId = carreraId;
        }

        const materialRepository = AppDataSource.getRepository(MaterialEntity as any);
        const material = await materialRepository.findOne({
            where: whereCondition,
            relations: { carrera: true, creador: true },
        });
        return material;
    } catch (error) {
        console.error("Error al obtener el material", error);
        return [null, "Error interno del servidor"];
    }
}

export async function patchMaterialSer(material: Partial<any>): Promise<any> {
    const materialRepository = AppDataSource.getRepository(MaterialEntity as any);
    try {
        if (!material) {
            throw new Error("Funcion mal llamada");
        }

        const savedMaterial = await materialRepository.save(material as any);

        return { data: savedMaterial, message: "Material actualizado con éxito", error: null };
    } catch (error) {
        console.error("Error al actualizar material", error);
        return { data: null, message: "error interno del servidor" };
    }
}

export async function deleteReunionSer(id_material: number): Promise<any> {
    try {
        const materialRepository = AppDataSource.getRepository(MaterialEntity as any);
        const material: any = await materialRepository.findOne({ where: { id_material } });

        if (!material) {
            return { result: null, message: "reunión no encontrada" };
        }

        return {
            result: await materialRepository.delete({ id_material: material.id_material}),
            message: "material eliminado exitosamente"
        };
    } catch (error) {
        console.error(error);
        return { result: null, message: "Error al eliminar el material" };
    }
}