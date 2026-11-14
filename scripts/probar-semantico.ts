// Script de prueba manual del semántico.
// Ejecutar con: npm run test:semantico
// Edita el string `codigo` de abajo con lo que quieras probar.

import { tokenizarPrograma } from "../lib/lexer";
import { analizarSintaxis } from "../lib/parser";
import { analizarSemantica } from "../lib/semantico";

const codigo = `int i,j,k;
char s[10];
s=i+j*k;
if (i > 0) {
  console.log("Resultado: 123, ok");
} else {
  const total = 45.5;
}`;

const tokens = tokenizarPrograma(codigo);
const sint = analizarSintaxis(tokens);

if (!sint.valido) {
  console.log("Error sintáctico, no se puede continuar al semántico:");
  console.log(sint.errores);
} else {
  const sem = analizarSemantica(sint.arbol!);
  console.log("Válido:", sem.valido);
  for (const h of sem.hallazgos) {
    console.log(`  [${h.severidad}] línea ${h.linea}, columna ${h.columna}: ${h.mensaje}`);
  }
}
