import { EntitySchema } from "typeorm";
import { IUser } from "./user.entity.js";

export interface Carrera {
    id_carrera: number,
    nombre_carrera: string,
    sigla: String,
    users?: IUser[];
    //malla curricular
}

export const CarreraEntity = new EntitySchema<Carrera>({
    name: "Carrera",
    tableName:"carreras",
    columns: {
        id_carrera: {
            type: Number,
            primary:true,
            generated: true
        },
        nombre_carrera: {
            type: String,
            unique: false,
            nullable: false,
        },
        sigla: {
            type: String,
            unique: false,
            nullable: false,
        }
        
    },
    relations: {
        users: {
            type: "one-to-many",
            target: "User", 
            inverseSide: "carreras", 
        },
    }
});

export default CarreraEntity;