import { EntitySchema } from "typeorm";
export const ActividadEntity = new EntitySchema({
    name: "Actividad",
    tableName: "actividades",
    columns: {
        id_actividad: {
            type: Number,
            primary: true,
            generated: true
        },
        nombre_actividad: {
            type: String,
            nullable: false
        },
        fecha_actividad: {
            type: "date",
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
    },
    relations: {
        creador: {
            type: "many-to-one",
            target: "User",
            joinColumn: { name: "creadorId", referencedColumnName: "id" },
            inverseSide: "actividades",
            nullable: false,
            onDelete: "RESTRICT",
        },
        carreras: {
            type: "many-to-many",
            target: "Carrera",
            inverseSide: "actividades",
            joinTable: {
                name: "actividades_carreras",
                joinColumn: { name: "id_actividad", referencedColumnName: "id_actividad" },
                inverseJoinColumn: { name: "id_carrera", referencedColumnName: "id_carrera" },
            },
        },
    },
});
export default ActividadEntity;
