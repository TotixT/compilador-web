import { Token } from "./types";

// ---------------------------------------------------------------------------
// GRAMÁTICA (notación BNF simplificada) que reconoce este parser:
//
//   programa        -> sentencia*
//   sentencia       -> declaracion | asignacion | sentenciaIf | sentenciaWhile
//                       | llamada ';' | bloque
//   declaracion     -> tipoDato declarador (',' declarador)* ';'
//   declarador      -> id ('[' numero_entero ']')?
//   asignacion      -> id ('[' expresion ']')? '=' expresion ';'
//   sentenciaIf     -> 'if' '(' expresion ')' bloque ('else' bloque)?
//   sentenciaWhile  -> 'while' '(' expresion ')' bloque
//   bloque          -> '{' sentencia* '}'
//   llamada         -> id ('.' id)* '(' argumentos? ')'
//   argumentos      -> expresion (',' expresion)*
//   expresion       -> expOr
//   expOr           -> expAnd ('||' expAnd)*
//   expAnd          -> expRel ('&&' expRel)*
//   expRel          -> expAdd (operador_relacional expAdd)?
//   expAdd          -> expMul (('+'|'-') expMul)*
//   expMul          -> factor (('*'|'/'|'%') factor)*
//   factor          -> numero | cadena | id | llamada | '(' expresion ')' | '!' factor
// ---------------------------------------------------------------------------

export interface NodoAST {
  tipo: string; // nombre de la regla gramatical, o "token" si es una hoja
  valor?: string; // lexema, solo para hojas
  linea?: number;
  columna?: number;
  tamano?: number; // solo en declaradores de arreglo
  hijos?: NodoAST[];
}

export interface ErrorSintactico {
  mensaje: string;
  linea: number;
  columna: number;
}

export interface ResultadoParser {
  arbol: NodoAST | null;
  errores: ErrorSintactico[];
  valido: boolean;
}

const TIPOS_DATO = new Set(["int", "char", "float", "double", "void", "long", "short"]);

/** Señal interna para abortar la regla actual y sincronizar */
class ErrorDeSincronizacion extends Error {}

class Parser {
  private tokens: Token[];
  private pos = 0;
  public errores: ErrorSintactico[] = [];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  // --- utilidades de bajo nivel -------------------------------------------

  private actual(): Token | undefined {
    return this.tokens[this.pos];
  }

  private fin(): boolean {
    return this.pos >= this.tokens.length;
  }

  private avanzar(): Token | undefined {
    return this.tokens[this.pos++];
  }

  private coincideLexema(...lexemas: string[]): boolean {
    const t = this.actual();
    return !!t && lexemas.includes(t.lexema);
  }

  private coincideCategoria(...categorias: string[]): boolean {
    const t = this.actual();
    return !!t && categorias.includes(t.categoria);
  }

  private registrarError(mensaje: string) {
    const t = this.actual();
    this.errores.push({
      mensaje,
      linea: t?.linea ?? this.tokens[this.tokens.length - 1]?.linea ?? 0,
      columna: t?.columna ?? 0,
    });
  }

  /** Exige un lexema exacto (ej: ';', '(', 'if'). Si falla, lanza para sincronizar. */
  private esperarLexema(lexema: string): Token {
    if (this.coincideLexema(lexema)) {
      return this.avanzar()!;
    }
    const encontrado = this.actual()?.lexema ?? "fin de archivo";
    this.registrarError(`Se esperaba "${lexema}" pero se encontró "${encontrado}"`);
    throw new ErrorDeSincronizacion();
  }

  /** Exige un token de cierta categoría (ej: identificador). */
  private esperarCategoria(categoria: string, descripcion: string): Token {
    if (this.coincideCategoria(categoria)) {
      return this.avanzar()!;
    }
    const encontrado = this.actual()?.lexema ?? "fin de archivo";
    this.registrarError(`Se esperaba ${descripcion} pero se encontró "${encontrado}"`);
    throw new ErrorDeSincronizacion();
  }

  /** Modo pánico: descarta tokens hasta encontrar un punto seguro para reanudar. */
  private sincronizar() {
    while (!this.fin()) {
      const t = this.actual()!;
      if (t.lexema === ";") {
        this.avanzar();
        return;
      }
      if (t.lexema === "}" || t.lexema === "{") {
        return;
      }
      this.avanzar();
    }
  }

