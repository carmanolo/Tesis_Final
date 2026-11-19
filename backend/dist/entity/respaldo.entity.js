import { EntitySchema } from "typeorm";
import { imagenesTransformer } from "../utils/respaldo.utils.js";
export const RespaldoEntity = new EntitySchema({
    name: "Respaldo",
    tableName: "respaldos",
    columns: {
        id_respaldo: {
            type: Number,
            primary: true,
            generated: true,
        },
        compromisoId: {
            type: Number,
            nullable: false,
        },
        descripcion: {
            type: String,
            nullable: false,
        },
        imagenes: {
            type: "text",
            nullable: false,
            default: "[]",
            transformer: imagenesTransformer,
        },
        creadorId: {
            type: "int",
            nullable: true,
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
    relations: {
        creador: {
            type: "many-to-one",
            target: "User",
            joinColumn: { name: "creadorId", referencedColumnName: "id" },
            nullable: true,
            onDelete: "SET NULL",
        },
        carrera: {
            type: "many-to-one",
            target: "Carrera",
            joinColumn: { name: "carreraId", referencedColumnName: "id_carrera" },
            nullable: false,
            onDelete: "CASCADE",
        },
        compromiso: {
            type: "many-to-one",
            target: "Compromiso",
            joinColumn: { name: "compromisoId", referencedColumnName: "id_compromiso" },
            nullable: false,
            onDelete: "CASCADE",
        }
    },
});
export default RespaldoEntity;
