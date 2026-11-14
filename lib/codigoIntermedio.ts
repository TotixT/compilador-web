import { NodoAST } from "./parser";

// ---------------------------------------------------------------------------
// GENERACIÓN DE CÓDIGO INTERMEDIO — código de tres direcciones
//
// Forma: A := B op C
// Se usan variables temporales (t1, t2, ...) para partir operaciones largas
// en pasos pequeños, y etiquetas (L1, L2, ...) + goto para condicionales
// y ciclos, con la técnica clásica de "cortocircuito" para && y ||
// (igual a como lo mostró el profesor con el ejemplo del while).
// ---------------------------------------------------------------------------

export interface InstruccionTAC {
  numero: number;
  etiqueta?: string;
  texto: string;
}

class GeneradorTAC {
  private instrucciones: InstruccionTAC[] = [];
  private contadorTemp = 0;
  private contadorLabel = 0;
  private etiquetasPendientes: string[] = [];

  private nuevaTemp(): string {
    return `t${++this.contadorTemp}`;
  }

  private nuevaEtiqueta(): string {
    return `L${++this.contadorLabel}`;
  }

  private colocarEtiqueta(etiqueta: string) {
    this.etiquetasPendientes.push(etiqueta);
  }

  private emitir(texto: string) {
    const etiqueta = this.etiquetasPendientes.length
      ? this.etiquetasPendientes.join(", ")
      : undefined;
    this.etiquetasPendientes = [];
    this.instrucciones.push({ numero: this.instrucciones.length + 1, etiqueta, texto });
  }

  obtenerInstrucciones(): InstruccionTAC[] {
    // Si quedó una etiqueta sin nada después (ej: fin del programa),
    // se agrega una instrucción vacía "nop" para que la etiqueta no se pierda.
    if (this.etiquetasPendientes.length) {
      this.emitir("nop");
    }
    return this.instrucciones;
  }

  // --- sentencias -------------------------------------------------------

  generarPrograma(nodo: NodoAST) {
    (nodo.hijos ?? []).forEach((h) => this.generarSentencia(h));
  }

  private generarBloque(nodo: NodoAST) {
    (nodo.hijos ?? []).forEach((h) => this.generarSentencia(h));
  }

  private generarSentencia(nodo: NodoAST) {
    switch (nodo.tipo) {
      case "declaracion":
        // Una declaración sin valor no produce código ejecutable,
        // solo reserva el nombre (eso ya lo maneja la tabla de símbolos).
        break;

      case "declaracion_inferida": {
        const hijos = nodo.hijos ?? [];
        const nombre = hijos[1].valor!;
        const expr = hijos[3];
        const lugar = this.generarExpresion(expr);
        this.emitir(`${nombre} := ${lugar}`);
        break;
      }

      case "asignacion": {
        const hijos = nodo.hijos ?? [];
        const nombre = hijos[0].valor!;
        const tieneIndice = hijos[1]?.tipo === "indice";
        const expr = hijos[hijos.length - 1];
        const lugarValor = this.generarExpresion(expr);

        if (tieneIndice) {
          const lugarIndice = this.generarExpresion(hijos[1].hijos![0]);
          this.emitir(`${nombre}[${lugarIndice}] := ${lugarValor}`);
        } else {
          this.emitir(`${nombre} := ${lugarValor}`);
        }
        break;
      }

      case "sentencia_if": {
        const hijos = nodo.hijos ?? [];
        const cond = hijos[0];
        const bloqueSi = hijos[1];
        const bloqueElse = hijos[2];

        const Ltrue = this.nuevaEtiqueta();
        const Lfalse = this.nuevaEtiqueta();

        this.generarCondicion(cond, Ltrue, Lfalse);

        this.colocarEtiqueta(Ltrue);
        this.generarBloque(bloqueSi);

        if (bloqueElse) {
          const Lfin = this.nuevaEtiqueta();
          this.emitir(`goto ${Lfin}`);
          this.colocarEtiqueta(Lfalse);
          this.generarBloque(bloqueElse);
          this.colocarEtiqueta(Lfin);
        } else {
          this.colocarEtiqueta(Lfalse);
        }
        break;
      }

      case "sentencia_while": {
        const hijos = nodo.hijos ?? [];
        const cond = hijos[0];
        const cuerpo = hijos[1];

        const Linicio = this.nuevaEtiqueta();
        const Lcuerpo = this.nuevaEtiqueta();
        const Lfin = this.nuevaEtiqueta();

        this.colocarEtiqueta(Linicio);
        this.generarCondicion(cond, Lcuerpo, Lfin);
        this.colocarEtiqueta(Lcuerpo);
        this.generarBloque(cuerpo);
        this.emitir(`goto ${Linicio}`);
        this.colocarEtiqueta(Lfin);
        break;
      }

      case "bloque":
        this.generarBloque(nodo);
        break;

      case "llamada":
        this.generarLlamada(nodo);
        break;

      default:
        break;
    }
  }

