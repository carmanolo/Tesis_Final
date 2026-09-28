export const processCarreras = (carreras) => {
    const DEFAULT_CARRERAS = [];
    if (!Array.isArray(carreras)) {
        console.error("¡Los profesores deben ser un arreglo!");
        return DEFAULT_CARRERAS;
    }
    const processedCarreras = carreras.map((carrera) => {
        const id_carrera = carrera?.id_carrera ?? "0";
        const nombre_carrera = carrera?.nombre_carrera || "trabajo social";
        const sigla = carrera?.sigla || "ESAY";
        return `${id_carrera}. ${nombre_carrera} (${sigla})`;
    });
    return processedCarreras;
};
