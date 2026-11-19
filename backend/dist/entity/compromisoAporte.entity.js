import { EntitySchema } from "typeorm";
export const CompromisoAporteEntity = new EntitySchema({
    name: "CompromisoAporte",
    tableName: "compromiso_aportes",
    columns: {
        id: {
            type: Number,
            primary: true,
            generated: true,
        },
        compromisoId: {
            type: "int",
            nullable: false,
        },
        aporteId: {
            type: "int",
            nullable: false,
        },
        monto_asignado: {
            type: Number,
            nullable: false,
        },
    },
    uniques: [
        { name: "UQ_compromiso_aporte", columns: ["compromisoId", "aporteId"] },
    ],
    checks: [
        { name: "CHK_asignacion_monto_positivo", expression: `"monto_asignado" > 0` },
    ],
    relations: {
        compromiso: {
            type: "many-to-one",
            target: "Compromiso",
            joinColumn: { name: "compromisoId", referencedColumnName: "id_compromiso" },
            inverseSide: "aportes",
            nullable: false,
            onDelete: "CASCADE",
        },
        aporte: {
            type: "many-to-one",
            target: "Aporte",
            joinColumn: { name: "aporteId", referencedColumnName: "id_aporte" },
            nullable: false,
            onDelete: "CASCADE",
        },
    },
});
export default CompromisoAporteEntity;
