import { EntitySchema } from "typeorm";
import { imagenesTransformer } from "../utils/publicacion.utils.js";
export const PublicacionEntity = new EntitySchema({
    name: "Publicacion",
    tableName: "publicaciones",
    columns: {
        id_publicacion: {
            type: Number,
            primary: true,
            generated: true,
        },
        titulo: {
            type: String,
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
    },
});
export default PublicacionEntity;
