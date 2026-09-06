import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CONFIGURACION_FIREBASE_CENTRAL } from '../../../configuracion/firebase';

interface PropsCabeceraCentral {
  readonly conectadoRtdb: boolean;
  readonly estaInicializado: boolean;
  readonly cargando: boolean;
  readonly ejecutandoInicializacion: boolean;
  readonly onInicializar: () => void;
  readonly onRecargar: () => void;
}

export const CabeceraCentral: React.FC<PropsCabeceraCentral> = ({
  conectadoRtdb,
  estaInicializado,
  cargando,
  ejecutandoInicializacion,
  onInicializar,
  onRecargar,
}) => {
  return (
    <View style={estilos.contenedor}>
      <View style={estilos.filaPrincipal}>
        <View style={estilos.bloqueMarca}>
          <View style={estilos.filaEtiqueta}>
            <Text style={estilos.marcaPrincipal}>UNIDAD CENTRAL</Text>
            <View style={estilos.badgeSistema}>
              <Text style={estilos.textoBadgeSistema}>MI NEGOCIO UN CLICK</Text>
            </View>
          </View>
          <Text style={estilos.tituloModulo}>Central Operativa</Text>
          <Text style={estilos.subtituloModulo}>
            Supervisión del catálogo maestro, categorías y capacidades de la red
          </Text>
        </View>

        <View style={estilos.bloqueAcciones}>
          <View style={estilos.indicadorConexion}>
            <View
              style={[
                estilos.puntoConexion,
                { backgroundColor: conectadoRtdb ? '#10b981' : '#f59e0b' },
              ]}
            />
            <Text style={estilos.textoConexion}>
              {conectadoRtdb ? 'RTDB En línea' : 'Verificando enlace'}
            </Text>
          </View>

          <View style={estilos.grupoBotones}>
            {!estaInicializado && (
              <TouchableOpacity
                style={[
                  estilos.botonInicializar,
                  (ejecutandoInicializacion || cargando) && estilos.botonDeshabilitado,
                ]}
                onPress={onInicializar}
                disabled={ejecutandoInicializacion || cargando}
                activeOpacity={0.8}
              >
                {ejecutandoInicializacion ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={estilos.textoBotonInicializar}>Inicializar Red</Text>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={estilos.botonRecargar}
              onPress={onRecargar}
              disabled={cargando}
              activeOpacity={0.8}
            >
              {cargando ? (
                <ActivityIndicator size="small" color="#374151" />
              ) : (
                <Text style={estilos.textoBotonRecargar}>Actualizar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={estilos.barraMeta}>
        <Text style={estilos.textoMeta}>
          Proyecto: <Text style={estilos.valorMeta}>{CONFIGURACION_FIREBASE_CENTRAL.idProyecto}</Text>
        </Text>
        <Text style={estilos.separadorMeta}>•</Text>
        <Text style={estilos.textoMeta}>
          App Web: <Text style={estilos.valorMeta}>{CONFIGURACION_FIREBASE_CENTRAL.nombreAplicacion}</Text>
        </Text>
        <Text style={estilos.separadorMeta}>•</Text>
        <Text style={estilos.textoMeta}>
          Estructura:{' '}
          <Text
            style={[
              estilos.valorMeta,
              { color: estaInicializado ? '#059669' : '#d97706', fontWeight: '700' },
            ]}
          >
            {estaInicializado ? 'Inicializada (v2)' : 'Pendiente de inicio'}
          </Text>
        </Text>
      </View>
    </View>
  );
};

const estilos = StyleSheet.create({
  contenedor: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  filaPrincipal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 16,
  },
  bloqueMarca: {
    flex: 1,
    minWidth: 260,
  },
  filaEtiqueta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  marcaPrincipal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#9ca3af',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  badgeSistema: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  textoBadgeSistema: {
    color: '#93c5fd',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tituloModulo: {
    fontSize: 26,
    fontWeight: '800',
    color: '#f9fafb',
    letterSpacing: -0.5,
  },
  subtituloModulo: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
    lineHeight: 18,
  },
  bloqueAcciones: {
    alignItems: 'flex-end',
    gap: 10,
  },
  indicadorConexion: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  puntoConexion: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  textoConexion: {
    color: '#d1d5db',
    fontSize: 11,
    fontWeight: '600',
  },
  grupoBotones: {
    flexDirection: 'row',
    gap: 8,
  },
  botonInicializar: {
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    justifyContent: 'center',
  },
  botonDeshabilitado: {
    opacity: 0.5,
  },
  textoBotonInicializar: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  botonRecargar: {
    backgroundColor: '#374151',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    justifyContent: 'center',
  },
  textoBotonRecargar: {
    color: '#f3f4f6',
    fontSize: 12,
    fontWeight: '600',
  },
  barraMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
    flexWrap: 'wrap',
    gap: 8,
  },
  textoMeta: {
    fontSize: 12,
    color: '#9ca3af',
  },
  valorMeta: {
    color: '#e5e7eb',
    fontWeight: '600',
  },
  separadorMeta: {
    color: '#4b5563',
    fontSize: 10,
  },
});
