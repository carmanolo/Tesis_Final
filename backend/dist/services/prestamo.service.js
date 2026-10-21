import { AppDataSource } from "../config/configDb.js";
import PrestamoEntity from "../entity/prestamo.entity.js";
import MaterialEntity from "../entity/material.entity.js";
export async function createPrestamoSer(materialId, prestatario, fecha_prestamo, tne_entregada = false) {
    try {
        if (!materialId || !prestatario) {
            return { data: null, error: "El material y el nombre del prestatario son obligatorios" };
        }
        const materialRepository = AppDataSource.getRepository(MaterialEntity);
        const material = await materialRepository.findOne({ where: { id_material: materialId } });
        if (!material) {
            return { data: null, error: "El material no fue encontrado" };
        }
        if (Number(material.stock) < 1) {
            return { data: null, error: "No hay unidades disponibles para prestar este material" };
        }
        const prestamoRepository = AppDataSource.getRepository(PrestamoEntity);
        const newPrestamo = prestamoRepository.create({
            materialId,
            material,
            prestatario: prestatario.trim(),
            fecha_prestamo: fecha_prestamo ? new Date(fecha_prestamo) : new Date(),
            estado_prestamo: "prestado",
            tne_entregada: Boolean(tne_entregada),
        });
        // Descontar 1 unidad del stock disponible del material
        material.stock = Number(material.stock) - 1;
        if (material.stock === 0) {
            material.estado_prestamo = "prestado";
        }
        else {
            material.estado_prestamo = "disponible";
        }
        await materialRepository.save(material);
        const savedPrestamo = await prestamoRepository.save(newPrestamo);
        return { data: savedPrestamo, error: null };
    }
    catch (error) {
        console.error("Error al registrar préstamo: ", error);
        return { data: null, error: "Error interno al registrar el préstamo" };
    }
}
export async function devolverPrestamoSer(id_prestamo) {
    try {
        const prestamoRepository = AppDataSource.getRepository(PrestamoEntity);
        const prestamo = await prestamoRepository.findOne({
            where: { id_prestamo },
            relations: { material: true },
        });
        if (!prestamo) {
            return { data: null, error: "Préstamo no encontrado" };
        }
        if (prestamo.estado_prestamo === "devuelto") {
            return { data: null, error: "Este préstamo ya ha sido devuelto anteriormente" };
        }
        prestamo.estado_prestamo = "devuelto";
        prestamo.fecha_devolucion = new Date();
        // Reponer 1 unidad al stock del material
        const materialRepository = AppDataSource.getRepository(MaterialEntity);
        const material = await materialRepository.findOne({ where: { id_material: prestamo.materialId } });
        if (material) {
            material.stock = Number(material.stock) + 1;
            material.estado_prestamo = "disponible";
            await materialRepository.save(material);
        }
        const savedPrestamo = await prestamoRepository.save(prestamo);
        return { data: savedPrestamo, error: null };
    }
    catch (error) {
        console.error("Error al devolver préstamo: ", error);
        return { data: null, error: "Error interno al registrar la devolución" };
    }
}
export async function deletePrestamoSer(id_prestamo) {
    try {
        const prestamoRepository = AppDataSource.getRepository(PrestamoEntity);
        const prestamo = await prestamoRepository.findOne({ where: { id_prestamo } });
        if (!prestamo) {
            return { result: null, error: "Préstamo no encontrado" };
        }
        // Si se elimina un préstamo que estaba activo (prestado), restaurar la unidad al stock
        if (prestamo.estado_prestamo === "prestado") {
            const materialRepository = AppDataSource.getRepository(MaterialEntity);
            const material = await materialRepository.findOne({ where: { id_material: prestamo.materialId } });
            if (material) {
                material.stock = Number(material.stock) + 1;
                material.estado_prestamo = "disponible";
                await materialRepository.save(material);
            }
        }
        const result = await prestamoRepository.delete({ id_prestamo });
        return { result, error: null };
    }
    catch (error) {
        console.error("Error al eliminar préstamo: ", error);
        return { result: null, error: "Error al eliminar el préstamo" };
    }
}
