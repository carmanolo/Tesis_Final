import { EntitySchema } from "typeorm";
import type { IUser } from "./user.entity.js";
import type { Carrera } from "./carrera.entity.js";
import type { CompromisoAporte } from "./compromisoAporte.entity.js"

export interface Compromiso {
    id_compromiso: number;
    descripcion_compromiso: string;
    fecha_compromiso: Date | string;
    monto_total: number;
    creadorId: number;
    creador?: IUser;
    carreraId: number;
    carrera?: Carrera;
    // Aportes que financian este compromiso (tabla intermedia con el monto asignado)
    aportes?: CompromisoAporte[];
    createdAt: Date;
    updatedAt: Date;
}

export const CompromisoEntity = new EntitySchema<Compromiso>({
    name: "Compromiso",
    tableName: "compromisos",
    columns: {
        id_compromiso: {
            type: Number,
            primary: true,
            generated: true,
        },
        descripcion_compromiso: {
            type: "text",
            nullable: false,
        },
        fecha_compromiso: {
            type: "date",
            nullable: false,
        },
        monto_total: {
            type: Number,
            nullable: false,
        },
        creadorId: {
            type: "int",
            nullable: false,
        },
        carreraId: {
            type: "int",
            nullable: false,
        },
        createdAt: {
            type: "timestamp",
            createDate: true,
        },
        updatedAt: {
            type: "timestamp",
            updateDate: true,
        },
    },
    checks: [
        { name: "CHK_compromiso_monto_positivo", expression: `"monto_total" > 0` },
    ],
    relations: {
        creador: {
            type: "many-to-one",
            target: "User",
            joinColumn: { name: "creadorId", referencedColumnName: "id" },
            nullable: false,
            onDelete: "RESTRICT",
        },
        carrera: {
            type: "many-to-one",
            target: "Carrera",
            joinColumn: { name: "carreraId", referencedColumnName: "id_carrera" },
            nullable: false,
            onDelete: "CASCADE",
        },
        aportes: {
            type: "one-to-many",
            target: "CompromisoAporte",
            inverseSide: "compromiso",
        },
    },
});

export default CompromisoEntity;