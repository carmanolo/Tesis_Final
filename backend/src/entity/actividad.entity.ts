import { EntitySchema } from "typeorm";
import type { IUser } from "./user.entity.js";
import type { Carrera } from "./carrera.entity.js";

export interface Actividad {
    id_actividad: number;
    nombre_actividad: string;
    fecha_actividad: Date;
    procedencia: string;
    monto: number;
    fecha_recepcion?: Date | null;
    creadorId?: number;
    creador?: IUser;
    carreraId?: number;
    carrera?: Carrera;
}

export const ActividadEntity = new EntitySchema<Actividad>({
    name: "Actividad",
    tableName: "actividades",
    columns: {
        id_actividad: { 
            type: Number, 
            primary: true, 
            generated: true 
        },
        nombre_actividad: { 
            type: String, 
            nullable: false 
        },
        fecha_actividad: { 
            type: "date", 
            nullable: false 
        },
        procedencia: { 
            type: String, 
            nullable: false 
        },
        monto: { 
            type: Number, 
            nullable: false 
        },
        fecha_recepcion: { 
            type: "timestamp", 
            nullable: true 
        },
        creadorId: {
            type: "int",
            nullable: false,
        },
        carreraId: {
            type: "int",
            nullable: false,
        },
    },
    relations: {
        creador: {
            type: "many-to-one",
            target: "User",
            joinColumn: { name: "creadorId", referencedColumnName: "id" },
            inverseSide: "actividades",
            nullable: false,
            onDelete: "RESTRICT",
        },
        carrera: {
            type: "many-to-one",
            target: "Carrera",
            joinColumn: { name: "carreraId", referencedColumnName: "id_carrera" },
            inverseSide: "actividades",
            nullable: false,
            onDelete: "CASCADE",
        },
    },
});

export default ActividadEntity;