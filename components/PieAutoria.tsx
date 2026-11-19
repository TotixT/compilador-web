// © 2026 Santiago López García y Oscar Julián Mojica Calderón. Ver el archivo LICENSE.
import { ANIO, AUTORES, INSTITUCION, NOMBRE_PROYECTO } from "@/lib/creditos";
import NombreArcoiris from "@/components/NombreArcoiris";

/** Pie de página con la autoría (verificado por lib/creditos.ts). */
export default function PieAutoria() {
  return (
    <footer
      data-creditos="pie"
      className="mt-8 border-t border-slate-200 pt-4 pb-2 text-center text-xs text-slate-500"
    >
      <p>
        {NOMBRE_PROYECTO} © {ANIO}{" "}
        {AUTORES.map((autor, i) => (
          <span key={autor}>
            {i > 0 && " y "}
            <NombreArcoiris texto={autor} />
          </span>
        ))}
        . {INSTITUCION}.
      </p>
      <p className="mt-1">
        Uso académico y educativo. Se debe conservar la autoría; ver el archivo LICENSE.
      </p>
    </footer>
  );
}
