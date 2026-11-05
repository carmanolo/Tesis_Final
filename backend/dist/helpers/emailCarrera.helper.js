import { AppDataSource } from "../config/configDb.js";
import UserEntity from "../entity/user.entity.js";
export async function getEmailsCarrera(carreraId) {
    const users = await AppDataSource.getRepository(UserEntity).find({
        where: { carreraId },
        select: { email: true },
    });
    const emails = users
        .map((u) => u.email)
        .filter((e) => typeof e === "string" && e.includes("@"));
    return [...new Set(emails)];
}