  private generarLlamada(nodo: NodoAST): string | undefined {
    const args = nodo.hijos ?? [];
    const lugares = args.map((a) => this.generarExpresion(a));
    lugares.forEach((l) => this.emitir(`param ${l}`));
    this.emitir(`call ${nodo.valor}, ${lugares.length}`);
    return undefined; // las llamadas que usamos (console.log) no devuelven valor
  }

  /**
   * Genera saltos condicionales: si nodo es verdadero, salta a Ltrue;
   * si es falso, salta a Lfalse. Implementa cortocircuito para && y ||,
   * igual a la técnica del ejemplo del profesor.
   */
  private generarCondicion(nodo: NodoAST, Ltrue: string, Lfalse: string) {
    if (nodo.tipo === "operacion" && nodo.valor === "&&") {
      const [izq, der] = nodo.hijos!;
      const Lmid = this.nuevaEtiqueta();
      this.generarCondicion(izq, Lmid, Lfalse);
      this.colocarEtiqueta(Lmid);
      this.generarCondicion(der, Ltrue, Lfalse);
      return;
    }

    if (nodo.tipo === "operacion" && nodo.valor === "||") {
      const [izq, der] = nodo.hijos!;
      const Lmid = this.nuevaEtiqueta();
      this.generarCondicion(izq, Ltrue, Lmid);
      this.colocarEtiqueta(Lmid);
      this.generarCondicion(der, Ltrue, Lfalse);
      return;
    }

    if (nodo.tipo === "operacion" && nodo.valor === "!") {
      this.generarCondicion(nodo.hijos![0], Lfalse, Ltrue);
      return;
    }

    const RELACIONALES = new Set(["<", ">", "<=", ">=", "==", "!="]);
    if (nodo.tipo === "operacion" && RELACIONALES.has(nodo.valor!)) {
      const izq = this.generarExpresion(nodo.hijos![0]);
      const der = this.generarExpresion(nodo.hijos![1]);
      this.emitir(`if ${izq} ${nodo.valor} ${der} goto ${Ltrue}`);
      this.emitir(`goto ${Lfalse}`);
      return;
    }

    // Cualquier otra expresión usada como condición (ej: una variable sola)
    const lugar = this.generarExpresion(nodo);
    this.emitir(`if ${lugar} goto ${Ltrue}`);
    this.emitir(`goto ${Lfalse}`);
  }

  // --- expresiones --------------------------------------------------------

  /** Genera el código de una expresión y devuelve el "lugar" (variable, temporal o literal) donde queda el resultado. */
  private generarExpresion(nodo: NodoAST): string {
    switch (nodo.tipo) {
      case "numero_entero":
      case "numero_decimal":
        return nodo.valor!;

      case "cadena":
        return nodo.valor!;

      case "identificador":
        return nodo.valor!;

      case "acceso_arreglo": {
        const lugarIndice = this.generarExpresion(nodo.hijos![0]);
        const t = this.nuevaTemp();
        this.emitir(`${t} := ${nodo.valor}[${lugarIndice}]`);
        return t;
      }

      case "llamada": {
        const args = nodo.hijos ?? [];
        const lugares = args.map((a) => this.generarExpresion(a));
        lugares.forEach((l) => this.emitir(`param ${l}`));
        const t = this.nuevaTemp();
        this.emitir(`${t} := call ${nodo.valor}, ${lugares.length}`);
        return t;
      }

      case "operacion":
        return this.generarOperacion(nodo);

      default:
        return "?";
    }
  }

  private generarOperacion(nodo: NodoAST): string {
    const op = nodo.valor!;
    const BOOLEANOS = new Set(["<", ">", "<=", ">=", "==", "!=", "&&", "||", "!"]);

    if (BOOLEANOS.has(op)) {
      // Una expresión booleana usada como VALOR (ej: bandera = a > 0;),
      // no como condición de salto. Se materializa en 0/1 con un temporal.
      const Ltrue = this.nuevaEtiqueta();
      const Lfalse = this.nuevaEtiqueta();
      const Lfin = this.nuevaEtiqueta();
      const t = this.nuevaTemp();

      this.generarCondicion(nodo, Ltrue, Lfalse);
      this.colocarEtiqueta(Ltrue);
      this.emitir(`${t} := 1`);
      this.emitir(`goto ${Lfin}`);
      this.colocarEtiqueta(Lfalse);
      this.emitir(`${t} := 0`);
      this.colocarEtiqueta(Lfin);
      return t;
    }

    // Operador aritmético: + - * / %
    const izq = this.generarExpresion(nodo.hijos![0]);
    const der = this.generarExpresion(nodo.hijos![1]);
    const t = this.nuevaTemp();
    this.emitir(`${t} := ${izq} ${op} ${der}`);
    return t;
  }
}

export function generarCodigoIntermedio(arbol: NodoAST): InstruccionTAC[] {
  const generador = new GeneradorTAC();
  generador.generarPrograma(arbol);
  return generador.obtenerInstrucciones();
}
