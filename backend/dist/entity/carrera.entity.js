import { EntitySchema } from "typeorm";
export const CarreraEntity = new EntitySchema({
    name: "Carrera",
    tableName: "carreras",
    columns: {
        id_carrera: {
            type: Number,
            primary: true,
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
