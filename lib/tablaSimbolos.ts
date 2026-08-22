export interface SimboloTabla {
  nombre: string;
  tipoDato: string; // int, char, float, etc.
  esArreglo: boolean;
  tamanoArreglo?: number;
  lineaDeclaracion: number;
}

/**
 * La tabla de símbolos es simplemente un mapa nombre -> símbolo.
 * Se va llenando durante el análisis sintáctico (cuando se reconocen
 * declaraciones) y se consulta durante el análisis semántico
 * (para validar tipos y usos).
 */
export class TablaSimbolos {
  private simbolos = new Map<string, SimboloTabla>();

  declarar(simbolo: SimboloTabla): { exito: boolean; yaExistia?: SimboloTabla } {
    const existente = this.simbolos.get(simbolo.nombre);
    if (existente) {
      return { exito: false, yaExistia: existente };
    }
    this.simbolos.set(simbolo.nombre, simbolo);
    return { exito: true };
  }

  buscar(nombre: string): SimboloTabla | undefined {
    return this.simbolos.get(nombre);
  }

  existe(nombre: string): boolean {
    return this.simbolos.has(nombre);
  }

  listar(): SimboloTabla[] {
    return Array.from(this.simbolos.values());
  }
}
