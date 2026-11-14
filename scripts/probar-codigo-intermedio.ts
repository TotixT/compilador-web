// Script de prueba manual del generador de código intermedio.
// Ejecutar con: npm run test:intermedio
// Edita el string `codigo` de abajo con lo que quieras probar.

import { tokenizarPrograma } from "../lib/lexer";
import { analizarSintaxis } from "../lib/parser";
import { analizarSemantica } from "../lib/semantico";
import { generarCodigoIntermedio } from "../lib/codigoIntermedio";

const codigo = `int a, b;
while (a > 0 && b < (a * 4 - 5)) {
  a = b * a - 10;
}`;

const tokens = tokenizarPrograma(codigo);
const sint = analizarSintaxis(tokens);

if (!sint.valido) {
  console.log("Error sintáctico:", sint.errores);
} else {
  const sem = analizarSemantica(sint.arbol!);
  if (!sem.valido) {
    console.log("Errores semánticos:", sem.hallazgos.filter((h) => h.severidad === "error"));
  } else {
    const tac = generarCodigoIntermedio(sint.arbol!);
    for (const inst of tac) {
      const etiqueta = inst.etiqueta ? `${inst.etiqueta}: ` : "    ";
      console.log(`${etiqueta}${inst.texto}`);
    }
  }
}
