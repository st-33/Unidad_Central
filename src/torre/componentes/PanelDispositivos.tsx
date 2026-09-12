import React, { useState } from 'react';
import type { DispositivoVinculado, PoliticaDispositivos } from '../tipos';

interface PanelDispositivosProps {
  idNegocio: string;
  categoria: string;
  limiteDispositivos: number;
  dispositivos: Record<string, DispositivoVinculado>;
  cargandoDispositivos: boolean;
  politicas: PoliticaDispositivos;
  onActualizarPoliticas: (politicas: PoliticaDispositivos) => Promise<void>;
  onConmutarEstado: (deviceId: string, estadoActual: 'activo' | 'bloqueado' | 'pendiente') => Promise<void>;
  onDesvincular: (deviceId: string) => Promise<void>;
  onAbrirModalPreautorizar: () => void;
  onRefrescar: () => void;
}

export const PanelDispositivos: React.FC<PanelDispositivosProps> = ({
  limiteDispositivos,
  dispositivos,
  cargandoDispositivos,
  politicas,
  onActualizarPoliticas,
  onConmutarEstado,
  onDesvincular,
  onAbrirModalPreautorizar,
  onRefrescar,
}) => {
  const [localPoliticas, setLocalPoliticas] = useState<PoliticaDispositivos>(politicas);
  const [guardandoPoliticas, setGuardandoPoliticas] = useState(false);

  const listaDispositivos = Object.values(dispositivos);
  const totalActivos = listaDispositivos.filter((d) => d.estado === 'activo').length;
  const porcentajeUso = Math.min(100, Math.round((listaDispositivos.length / Math.max(1, limiteDispositivos)) * 100));

  const manejarGuardarPoliticas = async () => {
    setGuardandoPoliticas(true);
    try {
      await onActualizarPoliticas(localPoliticas);
    } finally {
      setGuardandoPoliticas(false);
    }
  };

  const formatearFecha = (timestamp?: number) => {
    if (!timestamp) return 'Sin registro';
    return new Date(timestamp).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div id="panel-dispositivos-contenedor" className="space-y-6">
      {/* CUOTA Y RESUMEN DE DISPOSITIVOS */}
      <div id="resumen-cuota-dispositivos" className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
              Cupo de Dispositivos Conectados
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Capacidad configurada: <span className="font-mono text-white font-bold">{limiteDispositivos}</span> dispositivos simultáneos
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-white">{listaDispositivos.length}</span>
            <span className="text-slate-500 text-sm font-semibold"> / {limiteDispositivos}</span>
          </div>
        </div>

        {/* Barra de Progreso de Capacidad */}
        <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-300 ${
              listaDispositivos.length >= limiteDispositivos
                ? 'bg-red-500'
                : porcentajeUso > 70
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${porcentajeUso}%` }}
          />
        </div>

        <div className="flex justify-between items-center mt-3 text-xs text-slate-400">
          <span>{totalActivos} activos / {listaDispositivos.length - totalActivos} bloqueados</span>
          <span className="font-mono">{porcentajeUso}% utilizado</span>
        </div>
      </div>

      {/* POLÍTICAS DE ACCESO: NAVEGADOR WEB Y DISPOSITIVOS GENÉRICOS */}
      <div id="seccion-politicas-acceso" className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Políticas de Ingreso y Navegadores
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Controla la admisión de terminales web, emuladores y dispositivos sin ID de fábrica.
            </p>
          </div>
          <button
            id="boton-guardar-politicas-dispositivos"
            type="button"
            onClick={manejarGuardarPoliticas}
            disabled={guardandoPoliticas}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            {guardandoPoliticas ? 'Guardando...' : 'Aplicar Políticas'}
          </button>
        </div>

        <div className="space-y-3 pt-1">
          {/* Política 1: Navegador Web */}
          <div className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl">
            <div className="pr-4">
              <h4 className="text-sm font-bold text-slate-200">
                Permitir Navegadores Web (Chrome, Safari, Edge, Firefox)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Autoriza el ingreso desde laptops o PCs de escritorio mediante navegador sin exigir hardware físico móvil.
              </p>
            </div>
            <button
              id="switch-politica-navegador-web"
              type="button"
              onClick={() =>
                setLocalPoliticas((prev) => ({
                  ...prev,
                  permitir_navegador_web: !prev.permitir_navegador_web,
                }))
              }
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                localPoliticas.permitir_navegador_web ? 'bg-emerald-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  localPoliticas.permitir_navegador_web ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Política 2: Dispositivos Genéricos / Emuladores (brand: unknown) */}
          <div className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl">
            <div className="pr-4">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-200">
                  Permitir Dispositivos Genéricos / Expo Development
                </h4>
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono px-1.5 py-0.5 rounded">
                  brand: unknown
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Resuelve el rechazo <span className="font-mono text-amber-400">[deviceBinding] Dispositivo inválido o genérico</span> para pruebas en Expo o navegadores de desarrollo.
              </p>
            </div>
            <button
              id="switch-politica-dispositivos-genericos"
              type="button"
              onClick={() =>
                setLocalPoliticas((prev) => ({
                  ...prev,
                  permitir_dispositivos_genericos: !prev.permitir_dispositivos_genericos,
                }))
              }
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                localPoliticas.permitir_dispositivos_genericos ? 'bg-emerald-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  localPoliticas.permitir_dispositivos_genericos ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Política 3: Validación de Hardware Estricta */}
          <div className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl">
            <div className="pr-4">
              <h4 className="text-sm font-bold text-slate-200">
                Validación Estricta de Hardware (Producción Física)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Exige que cada dispositivo cuente con número de serie único y huella biométrica de dispositivo de fábrica.
              </p>
            </div>
            <button
              id="switch-politica-hardware-estricto"
              type="button"
              onClick={() =>
                setLocalPoliticas((prev) => ({
                  ...prev,
                  validar_hardware_estricto: !prev.validar_hardware_estricto,
                }))
              }
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                localPoliticas.validar_hardware_estricto ? 'bg-emerald-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  localPoliticas.validar_hardware_estricto ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* LISTADO DE DISPOSITIVOS VINCULADOS */}
      <div id="seccion-listado-dispositivos" className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Dispositivos Vinculados ({listaDispositivos.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Administra accesos, bloquea terminales o libera cupos desvinculando dispositivos.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="boton-refrescar-dispositivos"
              type="button"
              onClick={onRefrescar}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              title="Refrescar lista desde RTDB"
            >
              ↻ Refrescar
            </button>
            <button
              id="boton-abrir-modal-preautorizar"
              type="button"
              onClick={onAbrirModalPreautorizar}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              + Pre-Autorizar
            </button>
          </div>
        </div>

        {cargandoDispositivos ? (
          <div className="p-8 text-center text-slate-500">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-xs font-semibold">Consultando dispositivos en RTDB...</p>
          </div>
        ) : listaDispositivos.length === 0 ? (
          <div id="estado-sin-dispositivos" className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/80">
            <p className="text-slate-300 font-bold text-sm mb-1">
              No hay dispositivos vinculados aún
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Cuando un dispositivo ingrese con el código de acceso del negocio, se registrará aquí automáticamente. También puedes pre-autorizarlo con el botón de arriba.
            </p>
          </div>
        ) : (
          <div id="tarjetas-dispositivos" className="space-y-3">
            {listaDispositivos.map((dev) => {
              const estaActivo = dev.estado === 'activo';
              return (
                <div
                  id={`tarjeta-dispositivo-${dev.deviceId}`}
                  key={dev.deviceId}
                  className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-100 text-sm">
                        {dev.alias || 'Dispositivo sin alias'}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          estaActivo
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {estaActivo ? 'Activo' : 'Bloqueado'}
                      </span>
                      {dev.nivelOperativo ? (
                        <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full">
                          {dev.nivelOperativo}
                        </span>
                      ) : null}
                    </div>

                    <div className="font-mono text-xs text-slate-400 select-all">
                      ID: {dev.deviceId}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono flex-wrap">
                      <span>Plataforma: {dev.brand || 'Desconocida'} ({dev.model || 'Web'})</span>
                      <span>•</span>
                      <span>Registro: {formatearFecha(dev.fechaRegistro || dev.vinculadoEn)}</span>
                      {dev.ultimoHeartbeat ? (
                        <>
                          <span>•</span>
                          <span>Último contacto: {formatearFecha(dev.ultimoHeartbeat)}</span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  {/* Acciones de Dispositivo */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      id={`boton-conmutar-${dev.deviceId}`}
                      type="button"
                      onClick={() => onConmutarEstado(dev.deviceId, dev.estado)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        estaActivo
                          ? 'bg-slate-800 hover:bg-amber-950/50 text-amber-300 border border-amber-800/40'
                          : 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700/40'
                      }`}
                    >
                      {estaActivo ? 'Bloquear' : 'Desbloquear'}
                    </button>

                    <button
                      id={`boton-desvincular-${dev.deviceId}`}
                      type="button"
                      onClick={() => onDesvincular(dev.deviceId)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-red-950/60 text-red-400 border border-red-900/40 transition-colors cursor-pointer"
                      title="Desvincular y liberar cupo"
                    >
                      Desvincular
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
