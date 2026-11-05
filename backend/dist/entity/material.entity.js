import { EntitySchema } from "typeorm";
export const MaterialEntity = new EntitySchema({
    name: "Material",
    tableName: "materiales",
    columns: {
        id_material: {
            type: Number,
            primary: true,
            generated: true
        },
        nombre_material: {
            type: String,
            nullable: false
        },
        tipo_material: {
            type: String,
            nullable: false
        },
        fecha_prestamo: {
            type: "date",
            nullable: true
        },
        nombre_prestamo: {
            type: String,
            nullable: true
        },
        stock: {
            type: Number,
            nullable: false
        },
        estado_prestamo: {
            type: String,
            default: "disponible",
            nullable: false,
        },
        tne_entregada: {
            type: Boolean,
            default: false,
            nullable: false,
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
            inverseSide: "materiales",
            nullable: false,
            onDelete: "CASCADE",
        },
        prestamos: {
            type: "one-to-many",
            target: "Prestamo",
            inverseSide: "material",
        },
    },
});
export default MaterialEntity;
