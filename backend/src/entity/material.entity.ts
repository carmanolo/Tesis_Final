import { EntitySchema } from "typeorm";
import type { Carrera } from "./carrera.entity.js";

export interface Material {
    id_material: number;
    nombre_material: string;
    fecha_prestamo: Date;
    nombre_prestamo: string;
    stock: number;
    estado_prestamo: "pendiente" | "devuelto" | "prestado";
    tne_entregada: boolean;
    carreraId?: number;
    carrera?: Carrera;
}

export const MaterialEntity = new EntitySchema<Material>({
    name: "Material",
    tableName: "materiales",
    columns: {
        id_material: { 
            type: Number, 
            primary: true, 
            generated: true 
        },
        nombre_material: { 
            type: String, 
            nullable: false 
        },
        fecha_prestamo: { 
            type: "date", 
            nullable: false 
        },
        nombre_prestamo: { 
            type: String, 
            nullable: false 
        },
        stock: { 
            type: Number, 
            nullable: false 
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
        carreraId: {
            type: "int",
            nullable: false,
        },
    },
    relations: {
        carrera: {
            type: "many-to-one",
            target: "Carrera",
            joinColumn: { name: "carreraId", referencedColumnName: "id_carrera" },
            inverseSide: "materiales",
            nullable: false,
            onDelete: "CASCADE",
        },
    },
});

export default MaterialEntity;
