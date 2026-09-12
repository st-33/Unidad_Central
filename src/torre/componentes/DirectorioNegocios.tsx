import React from 'react';
import type { NegocioRTDB } from '../tipos';
import { PanelReporteIntegracion } from './PanelReporteIntegracion';

interface PropsDirectorioNegocios {
  pantallaActual: 'DIRECTORIO' | 'REPORTE_TECNICO';
  onCambiarPantalla: (pantalla: 'DIRECTORIO' | 'REPORTE_TECNICO') => void;
  categoriaActiva: string;
  categoriasDisponibles: readonly string[];
  negocios: readonly NegocioRTDB[];
  cargando: boolean;
  armonizandoGlobal: boolean;
  onCambiarCategoria: (categoria: string) => void;
  onAbrirModalNuevaCategoria: () => void;
  onSeleccionarNegocio: (negocio: NegocioRTDB) => void;
  onEjecutarArmonizacionGlobal: () => void;
  onAbrirCrearNegocio: () => void;
}

export const DirectorioNegocios: React.FC<PropsDirectorioNegocios> = ({
  pantallaActual,
  onCambiarPantalla,
  categoriaActiva,
  categoriasDisponibles,
  negocios,
  cargando,
  armonizandoGlobal,
  onCambiarCategoria,
  onAbrirModalNuevaCategoria,
  onSeleccionarNegocio,
  onEjecutarArmonizacionGlobal,
  onAbrirCrearNegocio,
}) => {
  return (
    <div className="max-w-4xl mx-auto pb-24">
      {/* Cabecera Principal */}
      <div id="cabecera-torre-control" className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span className="bg-cyan-600 p-2 rounded-xl text-white shadow-lg shadow-cyan-600/30">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </span>
              TORRE DE CONTROL
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Gobernanza centralizada de negocios y contratos de acceso en RTDB.
            </p>
          </div>

          {/* Selector de Categoría en Cabecera */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-xl self-start sm:self-auto">
            <span className="text-xs font-bold text-slate-400 pl-2">Categoría:</span>
            <select
              id="select-categoria-directorio"
              value={categoriaActiva}
              onChange={(e) => onCambiarCategoria(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-white text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500"
            >
              {categoriasDisponibles.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <button
              id="boton-abrir-nueva-categoria"
              type="button"
              onClick={onAbrirModalNuevaCategoria}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              title="Crear nueva categoría"
            >
              + Nueva
            </button>
          </div>
        </div>

        {/* Selector de Pestañas de la Primera Pantalla de la Torre */}
        <div
          id="selector-pantalla-principal"
          className="flex items-center gap-2 mt-5 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 w-full sm:w-fit"
        >
          <button
            id="boton-tab-directorio"
            type="button"
            onClick={() => onCambiarPantalla('DIRECTORIO')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              pantallaActual === 'DIRECTORIO'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span>🏢</span>
            <span>Directorio de Negocios</span>
            <span className="ml-1 px-1.5 py-0.5 rounded bg-slate-950/60 text-[10px] font-mono">
              {negocios.length}
            </span>
          </button>
          <button
            id="boton-tab-orquestacion"
            type="button"
            onClick={() => onCambiarPantalla('REPORTE_TECNICO')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              pantallaActual === 'REPORTE_TECNICO'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span>📊</span>
            <span>Reporte Técnico y Orquestación</span>
            <span className="ml-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
              /codigo_acceso
            </span>
          </button>
        </div>
      </div>

      {/* CUERPO SEGÚN LA PESTAÑA ACTIVA DE LA PRIMERA PANTALLA */}
      {pantallaActual === 'REPORTE_TECNICO' ? (
        <PanelReporteIntegracion
          categoriaSeleccionada={categoriaActiva}
          categoriasDisponibles={categoriasDisponibles}
          alCambiarCategoria={onCambiarCategoria}
        />
      ) : (
        <>
          {/* Subcabecera del Directorio */}
          <div id="subcabecera-directorio" className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-6">
            <h2 className="text-lg font-bold text-slate-300">
              Negocios Registrados ({cargando ? '...' : negocios.length})
            </h2>
            <div className="flex items-center gap-3">
              <div className="text-xs text-slate-500 font-mono hidden md:block">
                /{categoriaActiva} • Contrato Único: /codigo_acceso
              </div>
              <button
                id="boton-armonizar-indices-barra"
                type="button"
                onClick={onEjecutarArmonizacionGlobal}
                disabled={armonizandoGlobal}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-400 hover:text-emerald-300 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                title="Consolida todas las claves hacia el contrato único /codigo_acceso"
              >
                <span>⚡</span> {armonizandoGlobal ? 'Consolidando...' : 'Consolidar Contrato Único'}
              </button>
            </div>
          </div>

          {/* Estado de carga */}
          {cargando && negocios.length === 0 ? (
            <div id="estado-cargando-rtdb" className="p-12 text-center text-slate-500 bg-slate-900/50 border border-slate-800 rounded-xl">
              <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm font-semibold">Conectando a la RTDB matriz...</p>
            </div>
          ) : null}

          {/* Estado vacío */}
          {!cargando && negocios.length === 0 ? (
            <div id="estado-vacio-directorio" className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl">
              <p className="text-slate-300 font-bold text-base mb-1">
                No hay negocios registrados en la categoría <span className="text-cyan-400">{categoriaActiva}</span>.
              </p>
              <p className="text-slate-500 text-sm">
                Presiona el botón <span className="text-emerald-400 font-bold">+</span> en la esquina inferior izquierda para dar de alta el primer negocio.
              </p>
            </div>
          ) : null}

          {/* Lista de Negocios en Matriz */}
          <div id="lista-negocios-matriz" className="grid gap-4">
            {negocios.map((negocio) => (
              <button
                id={`tarjeta-negocio-${negocio.id}`}
                key={negocio.id}
                onClick={() => onSeleccionarNegocio(negocio)}
                className="w-full bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between hover:border-slate-600 hover:bg-slate-800/50 transition-all text-left group cursor-pointer active:scale-[0.99]"
              >
                <div>
                  <h2 className="text-lg font-bold text-slate-100 group-hover:text-white transition-colors">
                    {negocio.nombre}
                  </h2>
                  <div className="flex items-center gap-3 mt-1 text-xs font-mono text-slate-500">
                    <span className="text-emerald-400 font-semibold">Acceso: {negocio.codigo}</span>
                    <span>•</span>
                    <span>Límite: {negocio.limite}</span>
                    {negocio.direccion ? (
                      <>
                        <span>•</span>
                        <span className="line-clamp-1">{negocio.direccion}</span>
                      </>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xs uppercase font-bold text-slate-400 hidden sm:block">
                    {negocio.activo ? 'Operativo' : 'Desactivado'}
                  </span>
                  <div
                    className={`w-3.5 h-3.5 rounded-full shadow-lg ${
                      negocio.activo ? 'bg-emerald-500 shadow-emerald-500/40' : 'bg-red-500 shadow-red-500/40'
                    }`}
                  />
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Botón flotante para nuevo negocio */}
      <button
        id="boton-flotante-nuevo-negocio"
        onClick={onAbrirCrearNegocio}
        title="Registrar nuevo negocio"
        className="fixed bottom-6 left-6 w-14 h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-600/30 hover:scale-105 active:scale-95 transition-all z-40 border border-emerald-400/30 cursor-pointer"
      >
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
};
