import { useState, useEffect, useCallback, useMemo } from 'react';
import { ServicioCentral, ResumenCentral } from '../logica/servicio-central';
import { observarConexionTiempoReal } from '../../plataforma/firebase';

export interface EstadoCentral {
  readonly conectadoRtdb: boolean;
  readonly cargando: boolean;
  readonly ejecutandoInicializacion: boolean;
  readonly resumen: ResumenCentral | null;
  readonly error: string | null;
  readonly mensajeOperacion: string | null;
  readonly recargar: () => Promise<void>;
  readonly inicializar: () => Promise<void>;
}

export function useEstadoCentral(): EstadoCentral {
  const [conectadoRtdb, setConectadoRtdb] = useState<boolean>(false);
  const [cargando, setCargando] = useState<boolean>(true);
  const [ejecutandoInicializacion, setEjecutandoInicializacion] = useState<boolean>(false);
  const [resumen, setResumen] = useState<ResumenCentral | null>(null);
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
        setMensajeOperacion('La estructura base ya se encontraba inicializada.');
      } else {
        setMensajeOperacion(
          `Estructura base creada: ${resultado.datos.categoriasCreadas} categoría, ${resultado.datos.capacidadesCreadas} capacidades.`
        );
      }
      await recargar();
    } else {
      setError(resultado.error.message);
    }

    setEjecutandoInicializacion(false);
  }, [servicio, recargar]);

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
    resumen,
    error,
    mensajeOperacion,
    recargar,
    inicializar,
  };
}
