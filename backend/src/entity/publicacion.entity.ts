import { EntitySchema } from "typeorm";
import type { IUser } from "./user.entity.js";
import type { Carrera } from "./carrera.entity.js";
import type { Compromiso } from "./compromiso.entity.js";
import { imagenesTransformer } from "../utils/publicacion.utils.js";

export interface Publicacion {
    id_publicacion: number;
    compromisoId: number;
    descripcion: string;
    imagenes: string[];
    creadorId?: number | null;
    creador?: IUser;
    carreraId?: number;
    carrera?: Carrera;
    compromiso?: Compromiso;
    createdAt: Date;
    updatedAt: Date;
}

export const PublicacionEntity = new EntitySchema<Publicacion>({
    name: "Publicacion",
    tableName: "publicaciones",
    columns: {
        id_publicacion: {
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
            nullable:false,
            onDelete: "CASCADE",
        }
    },
});

export default PublicacionEntity;