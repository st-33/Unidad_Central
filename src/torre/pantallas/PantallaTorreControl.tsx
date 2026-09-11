import React, { useState, useEffect } from 'react';
import { servicioTorreControl } from '../logica/servicio-torre';
import { MODULOS_SISTEMA, type NegocioRTDB, type DatosFichaNegocio } from '../tipos';

// Componente de Switch personalizado (Toggle)
const ToggleSwitch: React.FC<{
  enabled: boolean;
  onChange: () => void;
}> = ({ enabled, onChange }) => {
  return (
    <button
      type="button"
      className={`${
        enabled ? 'bg-red-600' : 'bg-slate-700'
      } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900`}
      onClick={onChange}
    >
      <span
        aria-hidden="true"
        className={`${
          enabled ? 'translate-x-5' : 'translate-x-0'
        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
      />
    </button>
  );
};

export const PantallaTorreControl: React.FC = () => {
  const [pantallaActual, setPantallaActual] = useState<'DIRECTORIO' | 'PANEL_NEGOCIO' | 'CREAR_NEGOCIO'>('DIRECTORIO');
  const [negocios, setNegocios] = useState<readonly NegocioRTDB[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [guardando, setGuardando] = useState<boolean>(false);
  const [negocioSeleccionado, setNegocioSeleccionado] = useState<NegocioRTDB | null>(null);

  // Estados del Formulario / Panel
  const [formNombre, setFormNombre] = useState('');
  const [formActivo, setFormActivo] = useState(true);
  const [formCodigo, setFormCodigo] = useState('');
  const [formLimite, setFormLimite] = useState('3');
  const [formModulosBloqueados, setFormModulosBloqueados] = useState<Record<string, boolean>>({});
  const [formPerfiles, setFormPerfiles] = useState<string[]>([
    'Administrador',
    'Cajero',
    'Comandero',
    'Cocinero',
  ]);
  const [nuevoPerfilTexto, setNuevoPerfilTexto] = useState('');
  const [formDireccion, setFormDireccion] = useState('');
  const [formInstagram, setFormInstagram] = useState('');
  const [formFacebook, setFormFacebook] = useState('');
  const [formWhatsapp, setFormWhatsapp] = useState('');
  const [formCelular, setFormCelular] = useState('');
  const [formCorreo, setFormCorreo] = useState('');

  // Toast Notificación
  const [toast, setToast] = useState<{ tipo: 'exito' | 'error'; mensaje: string } | null>(null);

  const mostrarNotificacion = (mensaje: string, tipo: 'exito' | 'error' = 'exito') => {
    setToast({ tipo, mensaje });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Cargar y suscribir negocios desde RTDB real
  useEffect(() => {
    setCargando(true);
    const cancelarSuscripcion = servicioTorreControl.suscribirNegocios((lista) => {
      setNegocios(lista);
      setCargando(false);
    });

    return () => {
      cancelarSuscripcion();
    };
  }, []);

  const abrirCrearNegocio = () => {
    setFormNombre('');
    setFormActivo(true);
    setFormCodigo('');
    setFormLimite('3');
    setFormModulosBloqueados({
      Reparto: false,
      'KDS Cocina': false,
      Caja: false,
      Comandero: false,
    });
    setFormPerfiles(['Administrador', 'Cajero', 'Comandero', 'Cocinero']);
    setNuevoPerfilTexto('');
    setFormDireccion('');
    setFormInstagram('');
    setFormFacebook('');
    setFormWhatsapp('');
    setFormCelular('');
    setFormCorreo('');
    setPantallaActual('CREAR_NEGOCIO');
  };

  const abrirPanelNegocio = (negocio: NegocioRTDB) => {
    setNegocioSeleccionado(negocio);
    setFormNombre(negocio.nombre);
    setFormActivo(negocio.activo);
    setFormCodigo(negocio.codigo || '');
    setFormLimite(String(negocio.limite || 1));
    setFormModulosBloqueados(negocio.bloqueados || {});
    setFormPerfiles(
      negocio.perfiles && negocio.perfiles.length > 0
        ? [...negocio.perfiles]
        : ['Administrador', 'Cajero', 'Comandero', 'Cocinero']
    );
    setNuevoPerfilTexto('');
    setFormDireccion(negocio.direccion || '');
    setFormInstagram(negocio.instagram || '');
    setFormFacebook(negocio.facebook || '');
    setFormWhatsapp(negocio.whatsapp || '');
    setFormCelular(negocio.celular || '');
    setFormCorreo(negocio.correo || '');
    setPantallaActual('PANEL_NEGOCIO');
  };

  const volverAlDirectorio = () => {
    setPantallaActual('DIRECTORIO');
    setNegocioSeleccionado(null);
  };

  const alternarBloqueoModulo = (modulo: string) => {
    setFormModulosBloqueados((prev) => ({
      ...prev,
      [modulo]: !prev[modulo],
    }));
  };

  const agregarPerfil = () => {
    const texto = nuevoPerfilTexto.trim();
    if (!texto) return;
    if (!formPerfiles.includes(texto)) {
      setFormPerfiles((prev) => [...prev, texto]);
    }
    setNuevoPerfilTexto('');
  };

  const eliminarPerfil = (perfil: string) => {
    setFormPerfiles((prev) => prev.filter((p) => p !== perfil));
  };

  // Guardar en RTDB (creación o actualización)
  const impactarRTDB = async (idParaActualizar?: string) => {
    if (!formNombre.trim()) {
      mostrarNotificacion('El nombre comercial es obligatorio.', 'error');
      return;
    }

    setGuardando(true);

    const payload: DatosFichaNegocio = {
      nombre: formNombre.trim(),
      activo: formActivo,
      codigo: formCodigo.trim(),
      limite: Math.max(1, parseInt(formLimite, 10) || 1),
      bloqueados: formModulosBloqueados,
      perfiles: formPerfiles,
      direccion: formDireccion.trim(),
      instagram: formInstagram.trim(),
      facebook: formFacebook.trim(),
      whatsapp: formWhatsapp.trim(),
      celular: formCelular.trim(),
      correo: formCorreo.trim(),
    };

    const res = await servicioTorreControl.registrarOActualizarNegocio(payload, idParaActualizar);
    setGuardando(false);

    if (res.exito) {
      mostrarNotificacion(res.mensaje, 'exito');
      volverAlDirectorio();
    } else {
      mostrarNotificacion(res.mensaje, 'error');
    }
  };

  // Eliminar negocio de la matriz RTDB
  const eliminarNegocio = async (id: string) => {
    if (!window.confirm(`¿Confirmas retirar este negocio de la matriz RTDB?`)) {
      return;
    }

    setGuardando(true);
    const res = await servicioTorreControl.eliminarNegocio(id);
    setGuardando(false);

    if (res.exito) {
      mostrarNotificacion(res.mensaje, 'exito');
      volverAlDirectorio();
    } else {
      mostrarNotificacion(res.mensaje, 'error');
    }
  };

  // --- VISTA 1: DIRECTORIO ---
  if (pantallaActual === 'DIRECTORIO') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-4 md:p-8 relative selection:bg-blue-600 selection:text-white">
        <div className="max-w-4xl mx-auto pb-24">
          {/* Cabecera Principal */}
          <div className="border-b border-slate-800 pb-6 mb-6">
            <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                />
              </svg>
              TORRE DE CONTROL
            </h1>
            <p className="text-slate-400 mt-1 uppercase text-sm font-semibold tracking-widest flex items-center gap-2">
              Categoría Activa: <span className="text-blue-400 font-bold">Marisquerías</span>
            </p>
          </div>

          {/* Subcabecera del Directorio */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-300">
              Negocios Registrados ({cargando ? '...' : negocios.length})
            </h2>
            <div className="text-xs text-slate-500 font-mono">
              RTDB Matriz: minegocioaunclick
            </div>
          </div>

          {/* Estado de carga */}
          {cargando && negocios.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-slate-900/50 border border-slate-800 rounded-xl">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm font-semibold">Conectando a la RTDB matriz...</p>
            </div>
          ) : null}

          {/* Estado vacío */}
          {!cargando && negocios.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl">
              <p className="text-slate-300 font-bold text-base mb-1">No hay negocios registrados en la matriz.</p>
              <p className="text-slate-500 text-sm">
                Presiona el botón <span className="text-emerald-400 font-bold">+</span> en la esquina inferior izquierda para registrar el primer negocio.
              </p>
            </div>
          ) : null}

          {/* Lista de Negocios en Matriz */}
          <div className="grid gap-4">
            {negocios.map((negocio) => (
              <button
                key={negocio.id}
                onClick={() => abrirPanelNegocio(negocio)}
                className="w-full bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between hover:border-slate-600 hover:bg-slate-800/50 transition-all text-left group cursor-pointer active:scale-[0.99]"
              >
                <div>
                  <h2 className="text-lg font-bold text-slate-100 group-hover:text-white transition-colors">
                    {negocio.nombre}
                  </h2>
                  {negocio.direccion ? (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{negocio.direccion}</p>
                  ) : null}
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
        </div>

        {/* Botón flotante en esquina inferior izquierda */}
        <button
          onClick={abrirCrearNegocio}
          title="Registrar nuevo negocio"
          className="fixed bottom-6 left-6 w-14 h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-600/30 hover:scale-105 active:scale-95 transition-all z-40 border border-emerald-400/30 cursor-pointer"
        >
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {/* Toast Notificación */}
        {toast && (
          <div
            className={`fixed bottom-6 right-6 ${
              toast.tipo === 'exito' ? 'bg-emerald-950 border-emerald-700 text-emerald-200' : 'bg-red-950 border-red-700 text-red-200'
            } border px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-bounce`}
          >
            <span>{toast.tipo === 'exito' ? '✓' : '⚠'}</span>
            <span className="text-sm font-semibold">{toast.mensaje}</span>
          </div>
        )}
      </div>
    );
  }

  // --- VISTA 2: CREAR NEGOCIO (FICHA TÉCNICA) ---
  if (pantallaActual === 'CREAR_NEGOCIO') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-4 md:p-8 relative">
        <div className="max-w-3xl mx-auto pb-24">
          <div className="mb-8">
            <button
              onClick={volverAlDirectorio}
              className="text-blue-500 hover:text-blue-400 font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Cancelar Registro
            </button>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <span className="bg-emerald-500 p-2 rounded-xl text-slate-950">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
              </span>
              FICHA TÉCNICA DE REGISTRO
            </h1>
            <p className="text-slate-400 mt-2 text-sm">
              Aprovisionando configuración directa sobre RTDB matriz.
            </p>
          </div>

          <div className="space-y-6">
            {/* IDENTIDAD DEL NEGOCIO */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-black text-slate-400 uppercase tracking-wide">
                  Nombre Comercial
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase font-bold text-slate-400">
                    {formActivo ? 'Operativo' : 'Desactivado'}
                  </span>
                  <ToggleSwitch enabled={formActivo} onChange={() => setFormActivo(!formActivo)} />
                </div>
              </div>

              <input
                type="text"
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
                placeholder="Ej. Marisquería Puerto Libres, El Arquitecto"
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-sans font-bold text-lg"
              />
              <p className="text-xs text-slate-500">
                El nombre comercial se guardará exactamente con las mayúsculas y acentos introducidos. El identificador técnico se genera internamente.
              </p>
            </div>

            {/* BLOQUE A: ACCESO */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                <span className="w-6 h-px bg-slate-700"></span> Bloque A — Acceso
              </h3>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2">Código de Acceso (App)</label>
                  <input
                    type="text"
                    value={formCodigo}
                    onChange={(e) => setFormCodigo(e.target.value)}
                    placeholder="Ej. PL2026, 7890"
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2">Límite de Dispositivos</label>
                  <input
                    type="number"
                    min="1"
                    value={formLimite}
                    onChange={(e) => setFormLimite(e.target.value)}
                    placeholder="3"
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            {/* BLOQUE B: MÓDULOS */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg border-l-4 border-l-red-500/50">
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
                        formModulosBloqueados[modulo] ? 'text-slate-500 line-through' : 'text-slate-200'
                      }`}
                    >
                      {modulo}
                    </span>
                    <ToggleSwitch
                      enabled={!!formModulosBloqueados[modulo]}
                      onChange={() => alternarBloqueoModulo(modulo)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* BLOQUE C: PERFILES */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <span className="w-6 h-px bg-slate-700"></span> Bloque C — Perfiles
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                Roles operativos autorizados para el establecimiento.
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {formPerfiles.map((perfil) => (
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
                  type="text"
                  value={nuevoPerfilTexto}
                  onChange={(e) => setNuevoPerfilTexto(e.target.value)}
                  placeholder="Nuevo perfil (ej. Supervisor, Mesero)"
                  className="flex-1 bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={agregarPerfil}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-lg text-sm font-bold cursor-pointer"
                >
                  Agregar
                </button>
              </div>
            </div>

            {/* BLOQUE CONTACTO (5 CAMPOS) */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                <span className="w-6 h-px bg-slate-700"></span> Datos de Contacto
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                Información interna del establecimiento.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Instagram</label>
                  <input
                    type="text"
                    value={formInstagram}
                    onChange={(e) => setFormInstagram(e.target.value)}
                    placeholder="@puertolibres"
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Facebook</label>
                  <input
                    type="text"
                    value={formFacebook}
                    onChange={(e) => setFormFacebook(e.target.value)}
                    placeholder="puertolibres.oficial"
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">WhatsApp</label>
                  <input
                    type="text"
                    value={formWhatsapp}
                    onChange={(e) => setFormWhatsapp(e.target.value)}
                    placeholder="+52 744 123 4567"
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Número celular</label>
                  <input
                    type="text"
                    value={formCelular}
                    onChange={(e) => setFormCelular(e.target.value)}
                    placeholder="7441234567"
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Correo electrónico</label>
                <input
                  type="email"
                  value={formCorreo}
                  onChange={(e) => setFormCorreo(e.target.value)}
                  placeholder="contacto@puertolibres.com"
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* BLOQUE DIRECCIÓN */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                <span className="w-6 h-px bg-slate-700"></span> Dirección
              </h3>
              <input
                type="text"
                value={formDireccion}
                onChange={(e) => setFormDireccion(e.target.value)}
                placeholder="Calle, número, colonia o referencia física"
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>

            {/* Botón de Enviar a Matriz */}
            <button
              onClick={() => impactarRTDB()}
              disabled={guardando}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] mt-4 disabled:opacity-50 cursor-pointer text-center"
            >
              {guardando ? 'ESCRIBIENDO EN RTDB MATRIZ...' : 'REGISTRAR EN MATRIZ'}
            </button>
          </div>
        </div>

        {/* Toast Notificación */}
        {toast && (
          <div
            className={`fixed bottom-6 right-6 ${
              toast.tipo === 'exito' ? 'bg-emerald-950 border-emerald-700 text-emerald-200' : 'bg-red-950 border-red-700 text-red-200'
            } border px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50`}
          >
            <span>{toast.tipo === 'exito' ? '✓' : '⚠'}</span>
            <span className="text-sm font-semibold">{toast.mensaje}</span>
          </div>
        )}
      </div>
    );
  }

  // --- VISTA 3: PANEL DEL NEGOCIO (CONSULTA / ACTUALIZACIÓN) ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-4 md:p-8 relative">
      <div className="max-w-3xl mx-auto pb-24">
        {/* Cabecera del Panel */}
        <div className="mb-8">
          <button
            onClick={volverAlDirectorio}
            className="text-blue-500 hover:text-blue-400 font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al Directorio
          </button>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <h1 className="text-3xl font-black text-white">{formNombre || negocioSeleccionado?.nombre}</h1>
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase font-bold text-slate-400">
                {formActivo ? 'Operativo' : 'Desactivado'}
              </span>
              <ToggleSwitch enabled={formActivo} onChange={() => setFormActivo(!formActivo)} />
            </div>
          </div>
          <p className="text-slate-400 mt-1 uppercase text-xs font-semibold tracking-wider">
            Categoría: <span className="text-blue-400">Marisquerías</span>
          </p>
        </div>

        <div className="space-y-6">
          {/* Bloque Nombre Comercial */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
            <label className="block text-sm font-semibold text-slate-400 mb-2">Nombre Comercial</label>
            <input
              type="text"
              value={formNombre}
              onChange={(e) => setFormNombre(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 font-bold text-lg"
            />
          </div>

          {/* Bloque A: Acceso */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <span className="w-6 h-px bg-slate-700"></span> Bloque A — Acceso
            </h3>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">Código de Acceso (App)</label>
                <input
                  type="text"
                  value={formCodigo}
                  onChange={(e) => setFormCodigo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">Límite de Dispositivos</label>
                <input
                  type="number"
                  min="1"
                  value={formLimite}
                  onChange={(e) => setFormLimite(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Bloque B: Módulos */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg border-l-4 border-l-red-500/50">
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
                      formModulosBloqueados[modulo] ? 'text-slate-500 line-through' : 'text-slate-200'
                    }`}
                  >
                    {modulo}
                  </span>
                  <ToggleSwitch
                    enabled={!!formModulosBloqueados[modulo]}
                    onChange={() => alternarBloqueoModulo(modulo)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Bloque C: Perfiles */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <span className="w-6 h-px bg-slate-700"></span> Bloque C — Perfiles
            </h3>

            <div className="flex flex-wrap gap-2 mb-4">
              {formPerfiles.map((perfil) => (
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
                type="text"
                value={nuevoPerfilTexto}
                onChange={(e) => setNuevoPerfilTexto(e.target.value)}
                placeholder="Nuevo perfil"
                className="flex-1 bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={agregarPerfil}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-lg text-sm font-bold cursor-pointer"
              >
                Agregar
              </button>
            </div>
          </div>

          {/* Bloque Contacto */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
              <span className="w-6 h-px bg-slate-700"></span> Datos de Contacto
            </h3>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Instagram</label>
                <input
                  type="text"
                  value={formInstagram}
                  onChange={(e) => setFormInstagram(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Facebook</label>
                <input
                  type="text"
                  value={formFacebook}
                  onChange={(e) => setFormFacebook(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">WhatsApp</label>
                <input
                  type="text"
                  value={formWhatsapp}
                  onChange={(e) => setFormWhatsapp(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Número celular</label>
                <input
                  type="text"
                  value={formCelular}
                  onChange={(e) => setFormCelular(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Correo electrónico</label>
              <input
                type="email"
                value={formCorreo}
                onChange={(e) => setFormCorreo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Bloque Dirección */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
              <span className="w-6 h-px bg-slate-700"></span> Dirección
            </h3>
            <input
              type="text"
              value={formDireccion}
              onChange={(e) => setFormDireccion(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-4">
            <button
              onClick={() => impactarRTDB(negocioSeleccionado?.id)}
              disabled={guardando}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {guardando ? 'ACTUALIZANDO RTDB...' : 'ACTUALIZAR EN MATRIZ'}
            </button>

            {negocioSeleccionado?.id ? (
              <button
                onClick={() => eliminarNegocio(negocioSeleccionado.id)}
                disabled={guardando}
                className="bg-slate-900 hover:bg-red-950/40 border border-red-800 text-red-400 px-6 py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition-all cursor-pointer"
              >
                Retirar
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Toast Notificación */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 ${
            toast.tipo === 'exito' ? 'bg-emerald-950 border-emerald-700 text-emerald-200' : 'bg-red-950 border-red-700 text-red-200'
          } border px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50`}
        >
          <span>{toast.tipo === 'exito' ? '✓' : '⚠'}</span>
          <span className="text-sm font-semibold">{toast.mensaje}</span>
        </div>
      )}
    </div>
  );
};
