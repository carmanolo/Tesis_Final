import { EntitySchema } from "typeorm";
import type { Carrera } from "./carrera.entity.js";

export interface Aporte {
    id_aporte: number;
    descripcion_aporte: string;
    procedencia: string;
    monto: number;
    fecha_aporte: Date | string;
    tipo: "ingreso" | "egreso";
    carreraId: number;
    carrera?: Carrera;
}

export const AporteEntity = new EntitySchema<Aporte>({
    name: "Aporte",
    tableName: "aportes",
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
        procedencia: { 
            type: String, 
            nullable: false 
        },
        monto: { 
            type: Number, 
            nullable: false 
        },
        // Fecha elegida por el usuario al registrar el aporte
        fecha_aporte: { 
            type: "date", 
            nullable: false 
        },
        tipo: {
            type: "varchar",
            nullable: false,
            default: "ingreso",
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
            inverseSide: "Aportes",
            nullable: false,
            onDelete: "CASCADE",
        },
    },
});

export default AporteEntity;