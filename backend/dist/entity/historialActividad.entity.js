import { EntitySchema } from "typeorm";
export const HistorialActividadEntity = new EntitySchema({
    name: "HistorialActividad",
    tableName: "historial_actividades",
    columns: {
        id: {
            type: Number,
            primary: true,
            generated: true,
        },
        usuarioId: {
            type: "int",
            nullable: true,
        },
        usuarioEmail: {
            type: String,
            nullable: true,
        },
        usuarioNombre: {
            type: String,
            nullable: true,
        },
        rol: {
            type: String,
            nullable: true,
        },
        accion: {
            type: String,
            nullable: false,
        },
        modulo: {
            type: String,
            nullable: false,
        },
        descripcion: {
            type: String,
            nullable: false,
        },
        detalles: {
            type: "text",
            nullable: true,
        },
        ip: {
            type: String,
            nullable: false,
            default: "127.0.0.1",
        },
        dispositivo: {
            type: String,
            nullable: true,
        },
        metodoHttp: {
            type: String,
            nullable: true,
        },
        ruta: {
            type: String,
            nullable: true,
        },
        estadoHttp: {
            type: "int",
            nullable: true,
        },
        esSospechoso: {
            type: Boolean,
            default: false,
        },
        motivoSospecha: {
            type: String,
            nullable: true,
        },
        createdAt: {
            type: "timestamp",
            default: () => "CURRENT_TIMESTAMP",
        },
    },
});
export default HistorialActividadEntity;
