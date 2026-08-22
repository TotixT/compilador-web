import { Token } from "./types";
import { ConfiguracionLexica, CONFIGURACION_POR_DEFECTO } from "./configuracionLexica";

// Reglas ESTRUCTURALES: no vienen de la tabla configurable porque no son
// un símbolo fijo sino una FORMA (cualquier secuencia de dígitos, cualquier
// identificador, cualquier texto entre comillas). Esto se explica en el
// chat: la Tabla 1 solo puede cubrir símbolos exactos, no patrones.
const ESTRUCTURALES: { tipo: "cadena" | "numero_decimal" | "numero_entero" | "identificador"; regex: RegExp }[] = [
  { tipo: "cadena", regex: /^"([^"\\]|\\.)*"/ },
  { tipo: "numero_decimal", regex: /^\d+\.\d+/ },
  { tipo: "numero_entero", regex: /^\d+/ },
  { tipo: "identificador", regex: /^[a-zA-Z_][a-zA-Z0-9_]*/ },
];

const ESPACIO = /^\s+/;

/**
 * Tokeniza una sola línea de código fuente.
 * numeroLinea es 1-indexado, solo para reportar posición.
 * config es opcional: si no se pasa, se usa la configuración por defecto
 * del sistema (equivalente a como funcionaba antes de tener tablas).
 */
export function tokenizarLinea(
  texto: string,
  numeroLinea: number,
  config: ConfiguracionLexica = CONFIGURACION_POR_DEFECTO
): Token[] {
  const tokens: Token[] = [];
  let resto = texto;
  let columna = 1;

  // Palabras reservadas: mapa lexema -> entrada de la Tabla 1
  const palabrasReservadas = new Map(
    config.tabla1.filter((e) => e.categoria === "palabra_reservada").map((e) => [e.patron, e])
  );

  // Símbolos (operadores/delimitadores/etc): se prueban de más largo a
  // más corto, para que "==" no se confunda con "=" seguido de "=".
  const simbolos = config.tabla1
    .filter((e) => e.categoria !== "palabra_reservada")
    .slice()
    .sort((a, b) => b.patron.length - a.patron.length);

  // Tabla 2: caracteres ASCII sin regla propia, mapeados por carácter
  const mapaAscii = new Map(config.tabla2.map((e) => [e.caracter, e]));

  while (resto.length > 0) {
    const espacio = resto.match(ESPACIO);
    if (espacio) {
      columna += espacio[0].length;
      resto = resto.slice(espacio[0].length);
      continue;
    }

    // Comentario de línea: se ignora el resto de la línea
    if (resto.startsWith("//")) {
      break;
    }

    let coincidio = false;

    // 1) Reglas estructurales (cadena, números, identificador)
    for (const { tipo, regex } of ESTRUCTURALES) {
      const match = resto.match(regex);
      if (!match) continue;

      const lexema = match[0];

      if (tipo === "identificador" && palabrasReservadas.has(lexema)) {
        const entrada = palabrasReservadas.get(lexema)!;
        tokens.push({
          lexema,
          categoria: "palabra_reservada",
          etiqueta: entrada.traduccion,
          linea: numeroLinea,
          columna,
        });
      } else {
        tokens.push({ lexema, categoria: tipo, linea: numeroLinea, columna });
      }

      columna += lexema.length;
      resto = resto.slice(lexema.length);
      coincidio = true;
      break;
    }
    if (coincidio) continue;

    // 2) Símbolos configurables de la Tabla 1 (operadores, delimitadores...)
    for (const entrada of simbolos) {
      if (resto.startsWith(entrada.patron)) {
        tokens.push({
          lexema: entrada.patron,
          categoria: entrada.categoria,
          etiqueta: entrada.traduccion,
          linea: numeroLinea,
          columna,
        });
        columna += entrada.patron.length;
        resto = resto.slice(entrada.patron.length);
        coincidio = true;
        break;
      }
    }
    if (coincidio) continue;

    // 3) Nada coincidió: buscar el carácter en la Tabla 2 (ASCII)
    const caracter = resto[0];
    const entradaAscii = mapaAscii.get(caracter);

    if (entradaAscii && entradaAscii.traduccion.trim() !== "") {
      tokens.push({
        lexema: caracter,
        categoria: "personalizado",
        etiqueta: entradaAscii.traduccion,
        linea: numeroLinea,
        columna,
      });
    } else {
      tokens.push({
        lexema: caracter,
        categoria: "desconocido",
        linea: numeroLinea,
        columna,
      });
    }
    columna += 1;
    resto = resto.slice(1);
  }

  return tokens;
}

/**
 * Tokeniza el código fuente completo, línea por línea,
 * devolviendo un arreglo alineado con cada línea del editor.
 */
export function tokenizarCodigo(
  codigoFuente: string,
  config: ConfiguracionLexica = CONFIGURACION_POR_DEFECTO
) {
  const lineas = codigoFuente.split("\n");
  return lineas.map((texto, i) => ({
    numeroLinea: i + 1,
    texto,
    tokens: tokenizarLinea(texto, i + 1, config),
  }));
}

/**
 * Igual que tokenizarCodigo, pero devuelve un único arreglo plano
 * con todos los tokens del programa en orden. Es lo que necesita
 * el analizador sintáctico, ya que una sentencia puede abarcar
 * varias líneas.
 */
export function tokenizarPrograma(
  codigoFuente: string,
  config: ConfiguracionLexica = CONFIGURACION_POR_DEFECTO
): Token[] {
  return tokenizarCodigo(codigoFuente, config).flatMap((linea) => linea.tokens);
}
