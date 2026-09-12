import React, { useState, useEffect, useCallback } from 'react';
import { servicioTorreControl } from '../logica/servicio-torre';
import type {
  ReporteIntegracionCategoria,
  ResultadoConsolidacionCodigoAcceso,
  ResultadoPurgaLegacy,
} from '../tipos';

interface Props {
  categoriaSeleccionada: string;
  categoriasDisponibles?: readonly string[];
  alCambiarCategoria?: (nuevaCat: string) => void;
}

export const PanelReporteIntegracion: React.FC<Props> = ({
  categoriaSeleccionada,
  categoriasDisponibles = ['Marisquerias'],
  alCambiarCategoria,
}) => {
  const [reporte, setReporte] = useState<ReporteIntegracionCategoria | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [consolidando, setConsolidando] = useState<boolean>(false);
  const [purgando, setPurgando] = useState<boolean>(false);
  const [resultadoConsolidacion, setResultadoConsolidacion] =
    useState<ResultadoConsolidacionCodigoAcceso | null>(null);
  const [resultadoPurga, setResultadoPurga] = useState<ResultadoPurgaLegacy | null>(null);
  const [mostrarConfirmacionPurga, setMostrarConfirmacionPurga] = useState<boolean>(false);
  const [copiado, setCopiado] = useState<boolean>(false);
  const [vistaDetalle, setVistaDetalle] = useState<'DIAGNOSTICO' | 'NEGOCIOS' | 'INSTRUCCION'>(
    'DIAGNOSTICO'
  );

  const cargarAuditoria = useCallback(async () => {
    setCargando(true);
    try {
      const audit = await servicioTorreControl.auditarCategoria(categoriaSeleccionada);
      setReporte(audit);
    } catch {
      setReporte(null);
    } finally {
      setCargando(false);
    }
  }, [categoriaSeleccionada]);

  useEffect(() => {
    cargarAuditoria();
  }, [cargarAuditoria]);

  const ejecutarConsolidacion = async () => {
    setConsolidando(true);
    setResultadoConsolidacion(null);
    try {
      const res = await servicioTorreControl.consolidarContratoCodigoAcceso();
      setResultadoConsolidacion(res);
      await cargarAuditoria();
    } catch (e) {
      setResultadoConsolidacion({
        exito: false,
        mensaje: `Error al consolidar: ${e instanceof Error ? e.message : String(e)}`,
        totalCodigoAcceso: 0,
        clavesMigradasDesdeLegacy: 0,
        clavesConsistentes: 0,
        detalles: [],
      });
    } finally {
      setConsolidando(false);
    }
  };

  const ejecutarPurga = async () => {
    setPurgando(true);
    setResultadoPurga(null);
    setMostrarConfirmacionPurga(false);
    try {
      const res = await servicioTorreControl.purgarNodoLegacyAccessCodes();
      setResultadoPurga(res);
      await cargarAuditoria();
    } catch (e) {
      setResultadoPurga({
        exito: false,
        mensaje: `Error al purgar nodo legacy: ${e instanceof Error ? e.message : String(e)}`,
        registrosPurgados: 0,
        detalles: [],
      });
    } finally {
      setPurgando(false);
    }
  };

  const copiarInstruccion = async () => {
    if (!reporte) return;
    try {
      await navigator.clipboard.writeText(reporte.instruccionModeloCategoria);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    } catch {
      // Fallback
      setCopiado(false);
    }
  };

  return (
    <div id="panel-reporte-integracion-categoria" className="space-y-6">
      {/* Barra de Encabezado Operativo */}
      <div
        id="cabecera-reporte-tecnico"
        className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg"
      >
        <div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              ORQUESTACIÓN TÉCNICA DE CATEGORÍA
            </h2>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Unidad de Integración: <strong className="text-blue-400 font-mono">/{categoriaSeleccionada}</strong> • Todos los negocios de esta categoría heredan el mismo contrato y cliente operativo.
          </p>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {alCambiarCategoria && categoriasDisponibles.length > 1 ? (
            <select
              id="selector-categoria-reporte"
              value={categoriaSeleccionada}
              onChange={(e) => alCambiarCategoria(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-blue-400 font-bold px-3 py-1.5 rounded-lg text-xs focus:outline-none cursor-pointer"
            >
              {categoriasDisponibles.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          ) : null}

          <button
            id="boton-refrescar-auditoria"
            type="button"
            onClick={cargarAuditoria}
            disabled={cargando}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors border border-slate-700 flex items-center gap-1.5"
            title="Actualizar estado técnico desde RTDB"
          >
            <span>🔄</span> {cargando ? 'Auditan...' : 'Actualizar'}
          </button>

          <button
            id="boton-copiar-instruccion"
            type="button"
            onClick={copiarInstruccion}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 shadow-md shadow-blue-600/20"
            title="Copiar instrucción lista para el modelo de la categoría"
          >
            <span>📋</span> {copiado ? '¡Copiada!' : 'Copiar Instrucción para Modelo'}
          </button>

          <button
            id="boton-consolidar-contrato-unico"
            type="button"
            onClick={ejecutarConsolidacion}
            disabled={consolidando}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
            title="Asegura que todas las claves estén registradas en /codigo_acceso"
          >
            <span>⚡</span> {consolidando ? 'Consolidando...' : 'Consolidar Contrato'}
          </button>

          {reporte?.estadoLegacyRTDB.nodoPresente ? (
            <button
              id="boton-abrir-purga-legacy"
              type="button"
              onClick={() => setMostrarConfirmacionPurga(true)}
              disabled={purgando}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
              title="Elimina el nodo residual /access_codes de RTDB"
            >
              <span>🧹</span> Purgar /access_codes
            </button>
          ) : (
            <span
              id="badge-legacy-purgado"
              className="px-3 py-1.5 bg-slate-800 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5"
            >
              <span>✓</span> Legacy Purgado
            </span>
          )}
        </div>
      </div>

      {/* Modal de confirmación de Purga */}
      {mostrarConfirmacionPurga ? (
        <div
          id="modal-confirmacion-purga"
          className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-5 text-slate-200 shadow-xl animate-in fade-in duration-200"
        >
          <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
            <span>⚠️</span> Confirmar Purga del Nodo Residual /access_codes
          </h3>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            Esta acción eliminará definitivamente el subárbol <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-400 font-mono">/access_codes</code> de la RTDB de producción.
            Antes de borrarlo, Torre de Control comprobará que todas las claves existentes estén consolidadas en <code className="bg-slate-900 px-1 py-0.5 rounded text-emerald-400 font-mono">/codigo_acceso</code>.
          </p>
          <div className="flex items-center gap-3 mt-4">
            <button
              id="boton-confirmar-purga-ejecutar"
              type="button"
              onClick={ejecutarPurga}
              disabled={purgando}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              {purgando ? 'Purgando...' : 'Sí, Purgar Nodo Residual'}
            </button>
            <button
              id="boton-cancelar-purga"
              type="button"
              onClick={() => setMostrarConfirmacionPurga(false)}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      {/* Alertas de Resultados de Operaciones */}
      {resultadoConsolidacion ? (
        <div
          id="resultado-consolidacion-banner"
          className={`p-4 rounded-xl border text-xs ${
            resultadoConsolidacion.exito
              ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
              : 'bg-red-950/30 border-red-500/30 text-red-200'
          }`}
        >
          <p className="font-bold">{resultadoConsolidacion.mensaje}</p>
          {resultadoConsolidacion.detalles.length > 0 ? (
            <ul className="list-disc list-inside mt-2 space-y-0.5 text-slate-300 font-mono">
              {resultadoConsolidacion.detalles.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {resultadoPurga ? (
        <div
          id="resultado-purga-banner"
          className={`p-4 rounded-xl border text-xs ${
            resultadoPurga.exito
              ? 'bg-blue-950/30 border-blue-500/30 text-blue-200'
              : 'bg-red-950/30 border-red-500/30 text-red-200'
          }`}
        >
          <p className="font-bold">{resultadoPurga.mensaje}</p>
          {resultadoPurga.detalles.length > 0 ? (
            <ul className="list-disc list-inside mt-2 space-y-0.5 text-slate-300 font-mono">
              {resultadoPurga.detalles.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {/* Métricas Principales de Contrato */}
      {reporte ? (
        <div id="metricas-contrato-categoria" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Fuente Contractual Única */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-xs uppercase font-bold text-slate-400">Contrato Normativo</div>
            <div className="mt-1 text-2xl font-black text-emerald-400 font-mono">/codigo_acceso</div>
            <div className="text-xs text-slate-500 mt-1">
              Resolución O(1) hacia <span className="text-slate-300 font-mono">{categoriaSeleccionada}/&#123;id&#125;</span>
            </div>
          </div>

          {/* Card 2: Cobertura de Categoría */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-xs uppercase font-bold text-slate-400">Negocios en Categoría</div>
            <div className="mt-1 text-2xl font-black text-white font-mono">
              {reporte.contratoCodigoAcceso.clavesValidas} / {reporte.totalNegocios}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  reporte.contratoCodigoAcceso.cumplimientoPorcentaje === 100
                    ? 'bg-emerald-400'
                    : 'bg-amber-400'
                }`}
              />
              {reporte.contratoCodigoAcceso.cumplimientoPorcentaje}% alineación de contrato
            </div>
          </div>

          {/* Card 3: Claves Globales en RTDB */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-xs uppercase font-bold text-slate-400">Total Claves en RTDB</div>
            <div className="mt-1 text-2xl font-black text-blue-400 font-mono">
              {reporte.contratoCodigoAcceso.totalEnRTDB}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Índice O(1) centralizado en RTDB
            </div>
          </div>

          {/* Card 4: Estado Residual Legacy */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-xs uppercase font-bold text-slate-400">Nodo Legacy RTDB</div>
            <div
              className={`mt-1 text-2xl font-black font-mono ${
                reporte.estadoLegacyRTDB.nodoPresente ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {reporte.estadoLegacyRTDB.nodoPresente
                ? `${reporte.estadoLegacyRTDB.totalClavesLegacy} residuos`
                : 'PURGADO'}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {reporte.estadoLegacyRTDB.nodoPresente
                ? 'Nodo /access_codes aún existe'
                : 'Sin residuos en /access_codes'}
            </div>
          </div>
        </div>
      ) : null}

      {/* Selector de Sub-vistas del Reporte */}
      <div className="flex border-b border-slate-800 pb-2 gap-4 text-xs font-bold">
        <button
          type="button"
          onClick={() => setVistaDetalle('DIAGNOSTICO')}
          className={`pb-2 border-b-2 transition-colors cursor-pointer ${
            vistaDetalle === 'DIAGNOSTICO'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          1. DIAGNÓSTICO OPERATIVO (5 DIMENSIONES)
        </button>
        <button
          type="button"
          onClick={() => setVistaDetalle('NEGOCIOS')}
          className={`pb-2 border-b-2 transition-colors cursor-pointer ${
            vistaDetalle === 'NEGOCIOS'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          2. NEGOCIOS Y CONTRATO ({reporte?.negocios.length ?? 0})
        </button>
        <button
          type="button"
          onClick={() => setVistaDetalle('INSTRUCCION')}
          className={`pb-2 border-b-2 transition-colors cursor-pointer ${
            vistaDetalle === 'INSTRUCCION'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          3. INSTRUCCIÓN OFICIAL PARA EL MODELO
        </button>
      </div>

      {/* VISTA 1: DIAGNÓSTICO OPERATIVO DE 5 DIMENSIONES */}
      {vistaDetalle === 'DIAGNOSTICO' && reporte ? (
        <div id="bloque-diagnostico-operativo" className="space-y-4">
          {/* Fila: Categoría Afectada y Parte del Contrato */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-xs uppercase font-bold text-slate-500 mb-1">
                1. Categoría Afectada
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded text-sm font-bold font-mono">
                  {reporte.diagnostico.categoriaAfectada}
                </span>
                <span className="text-xs text-slate-400">
                  Unidad de integración de la aplicación
                </span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-xs uppercase font-bold text-slate-500 mb-1">
                2. Parte del Contrato / App que Requiere Movimiento
              </div>
              <div className="text-xs text-slate-300 leading-relaxed font-mono">
                <span className="text-red-400 line-through">/access_codes/&#123;CODIGO&#125;</span>
                {' ➔ '}
                <span className="text-emerald-400 font-bold">/codigo_acceso/&#123;CODIGO&#125;</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Sustitución del resolver O(1) en pantalla de login y descontinuación del nodo legacy.
              </p>
            </div>
          </div>

          {/* Fila: Cambios Ejecutados por la Torre vs Pendientes del Modelo de Categoría */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cambios Ejecutados por la Torre */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="text-xs uppercase font-bold text-emerald-400">
                  3. Cambios que Ya Ejecutó la Torre (Autoridad)
                </h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                {reporte.diagnostico.cambiosEjecutadosTorre.map((c, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pendientes del Modelo de la Categoría */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h3 className="text-xs uppercase font-bold text-amber-400">
                  4. Qué Queda Pendiente del Modelo de Categoría
                </h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                {reporte.diagnostico.pendientesModeloCategoria.map((p, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">➔</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Acción Concreta Requerida */}
          <div className="bg-blue-950/20 border border-blue-500/30 p-4 rounded-xl">
            <div className="text-xs uppercase font-bold text-blue-400 mb-1">
              5. Acción Técnica Requerida para el Modelo de la Categoría
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              {reporte.diagnostico.accionRequeridaModelo}. El modelo de la categoría debe ejecutar estos cambios <strong>exclusivamente dentro de su propio repositorio</strong> (sin importar código ni herramientas de Torre de Control).
            </p>
          </div>
        </div>
      ) : null}

      {/* VISTA 2: LISTADO DE NEGOCIOS Y ESTADO DEL CONTRATO */}
      {vistaDetalle === 'NEGOCIOS' && reporte ? (
        <div id="bloque-negocios-contrato" className="space-y-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">ID Negocio</th>
                  <th className="p-3">Nombre Comercial</th>
                  <th className="p-3">Código de Acceso</th>
                  <th className="p-3">Ruta Esperada</th>
                  <th className="p-3">Puntero en /codigo_acceso</th>
                  <th className="p-3 text-right">Estatus Contrato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {reporte.negocios.map((neg) => (
                  <tr key={neg.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 font-mono text-blue-400 font-bold">{neg.id}</td>
                    <td className="p-3 text-slate-200 font-medium">{neg.nombre}</td>
                    <td className="p-3 font-mono text-emerald-400 font-semibold">{neg.codigo || '—'}</td>
                    <td className="p-3 font-mono text-slate-400">{neg.rutaEsperada}</td>
                    <td className="p-3 font-mono">
                      {neg.rutaEnCodigoAcceso ? (
                        <span className="text-slate-300">{neg.rutaEnCodigoAcceso}</span>
                      ) : (
                        <span className="text-red-400">Sin puntero</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {neg.estadoContrato === 'valido' ? (
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded font-bold uppercase text-[10px]">
                          Válido
                        </span>
                      ) : neg.estadoContrato === 'desalineado' ? (
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded font-bold uppercase text-[10px]">
                          Desalineado
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded font-bold uppercase text-[10px]">
                          Ausente
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* VISTA 3: INSTRUCCIÓN OFICIAL LISTA PARA COPIAR */}
      {vistaDetalle === 'INSTRUCCION' && reporte ? (
        <div id="bloque-instruccion-modelo" className="space-y-3">
          <div className="flex justify-between items-center bg-slate-900 p-3 rounded-t-xl border-t border-x border-slate-800">
            <span className="text-xs font-bold text-slate-400">
              Instrucción generada para el modelo de la categoría <span className="text-blue-400">{categoriaSeleccionada}</span>
            </span>
            <button
              type="button"
              onClick={copiarInstruccion}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold cursor-pointer transition-colors"
            >
              {copiado ? '¡Copiada!' : 'Copiar Texto'}
            </button>
          </div>
          <pre className="bg-slate-950 p-4 rounded-b-xl border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
            {reporte.instruccionModeloCategoria}
          </pre>
        </div>
      ) : null}
    </div>
  );
};
