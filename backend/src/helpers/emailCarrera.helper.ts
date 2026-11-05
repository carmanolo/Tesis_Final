import { AppDataSource } from "../config/configDb.js";
import UserEntity from "../entity/user.entity.js";

export async function getEmailsCarrera(carreraId: number): Promise<string[]> {
    const users = await AppDataSource.getRepository(UserEntity as any).find({
        where: { carreraId },
        select: { email: true } as any,
    });
    const emails = users
        .map((u: any) => u.email)
        .filter((e: any) => typeof e === "string" && e.includes("@"));
    return [...new Set(emails)] as string[];
}