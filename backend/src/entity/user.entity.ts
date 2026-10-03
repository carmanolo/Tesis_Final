import { EntitySchema } from "typeorm";
import { Actividad } from "./actividad.entity.js";


export interface IUser {
    id: number;
    username: string;
    email: string;
    password?: string;
    role: string;
    carreraId: number;
    carreras?: any;
    actividades?: Actividad[];      // NUEVO
    createdAt: Date;
    updatedAt: Date;
}

export const UserEntity = new EntitySchema<IUser>({
    name: "User",
    tableName: "users",
    columns: {
        id: {
            type: Number,
            primary: true,
            generated: true,
        },
        username: {
            type: String,
            unique: true,
            nullable: false,
        },
        email: {
            type: String,
            unique: true,
            nullable: false,
        },
        password: {
            type: String,
            nullable: false,
        },
        role: {
            type: String,
            default: "user",
        },
        carreraId: {
            type: "int",
            nullable: true,
        },
        
        createdAt: {
            type: "timestamp",
            default: () => "CURRENT_TIMESTAMP",
        },
        updatedAt: {
            type: "timestamp",
            default: () => "CURRENT_TIMESTAMP",
            onUpdate: "CURRENT_TIMESTAMP",
        },
    },
    relations: {
       carreras: {
            type: "many-to-one",
            target: "Carrera",
            joinColumn: { name: "carreraId", referencedColumnName: "id_carrera" },
            onDelete: "SET NULL",
            inverseSide: "users",
        },
        actividades: {              // NUEVO
            type: "one-to-many",
            target: "Actividad",
            inverseSide: "creador",
        },
    }

});

export default UserEntity;