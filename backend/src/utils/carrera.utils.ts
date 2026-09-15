export interface Carrera {
  id_carrera?: string | number;
  nombre_carrera?: string;
  sigla?: string;
}

export const processCarreras = (carreras: Carrera[] | unknown): string[] => {
  const DEFAULT_CARRERAS: string[] = [];

  if (!Array.isArray(carreras)) {
    console.error("¡Los profesores deben ser un arreglo!");
    return DEFAULT_CARRERAS;
  }

  const processedCarreras = carreras.map((carrera: Carrera) => {
    const id_carrera = carrera?.id_carrera ?? "0";
    const nombre_carrera = carrera?.nombre_carrera || "trabajo social";
    const sigla = carrera?.sigla || "ESAY";

    return `${id_carrera}. ${nombre_carrera} (${sigla})`;
  });

  return processedCarreras;
};