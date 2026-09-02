import { getStats } from "@services/user.service";

export const useGetStats = () => {
    const fetchStats = async () => {
        try {
            const statsData = await getStats();
            return statsData;
        } catch (error) {
            console.error("Error consiguiendo las estadísticas:", error);
        }
    }
    return { fetchStats };
}

export default useGetStats;
