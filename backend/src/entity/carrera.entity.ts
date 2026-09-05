import { EntitySchema } from "typeorm";

export interface Carrera {
    id_carrera: number,
    nombre_carrera: string;
    sigla: String
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
        
    }
});

export default CarreraEntity;