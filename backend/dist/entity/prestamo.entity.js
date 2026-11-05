import { EntitySchema } from "typeorm";
export const PrestamoEntity = new EntitySchema({
    name: "Prestamo",
    tableName: "prestamos",
    columns: {
        id_prestamo: {
            type: Number,
            primary: true,
            generated: true,
        },
        materialId: {
            type: Number,
            nullable: false,
        },
        prestatario: {
            type: String,
            nullable: false,
        },
        fecha_prestamo: {
            type: "date",
            nullable: false,
        },
        fecha_devolucion: {
            type: "date",
            nullable: true,
        },
        estado_prestamo: {
            type: String,
            default: "prestado",
            nullable: false,
        },
        tne_entregada: {
            type: Boolean,
            default: false,
            nullable: false,
        },
    },
    relations: {
        material: {
            type: "many-to-one",
            target: "Material",
            joinColumn: { name: "materialId", referencedColumnName: "id_material" },
            inverseSide: "prestamos",
            nullable: false,
            onDelete: "CASCADE",
        },
    },
});
export default PrestamoEntity;
