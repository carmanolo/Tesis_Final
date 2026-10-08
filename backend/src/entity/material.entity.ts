import { EntitySchema } from "typeorm";
import type { IUser } from "./user.entity.js";
import type { Carrera } from "./carrera.entity.js";

export interface Material {
    id_material: number;
    nombre_material: string;
    fecha_prestamo: Date;
    nombre_prestamo: string;
    stock: number;
    tne_entregada:boolean
    fecha_recepcion?: Date | null;
    carreraId?: number;
    carrera?: Carrera;
    estudiante: IUser[]
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

        carreraId: {
            type: "int",
            nullable: false,
        },
    },
    relations: {
        estudiante: {
            type: "many-to-one",
            target: "User",
            joinColumn: {name:"username", referencedColumnName: "nombre_prestamo"},
            nullable:false,
            onDelete: "CASCADE"
        },
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
