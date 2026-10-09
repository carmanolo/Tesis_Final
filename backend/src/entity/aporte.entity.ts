import { EntitySchema } from "typeorm";
import type { IUser } from "./user.entity.js";
import type { Carrera } from "./carrera.entity.js";

export interface Aporte {
    id_aporte: number;
    descripcion_aporte: string;
    fecha_aporte: Date;
    procedencia: string;
    monto: number;
    fecha_recepcion?: Date | null;
    creadorId?: number;
    creador?: IUser;
    carreraId?: number;
    carrera?: Carrera;
}

export const AporteEntity = new EntitySchema<Aporte>({
    name: "Aporte",
    tableName: "Aportes",
    columns: {
        id_aporte: { 
            type: Number, 
            primary: true, 
            generated: true 
        },
        descripcion_aporte: { 
            type: String, 
            nullable: false 
        },
        fecha_aporte: { 
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
            inverseSide: "Aportes",
            nullable: false,
            onDelete: "RESTRICT",
        },
        carrera: {
            type: "many-to-one",
            target: "Carrera",
            joinColumn: { name: "carreraId", referencedColumnName: "id_carrera" },
            inverseSide: "Aportes",
            nullable: false,
            onDelete: "CASCADE",
        },
    },
});

export default AporteEntity;
