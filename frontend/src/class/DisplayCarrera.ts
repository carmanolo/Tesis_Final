import { SIN_ASIGNAR } from "../constants/user.constants";

const DEFAULT_CARRERA = "NO HAY CARRERA";
const DEFAULT_ID = 0;
const DEFAULT_NAME: string = SIN_ASIGNAR;
const DEFAULT_SIGLA = "NADA";

const findCarrera = (carreraList: unknown[], id: number | string): string => {
  if (!Array.isArray(carreraList)) {
    return DEFAULT_CARRERA;
  }

  const foundCarrera = carreraList.find((c) => {
    try {
      if (typeof c !== "string") {
        console.error("Carrera desconocida: ", String(c));
        return false;
      }

      const [newID] = c.split(". ");
      return Number(newID?.trim()) === Number(id);
    } catch (error) {
      console.error(error);
      return false;
    }
  });

  return typeof foundCarrera === "string" ? foundCarrera : DEFAULT_CARRERA;
};

export class DisplayCarrera {
  private _id_carrera: number;
  private _nombre_carrera: string;
  private _sigla: string;

  constructor(carreraList: string[] = [], id_carrera: number | string = 0) {
    try {
      const foundCarrera = findCarrera(carreraList, id_carrera);

      if (foundCarrera === DEFAULT_CARRERA || !foundCarrera) {
        this._id_carrera = DEFAULT_ID;
        this._nombre_carrera = DEFAULT_NAME;
        this._sigla = DEFAULT_SIGLA;
        return;
      }

      const [idPart, ...rest] = foundCarrera.split(". ");
      const remainingText = rest.join(". ");
      const [nombrePart, siglaPart] = remainingText.split("(");

      this._id_carrera = Number(idPart?.trim()) || DEFAULT_ID;
      this._nombre_carrera = nombrePart ? nombrePart.trim() : DEFAULT_NAME;
      this._sigla = siglaPart ? siglaPart.replace(")", "").trim() : DEFAULT_SIGLA;
    } catch {
      this._id_carrera = DEFAULT_ID;
      this._nombre_carrera = DEFAULT_NAME;
      this._sigla = DEFAULT_SIGLA;
    }
  }

  get id_carrera(): number {
    return Number(this._id_carrera || DEFAULT_ID);
  }
  set id_carrera(id_carrera: number | string) {
    this._id_carrera = Number(id_carrera);
  }

  get nombre_carrera(): string {
    return String(this._nombre_carrera || DEFAULT_NAME);
  }
  set nombre_carrera(nombre_carrera: string) {
    this._nombre_carrera = String(nombre_carrera || DEFAULT_NAME);
  }

  get sigla(): string {
    return String(this._sigla || DEFAULT_SIGLA);
  }
  set sigla(sigla: string) {
    this._sigla = String(sigla || DEFAULT_SIGLA);
  }
}

export default DisplayCarrera;