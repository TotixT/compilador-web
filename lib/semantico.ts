// © 2026 Santiago López García y Oscar Julián Mojica Calderón. Ver el archivo LICENSE.
import { NodoAST } from "./parser";
import { TablaSimbolos } from "./tablaSimbolos";

// ---------------------------------------------------------------------------
// ANÁLISIS SEMÁNTICO
//
// Recorre el árbol sintáctico EN ORDEN y, siguiendo las funciones generales del
// análisis semántico del material del profesor:
//   - registra las declaraciones en la tabla de símbolos (con su ámbito)
//   - detecta identificadores no declarados, usados antes de declararse o fuera
//     de su ámbito, y declarados más de una vez en el mismo ámbito
//   - infiere y comprueba tipos en expresiones y asignaciones
//   - exige condiciones booleanas en if / while
//   - impide modificar constantes
//   - comprueba cantidad y tipo de argumentos en las llamadas a funciones
//
// Cada hallazgo indica línea y columna, igual que los ejemplos del profesor.
// Los tipos que se calculan de abajo hacia arriba (tipoDe) son los atributos
// "sintetizados" del árbol; el tipo declarado que baja a cada variable de una
// lista (float x, y;) es el atributo "heredado".
// ---------------------------------------------------------------------------

export type Severidad = "error" | "advertencia";

export interface HallazgoSemantico {
  mensaje: string;
  linea: number;
  columna: number; // 0 si no se conoce
  severidad: Severidad;
}

export interface ResultadoSemantico {
  hallazgos: HallazgoSemantico[];
  valido: boolean; // true si no hay hallazgos de severidad "error"
  tablaSimbolos: TablaSimbolos;
}

/** Tipo de una expresión. Si arreglo está definido, es un arreglo de ese tamaño. */
interface TipoExp {
  base: string;
  arreglo?: number;
}

/** Posición en el código fuente (la cumple cualquier NodoAST). */
interface Pos {
  linea?: number;
  columna?: number;
}

const DESCONOCIDO: TipoExp = { base: "desconocido" };

// Rango numérico: sirve para saber si una asignación estrecha el tipo
const RANGO: Record<string, number> = {
  bool: 0, char: 1, short: 2, int: 3, long: 4, float: 5, double: 6,
};
const NOMBRE_POR_RANGO: Record<number, string> = { 3: "int", 4: "long", 5: "float", 6: "double" };
const ENTEROS = new Set(["char", "short", "int", "long", "bool"]);
const RELACIONALES = new Set(["<", ">", "<=", ">=", "==", "!="]);

interface FirmaFuncion {
  min: number;
  max: number;
  primeroCadena?: boolean; // el primer argumento debe ser una cadena
}

// Funciones conocidas y su firma (cantidad y tipo de argumentos)
const FUNCIONES: Record<string, FirmaFuncion> = {
  "console.log": { min: 1, max: Infinity },
  "console.error": { min: 1, max: Infinity },
  "console.warn": { min: 1, max: Infinity },
  printf: { min: 1, max: Infinity, primeroCadena: true },
  print: { min: 1, max: 1 },
};

const esNumerico = (t: string) => t in RANGO;
const esEntero = (t: string) => ENTEROS.has(t);

function tipoTexto(t: TipoExp): string {
  return t.arreglo !== undefined ? `${t.base}[${t.arreglo}]` : t.base;
}

function textoCantidad(f: FirmaFuncion): string {
  const plural = (n: number) => `${n} argumento${n === 1 ? "" : "s"}`;
  if (f.max === Infinity) return `al menos ${plural(f.min)}`;
  if (f.min === f.max) return `exactamente ${plural(f.min)}`;
  return `entre ${f.min} y ${f.max} argumentos`;
}

/** Recorre el árbol y junta todos los nombres que se declaran en algún punto. */
function recolectarDeclarados(nodo: NodoAST, destino: Set<string>) {
  if (nodo.tipo === "declarador" && nodo.valor) destino.add(nodo.valor);
  if (nodo.tipo === "declaracion_inferida" && nodo.hijos?.[1]?.valor) destino.add(nodo.hijos[1].valor);
  nodo.hijos?.forEach((h) => recolectarDeclarados(h, destino));
}

class AnalizadorSemantico {
  hallazgos: HallazgoSemantico[] = [];
  readonly tabla = new TablaSimbolos();
  private declaradosEnAlgunLugar = new Set<string>();

  constructor(arbol: NodoAST) {
    recolectarDeclarados(arbol, this.declaradosEnAlgunLugar);
  }

