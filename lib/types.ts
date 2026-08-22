export type TokenCategory =
  | "palabra_reservada"
  | "identificador"
  | "numero_entero"
  | "numero_decimal"
  | "cadena"
  | "operador_aritmetico"
  | "operador_relacional"
  | "asignacion"
  | "operador_logico"
  | "delimitador"
  | "acceso_miembro"
  | "personalizado"
  | "desconocido";

export interface Token {
  lexema: string;
  categoria: TokenCategory;
  linea: number;
  columna: number;
  /** Etiqueta a mostrar; si no viene, se usa ETIQUETAS_CATEGORIA[categoria]. */
  etiqueta?: string;
}

export interface LineaAnalizada {
  numeroLinea: number;
  texto: string;
  tokens: Token[];
}

export const ETIQUETAS_CATEGORIA: Record<TokenCategory, string> = {
  palabra_reservada: "Palabra reservada",
  identificador: "Identificador (id)",
  numero_entero: "Número entero",
  numero_decimal: "Número decimal",
  cadena: "Cadena",
  operador_aritmetico: "Operador aritmético",
  operador_relacional: "Operador relacional",
  asignacion: "Asignación",
  operador_logico: "Operador lógico",
  delimitador: "Delimitador",
  acceso_miembro: "Acceso a miembro",
  personalizado: "Personalizado (ASCII)",
  desconocido: "Desconocido",
};

export const COLOR_CATEGORIA: Record<TokenCategory, string> = {
  palabra_reservada: "bg-purple-100 text-purple-800 border-purple-300",
  identificador: "bg-blue-100 text-blue-800 border-blue-300",
  numero_entero: "bg-emerald-100 text-emerald-800 border-emerald-300",
  numero_decimal: "bg-emerald-100 text-emerald-800 border-emerald-300",
  cadena: "bg-amber-100 text-amber-800 border-amber-300",
  operador_aritmetico: "bg-rose-100 text-rose-800 border-rose-300",
  operador_relacional: "bg-rose-100 text-rose-800 border-rose-300",
  asignacion: "bg-pink-100 text-pink-800 border-pink-300",
  operador_logico: "bg-rose-100 text-rose-800 border-rose-300",
  delimitador: "bg-slate-200 text-slate-700 border-slate-400",
  acceso_miembro: "bg-cyan-100 text-cyan-800 border-cyan-300",
  personalizado: "bg-indigo-100 text-indigo-800 border-indigo-300",
  desconocido: "bg-red-100 text-red-800 border-red-400",
};
