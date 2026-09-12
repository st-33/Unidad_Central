import React, { useState, useEffect } from 'react';
import {
  MODULOS_SISTEMA,
  type NegocioRTDB,
  type DatosFichaNegocio,
  type DispositivoVinculado,
  type PoliticaDispositivos,
} from '../tipos';
import { ToggleSwitch } from './ToggleSwitch';
import { PanelDispositivos } from './PanelDispositivos';
import { ModalPreautorizarDispositivo } from './ModalPreautorizarDispositivo';
import { PanelReporteIntegracion } from './PanelReporteIntegracion';
import { URL_RTDB_NEGOCIOS, URL_RTDB_CENTRAL } from '../persistencia/conexion-rtdb';

interface PropsPanelFichaNegocio {
  negocio: NegocioRTDB;
  categoriasDisponibles: readonly string[];
  dispositivos: Record<string, DispositivoVinculado>;
  cargandoDispositivos: boolean;
  guardando: boolean;
  onVolver: () => void;
  onActualizar: (idNegocio: string, datos: DatosFichaNegocio) => Promise<void>;
  onEliminar: (categoria: string, id: string, codigo: string) => Promise<void>;
  onForzarSincronizacionCentral: (idNegocio: string) => Promise<void>;
  onActualizarPoliticas: (politicas: PoliticaDispositivos) => Promise<void>;
  onConmutarEstadoDispositivo: (deviceId: string, estadoActual: 'activo' | 'pendiente' | 'bloqueado') => Promise<void>;
  onDesvincularDispositivo: (deviceId: string) => Promise<void>;
  onPreautorizarDispositivo: (dispositivo: DispositivoVinculado) => Promise<void>;
  onRefrescarDispositivos: () => void;
  onNotificar: (mensaje: string, tipo?: 'exito' | 'error') => void;
}