  private reportar(severidad: Severidad, mensaje: string, pos: Pos) {
    this.hallazgos.push({ severidad, mensaje, linea: pos.linea ?? 0, columna: pos.columna ?? 0 });
  }

  /** Mensaje para un identificador que no se puede usar en este punto. */
  private mensajeNoVisible(nombre: string): string {
    const cerrado = this.tabla.buscarEnAmbitoCerrado(nombre);
    if (cerrado) {
      return `La variable "${nombre}" no es visible aquí: se declaró en la línea ${cerrado.lineaDeclaracion} dentro del ámbito "${cerrado.ambito}"`;
    }
    if (this.declaradosEnAlgunLugar.has(nombre)) {
      return `La variable "${nombre}" se usa antes de ser declarada`;
    }
    return `Identificador no declarado: "${nombre}"`;
  }

  // --- sentencias -----------------------------------------------------------

  visitar(nodo: NodoAST) {
    switch (nodo.tipo) {
      case "programa":
        nodo.hijos?.forEach((h) => this.visitar(h));
        break;
      case "bloque":
        this.visitarBloque(nodo, `bloque (línea ${nodo.linea})`);
        break;
      case "declaracion":
        this.visitarDeclaracion(nodo);
        break;
      case "declaracion_inferida":
        this.visitarDeclaracionInferida(nodo);
        break;
      case "asignacion":
        this.visitarAsignacion(nodo);
        break;
      case "sentencia_if":
      case "sentencia_while":
        this.visitarCondicional(nodo);
        break;
      case "llamada":
        this.tipoDe(nodo);
        break;
      default:
        nodo.hijos?.forEach((h) => this.visitar(h));
    }
  }

  /** Un bloque abre un ámbito nuevo; al cerrarse, sus variables dejan de ser visibles. */
  private visitarBloque(nodo: NodoAST, etiquetaAmbito: string) {
    this.tabla.entrarAmbito(etiquetaAmbito);
    nodo.hijos?.forEach((h) => this.visitar(h));
    this.tabla.salirAmbito();
  }

  private declarar(
    nombre: string,
    tipoDato: string,
    pos: Pos,
    opciones: { tamano?: number; esConstante: boolean; valor?: string }
  ) {
    const resultado = this.tabla.declarar({
      nombre,
      tipoDato,
      esArreglo: opciones.tamano !== undefined,
      tamanoArreglo: opciones.tamano,
      esConstante: opciones.esConstante,
      valor: opciones.valor,
      lineaDeclaracion: pos.linea ?? 0,
      columnaDeclaracion: pos.columna ?? 0,
    });

    if (!resultado.exito) {
      this.reportar(
        "error",
        `La variable "${nombre}" ya había sido declarada en la línea ${resultado.yaExistia?.lineaDeclaracion} (ámbito "${this.tabla.ambitoActual()}")`,
        pos
      );
    }
  }

  private visitarDeclaracion(nodo: NodoAST) {
    const hijos = nodo.hijos ?? [];
    const esConst = hijos[0]?.valor === "const";
    // El tipo declarado baja a cada variable de la lista (atributo heredado)
    const tipoDato = (esConst ? hijos[1] : hijos[0])?.valor ?? "";

    for (const decl of hijos.filter((h) => h.tipo === "declarador")) {
      const nombre = decl.valor!;

      if (tipoDato === "void") {
        this.reportar("error", `La variable "${nombre}" no puede ser de tipo void`, decl);
      }
      if (decl.tamano !== undefined && decl.tamano <= 0) {
        this.reportar("error", `El arreglo "${nombre}" debe tener un tamaño mayor que 0`, decl);
      }
      if (esConst) {
        this.reportar(
          "error",
          `La constante "${nombre}" debe inicializarse al declararla (usa const ${nombre} = valor;)`,
          decl
        );
      }

      this.declarar(nombre, tipoDato, decl, { tamano: decl.tamano, esConstante: esConst });
    }
  }

  private visitarDeclaracionInferida(nodo: NodoAST) {
    const hijos = nodo.hijos ?? [];
    const idNodo = hijos[1];
    const nombre = idNodo.valor!;
    const expr = hijos[3];

    // Primero se evalúa el valor (no puede usar la propia constante que declara)
    const tipo = this.tipoDe(expr);
    if (tipo.base === "void") {
      this.reportar("error", `La constante "${nombre}" no puede recibir un valor void`, idNodo);
    } else if (tipo.arreglo !== undefined) {
      this.reportar("error", `La constante "${nombre}" no puede recibir un arreglo completo`, idNodo);
    }

    const esLiteral =
      expr.tipo === "numero_entero" || expr.tipo === "numero_decimal" || expr.tipo === "cadena";

    this.declarar(nombre, tipo.base, idNodo, {
      esConstante: true,
      valor: esLiteral ? expr.valor : undefined,
    });
  }

