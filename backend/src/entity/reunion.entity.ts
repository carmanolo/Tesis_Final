import { EntitySchema } from "typeorm";

export interface Reunion {
    id_reunion: number,
    fecha_reunion: Date,
    descripcion: string,
    // Metadata del acta (PDF/Word) asociada a la reunión
    nombre_archivo?: string | null,
    nombre_original?: string | null,
    tipo_archivo?: string | null,
    ruta_archivo?: string | null,
    fecha_subida?: Date | null,
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
        }
    }
});

export default ReunionEntity;