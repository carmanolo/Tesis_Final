const DEFAULT_COMPROMISO = "NO HAY COMPROMISO";
const DEFAULT_ID = 0;
const DEFAULT_NAME = "Sin asignar";

const findCompromiso = (compromisoList: unknown[], id: number | string): string => {
  if (!Array.isArray(compromisoList)) {
    return DEFAULT_COMPROMISO;
  }

  const foundCompromiso = compromisoList.find((c) => {
    try {
      if (typeof c !== "string") {
        return false;
      }
      const [newID] = c.split(". ");
      return Number(newID?.trim()) === Number(id);
    } catch (error) {
      console.error(error);
      return false;
    }
  });

  return typeof foundCompromiso === "string" ? foundCompromiso : DEFAULT_COMPROMISO;
};

export class DisplayCompromiso {
  private _id_compromiso: number;
  private _descripcion_compromiso: string;

  constructor(compromisoList: string[] = [], id_compromiso: number | string = 0) {
    try {
      const found = findCompromiso(compromisoList, id_compromiso);
      if (found === DEFAULT_COMPROMISO || !found) {
        this._id_compromiso = DEFAULT_ID;
        this._descripcion_compromiso = DEFAULT_NAME;
        return;
      }

      const [idPart, ...rest] = found.split(". ");
      this._id_compromiso = Number(idPart?.trim()) || DEFAULT_ID;
      this._descripcion_compromiso = rest.join(". ").trim();
    } catch (error) {
      console.error(error);
      this._id_compromiso = DEFAULT_ID;
      this._descripcion_compromiso = DEFAULT_NAME;
    }
  }

  get id_compromiso(): number {
    return this._id_compromiso;
  }

  get descripcion_compromiso(): string {
    return this._descripcion_compromiso;
  }
}

export default DisplayCompromiso;

