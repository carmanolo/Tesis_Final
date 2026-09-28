import { EntitySchema } from "typeorm";
export const ReunionEntity = new EntitySchema({
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
