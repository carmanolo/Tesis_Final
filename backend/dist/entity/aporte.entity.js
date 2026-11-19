import { EntitySchema } from "typeorm";
export const AporteEntity = new EntitySchema({
    name: "Aporte",
    tableName: "aportes",
    columns: {
        id_aporte: {
            type: Number,
            primary: true,
            generated: true
        },
        descripcion_aporte: {
            type: String,
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
        // Fecha elegida por el usuario al registrar el aporte
        fecha_aporte: {
            type: "date",
            nullable: false
        },
        tipo: {
            type: "varchar",
            nullable: false,
            default: "ingreso",
        },
        carreraId: {
            type: "int",
            nullable: false,
        },
    },
    relations: {
        carrera: {
            type: "many-to-one",
            target: "Carrera",
            joinColumn: { name: "carreraId", referencedColumnName: "id_carrera" },
            inverseSide: "aportes",
            nullable: false,
            onDelete: "CASCADE",
        },
    },
});
export default AporteEntity;
