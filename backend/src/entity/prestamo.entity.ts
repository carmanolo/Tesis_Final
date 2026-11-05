import { EntitySchema } from "typeorm";
import type { Material } from "./material.entity.js";

export interface Prestamo {
    id_prestamo: number;
    materialId: number;
    material?: Material;
    prestatario: string;
    fecha_prestamo: Date | string;
    fecha_devolucion?: Date | string | null;
    estado_prestamo: "prestado" | "devuelto" | string;
    tne_entregada: boolean;
}

export const PrestamoEntity = new EntitySchema<Prestamo>({
    name: "Prestamo",
    tableName: "prestamos",
    columns: {
        id_prestamo: {
            type: Number,
            primary: true,
            generated: true,
        },
        materialId: {
            type: Number,
            nullable: false,
        },
        prestatario: {
            type: String,
            nullable: false,
        },
        fecha_prestamo: {
            type: "date",
            nullable: false,
        },
        fecha_devolucion: {
            type: "date",
            nullable: true,
        },
        estado_prestamo: {
            type: String,
            default: "prestado",
            nullable: false,
        },
        tne_entregada: {
            type: Boolean,
            default: false,
            nullable: false,
        },
    },
    relations: {
        material: {
            type: "many-to-one",
            target: "Material",
            joinColumn: { name: "materialId", referencedColumnName: "id_material" },
            inverseSide: "prestamos",
            nullable: false,
            onDelete: "CASCADE",
        },
    },
});

export default PrestamoEntity;
