// ---------------------------------------------------------------------------
// TABLA DE SÍMBOLOS
//
// Sigue lo que pide el material del profesor: por cada identificador guarda
// número, nombre, dirección, tipo, valor, línea de declaración, líneas donde
// se referencia y ámbito. Soporta las tres operaciones principales:
//   - Inserción:   declarar()
//   - Búsqueda:    buscar()
//   - Eliminación: salirAmbito() (al cerrar un bloque, sus variables dejan de
//                  ser visibles; se conservan en el historial solo para mostrarlas)
//
// Internamente cada ámbito es un Map (tabla hash), que da inserción y
// búsqueda de bajo costo.
// ---------------------------------------------------------------------------

export interface SimboloTabla {
  numero: number;
  nombre: string;
  tipoDato: string; // int, char, float, char*, etc.
  esArreglo: boolean;
  tamanoArreglo?: number;
  esConstante: boolean;
  direccion: number; // desplazamiento simulado en bytes
  valor?: string; // solo constantes con valor literal
  lineaDeclaracion: number;
  columnaDeclaracion: number;
  lineasReferenciadas: number[];
  ambito: string;
}

/** Datos que entrega quien declara; el resto lo calcula la tabla. */
export type DatosSimbolo = Pick<
  SimboloTabla,
  | "nombre"
  | "tipoDato"
  | "esArreglo"
  | "tamanoArreglo"
  | "esConstante"
  | "valor"
  | "lineaDeclaracion"
  | "columnaDeclaracion"
>;

// Tamaño en bytes de cada tipo, usado para calcular las direcciones simuladas.
const TAMANO_TIPO: Record<string, number> = {
  char: 1,
  bool: 1,
  short: 2,
  int: 4,
  float: 4,
  long: 8,
  double: 8,
  "char*": 8,
};

interface Ambito {
  etiqueta: string;
  simbolos: Map<string, SimboloTabla>;
}

export class TablaSimbolos {
  private ambitos: Ambito[] = [{ etiqueta: "global", simbolos: new Map() }];
  private historial: SimboloTabla[] = [];
  private siguienteDireccion = 0;

  // --- ámbitos ---------------------------------------------------------------

  entrarAmbito(etiqueta: string) {
    this.ambitos.push({ etiqueta, simbolos: new Map() });
  }

  /** Eliminación: las variables del ámbito que se cierra dejan de ser visibles. */
  salirAmbito() {
    if (this.ambitos.length > 1) this.ambitos.pop();
  }

  ambitoActual(): string {
    return this.ambitos[this.ambitos.length - 1].etiqueta;
  }

  // --- inserción ---------------------------------------------------------------

  declarar(datos: DatosSimbolo): { exito: boolean; simbolo?: SimboloTabla; yaExistia?: SimboloTabla } {
    const actual = this.ambitos[this.ambitos.length - 1];
    const existente = actual.simbolos.get(datos.nombre);
    if (existente) {
      return { exito: false, yaExistia: existente };
    }

    const bytesBase = TAMANO_TIPO[datos.tipoDato] ?? 4;
    const bytes = datos.esArreglo ? bytesBase * Math.max(datos.tamanoArreglo ?? 1, 1) : bytesBase;

    const simbolo: SimboloTabla = {
      ...datos,
      numero: this.historial.length + 1,
      direccion: this.siguienteDireccion,
      lineasReferenciadas: [],
      ambito: actual.etiqueta,
    };
    this.siguienteDireccion += bytes;

    actual.simbolos.set(simbolo.nombre, simbolo);
    this.historial.push(simbolo);
    return { exito: true, simbolo };
  }

  // --- búsqueda ----------------------------------------------------------------

  /** Busca desde el ámbito más interno hacia el global (lo que es visible desde aquí). */
  buscar(nombre: string): SimboloTabla | undefined {
    for (let i = this.ambitos.length - 1; i >= 0; i--) {
      const s = this.ambitos[i].simbolos.get(nombre);
      if (s) return s;
    }
    return undefined;
  }

  existe(nombre: string): boolean {
    return this.buscar(nombre) !== undefined;
  }

  /** Busca un símbolo que existió pero cuyo ámbito ya se cerró (no es visible). */
  buscarEnAmbitoCerrado(nombre: string): SimboloTabla | undefined {
    for (let i = this.historial.length - 1; i >= 0; i--) {
      const s = this.historial[i];
      if (s.nombre === nombre && this.buscar(nombre) !== s) return s;
    }
    return undefined;
  }

  // --- referencias -------------------------------------------------------------

  referenciar(simbolo: SimboloTabla, linea: number | undefined) {
    if (linea === undefined) return;
    if (!simbolo.lineasReferenciadas.includes(linea)) {
      simbolo.lineasReferenciadas.push(linea);
      simbolo.lineasReferenciadas.sort((a, b) => a - b);
    }
  }

  // --- consulta ----------------------------------------------------------------

  /** Todos los símbolos declarados, en orden de declaración (incluye los de ámbitos ya cerrados). */
  listar(): SimboloTabla[] {
    return this.historial;
  }
}
