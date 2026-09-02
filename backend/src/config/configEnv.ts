import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envFilePath = path.resolve(__dirname, ".env");

dotenv.config({ path: envFilePath });

export const DB_HOST: string = process.env.DB_HOST || process.env.HOST || "localhost";
export const DB_PORT: number = Number(process.env.DB_PORT || process.env.PORT || 5432);
export const PORT: number = Number(process.env.PORT || 3000);
export const HOST: string = process.env.HOST || "localhost";
export const DB_USERNAME: string = process.env.DB_USERNAME || "";
export const PASSWORD: string = process.env.PASSWORD || "";
export const DATABASE: string = process.env.DATABASE || "";
export const SESSION_SECRET: string = process.env.SESSION_SECRET || "secret_default";