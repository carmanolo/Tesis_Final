import { EntitySchema } from "typeorm";


export interface IUser {
    id: number;
    username: string;
    email: string;
    password?: string; // Opcional por seguridad al retornar datos
    role: string;
    createdAt: Date;
    updatedAt: Date;
}

export const UserEntity = new EntitySchema<IUser>({
    name: "User",
    tableName: "users",
    columns: {
        id: {
            type: Number,
            primary: true,
            generated: true,
        },
        username: {
            type: String,
            unique: true,
            nullable: false,
        },
        email: {
            type: String,
            unique: true,
            nullable: false,
        },
        password: {
            type: String,
            nullable: false,
        },
        role: {
            type: String,
            default: "user",
        },
        createdAt: {
            type: "timestamp",
            default: () => "CURRENT_TIMESTAMP",
        },
        updatedAt: {
            type: "timestamp",
            default: () => "CURRENT_TIMESTAMP",
            onUpdate: "CURRENT_TIMESTAMP",
    },
    },
});

export default UserEntity;