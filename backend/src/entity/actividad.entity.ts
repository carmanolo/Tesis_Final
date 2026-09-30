import { EntitySchema } from "typeorm";
import { IUser } from "./user.entity.js";
import { Carrera } from "./carrera.entity.js";

export interface Actividad {
    id_actividad: number,
    nombre_actividad: String
    fecha_actividad: Date,
    procedencia: string,
    monto: number
    fecha_recepcion?: Date | null,
    users?: IUser[];
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
            nullable: false,
        },
        fecha_actividad: {
            type: "date",
            nullable: false,
        },
        procedencia: {
            type: String,
            nullable: false,
        },
        monto: {
            type: Number,
            nullable: false,
        },
        fecha_recepcion: {
            type: "timestamp",
            nullable: true,
        }
    },
    relations: {
        users: {
            type: "many-to-many",
            target: "User", 
            inverseSide: "actividades", 
        },
        carreras: {
            type: "many-to-many",
            target: "Carrera",
            inverseSide: "Actividades"
        }
    }
});

export default ActividadEntity;