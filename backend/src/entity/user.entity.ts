import { EntitySchema } from "typeorm";
import { Aporte } from "./aporte.entity.js";


export interface IUser {
    id: number;
    username: string;
    email: string;
    password?: string;
    role: string;
    carreraId: number;
    carreras?: any;
    Aportes?: Aporte[];      
    createdAt: Date;
    updatedAt: Date;
    recoveryStatus?: string | null;         
    recoveryRequestedAt?: Date | null;
    recoveryCodeHash?: string | null;
    recoveryCodeExpires?: Date | null;
    recoveryAttempts?: number;
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
            default: "estudiante",
        },
        carreraId: {
            type: "int",
            nullable: true,
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
        recoveryStatus: { 
            type: String, nullable: true, 
            select: false 
        },
        recoveryRequestedAt: { 
            type: "timestamp", 
            nullable: true, 
            select: false 
        },
        recoveryCodeHash: { 
            type: String, 
            nullable: true, 
            select: false 
        },
        recoveryCodeExpires: { 
            type: "timestamp", 
            nullable: true, 
            select: false 
        },
        recoveryAttempts: { 
            type: "int", 
            default: 0, 
            select: false 
        },
    },
    relations: {
       carreras: {
            type: "many-to-one",
            target: "Carrera",
            joinColumn: { name: "carreraId", referencedColumnName: "id_carrera" },
            onDelete: "SET NULL",
            inverseSide: "users",
        },
        Aportes: {              
            type: "one-to-many",
            target: "Aporte",
            inverseSide: "creador",
        },
    }

});

export default UserEntity;