  private visitarAsignacion(nodo: NodoAST) {
    const hijos = nodo.hijos ?? [];
    const nombre = hijos[0].valor!;
    const tieneIndice = hijos[1]?.tipo === "indice";
    const expr = hijos[hijos.length - 1];

    const tipoValor = this.tipoDe(expr);

    const simbolo = this.tabla.buscar(nombre);
    if (!simbolo) {
      this.reportar("error", this.mensajeNoVisible(nombre), nodo);
      if (tieneIndice) this.tipoDe(hijos[1].hijos![0]);
      return;
    }
    this.tabla.referenciar(simbolo, nodo.linea);

    if (simbolo.esConstante) {
      this.reportar("error", `No se puede modificar la constante "${nombre}"`, nodo);
    }

    if (tieneIndice) {
      if (!simbolo.esArreglo && simbolo.tipoDato !== "char*") {
        this.reportar("error", `"${nombre}" no es un arreglo, no se puede usar con índice`, nodo);
        return;
      }
      this.validarIndice(hijos[1].hijos![0], simbolo.tamanoArreglo, nombre, nodo);
      const destino = simbolo.tipoDato === "char*" ? "char" : simbolo.tipoDato;
      this.validarAsignacion({ base: destino }, tipoValor, expr, nombre, nodo);
      return;
    }

    if (simbolo.esArreglo) {
      const esTextoEnChar = simbolo.tipoDato === "char" && expr.tipo === "cadena";
      if (esTextoEnChar) {
        const largo = (expr.valor ?? "").length - 2;
        if (largo + 1 > (simbolo.tamanoArreglo ?? 0)) {
          this.reportar(
            "error",
            `El texto (${largo} caracteres + terminador) no cabe en "${nombre}" de tamaño ${simbolo.tamanoArreglo}`,
            nodo
          );
        }
      } else if (tipoValor.base !== "desconocido") {
        this.reportar(
          "error",
          `Tipo de variables asignadas incorrecta: "${nombre}" es ${tipoTexto({
            base: simbolo.tipoDato,
            arreglo: simbolo.tamanoArreglo,
          })} y no puede recibir un valor de tipo ${tipoTexto(tipoValor)}`,
          nodo
        );
      }
      return;
    }

    this.validarAsignacion({ base: simbolo.tipoDato }, tipoValor, expr, nombre, nodo);
  }

  private validarAsignacion(
    destino: TipoExp,
    valor: TipoExp,
    nodoValor: NodoAST,
    nombre: string,
    pos: Pos
  ) {
    if (valor.base === "desconocido" || destino.base === "desconocido") return;

    if (valor.base === "void") {
      this.reportar("error", `No se puede asignar un valor void a "${nombre}"`, pos);
      return;
    }
    if (valor.arreglo !== undefined) {
      this.reportar("error", `No se puede asignar el arreglo completo a "${nombre}"`, pos);
      return;
    }

    if (destino.base === "char*") {
      if (valor.base !== "char*") {
        this.reportar(
          "error",
          `Tipo de variables asignadas incorrecta: "${nombre}" es char* y recibe un valor de tipo ${valor.base}`,
          pos
        );
      }
      return;
    }

    if (esNumerico(destino.base)) {
      if (!esNumerico(valor.base)) {
        this.reportar(
          "error",
          `Tipo de variables asignadas incorrecta: "${nombre}" es ${destino.base} y recibe un valor de tipo ${valor.base}`,
          pos
        );
        return;
      }
      const literalEntero = nodoValor.tipo === "numero_entero";
      if (RANGO[valor.base] > RANGO[destino.base] && !literalEntero) {
        const perdidaDecimal = !esEntero(valor.base) && esEntero(destino.base);
        this.reportar(
          "advertencia",
          perdidaDecimal
            ? `Se pierde la parte decimal al asignar ${valor.base} a "${nombre}" (${destino.base})`
            : `Posible pérdida de información al asignar ${valor.base} a "${nombre}" (${destino.base})`,
          pos
        );
      }
    }
  }

