// © 2026 Santiago López García y Oscar Julián Mojica Calderón. Ver el archivo LICENSE.
import { TokenCategory } from "./types";

/**
 * TABLA 1: palabras reservadas, operadores y delimitadores.
 * El "patrón" (símbolo exacto) queda protegido en las filas por defecto,
 * porque el analizador sintáctico depende de reconocer esos textos
 * exactos (if, while, const, *, etc). Solo la "traducción" (etiqueta
 * que se muestra al usuario) es editable en esas filas.
 * Las filas que el usuario agregue sí permiten patrón libre.
 */
export interface EntradaTabla1 {
  id: string;
  patron: string; // código/símbolo exacto que el lexer debe encontrar
  categoria: TokenCategory; // familia (controla color y lógica interna)
  traduccion: string; // etiqueta visible, editable
  personalizada: boolean; // true si la agregó el usuario (patrón editable)
}

/**
 * TABLA 2: caracteres ASCII imprimibles que no tienen un significado
 * predefinido (no son letra, dígito, comilla, ni ya están en la Tabla 1).
 * Por defecto no traducen nada (el lexer los sigue marcando como
 * "Desconocido"), hasta que el usuario les asigna una traducción.
 */
export interface EntradaTabla2 {
  codigoAscii: number;
  caracter: string;
  traduccion: string; // vacío = sin definir todavía
}

export interface ConfiguracionLexica {
  tabla1: EntradaTabla1[];
  tabla2: EntradaTabla2[];
}

const PALABRAS_RESERVADAS_DEFECTO = [
  "int", "char", "float", "double", "void", "long", "short",
  "if", "else", "while", "do", "for", "switch", "case", "break",
  "continue", "return", "const", "struct", "typedef", "static",
];

const SIMBOLOS_DEFECTO: { patron: string; categoria: TokenCategory; traduccion: string }[] = [
  { patron: ".", categoria: "acceso_miembro", traduccion: "Acceso a miembro" },
  { patron: "==", categoria: "operador_relacional", traduccion: "Igual a" },
  { patron: "!=", categoria: "operador_relacional", traduccion: "Diferente de" },
  { patron: "<=", categoria: "operador_relacional", traduccion: "Menor o igual que" },
  { patron: ">=", categoria: "operador_relacional", traduccion: "Mayor o igual que" },
  { patron: "<", categoria: "operador_relacional", traduccion: "Menor que" },
  { patron: ">", categoria: "operador_relacional", traduccion: "Mayor que" },
  { patron: "&&", categoria: "operador_logico", traduccion: "Y lógico" },
  { patron: "||", categoria: "operador_logico", traduccion: "O lógico" },
  { patron: "!", categoria: "operador_logico", traduccion: "Negación" },
  { patron: "=", categoria: "asignacion", traduccion: "Asignación" },
  { patron: "+", categoria: "operador_aritmetico", traduccion: "Suma" },
  { patron: "-", categoria: "operador_aritmetico", traduccion: "Resta" },
  { patron: "*", categoria: "operador_aritmetico", traduccion: "Multiplicación" },
  { patron: "/", categoria: "operador_aritmetico", traduccion: "División" },
  { patron: "%", categoria: "operador_aritmetico", traduccion: "Módulo" },
  { patron: ";", categoria: "delimitador", traduccion: "Punto y coma" },
  { patron: ",", categoria: "delimitador", traduccion: "Coma" },
  { patron: "(", categoria: "delimitador", traduccion: "Paréntesis de apertura" },
  { patron: ")", categoria: "delimitador", traduccion: "Paréntesis de cierre" },
  { patron: "{", categoria: "delimitador", traduccion: "Llave de apertura" },
  { patron: "}", categoria: "delimitador", traduccion: "Llave de cierre" },
  { patron: "[", categoria: "delimitador", traduccion: "Corchete de apertura" },
  { patron: "]", categoria: "delimitador", traduccion: "Corchete de cierre" },
];

function construirTabla1Defecto(): EntradaTabla1[] {
  const palabras: EntradaTabla1[] = PALABRAS_RESERVADAS_DEFECTO.map((p) => ({
    id: `kw-${p}`,
    patron: p,
    categoria: "palabra_reservada",
    traduccion: "Palabra reservada",
    personalizada: false,
  }));

  const simbolos: EntradaTabla1[] = SIMBOLOS_DEFECTO.map((s) => ({
    id: `sym-${s.patron}`,
    patron: s.patron,
    categoria: s.categoria,
    traduccion: s.traduccion,
    personalizada: false,
  }));

  return [...palabras, ...simbolos];
}

/**
 * Genera la Tabla 2 automáticamente: recorre todo el rango ASCII
 * imprimible (33-126) y descarta lo que ya está cubierto por reglas
 * estructurales (letras, dígitos, comillas) o por la Tabla 1
 * (símbolos de un solo carácter). Así no se puede quedar ningún
 * carácter por fuera "sin darnos cuenta".
 */
function construirTabla2Defecto(tabla1: EntradaTabla1[]): EntradaTabla2[] {
  const simbolosUnCaracter = new Set(
    tabla1.filter((e) => e.patron.length === 1).map((e) => e.patron)
  );

  const entradas: EntradaTabla2[] = [];
  for (let codigo = 33; codigo <= 126; codigo++) {
    const caracter = String.fromCharCode(codigo);
    const esLetra = /[a-zA-Z]/.test(caracter);
    const esDigito = /[0-9]/.test(caracter);
    const esComilla = caracter === '"';

    if (esLetra || esDigito || esComilla) continue;
    if (simbolosUnCaracter.has(caracter)) continue;

    entradas.push({ codigoAscii: codigo, caracter, traduccion: "" });
  }
  return entradas;
}

const TABLA1_DEFECTO = construirTabla1Defecto();
const TABLA2_DEFECTO = construirTabla2Defecto(TABLA1_DEFECTO);

export const CONFIGURACION_POR_DEFECTO: ConfiguracionLexica = {
  tabla1: TABLA1_DEFECTO,
  tabla2: TABLA2_DEFECTO,
};