export const PanelFichaNegocio: React.FC<PropsPanelFichaNegocio> = ({
  negocio,
  categoriasDisponibles,
  dispositivos,
  cargandoDispositivos,
  guardando,
  onVolver,
  onActualizar,
  onEliminar,
  onForzarSincronizacionCentral,
  onActualizarPoliticas,
  onConmutarEstadoDispositivo,
  onDesvincularDispositivo,
  onPreautorizarDispositivo,
  onRefrescarDispositivos,
  onNotificar,
}) => {
  const [subpestana, setSubpestana] = useState<'GENERAL' | 'DISPOSITIVOS' | 'CENTRAL' | 'REPORTE_APP'>('GENERAL');
  const [modalPreautorizar, setModalPreautorizar] = useState(false);

  // Form states
  const [nombre, setNombre] = useState(negocio.nombre || '');
  const [categoria, setCategoria] = useState(negocio.categoria || 'Marisquerias');
  const [activo, setActivo] = useState(negocio.activo ?? true);
  const [codigo, setCodigo] = useState(negocio.codigo || '');
  const [limite, setLimite] = useState(String(negocio.limite || 3));
  const [modulosBloqueados, setModulosBloqueados] = useState<Record<string, boolean>>(negocio.bloqueados || {});
  const [perfiles, setPerfiles] = useState<string[]>(
    negocio.perfiles?.length ? [...negocio.perfiles] : ['Administrador', 'Cajero', 'Comandero', 'Cocinero']
  );
  const [nuevoPerfilTexto, setNuevoPerfilTexto] = useState('');
  const [direccion, setDireccion] = useState(negocio.direccion || '');
  const [instagram, setInstagram] = useState(negocio.instagram || '');
  const [facebook, setFacebook] = useState(negocio.facebook || '');
  const [whatsapp, setWhatsapp] = useState(negocio.whatsapp || '');
  const [celular, setCelular] = useState(negocio.celular || '');
  const [correo, setCorreo] = useState(negocio.correo || '');
  const [politicas, setPoliticas] = useState<PoliticaDispositivos>(
    negocio.politicas_dispositivos || {
      permitir_navegador_web: true,
      permitir_dispositivos_genericos: true,
      validar_hardware_estricto: false,
    }
  );

  useEffect(() => {
    setNombre(negocio.nombre || '');
    setCategoria(negocio.categoria || 'Marisquerias');
    setActivo(negocio.activo ?? true);
    setCodigo(negocio.codigo || '');
    setLimite(String(negocio.limite || 3));
    setModulosBloqueados(negocio.bloqueados || {});
    setPerfiles(negocio.perfiles?.length ? [...negocio.perfiles] : ['Administrador', 'Cajero', 'Comandero', 'Cocinero']);
    setDireccion(negocio.direccion || '');
    setInstagram(negocio.instagram || '');
    setFacebook(negocio.facebook || '');
    setWhatsapp(negocio.whatsapp || '');
    setCelular(negocio.celular || '');
    setCorreo(negocio.correo || '');
    if (negocio.politicas_dispositivos) {
      setPoliticas(negocio.politicas_dispositivos);
    }
  }, [negocio]);

  const alternarBloqueoModulo = (modulo: string) => {
    setModulosBloqueados((prev) => ({ ...prev, [modulo]: !prev[modulo] }));
  };

  const agregarPerfil = () => {
    const texto = nuevoPerfilTexto.trim();
    if (!texto) return;
    if (perfiles.includes(texto)) {
      onNotificar('El perfil ya existe', 'error');
      return;
    }
    setPerfiles([...perfiles, texto]);
    setNuevoPerfilTexto('');
  };

  const eliminarPerfil = (perfil: string) => {
    setPerfiles(perfiles.filter((p) => p !== perfil));
  };

  const handleActualizar = async () => {
    if (!nombre.trim()) {
      onNotificar('El nombre comercial es obligatorio', 'error');
      return;
    }
    if (!codigo.trim()) {
      onNotificar('El código de acceso es obligatorio', 'error');
      return;
    }

    const datos: DatosFichaNegocio = {
      nombre: nombre.trim(),
      categoria: categoria.trim() || 'Marisquerias',
      activo,
      codigo: codigo.trim().toUpperCase().replace(/\s+/g, ''),
      limite: parseInt(limite, 10) || 3,
      bloqueados: modulosBloqueados,
      perfiles,
      politicas_dispositivos: politicas,
      direccion: direccion.trim(),
      instagram: instagram.trim(),
      facebook: facebook.trim(),
      whatsapp: whatsapp.trim(),
      celular: celular.trim(),
      correo: correo.trim(),
    };

    await onActualizar(negocio.id, datos);
  };

  return (
    <div id="pantalla-panel-negocio" className="min-h-screen bg-slate-950 text-slate-200 font-sans p-4 md:p-8 relative">
      <div className="max-w-3xl mx-auto pb-24">
        {/* Cabecera del Panel */}
        <div id="cabecera-panel-negocio" className="mb-8">
          <button
            id="boton-volver-al-directorio"
            type="button"
            onClick={onVolver}
            className="text-cyan-400 hover:text-cyan-300 font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al Directorio
          </button>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <h1 className="text-3xl font-black text-white">{nombre || negocio.nombre}</h1>
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase font-bold text-slate-400">
                {activo ? 'Operativo' : 'Desactivado'}
              </span>
              <ToggleSwitch
                id="switch-activo-panel"
                enabled={activo}
                onChange={() => setActivo(!activo)}
                colorActivo="verde"
              />
            </div>
          </div>
          <p className="text-slate-400 mt-2 text-xs font-mono">
            Ruta Negocio:{' '}
            <span className="text-cyan-400 font-bold">
              /{categoria}/{negocio.id}
            </span>{' '}
            | Acceso:{' '}
            <span className="text-emerald-400 font-bold">{codigo}</span>
          </p>
        </div>

        {/* NAVEGACIÓN ENTRE SUBPESTAÑAS */}
        <div id="subpestanas-panel" className="flex border-b border-slate-800 mb-6 gap-2 flex-wrap">
          <button
            id="pestana-datos-generales"
            type="button"
            onClick={() => setSubpestana('GENERAL')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              subpestana === 'GENERAL'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Configuración General
          </button>
          <button
            id="pestana-dispositivos"
            type="button"
            onClick={() => setSubpestana('DISPOSITIVOS')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              subpestana === 'DISPOSITIVOS'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Dispositivos y Políticas
            <span className="bg-slate-800 text-[10px] px-2 py-0.5 rounded-full font-mono">
              {Object.keys(dispositivos).length}
            </span>
          </button>
          <button
            id="pestana-unidad-central"
            type="button"
            onClick={() => setSubpestana('CENTRAL')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              subpestana === 'CENTRAL'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Unidad Central
          </button>
          <button
            id="pestana-reporte-app"
            type="button"
            onClick={() => setSubpestana('REPORTE_APP')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              subpestana === 'REPORTE_APP'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="font-mono text-xs">📋</span> Reporte Técnico App
          </button>
        </div>

        {/* SUBPESTAÑA 1: CONFIGURACIÓN GENERAL */}
        {subpestana === 'GENERAL' && (
          <div className="space-y-6">
            <div id="bloque-nombre-panel" className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
              <label htmlFor="input-nombre-comercial-panel" className="block text-sm font-semibold text-slate-400 mb-2">
                Nombre Comercial
              </label>
              <input
                id="input-nombre-comercial-panel"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-500 font-bold text-lg"
              />
            </div>

            <div id="bloque-categoria-panel" className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
              <label htmlFor="select-categoria-panel" className="block text-sm font-semibold text-slate-400 mb-2">
                Categoría en Matriz
              </label>
              <select
                id="select-categoria-panel"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 font-bold"
              >
                {categoriasDisponibles.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {categoria !== negocio.categoria ? (
                <p className="text-xs text-amber-400 mt-2">
                  ⚠ Al actualizar, el negocio se moverá atómicamente de /{negocio.categoria} a /{categoria}.
                </p>
              ) : null}
            </div>

            <div id="bloque-acceso-panel" className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                <span className="w-6 h-px bg-slate-700"></span> Bloque A — Acceso
              </h3>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="input-codigo-acceso-panel" className="block text-sm font-semibold text-slate-400 mb-1">
                    Código de Acceso (Único)
                  </label>
                  <p className="text-xs text-slate-500 mb-2">Indexado en /codigo_acceso.</p>
                  <input
                    id="input-codigo-acceso-panel"
                    type="text"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-500 font-mono uppercase font-bold tracking-wider"
                  />
                </div>
                <div>
                  <label htmlFor="input-limite-dispositivos-panel" className="block text-sm font-semibold text-slate-400 mb-1">
                    Límite de Dispositivos
                  </label>
                  <p className="text-xs text-slate-500 mb-2">Límite operativo simultáneo.</p>
                  <input
                    id="input-limite-dispositivos-panel"
                    type="number"
                    min="1"
                    value={limite}
                    onChange={(e) => setLimite(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>
            </div>

            <div id="bloque-modulos-panel" className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg border-l-4 border-l-red-500/50">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                <span className="w-6 h-px bg-slate-700"></span> Bloque B — Módulos
              </h3>
              <p className="text-sm text-slate-400 mb-6 border-b border-slate-800 pb-4">
                Activa el interruptor para <span className="text-red-400 font-bold">BLOQUEAR</span> y excluir el módulo del negocio.
              </p>

              <div className="space-y-4">
                {MODULOS_SISTEMA.map((modulo) => (
                  <div
                    key={modulo}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/50 transition-colors"
                  >
                    <span
                      className={`text-base font-medium ${
                        modulosBloqueados[modulo] ? 'text-slate-500 line-through' : 'text-slate-200'
                      }`}
                    >
                      {modulo}
                    </span>
                    <ToggleSwitch
                      id={`switch-modulo-panel-${modulo}`}
                      enabled={!!modulosBloqueados[modulo]}
                      onChange={() => alternarBloqueoModulo(modulo)}
                      colorActivo="rojo"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div id="bloque-perfiles-panel" className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <span className="w-6 h-px bg-slate-700"></span> Bloque C — Perfiles Operativos
              </h3>

              <div className="flex flex-wrap gap-2 mb-4">
                {perfiles.map((perfil) => (
                  <div
                    key={perfil}
                    className="bg-slate-950 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm text-slate-300"
                  >
                    <span>{perfil}</span>
                    <button
                      type="button"
                      onClick={() => eliminarPerfil(perfil)}
                      className="text-slate-500 hover:text-red-400 font-bold ml-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  id="input-nuevo-perfil-panel"
                  type="text"
                  value={nuevoPerfilTexto}
                  onChange={(e) => setNuevoPerfilTexto(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      agregarPerfil();
                    }
                  }}
                  placeholder="Nuevo perfil"
                  className="flex-1 bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500"
                />
                <button
                  id="boton-agregar-perfil-panel"
                  type="button"
                  onClick={agregarPerfil}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-lg text-sm font-bold cursor-pointer"
                >
                  Agregar
                </button>
              </div>
            </div>

            <div id="bloque-contacto-panel" className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                <span className="w-6 h-px bg-slate-700"></span> Datos de Contacto
              </h3>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="input-instagram-panel" className="block text-xs font-bold text-slate-400 mb-1">
                    Instagram
                  </label>
                  <input
                    id="input-instagram-panel"
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label htmlFor="input-facebook-panel" className="block text-xs font-bold text-slate-400 mb-1">
                    Facebook
                  </label>
                  <input
                    id="input-facebook-panel"
                    type="text"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label htmlFor="input-whatsapp-panel" className="block text-xs font-bold text-slate-400 mb-1">
                    WhatsApp
                  </label>
                  <input
                    id="input-whatsapp-panel"
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label htmlFor="input-celular-panel" className="block text-xs font-bold text-slate-400 mb-1">
                    Número celular
                  </label>
                  <input
                    id="input-celular-panel"
                    type="text"
                    value={celular}
                    onChange={(e) => setCelular(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="input-correo-panel" className="block text-xs font-bold text-slate-400 mb-1">
                  Correo electrónico
                </label>
                <input
                  id="input-correo-panel"
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div id="bloque-direccion-panel" className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                <span className="w-6 h-px bg-slate-700"></span> Dirección
              </h3>
              <input
                id="input-direccion-panel"
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-500 text-sm"
              />
            </div>

            <div className="flex gap-4">
              <button
                id="boton-actualizar-en-matriz"
                type="button"
                onClick={handleActualizar}
                disabled={guardando}
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-cyan-500/20 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {guardando ? 'ACTUALIZANDO RTDB...' : 'ACTUALIZAR EN MATRIZ'}
              </button>

              <button
                id="boton-retirar-de-matriz"
                type="button"
                onClick={() => onEliminar(negocio.categoria || categoria, negocio.id, negocio.codigo)}
                disabled={guardando}
                className="bg-slate-900 hover:bg-red-950/40 border border-red-800 text-red-400 px-6 py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition-all cursor-pointer"
              >
                Retirar
              </button>
            </div>
          </div>
        )}

        {/* SUBPESTAÑA 2: DISPOSITIVOS Y POLÍTICAS */}
        {subpestana === 'DISPOSITIVOS' && (
          <PanelDispositivos
            idNegocio={negocio.id}
            categoria={negocio.categoria || categoria}
            limiteDispositivos={parseInt(limite, 10) || negocio.limite || 1}
            dispositivos={dispositivos}
            cargandoDispositivos={cargandoDispositivos}
            politicas={politicas}
            onActualizarPoliticas={async (p) => {
              setPoliticas(p);
              await onActualizarPoliticas(p);
            }}
            onConmutarEstado={onConmutarEstadoDispositivo}
            onDesvincular={onDesvincularDispositivo}
            onAbrirModalPreautorizar={() => setModalPreautorizar(true)}
            onRefrescar={onRefrescarDispositivos}
          />
        )}

        {/* SUBPESTAÑA 3: UNIDAD CENTRAL */}
        {subpestana === 'CENTRAL' && (
          <div id="panel-unidad-central" className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <span className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse"></span>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider">
                    Sincronización con Unidad Central
                  </h3>
                  <p className="text-xs text-slate-400">
                    Matriz central de gobernanza y respaldo maestro en base-principal-ma1.
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-slate-400 font-bold uppercase">RTDB Negocios (Operativo)</div>
                  <div className="text-emerald-400 truncate">{URL_RTDB_NEGOCIOS}</div>
                  <div className="text-slate-300">
                    Nodo:{' '}
                    <span className="text-white font-bold">
                      /{categoria}/{negocio.id}
                    </span>
                  </div>
                  <div className="text-slate-300">
                    Contrato Único:{' '}
                    <span className="text-white font-bold">
                      /codigo_acceso/{negocio.codigo}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-slate-400 font-bold uppercase">RTDB Central (Torre Maestra)</div>
                  <div className="text-cyan-400 truncate">{URL_RTDB_CENTRAL}</div>
                  <div className="text-slate-300">
                    Ficha:{' '}
                    <span className="text-white font-bold">
                      /torre_control/negocios/{negocio.id}
                    </span>
                  </div>
                  <div className="text-slate-300">
                    Índice:{' '}
                    <span className="text-white font-bold">
                      /torre_control/indice_codigos/{negocio.codigo}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  id="boton-forzar-sincronizacion-central"
                  type="button"
                  onClick={() => onForzarSincronizacionCentral(negocio.id)}
                  disabled={guardando}
                  className="w-full bg-cyan-700 hover:bg-cyan-600 text-white font-bold uppercase tracking-wider py-3 rounded-xl transition-colors cursor-pointer text-xs"
                >
                  {guardando ? 'Sincronizando...' : 'Forzar Re-sincronización con Unidad Central'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUBPESTAÑA 4: REPORTE TÉCNICO E INTEGRACIÓN APP */}
        {subpestana === 'REPORTE_APP' && (
          <PanelReporteIntegracion
            categoriaSeleccionada={negocio.categoria || categoria}
            categoriasDisponibles={categoriasDisponibles}
            alCambiarCategoria={(c) => {
              setCategoria(c);
            }}
          />
        )}
      </div>

      {modalPreautorizar ? (
        <ModalPreautorizarDispositivo
          idNegocio={negocio.id}
          nombreNegocio={negocio.nombre}
          onCerrar={() => setModalPreautorizar(false)}
          onGuardar={async (datos) => {
            await onPreautorizarDispositivo(datos);
            setModalPreautorizar(false);
          }}
        />
      ) : null}
    </div>
  );
};