  /**
   * Envuelve una llamada a parseSentencia() capturando errores de sincronización.
   * CRÍTICO: garantiza que la posición siempre avance al menos un token,
   * incluso si sincronizar() no pudo consumir nada (ej: quedó parado justo
   * en un "}" inesperado). Sin esta garantía, el bucle que llama a este
   * método puede quedar congelado para siempre repitiendo el mismo error.
   */
  private intentarSentencia(hijos: NodoAST[]) {
    const posAntes = this.pos;
    try {
      hijos.push(this.parseSentencia());
    } catch (e) {
      if (!(e instanceof ErrorDeSincronizacion)) throw e;
      this.sincronizar();
      if (this.pos === posAntes && !this.fin()) {
        // La sincronización no logró avanzar: forzamos consumir un token
        // para garantizar progreso y evitar un bucle infinito.
        this.avanzar();
      }
    }
  }

  // --- reglas de la gramática ----------------------------------------------

  parsePrograma(): NodoAST {
    const hijos: NodoAST[] = [];
    const LIMITE_SEGURIDAD = 10000;
    let pasos = 0;
    while (!this.fin()) {
      pasos++;
      if (pasos > LIMITE_SEGURIDAD) {
        this.registrarError(
          "El analizador se detuvo por seguridad (posible bucle infinito). Revisa el código fuente."
        );
        break;
      }
      this.intentarSentencia(hijos);
    }
    return { tipo: "programa", hijos };
  }

  private parseSentencia(): NodoAST {
    const t = this.actual();
    if (!t) {
      this.registrarError("Se esperaba una sentencia pero el código terminó");
      throw new ErrorDeSincronizacion();
    }

    if (t.lexema === "const") {
      const siguiente = this.tokens[this.pos + 1];
      const esConstTipada =
        siguiente?.categoria === "palabra_reservada" && TIPOS_DATO.has(siguiente.lexema);
      return esConstTipada ? this.parseDeclaracion() : this.parseDeclaracionInferida();
    }
    if (t.categoria === "palabra_reservada" && TIPOS_DATO.has(t.lexema)) {
      return this.parseDeclaracion();
    }
    if (t.lexema === "if") return this.parseSentenciaIf();
    if (t.lexema === "while") return this.parseSentenciaWhile();
    if (t.lexema === "{") return this.parseBloque();

    if (t.categoria === "identificador") {
      // Puede ser asignación (id = ...) o llamada (id(...) / id.metodo(...))
      const siguiente = this.tokens[this.pos + 1];
      if (siguiente && (siguiente.lexema === "(" || siguiente.lexema === ".")) {
        const nodo = this.parseLlamada();
        this.esperarLexema(";");
        return nodo;
      }
      return this.parseAsignacion();
    }

    this.registrarError(`Token inesperado "${t.lexema}" al iniciar una sentencia`);
    throw new ErrorDeSincronizacion();
  }

  private parseDeclaracion(): NodoAST {
    let calificadorTok: Token | null = null;
    if (this.coincideLexema("const")) {
      calificadorTok = this.avanzar()!;
    }

    const tipoTok = this.esperarCategoria("palabra_reservada", "un tipo de dato (int, char, float...)");
    if (!TIPOS_DATO.has(tipoTok.lexema)) {
      this.registrarError(`"${tipoTok.lexema}" no es un tipo de dato válido`);
      throw new ErrorDeSincronizacion();
    }

    const declaradores: NodoAST[] = [this.parseDeclarador()];

    while (this.coincideLexema(",")) {
      this.avanzar();
      declaradores.push(this.parseDeclarador());
    }

    this.esperarLexema(";");

    const hijos: NodoAST[] = [];
    if (calificadorTok) {
      hijos.push({ tipo: "token", valor: calificadorTok.lexema, linea: calificadorTok.linea, columna: calificadorTok.columna });
    }
    hijos.push({ tipo: "token", valor: tipoTok.lexema, linea: tipoTok.linea, columna: tipoTok.columna }, ...declaradores);

    return {
      tipo: "declaracion",
      linea: (calificadorTok ?? tipoTok).linea,
      columna: (calificadorTok ?? tipoTok).columna,
      hijos,
    };
  }