  private visitarCondicional(nodo: NodoAST) {
    const hijos = nodo.hijos ?? [];
    const esIf = nodo.tipo === "sentencia_if";
    const palabra = esIf ? "if" : "while";

    // La condición se evalúa en el ámbito de afuera, antes de entrar al bloque
    const tipoCond = this.tipoDe(hijos[0]);

    // La condición debe ser booleana: una comparación o una expresión lógica
    if (tipoCond.base !== "desconocido" && (tipoCond.base !== "bool" || tipoCond.arreglo !== undefined)) {
      this.reportar(
        "error",
        `La condición del ${palabra} debe ser booleana (una comparación o una expresión lógica), pero es de tipo ${tipoTexto(tipoCond)}`,
        nodo
      );
    }

    if (esIf) {
      if (hijos[1]) this.visitarBloque(hijos[1], `if (línea ${nodo.linea})`);
      if (hijos[2]) this.visitarBloque(hijos[2], `else (línea ${hijos[2].linea})`);
    } else if (hijos[1]) {
      this.visitarBloque(hijos[1], `while (línea ${nodo.linea})`);
    }
  }

  // --- expresiones ----------------------------------------------------------

  private validarIndice(
    nodoIndice: NodoAST,
    tamano: number | undefined,
    nombre: string,
    pos: Pos
  ) {
    const tipoIdx = this.tipoDe(nodoIndice);
    if (tipoIdx.base === "desconocido") return;

    if (!esEntero(tipoIdx.base) || tipoIdx.arreglo !== undefined) {
      this.reportar("error", `El índice de "${nombre}" debe ser un entero, pero es ${tipoTexto(tipoIdx)}`, pos);
      return;
    }
    if (nodoIndice.tipo === "numero_entero" && tamano !== undefined) {
      const valor = parseInt(nodoIndice.valor!, 10);
      if (valor >= tamano) {
        this.reportar("error", `Índice ${valor} fuera de rango en "${nombre}" (tamaño ${tamano})`, pos);
      }
    }
  }

  private tipoDe(nodo: NodoAST): TipoExp {
    switch (nodo.tipo) {
      case "numero_entero":
        return { base: "int" };
      case "numero_decimal":
        return { base: "float" };
      case "cadena":
        return { base: "char*" };

      case "identificador": {
        const nombre = nodo.valor!;
        const s = this.tabla.buscar(nombre);
        if (!s) {
          this.reportar("error", this.mensajeNoVisible(nombre), nodo);
          return DESCONOCIDO;
        }
        this.tabla.referenciar(s, nodo.linea);
        return s.esArreglo
          ? { base: s.tipoDato, arreglo: s.tamanoArreglo }
          : { base: s.tipoDato };
      }

      case "acceso_arreglo": {
        const nombre = nodo.valor!;
        const indice = nodo.hijos![0];
        const s = this.tabla.buscar(nombre);
        if (!s) {
          this.reportar("error", this.mensajeNoVisible(nombre), nodo);
          this.tipoDe(indice);
          return DESCONOCIDO;
        }
        this.tabla.referenciar(s, nodo.linea);
        if (!s.esArreglo && s.tipoDato !== "char*") {
          this.reportar("error", `"${nombre}" no es un arreglo, no se puede usar con índice`, nodo);
          this.tipoDe(indice);
          return DESCONOCIDO;
        }
        this.validarIndice(indice, s.tamanoArreglo, nombre, nodo);
        return { base: s.tipoDato === "char*" ? "char" : s.tipoDato };
      }

      case "llamada":
        return this.tipoLlamada(nodo);

      case "operacion":
        return this.tipoOperacion(nodo);

      default:
        return DESCONOCIDO;
    }
  }

  /** Comprueba que la función exista y que cantidad y tipo de argumentos sean correctos. */
  private tipoLlamada(nodo: NodoAST): TipoExp {
    const nombre = nodo.valor!;
    const args = nodo.hijos ?? [];
    const tipos = args.map((a) => this.tipoDe(a));

    const firma = FUNCIONES[nombre];
    if (!firma) {
      this.reportar("error", `La función "${nombre}" no está declarada`, nodo);
      return DESCONOCIDO;
    }

    if (args.length < firma.min || args.length > firma.max) {
      this.reportar(
        "error",
        `La función "${nombre}" espera ${textoCantidad(firma)}, pero recibió ${args.length}`,
        nodo
      );
    }

    tipos.forEach((t, i) => {
      if (t.base === "void") {
        this.reportar("error", `El argumento ${i + 1} de "${nombre}" no tiene valor (es void)`, args[i]);
      }
    });

    if (firma.primeroCadena && tipos.length > 0 && tipos[0].base !== "desconocido") {
      const t = tipos[0];
      const esCadena = t.base === "char*" || (t.base === "char" && t.arreglo !== undefined);
      if (!esCadena) {
        this.reportar(
          "error",
          `La función "${nombre}" espera una cadena como primer argumento, pero recibió ${tipoTexto(t)}`,
          args[0]
        );
      }
    }

    return { base: "void" };
  }

