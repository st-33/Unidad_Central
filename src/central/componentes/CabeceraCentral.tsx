import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

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
          <Text style={estilos.marcaPrincipal}>UNIDAD CENTRAL</Text>
          <Text style={estilos.tituloModulo}>Administrador de Negocios</Text>
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
              {conectadoRtdb ? 'En línea' : 'Conectando...'}
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
                  <Text style={estilos.textoBotonInicializar}>Inicializar</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
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
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  bloqueMarca: {
    flex: 1,
    minWidth: 260,
  },
  marcaPrincipal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#9ca3af',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  tituloModulo: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f9fafb',
    letterSpacing: -0.5,
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
});
