import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { EstadoCentral } from '../estado/useEstadoCentral';
import { CONFIGURACION_FIREBASE_CENTRAL } from '../../../configuracion/firebase';

interface PropsPanelEstadoCentral {
  readonly estado: EstadoCentral;
}

export const PanelEstadoCentral: React.FC<PropsPanelEstadoCentral> = ({ estado }) => {
  const { conectadoRtdb, cargando, resumen, error, recargar } = estado;

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.seccionCabecera}>
        <Text style={estilos.etiquetaSistema}>UNIDAD CENTRAL</Text>
        <Text style={estilos.tituloModulo}>CENTRAL</Text>
        <Text style={estilos.subtitulo}>Nodo de supervisión y catálogo de la red</Text>
      </View>

      <View style={estilos.bloqueTecnico}>
        <Text style={estilos.tituloSeccion}>INFRAESTRUCTURA TÉCNICA</Text>

        <View style={estilos.filaEstado}>
          <Text style={estilos.etiquetaCampo}>Proyecto Firebase:</Text>
          <Text style={estilos.valorCampo}>{CONFIGURACION_FIREBASE_CENTRAL.idProyecto}</Text>
        </View>

        <View style={estilos.filaEstado}>
          <Text style={estilos.etiquetaCampo}>Aplicación registrada:</Text>
          <Text style={estilos.valorCampo}>{CONFIGURACION_FIREBASE_CENTRAL.nombreAplicacion}</Text>
        </View>

        <View style={estilos.filaEstado}>
          <Text style={estilos.etiquetaCampo}>Estado RTDB:</Text>
          <View style={estilos.indicadorConexion}>
            <View
              style={[
                estilos.puntoEstado,
                { backgroundColor: conectadoRtdb ? '#10b981' : '#f59e0b' },
              ]}
            />
            <Text style={estilos.valorCampo}>
              {conectadoRtdb ? 'Conectado (En línea)' : 'Verificando enlace / En espera'}
            </Text>
          </View>
        </View>
      </View>

      <View style={estilos.bloqueTecnico}>
        <Text style={estilos.tituloSeccion}>REGISTROS EN CENTRAL</Text>

        {cargando ? (
          <ActivityIndicator size="small" color="#2563eb" style={estilos.cargador} />
        ) : error ? (
          <View style={estilos.cajaAlerta}>
            <Text style={estilos.textoAlerta}>Aviso técnico: {error}</Text>
          </View>
        ) : (
          <View>
            <View style={estilos.filaEstado}>
              <Text style={estilos.etiquetaCampo}>Categorías registradas:</Text>
              <Text style={estilos.valorCampo}>{resumen?.totalCategorias ?? 0}</Text>
            </View>

            <View style={estilos.filaEstado}>
              <Text style={estilos.etiquetaCampo}>Negocios registrados:</Text>
              <Text style={estilos.valorCampo}>
                {resumen?.totalNegocios ?? 0} ({resumen?.negociosActivos ?? 0} activos)
              </Text>
            </View>

            <View style={estilos.filaEstado}>
              <Text style={estilos.etiquetaCampo}>Capacidades definidas:</Text>
              <Text style={estilos.valorCampo}>{resumen?.totalCapacidades ?? 0}</Text>
            </View>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={estilos.botonRecargar}
        onPress={recargar}
        disabled={cargando}
        activeOpacity={0.8}
      >
        <Text style={estilos.textoBotonRecargar}>
          {cargando ? 'Consultando...' : 'Revalidar estado'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const estilos = StyleSheet.create({
  contenedor: {
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    width: '100%',
    maxWidth: 560,
  },
  seccionCabecera: {
    borderBottomWidth: 2,
    borderBottomColor: '#111827',
    paddingBottom: 16,
    marginBottom: 20,
  },
  etiquetaSistema: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  tituloModulo: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginTop: 4,
  },
  subtitulo: {
    fontSize: 14,
    color: '#4b5563',
    marginTop: 4,
  },
  bloqueTecnico: {
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  tituloSeccion: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  filaEstado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  etiquetaCampo: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  valorCampo: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
  },
  indicadorConexion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  puntoEstado: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cargador: {
    marginVertical: 12,
  },
  cajaAlerta: {
    backgroundColor: '#fef3c7',
    padding: 10,
    borderRadius: 4,
    marginTop: 6,
  },
  textoAlerta: {
    color: '#92400e',
    fontSize: 12,
  },
  botonRecargar: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  textoBotonRecargar: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