  private parseDeclaracionInferida(): NodoAST {
    const constTok = this.esperarLexema("const");
    const idTok = this.esperarCategoria("identificador", "un identificador");
    this.esperarLexema("=");
    const expr = this.parseExpresion();
    this.esperarLexema(";");

    const tipoInferido = this.inferirTipo(expr);

    return {
      tipo: "declaracion_inferida",
      linea: constTok.linea,
      columna: constTok.columna,
      hijos: [
        { tipo: "token", valor: "const", linea: constTok.linea, columna: constTok.columna },
        { tipo: "token", valor: idTok.lexema, linea: idTok.linea, columna: idTok.columna },
        { tipo: "token", valor: `(tipo inferido: ${tipoInferido})`, linea: idTok.linea, columna: idTok.columna },
        expr,
      ],
    };
  }

  /** Infiere un tipo de dato básico a partir de la expresión del lado derecho. */
  private inferirTipo(expr: NodoAST): string {
    if (expr.tipo === "numero_entero") return "int";
    if (expr.tipo === "numero_decimal") return "float";
    if (expr.tipo === "cadena") return "char*";
    return "inferido";
  }

  private parseDeclarador(): NodoAST {
    const idTok = this.esperarCategoria("identificador", "un identificador");
    let esArreglo = false;
    let tamano: number | undefined;

    if (this.coincideLexema("[")) {
      this.avanzar();
      const numTok = this.esperarCategoria("numero_entero", "un número entero (tamaño del arreglo)");
      tamano = parseInt(numTok.lexema, 10);
      this.esperarLexema("]");
      esArreglo = true;
    }

    return {
      tipo: "declarador",
      valor: idTok.lexema,
      linea: idTok.linea,
      columna: idTok.columna,
      tamano: esArreglo ? tamano : undefined,
      hijos: esArreglo
        ? [{ tipo: "token", valor: `[${tamano}]`, linea: idTok.linea, columna: idTok.columna }]
        : undefined,
    };
  }

  private parseAsignacion(): NodoAST {
    const idTok = this.esperarCategoria("identificador", "un identificador");
    let indice: NodoAST | undefined;

    if (this.coincideLexema("[")) {
      this.avanzar();
      indice = this.parseExpresion();
      this.esperarLexema("]");
    }

    this.esperarLexema("=");
    const expr = this.parseExpresion();
    this.esperarLexema(";");

    const hijos: NodoAST[] = [{ tipo: "token", valor: idTok.lexema, linea: idTok.linea, columna: idTok.columna }];
    if (indice) hijos.push({ tipo: "indice", hijos: [indice] });
    hijos.push(expr);

    return { tipo: "asignacion", linea: idTok.linea, columna: idTok.columna, hijos };
  }

  private parseSentenciaIf(): NodoAST {
    const ifTok = this.esperarLexema("if");
    this.esperarLexema("(");
    const cond = this.parseExpresion();
    this.esperarLexema(")");
    const bloqueSi = this.parseBloque();

    const hijos = [cond, bloqueSi];
    if (this.coincideLexema("else")) {
      this.avanzar();
      hijos.push(this.parseBloque());
    }

    return { tipo: "sentencia_if", linea: ifTok.linea, columna: ifTok.columna, hijos };
  }

  private parseSentenciaWhile(): NodoAST {
    const whileTok = this.esperarLexema("while");
    this.esperarLexema("(");
    const cond = this.parseExpresion();
    this.esperarLexema(")");
    const cuerpo = this.parseBloque();
    return { tipo: "sentencia_while", linea: whileTok.linea, columna: whileTok.columna, hijos: [cond, cuerpo] };
  }

  private parseBloque(): NodoAST {
    const abre = this.esperarLexema("{");
    const hijos: NodoAST[] = [];
    while (!this.coincideLexema("}") && !this.fin()) {
      this.intentarSentencia(hijos);
    }
    this.esperarLexema("}");
    return { tipo: "bloque", linea: abre.linea, columna: abre.columna, hijos };
  }

  private parseLlamada(): NodoAST {
    const idTok = this.esperarCategoria("identificador", "un identificador");
    let nombreCompleto = idTok.lexema;

    while (this.coincideLexema(".")) {
      this.avanzar();
      const miembro = this.esperarCategoria("identificador", "un identificador");
      nombreCompleto += "." + miembro.lexema;
    }

    this.esperarLexema("(");
    const argumentos: NodoAST[] = [];
    if (!this.coincideLexema(")")) {
      argumentos.push(this.parseExpresion());
      while (this.coincideLexema(",")) {
        this.avanzar();
        argumentos.push(this.parseExpresion());
      }
    }
    this.esperarLexema(")");

    return {
      tipo: "llamada",
      valor: nombreCompleto,
      linea: idTok.linea,
      columna: idTok.columna,
      hijos: argumentos,
    };
  }

