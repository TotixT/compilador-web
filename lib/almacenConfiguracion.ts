import {
  ConfiguracionLexica,
  CONFIGURACION_POR_DEFECTO,
  EntradaTabla1,
  EntradaTabla2,
} from "./configuracionLexica";

const CLAVE_ALMACENAMIENTO = "compilador-web:configuracion-lexica";

function enNavegador(): boolean {
  return typeof window !== "undefined";
}

/**
 * Combina lo guardado por el usuario con los valores por defecto.
 * Esto es importante para que, si en el futuro agregamos más palabras
 * reservadas o símbolos al proyecto, a un usuario que ya tenía datos
 * guardados no se le "pierdan" las filas nuevas del sistema.
 */
function combinarConDefecto(guardada: Partial<ConfiguracionLexica>): ConfiguracionLexica {
  const traduccionesGuardadasT1 = new Map(
    (guardada.tabla1 ?? []).filter((e) => !e.personalizada).map((e) => [e.id, e.traduccion])
  );
  const personalizadasT1 = (guardada.tabla1 ?? []).filter((e) => e.personalizada);

  const tabla1: EntradaTabla1[] = [
    ...CONFIGURACION_POR_DEFECTO.tabla1.map((e) => ({
      ...e,
      traduccion: traduccionesGuardadasT1.get(e.id) ?? e.traduccion,
    })),
    ...personalizadasT1,
  ];

  const traduccionesGuardadasT2 = new Map(
    (guardada.tabla2 ?? []).map((e) => [e.codigoAscii, e.traduccion])
  );

  const tabla2: EntradaTabla2[] = CONFIGURACION_POR_DEFECTO.tabla2.map((e) => ({
    ...e,
    traduccion: traduccionesGuardadasT2.get(e.codigoAscii) ?? e.traduccion,
  }));

  return { tabla1, tabla2 };
}

export function cargarConfiguracion(): ConfiguracionLexica {
  if (!enNavegador()) return CONFIGURACION_POR_DEFECTO;

  try {
    const crudo = window.localStorage.getItem(CLAVE_ALMACENAMIENTO);
    if (!crudo) return CONFIGURACION_POR_DEFECTO;
    const parseado = JSON.parse(crudo) as Partial<ConfiguracionLexica>;
    return combinarConDefecto(parseado);
  } catch {
    // Si el JSON guardado está corrupto, no tumbamos la app: volvemos a defecto.
    return CONFIGURACION_POR_DEFECTO;
  }
}

export function guardarConfiguracion(config: ConfiguracionLexica) {
  if (!enNavegador()) return;
  window.localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(config));
}

export function restablecerConfiguracion(): ConfiguracionLexica {
  if (enNavegador()) {
    window.localStorage.removeItem(CLAVE_ALMACENAMIENTO);
  }
  return CONFIGURACION_POR_DEFECTO;
}
