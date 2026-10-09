import { EntitySchema } from "typeorm";
export const AporteEntity = new EntitySchema({
    name: "Aporte",
    tableName: "Aportees",
    columns: {
        id_Aporte: {
            type: Number,
            primary: true,
            generated: true
        },
        nombre_Aporte: {
            type: String,
            nullable: false
        },
        fecha_Aporte: {
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
        creadorId: {
            type: "int",
            nullable: false,
        },
        carreraId: {
            type: "int",
            nullable: false,
        },
    },
    relations: {
        creador: {
            type: "many-to-one",
            target: "User",
            joinColumn: { name: "creadorId", referencedColumnName: "id" },
            inverseSide: "Aportees",
            nullable: false,
            onDelete: "RESTRICT",
        },
        carrera: {
            type: "many-to-one",
            target: "Carrera",
            joinColumn: { name: "carreraId", referencedColumnName: "id_carrera" },
            inverseSide: "Aportees",
            nullable: false,
            onDelete: "CASCADE",
        },
    },
});
export default AporteEntity;
