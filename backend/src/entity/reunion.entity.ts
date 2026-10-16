import { EntitySchema } from "typeorm";

export interface Reunion {
    id_reunion: number,
    fecha_reunion: Date,
    descripcion: string,
    google_event_id?: string | null,

    // Metadata del acta (PDF/Word) asociada a la reunión
    nombre_archivo?: string | null,
    nombre_original?: string | null,
    tipo_archivo?: string | null,
    ruta_archivo?: string | null,
    fecha_subida?: Date | null
    carreraId?: number | null,
    creadorId?: number | null,
    carrera?: any,
    creador?: any,
    recordatorio_enviado?: boolean,
}

export const ReunionEntity = new EntitySchema<Reunion>({
    name: "Reunion",
    tableName: "reuniones",
    columns: {
        id_reunion: {
            type: Number,
            primary: true,
            generated: true
        },
        fecha_reunion: {
            type: "date",
            nullable: false,
        },
        descripcion: {
            type: String,
            nullable: false,
        },
        nombre_archivo: {
            type: String,
            nullable: true,
        },
        nombre_original: {
            type: String,
            nullable: true,
        },
        tipo_archivo: {
            type: String,
            nullable: true,
        },
        ruta_archivo: {
            type: String,
            nullable: true,
        },
        fecha_subida: {
            type: "timestamp",
            nullable: true,
        },
        google_event_id: {
            type: String,
            nullable: true,
        },
        carreraId: { type: "int", nullable: true },
        creadorId: { type: "int", nullable: true },
        recordatorio_enviado: { type: Boolean, default: false },
    },
    relations: {
    carrera: {
        type: "many-to-one",
        target: "Carrera",
        joinColumn: { name: "carreraId", referencedColumnName: "id_carrera" },
        onDelete: "SET NULL",
        nullable: true,
    },
    creador: {
        type: "many-to-one",
        target: "User",
        joinColumn: { name: "creadorId", referencedColumnName: "id" },
        onDelete: "SET NULL",
        nullable: true,
    },
    },
});

export default ReunionEntity;