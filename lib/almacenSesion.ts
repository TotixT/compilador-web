// © 2026 Santiago López García y Oscar Julián Mojica Calderón. Ver el archivo LICENSE.
const CLAVE_CODIGO = "compilador-web:codigo-fuente";
const CLAVE_SE_COMPILO = "compilador-web:se-compilo";

function enNavegador(): boolean {
  return typeof window !== "undefined";
}

export function cargarCodigoGuardado(): string | null {
  if (!enNavegador()) return null;
  return window.localStorage.getItem(CLAVE_CODIGO);
}

export function guardarCodigoGuardado(codigo: string) {
  if (!enNavegador()) return;
  window.localStorage.setItem(CLAVE_CODIGO, codigo);
}

export function cargarSeCompilo(): boolean {
  if (!enNavegador()) return false;
  return window.localStorage.getItem(CLAVE_SE_COMPILO) === "1";
}

export function guardarSeCompilo(valor: boolean) {
  if (!enNavegador()) return;
  window.localStorage.setItem(CLAVE_SE_COMPILO, valor ? "1" : "0");
}