  private tipoOperacion(nodo: NodoAST): TipoExp {
    const op = nodo.valor!;
    const hijos = nodo.hijos ?? [];
    const tipos = hijos.map((h) => this.tipoDe(h));

    if (tipos.some((t) => t.base === "desconocido")) return DESCONOCIDO;

    for (let i = 0; i < tipos.length; i++) {
      if (tipos[i].base === "void") {
        this.reportar("error", `Un valor void no se puede usar con el operador "${op}"`, nodo);
        return DESCONOCIDO;
      }
      if (tipos[i].arreglo !== undefined) {
        this.reportar(
          "error",
          `El arreglo completo (${tipoTexto(tipos[i])}) no se puede usar con el operador "${op}", usa un índice`,
          nodo
        );
        return DESCONOCIDO;
      }
    }

    if (op === "!") {
      if (!esNumerico(tipos[0].base)) {
        this.reportar("error", `El operador "!" no se puede aplicar a ${tipos[0].base}`, nodo);
        return DESCONOCIDO;
      }
      return { base: "bool" };
    }

    const [izq, der] = tipos;

    if (op === "&&" || op === "||") {
      if (!esNumerico(izq.base) || !esNumerico(der.base)) {
        this.reportar("error", `El operador "${op}" requiere valores numéricos o booleanos (${izq.base} ${op} ${der.base})`, nodo);
        return DESCONOCIDO;
      }
      return { base: "bool" };
    }

    if (RELACIONALES.has(op)) {
      const ambosNumericos = esNumerico(izq.base) && esNumerico(der.base);
      const ambosTexto = izq.base === "char*" && der.base === "char*";
      const igualdad = op === "==" || op === "!=";
      if (!(ambosNumericos || (ambosTexto && igualdad))) {
        this.reportar(
          "error",
          `No es posible realizar la comparación "${op}" ya que los dos operandos son de tipos distintos o no comparables (${izq.base} y ${der.base})`,
          nodo
        );
        return DESCONOCIDO;
      }
      return { base: "bool" };
    }

    // El operador + está sobrecargado: suma números o une cadenas
    if (op === "+") {
      if (izq.base === "char*" && der.base === "char*") return { base: "char*" };
      if (!(esNumerico(izq.base) && esNumerico(der.base))) {
        const esperado = izq.base === "char*" ? "cadena" : "numérico";
        this.reportar(
          "error",
          `Se esperaba un valor de tipo ${esperado} tras el operador +, pero se encontró ${der.base}`,
          nodo
        );
        return DESCONOCIDO;
      }
    }

    // Aritméticos: + - * / %
    if (!esNumerico(izq.base) || !esNumerico(der.base)) {
      this.reportar("error", `Operación "${op}" no válida entre ${izq.base} y ${der.base}`, nodo);
      return DESCONOCIDO;
    }

    if (op === "%" && (!esEntero(izq.base) || !esEntero(der.base))) {
      this.reportar("error", `El operador "%" solo acepta enteros (${izq.base} % ${der.base})`, nodo);
      return DESCONOCIDO;
    }

    if (op === "/" || op === "%") {
      const divisor = hijos[1];
      const esCero =
        (divisor.tipo === "numero_entero" || divisor.tipo === "numero_decimal") &&
        parseFloat(divisor.valor!) === 0;
      if (esCero) {
        this.reportar("error", `División por cero`, nodo);
      }
    }

    const rango = Math.max(RANGO[izq.base], RANGO[der.base], 3);
    return { base: NOMBRE_POR_RANGO[rango] };
  }
}

export function analizarSemantica(arbol: NodoAST): ResultadoSemantico {
  const analizador = new AnalizadorSemantico(arbol);
  analizador.visitar(arbol);
  return {
    hallazgos: analizador.hallazgos,
    valido: !analizador.hallazgos.some((h) => h.severidad === "error"),
    tablaSimbolos: analizador.tabla,
  };
}
