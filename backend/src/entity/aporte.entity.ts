import { EntitySchema } from "typeorm";
import type { Carrera } from "./carrera.entity.js";

export interface Aporte {
    id_aporte: number;
    descripcion_aporte: string;
    procedencia: string;
    monto: number;
    fecha_recepcion?: Date | null;
    comprobante?: string | null;
    carreraId: number;
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
        comprobante: { 
            type: String, 
            nullable: true 
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