"use strict";
import { DataSource } from "typeorm";
import { DATABASE, DB_USERNAME, PASSWORD, DB_HOST, DB_PORT } from "./configEnv.js";
import UserEntity from "../entity/user.entity.js";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: DB_HOST,
    port: Number(DB_PORT), // ⚠️ Importante: TypeORM requiere que el puerto sea un número
    username: DB_USERNAME,
    password: PASSWORD,
    database: DATABASE,
    entities: [UserEntity],
    synchronize: true,
    logging: false,
});

export async function connectDB(): Promise<void> {
    try {
        await AppDataSource.initialize();
        console.log("=> Conexión con la base de datos exitosa!");
    } catch (error) {
        console.error("Error al conectar con la base de datos:", error);
        process.exit(1);
    }
}