// © 2026 Santiago López García y Oscar Julián Mojica Calderón. Ver el archivo LICENSE.
// Script de prueba rápida del lexer.
// Ejecutar con: npm run test:lexer
// Edita el string `codigo` de abajo con lo que quieras probar.

import { tokenizarCodigo } from "../lib/lexer";

const codigo = `if (i > 0) {
  console.log("Resultado: 123, ok");
} else {
  const total = 45.5;
}`;

const resultado = tokenizarCodigo(codigo);

for (const linea of resultado) {
  console.log(`Línea ${linea.numeroLinea}: "${linea.texto}"`);
  for (const t of linea.tokens) {
    console.log(`   [${t.categoria}] -> ${JSON.stringify(t.lexema)}`);
  }
}
