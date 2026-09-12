import React, { useState, useEffect, useCallback } from 'react';
import { servicioTorreControl } from '../logica/servicio-torre';
import type { NegocioRTDB, DatosFichaNegocio, DispositivoVinculado, PoliticaDispositivos } from '../tipos';
import { ModalNuevaCategoria } from '../componentes/ModalNuevaCategoria';
import { FormularioCrearNegocio } from '../componentes/FormularioCrearNegocio';
import { PanelFichaNegocio } from '../componentes/PanelFichaNegocio';
import { DirectorioNegocios } from '../componentes/DirectorioNegocios';

export const PantallaTorreControl: React.FC = () => {
  const [pantallaActual, setPantallaActual] = useState<'DIRECTORIO' | 'REPORTE_TECNICO' | 'PANEL_NEGOCIO' | 'CREAR_NEGOCIO'>('DIRECTORIO');
  const [categoriaActiva, setCategoriaActiva] = useState<string>('Marisquerias');
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<readonly string[]>(['Marisquerias']);
  const [modalNuevaCategoria, setModalNuevaCategoria] = useState<boolean>(false);

  const [negocios, setNegocios] = useState<readonly NegocioRTDB[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [guardando, setGuardando] = useState<boolean>(false);
  const [armonizandoGlobal, setArmonizandoGlobal] = useState<boolean>(false);
  const [negocioSeleccionado, setNegocioSeleccionado] = useState<NegocioRTDB | null>(null);

  const [dispositivosNegocio, setDispositivosNegocio] = useState<Record<string, DispositivoVinculado>>({});
  const [cargandoDispositivos, setCargandoDispositivos] = useState<boolean>(false);

  // Toast Notificación
  const [toast, setToast] = useState<{ tipo: 'exito' | 'error'; mensaje: string } | null>(null);

  const mostrarNotificacion = useCallback((mensaje: string, tipo: 'exito' | 'error' = 'exito') => {
    setToast({ tipo, mensaje });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  const refrescarCategorias = useCallback(async () => {
    const cats = await servicioTorreControl.listarCategorias();
    setCategoriasDisponibles(cats);
  }, []);

  useEffect(() => {
    setCargando(true);
    refrescarCategorias();

    const cancelarSuscripcion = servicioTorreControl.suscribirNegociosPorCategoria(
      categoriaActiva,
      (lista) => {
        setNegocios(lista);
        setCargando(false);
      }
    );

    return () => {
      cancelarSuscripcion();
    };
  }, [categoriaActiva, refrescarCategorias]);

  const cargarDispositivos = useCallback(async (categoria: string, id: string) => {
    setCargandoDispositivos(true);
    try {
      const devs = await servicioTorreControl.obtenerDispositivos(categoria, id);
      setDispositivosNegocio(devs);
    } catch {
      mostrarNotificacion('Error al cargar dispositivos del negocio', 'error');
    } finally {
      setCargandoDispositivos(false);
    }
  }, [mostrarNotificacion]);

  const abrirPanelNegocio = (negocio: NegocioRTDB) => {
    setNegocioSeleccionado(negocio);
    setPantallaActual('PANEL_NEGOCIO');
    cargarDispositivos(negocio.categoria || categoriaActiva, negocio.id);
  };

  const abrirCrearNegocio = () => {
    setNegocioSeleccionado(null);
    setPantallaActual('CREAR_NEGOCIO');
  };

  const volverAlDirectorio = () => {
    setPantallaActual('DIRECTORIO');
    setNegocioSeleccionado(null);
  };

  const agregarNuevaCategoria = (nombreCategoria: string) => {
    if (!categoriasDisponibles.includes(nombreCategoria)) {
      setCategoriasDisponibles([...categoriasDisponibles, nombreCategoria]);
    }
    setCategoriaActiva(nombreCategoria);
    setModalNuevaCategoria(false);
    mostrarNotificacion(`Categoría "${nombreCategoria}" activada`, 'exito');
  };

  const guardarNuevoNegocio = async (datos: DatosFichaNegocio) => {
    setGuardando(true);
    try {
      const res = await servicioTorreControl.registrarOActualizarNegocio(datos);
      if (res.exito) {
        mostrarNotificacion(res.mensaje, 'exito');
        setCategoriaActiva(datos.categoria);
        volverAlDirectorio();
        await refrescarCategorias();
      } else {
        mostrarNotificacion(res.mensaje, 'error');
      }
    } catch (e: unknown) {
      const err = e as Error;
      mostrarNotificacion(err?.message || 'Error de escritura en RTDB', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const actualizarNegocioExistente = async (idNegocio: string, datos: DatosFichaNegocio) => {
    setGuardando(true);
    try {
      const res = await servicioTorreControl.registrarOActualizarNegocio(
        datos,
        idNegocio,
        negocioSeleccionado?.codigo,
        negocioSeleccionado?.categoria
      );

      if (res.exito) {
        mostrarNotificacion(res.mensaje, 'exito');
        setCategoriaActiva(datos.categoria);
        setNegocioSeleccionado((prev) => (prev ? { ...prev, ...datos, id: idNegocio } : null));
        await refrescarCategorias();
      } else {
        mostrarNotificacion(res.mensaje, 'error');
      }
    } catch (e: unknown) {
      const err = e as Error;
      mostrarNotificacion(err?.message || 'Error al actualizar en RTDB', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const eliminarNegocio = async (categoria: string, id: string, codigo: string) => {
    const confirmacion = window.confirm(
      `¿Confirmas retirar este negocio de la matriz?\nSe eliminará de /${categoria}/${id} y se liberará el código /codigo_acceso/${codigo}.`
    );
    if (!confirmacion) return;

    setGuardando(true);
    try {
      const res = await servicioTorreControl.eliminarNegocio(categoria, id, codigo);
      if (res.exito) {
        mostrarNotificacion(res.mensaje, 'exito');
        volverAlDirectorio();
      } else {
        mostrarNotificacion(res.mensaje, 'error');
      }
    } catch (e: unknown) {
      const err = e as Error;
      mostrarNotificacion(err?.message || 'Error al retirar el negocio de RTDB', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const forzarSincronizacionCentral = async (idNegocio: string) => {
    if (!negocioSeleccionado) return;
    setGuardando(true);
    try {
      const datos: DatosFichaNegocio = {
        nombre: negocioSeleccionado.nombre,
        categoria: negocioSeleccionado.categoria || categoriaActiva,
        activo: negocioSeleccionado.activo,
        codigo: negocioSeleccionado.codigo,
        limite: negocioSeleccionado.limite,
        bloqueados: negocioSeleccionado.bloqueados || {},
        perfiles: negocioSeleccionado.perfiles || [],
        politicas_dispositivos: negocioSeleccionado.politicas_dispositivos,
        direccion: negocioSeleccionado.direccion || '',
        instagram: negocioSeleccionado.instagram || '',
        facebook: negocioSeleccionado.facebook || '',
        whatsapp: negocioSeleccionado.whatsapp || '',
        celular: negocioSeleccionado.celular || '',
        correo: negocioSeleccionado.correo || '',
      };

      const res = await servicioTorreControl.registrarOActualizarNegocio(
        datos,
        idNegocio,
        negocioSeleccionado.codigo,
        negocioSeleccionado.categoria
      );

      if (res.exito) {
        mostrarNotificacion('Sincronización forzada con Unidad Central exitosa', 'exito');
      } else {
        mostrarNotificacion(res.mensaje, 'error');
      }
    } catch (e: unknown) {
      const err = e as Error;
      mostrarNotificacion(err?.message || 'Error en sincronización central', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const ejecutarArmonizacionGlobal = async () => {
    setArmonizandoGlobal(true);
    try {
      const res = await servicioTorreControl.consolidarContratoCodigoAcceso();
      if (res.exito) {
        mostrarNotificacion(res.mensaje, 'exito');
      } else {
        mostrarNotificacion(res.mensaje, 'error');
      }
    } catch (e: unknown) {
      const err = e as Error;
      mostrarNotificacion(err?.message || 'Error al consolidar contrato único', 'error');
    } finally {
      setArmonizandoGlobal(false);
    }
  };

  const conmutarEstadoDispositivo = async (
    deviceId: string,
    estadoActual: 'activo' | 'pendiente' | 'bloqueado'
  ) => {
    if (!negocioSeleccionado) return;
    const nuevoEstado: 'activo' | 'bloqueado' = estadoActual === 'activo' ? 'bloqueado' : 'activo';
    try {
      await servicioTorreControl.actualizarEstadoDispositivo(
        negocioSeleccionado.categoria || categoriaActiva,
        negocioSeleccionado.id,
        deviceId,
        nuevoEstado
      );
      mostrarNotificacion(`Dispositivo marcado como ${nuevoEstado}`, 'exito');
      cargarDispositivos(negocioSeleccionado.categoria || categoriaActiva, negocioSeleccionado.id);
    } catch {
      mostrarNotificacion('Error al actualizar estado del dispositivo', 'error');
    }
  };

  const desvincularDispositivo = async (deviceId: string) => {
    if (!negocioSeleccionado) return;
    const conf = window.confirm('¿Confirmas revocar y desvincular este dispositivo?');
    if (!conf) return;

    try {
      await servicioTorreControl.eliminarDispositivo(
        negocioSeleccionado.categoria || categoriaActiva,
        negocioSeleccionado.id,
        deviceId
      );
      mostrarNotificacion('Dispositivo revocado exitosamente', 'exito');
      cargarDispositivos(negocioSeleccionado.categoria || categoriaActiva, negocioSeleccionado.id);
    } catch {
      mostrarNotificacion('Error al desvincular dispositivo', 'error');
    }
  };

  const preautorizarDispositivo = async (nuevoDispositivo: DispositivoVinculado) => {
    if (!negocioSeleccionado) return;

    try {
      await servicioTorreControl.autorizarNuevoDispositivo(
        negocioSeleccionado.categoria || categoriaActiva,
        negocioSeleccionado.id,
        nuevoDispositivo
      );
      mostrarNotificacion('Dispositivo pre-autorizado con éxito', 'exito');
      cargarDispositivos(negocioSeleccionado.categoria || categoriaActiva, negocioSeleccionado.id);
    } catch {
      mostrarNotificacion('Error al pre-autorizar dispositivo', 'error');
    }
  };

  const actualizarPoliticas = async (politicas: PoliticaDispositivos) => {
    if (!negocioSeleccionado) return;
    try {
      await servicioTorreControl.actualizarPoliticaDispositivos(
        negocioSeleccionado.categoria || categoriaActiva,
        negocioSeleccionado.id,
        politicas
      );
      mostrarNotificacion('Políticas de conexión actualizadas', 'exito');
    } catch {
      mostrarNotificacion('Error al guardar políticas de conexión', 'error');
    }
  };

  // Render según vista activa
  if (pantallaActual === 'CREAR_NEGOCIO') {
    return (
      <>
        <FormularioCrearNegocio
          categoriaInicial={categoriaActiva}
          categoriasDisponibles={categoriasDisponibles}
          guardando={guardando}
          onVolver={volverAlDirectorio}
          onGuardar={guardarNuevoNegocio}
          onNotificar={mostrarNotificacion}
        />
        {toast && (
          <div
            id="toast-notificacion-crear"
            className={`fixed bottom-6 right-6 ${
              toast.tipo === 'exito' ? 'bg-emerald-950 border-emerald-700 text-emerald-200' : 'bg-red-950 border-red-700 text-red-200'
            } border px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50`}
          >
            <span>{toast.tipo === 'exito' ? '✓' : '⚠'}</span>
            <span className="text-sm font-semibold">{toast.mensaje}</span>
          </div>
        )}
      </>
    );
  }

  if (pantallaActual === 'PANEL_NEGOCIO' && negocioSeleccionado) {
    return (
      <>
        <PanelFichaNegocio
          negocio={negocioSeleccionado}
          categoriasDisponibles={categoriasDisponibles}
          dispositivos={dispositivosNegocio}
          cargandoDispositivos={cargandoDispositivos}
          guardando={guardando}
          onVolver={volverAlDirectorio}
          onActualizar={actualizarNegocioExistente}
          onEliminar={eliminarNegocio}
          onForzarSincronizacionCentral={forzarSincronizacionCentral}
          onActualizarPoliticas={actualizarPoliticas}
          onConmutarEstadoDispositivo={conmutarEstadoDispositivo}
          onDesvincularDispositivo={desvincularDispositivo}
          onPreautorizarDispositivo={preautorizarDispositivo}
          onRefrescarDispositivos={() =>
            cargarDispositivos(negocioSeleccionado.categoria || categoriaActiva, negocioSeleccionado.id)
          }
          onNotificar={mostrarNotificacion}
        />
        {toast && (
          <div
            id="toast-notificacion-panel"
            className={`fixed bottom-6 right-6 ${
              toast.tipo === 'exito' ? 'bg-emerald-950 border-emerald-700 text-emerald-200' : 'bg-red-950 border-red-700 text-red-200'
            } border px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50`}
          >
            <span>{toast.tipo === 'exito' ? '✓' : '⚠'}</span>
            <span className="text-sm font-semibold">{toast.mensaje}</span>
          </div>
        )}
      </>
    );
  }

  return (
    <div id="pantalla-torre-control" className="min-h-screen bg-slate-950 text-slate-200 font-sans p-4 md:p-8 relative">
      <DirectorioNegocios
        pantallaActual={pantallaActual === 'REPORTE_TECNICO' ? 'REPORTE_TECNICO' : 'DIRECTORIO'}
        onCambiarPantalla={(p) => setPantallaActual(p)}
        categoriaActiva={categoriaActiva}
        categoriasDisponibles={categoriasDisponibles}
        negocios={negocios}
        cargando={cargando}
        armonizandoGlobal={armonizandoGlobal}
        onCambiarCategoria={setCategoriaActiva}
        onAbrirModalNuevaCategoria={() => setModalNuevaCategoria(true)}
        onSeleccionarNegocio={abrirPanelNegocio}
        onEjecutarArmonizacionGlobal={ejecutarArmonizacionGlobal}
        onAbrirCrearNegocio={abrirCrearNegocio}
      />

      {modalNuevaCategoria && (
        <ModalNuevaCategoria
          onCerrar={() => setModalNuevaCategoria(false)}
          onCrear={agregarNuevaCategoria}
        />
      )}

      {toast && (
        <div
          id="toast-notificacion-directorio"
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
