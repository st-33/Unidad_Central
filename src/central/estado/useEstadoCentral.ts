import { useState, useEffect, useCallback, useMemo } from 'react';
import { ServicioCentral, ResumenCentral } from '../logica/servicio-central';
import { observarConexionTiempoReal } from '../../plataforma/firebase';
import type { IdentificadorUnico, ClaveCapacidad, Negocio } from '../../../contratos';

export interface EstadoCentral {
  readonly conectadoRtdb: boolean;
  readonly cargando: boolean;
  readonly ejecutandoInicializacion: boolean;
  readonly guardandoCapacidad: boolean;
  readonly resumen: ResumenCentral | null;
  readonly negocioSeleccionado: Negocio | null;
  readonly error: string | null;
  readonly mensajeOperacion: string | null;
  readonly recargar: () => Promise<void>;
  readonly inicializar: () => Promise<void>;
  readonly seleccionarNegocio: (id: IdentificadorUnico | null) => void;
  readonly cambiarEstadoCapacidad: (claveCapacidad: ClaveCapacidad, activa: boolean) => Promise<void>;
}

export function useEstadoCentral(): EstadoCentral {
  const [conectadoRtdb, setConectadoRtdb] = useState<boolean>(false);
  const [cargando, setCargando] = useState<boolean>(true);
  const [ejecutandoInicializacion, setEjecutandoInicializacion] = useState<boolean>(false);
  const [guardandoCapacidad, setGuardandoCapacidad] = useState<boolean>(false);
  const [resumen, setResumen] = useState<ResumenCentral | null>(null);
  const [negocioSeleccionadoId, setNegocioSeleccionadoId] = useState<IdentificadorUnico | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mensajeOperacion, setMensajeOperacion] = useState<string | null>(null);

  const servicio = useMemo(() => new ServicioCentral(), []);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    const resultado = await servicio.obtenerResumen();
    if (resultado.exito) {
      setResumen(resultado.datos);
    } else {
      setError(resultado.error.message);
    }
    setCargando(false);
  }, [servicio]);

  const inicializar = useCallback(async () => {
    setEjecutandoInicializacion(true);
    setError(null);
    setMensajeOperacion(null);

    const resultado = await servicio.inicializarEstructuraBase();
    if (resultado.exito) {
      if (resultado.datos.yaInicializado) {
        setMensajeOperacion('La estructura base y los negocios ya se encontraban inicializados.');
      } else {
        setMensajeOperacion(
          `Estructura inicializada: ${resultado.datos.categoriasCreadas} categorías, ${resultado.datos.capacidadesCreadas} capacidades, ${resultado.datos.negociosCreados} negocios.`
        );
      }
      await recargar();
    } else {
      setError(resultado.error.message);
    }

    setEjecutandoInicializacion(false);
  }, [servicio, recargar]);

  const seleccionarNegocio = useCallback((id: IdentificadorUnico | null) => {
    setNegocioSeleccionadoId(id);
    setMensajeOperacion(null);
  }, []);

  const negocioSeleccionado = useMemo(() => {
    if (!resumen || !negocioSeleccionadoId) {
      return null;
    }
    return resumen.negocios.find((n) => n.id === negocioSeleccionadoId) ?? null;
  }, [resumen, negocioSeleccionadoId]);

  const cambiarEstadoCapacidad = useCallback(
    async (claveCapacidad: ClaveCapacidad, activa: boolean) => {
      if (!negocioSeleccionadoId) {
        return;
      }

      setGuardandoCapacidad(true);
      setError(null);

      const resultado = await servicio.alternarCapacidadNegocio(
        negocioSeleccionadoId,
        claveCapacidad,
        activa
      );

      if (resultado.exito) {
        setMensajeOperacion(
          `Capacidad "${claveCapacidad}" ${activa ? 'activada' : 'desactivada'} para ${resultado.datos.nombreComercial}.`
        );
        // Actualizar el negocio en el resumen local para respuesta instantánea
        setResumen((prev) => {
          if (!prev) return null;
          const negociosActualizados = prev.negocios.map((n) =>
            n.id === resultado.datos.id ? resultado.datos : n
          );
          return {
            ...prev,
            negocios: negociosActualizados,
          };
        });
      } else {
        setError(resultado.error.message);
      }

      setGuardandoCapacidad(false);
    },
    [servicio, negocioSeleccionadoId]
  );

  useEffect(() => {
    const desuscribir = observarConexionTiempoReal((conectado) => {
      setConectadoRtdb(conectado);
    });

    recargar();

    return () => {
      desuscribir();
    };
  }, [recargar]);

  return {
    conectadoRtdb,
    cargando,
    ejecutandoInicializacion,
    guardandoCapacidad,
    resumen,
    negocioSeleccionado,
    error,
    mensajeOperacion,
    recargar,
    inicializar,
    seleccionarNegocio,
    cambiarEstadoCapacidad,
  };
}
