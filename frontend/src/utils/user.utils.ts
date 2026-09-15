export const getCarreraSigla = (carrera: unknown): string => {
  const DEFAULT_SIGLA = "NADA";
  if (typeof carrera !== "string") {
    return DEFAULT_SIGLA;
  }
  try {
    const splitCarrera = carrera.split("(")[1];
    if (!splitCarrera) return DEFAULT_SIGLA;

    return splitCarrera.replace(")", "").trim() || DEFAULT_SIGLA;
  } catch (error) {
    console.error(error);
    return DEFAULT_SIGLA;
  }
};

export const getCarreraNombre = (carrera: unknown): string => {
  const DEFAULT_NAME = "juanito perez";
  if (typeof carrera !== "string") {
    return DEFAULT_NAME;
  }
  try {
    const splitCarrera = carrera.split("(")[0];
    const nameCarrera = splitCarrera ? splitCarrera.trim() : "";
    const nameCarreraWithoutId = nameCarrera.split(". ")[1];

    return nameCarreraWithoutId?.trim() || DEFAULT_NAME;
  } catch (error) {
    console.error(error);
    return DEFAULT_NAME;
  }
};

export const getCarreraSiglaFromCarreraList = (carrera: unknown): string => {
  const DEFAULT_SIGLA = "NADA";
  if (!carrera || typeof carrera !== "string") {
    return DEFAULT_SIGLA;
  }

  try {
    const siglaPart = carrera.split("(")[1];
    if (!siglaPart) return DEFAULT_SIGLA;

    return siglaPart.replace(")", "").trim() || DEFAULT_SIGLA;
  } catch (error) {
    console.error(error);
    return DEFAULT_SIGLA;
  }
};

export const processCarreras = (carreras: unknown): string[] => {
  const DEFAULT_CARRERA = "NO EXISTE CARRERA (NADA)";

  if (!Array.isArray(carreras)) {
    return [];
  }

  const newCarreras: string[] = carreras.map((carrera: unknown) => {
    try {
      if (typeof carrera !== "string") {
        console.error("El profesor debe ser un string: ", carrera);
        return DEFAULT_CARRERA;
      }

      return carrera.split(". ")[1]?.trim() || DEFAULT_CARRERA;
    } catch (error) {
      console.error(error);
      return DEFAULT_CARRERA;
    }
  });

  return newCarreras;
};