  // --- expresiones (precedencia de menor a mayor) ---------------------------

  private parseExpresion(): NodoAST {
    return this.parseExpOr();
  }

  private parseExpOr(): NodoAST {
    let izq = this.parseExpAnd();
    while (this.coincideLexema("||")) {
      const op = this.avanzar()!;
      const der = this.parseExpAnd();
      izq = { tipo: "operacion", valor: op.lexema, linea: op.linea, columna: op.columna, hijos: [izq, der] };
    }
    return izq;
  }

  private parseExpAnd(): NodoAST {
    let izq = this.parseExpRel();
    while (this.coincideLexema("&&")) {
      const op = this.avanzar()!;
      const der = this.parseExpRel();
      izq = { tipo: "operacion", valor: op.lexema, linea: op.linea, columna: op.columna, hijos: [izq, der] };
    }
    return izq;
  }

  private parseExpRel(): NodoAST {
    let izq = this.parseExpAdd();
    if (this.coincideCategoria("operador_relacional")) {
      const op = this.avanzar()!;
      const der = this.parseExpAdd();
      izq = { tipo: "operacion", valor: op.lexema, linea: op.linea, columna: op.columna, hijos: [izq, der] };
    }
    return izq;
  }

  private parseExpAdd(): NodoAST {
    let izq = this.parseExpMul();
    while (this.coincideLexema("+", "-")) {
      const op = this.avanzar()!;
      const der = this.parseExpMul();
      izq = { tipo: "operacion", valor: op.lexema, linea: op.linea, columna: op.columna, hijos: [izq, der] };
    }
    return izq;
  }

  private parseExpMul(): NodoAST {
    let izq = this.parseFactor();
    while (this.coincideLexema("*", "/", "%")) {
      const op = this.avanzar()!;
      const der = this.parseFactor();
      izq = { tipo: "operacion", valor: op.lexema, linea: op.linea, columna: op.columna, hijos: [izq, der] };
    }
    return izq;
  }

  private parseFactor(): NodoAST {
    const t = this.actual();

    if (!t) {
      this.registrarError("Se esperaba una expresión pero el código terminó");
      throw new ErrorDeSincronizacion();
    }

    if (t.lexema === "!") {
      this.avanzar();
      const operando = this.parseFactor();
      return { tipo: "operacion", valor: "!", linea: t.linea, columna: t.columna, hijos: [operando] };
    }

    if (t.lexema === "(") {
      this.avanzar();
      const expr = this.parseExpresion();
      this.esperarLexema(")");
      return expr;
    }

    if (t.categoria === "numero_entero" || t.categoria === "numero_decimal") {
      this.avanzar();
      return { tipo: t.categoria, valor: t.lexema, linea: t.linea, columna: t.columna };
    }

    if (t.categoria === "cadena") {
      this.avanzar();
      return { tipo: "cadena", valor: t.lexema, linea: t.linea, columna: t.columna };
    }

    if (t.categoria === "identificador") {
      const siguiente = this.tokens[this.pos + 1];
      if (siguiente && (siguiente.lexema === "(" || siguiente.lexema === ".")) {
        return this.parseLlamada();
      }
      this.avanzar();
      if (this.coincideLexema("[")) {
        this.avanzar();
        const indice = this.parseExpresion();
        this.esperarLexema("]");
        return { tipo: "acceso_arreglo", valor: t.lexema, linea: t.linea, columna: t.columna, hijos: [indice] };
      }
      return { tipo: "identificador", valor: t.lexema, linea: t.linea, columna: t.columna };
    }

    this.registrarError(`Token inesperado "${t.lexema}" dentro de una expresión`);
    throw new ErrorDeSincronizacion();
  }
}

export function analizarSintaxis(tokens: Token[]): ResultadoParser {
  // Los tokens "desconocido" ya se reportaron como error léxico;
  // para el sintáctico los ignoramos para no duplicar el ruido.
  const tokensValidos = tokens.filter((t) => t.categoria !== "desconocido");

  const parser = new Parser(tokensValidos);
  const arbol = parser.parsePrograma();

  return {
    arbol,
    errores: parser.errores,
    valido: parser.errores.length === 0,
  };
}
