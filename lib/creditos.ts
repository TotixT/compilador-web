// © 2026 Santiago López García y Oscar Julián Mojica Calderón.
// Proyecto de Compiladores, Universitaria Tecnológica de Santander. Ver el archivo LICENSE.

// ---------------------------------------------------------------------------
// CRÉDITOS DEL PROYECTO
//
// Fuente única de los datos de autoría. El encabezado, el pie de página y el
// título de la pestaña leen estos valores. Además, verificarCreditos() comprueba
// que los datos no hayan sido alterados y que los bloques de créditos sigan
// visibles en pantalla; si no es así, el botón Compilar se bloquea con un
// mensaje claro (ver app/page.tsx).
//
// Esto es una medida de atribución para uso académico: sirve para dejar
// constancia de la autoría y desalentar que se quiten los créditos, no es un
// sistema de seguridad. La protección formal es el archivo LICENSE.
// ---------------------------------------------------------------------------

export const NOMBRE_PROYECTO = "Compilador Web";
export const AUTORES: readonly string[] = [
  "Santiago López García",
  "Oscar Julián Mojica Calderón",
];
export const ANIO = 2026;
export const INSTITUCION = "Universitaria Tecnológica de Santander";

// Huella (hash) de los datos de autoría originales.
const HUELLA_ESPERADA = "f10418612ed3b295";

/** Hash FNV-1a de 32 bits con una semilla dada (devuelve 8 caracteres hexadecimales). */
function fnv1a(texto: string, semilla: number): string {
  let h = semilla >>> 0;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

export function calcularHuella(): string {
  const base = [NOMBRE_PROYECTO, ...AUTORES, String(ANIO), INSTITUCION].join("|");
  return fnv1a(base, 0x811c9dc5) + fnv1a(base, 0x2545f491);
}

export function creditosIntegros(): boolean {
  return calcularHuella() === HUELLA_ESPERADA;
}

export interface ResultadoVerificacion {
  ok: boolean;
  motivo?: string;
}

/**
 * Verifica (solo en el navegador) que los datos de autoría no se hayan alterado
 * y que los bloques de créditos del encabezado y del pie existan y se vean.
 */
export function verificarCreditos(): ResultadoVerificacion {
  if (typeof document === "undefined") return { ok: true };

  if (!creditosIntegros()) {
    return { ok: false, motivo: "Los datos de autoría del proyecto fueron modificados." };
  }

  for (const zona of ["encabezado", "pie"]) {
    const el = document.querySelector(`[data-creditos="${zona}"]`);
    if (!el) {
      return { ok: false, motivo: `Falta el bloque de créditos (${zona}).` };
    }

    const texto = el.textContent ?? "";
    if (!AUTORES.every((autor) => texto.includes(autor))) {
      return { ok: false, motivo: `El bloque de créditos (${zona}) no muestra a los autores.` };
    }

    const caja = el.getBoundingClientRect();
    const estilo = window.getComputedStyle(el);
    const oculto =
      caja.width === 0 ||
      caja.height === 0 ||
      estilo.display === "none" ||
      estilo.visibility === "hidden" ||
      parseFloat(estilo.opacity) === 0;
    if (oculto) {
      return { ok: false, motivo: `El bloque de créditos (${zona}) está oculto.` };
    }
  }

  return { ok: true };
}
