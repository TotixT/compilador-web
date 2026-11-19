# Compilador Web

Compilador didáctico que corre en el navegador. Recibe un programa fuente y muestra,
etapa por etapa, el análisis léxico, el análisis sintáctico (con árbol), el análisis
semántico (con tabla de símbolos) y la generación de código intermedio (código de
tres direcciones).

Proyecto de Compiladores, Universitaria Tecnológica de Santander.

**Autores:** Santiago López García y Oscar Julián Mojica Calderón.

## Requisitos

- Node.js 20.9 o superior (recomendado: la versión LTS), que incluye npm.
- Un navegador actualizado.

## Puesta en marcha

```bash
npm install      # solo la primera vez
npm run dev      # abre http://localhost:3000
```

## Comandos útiles

```bash
npm run test:lexer        # prueba el análisis léxico desde la terminal
npm run test:semantico    # prueba el análisis semántico
npm run test:intermedio   # prueba el código intermedio
npm run build             # compila la versión de producción
npm start                 # sirve la versión de producción
```

Para probar otro código con los comandos `test:*`, edita la variable `codigo` del
archivo correspondiente en la carpeta `scripts/`.

## Estructura

- `lib/`: la lógica del compilador (lexer, parser, semántico, código intermedio, tabla de símbolos).
- `components/`: las cajas visuales.
- `app/`: las páginas (el compilador y la configuración léxica).
- `scripts/`: pruebas por terminal.

## Autoría y licencia

Este software es de uso académico y educativo. Los créditos de autoría (encabezado, pie
de página, título de la pestaña y avisos de cada archivo) deben conservarse; ver el archivo
[LICENSE](./LICENSE). El compilador verifica que los créditos estén intactos y visibles, y
bloquea el botón Compilar si se modifican o se ocultan.
