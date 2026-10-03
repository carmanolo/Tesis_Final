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
    creador?: IUser;
    carreras?: Carrera[];
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
        carreras: {
            type: "many-to-many",
            target: "Carrera",
            inverseSide: "actividades",
            joinTable: {
                name: "actividades_carreras",
                joinColumn: { name: "id_actividad", referencedColumnName: "id_actividad" },
                inverseJoinColumn: { name: "id_carrera", referencedColumnName: "id_carrera" },
            },
        },
    },
});

export default ActividadEntity;