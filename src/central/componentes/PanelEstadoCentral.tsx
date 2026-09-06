import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { EstadoCentral } from '../estado/useEstadoCentral';
import { CONFIGURACION_FIREBASE_CENTRAL } from '../../../configuracion/firebase';

interface PropsPanelEstadoCentral {
  readonly estado: EstadoCentral;
}

export const PanelEstadoCentral: React.FC<PropsPanelEstadoCentral> = ({ estado }) => {
  const {
    conectadoRtdb,
    cargando,
    ejecutandoInicializacion,
    resumen,
    error,
    mensajeOperacion,
    recargar,
    inicializar,
  } = estado;

  const estaInicializado = Boolean(resumen?.inicializado);

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.seccionCabecera}>
        <Text style={estilos.etiquetaSistema}>UNIDAD CENTRAL</Text>
        <Text style={estilos.tituloModulo}>CENTRAL</Text>
        <Text style={estilos.subtitulo}>Supervisión de catálogo e infraestructura</Text>
      </View>

      <View style={estilos.bloqueTecnico}>
        <Text style={estilos.tituloSeccion}>INFRAESTRUCTURA TÉCNICA</Text>

        <View style={estilos.filaEstado}>
          <Text style={estilos.etiquetaCampo}>Proyecto Firebase:</Text>
          <Text style={estilos.valorCampo}>{CONFIGURACION_FIREBASE_CENTRAL.idProyecto}</Text>
        </View>

        <View style={estilos.filaEstado}>
          <Text style={estilos.etiquetaCampo}>Aplicación web:</Text>
          <Text style={estilos.valorCampo}>{CONFIGURACION_FIREBASE_CENTRAL.nombreAplicacion}</Text>
        </View>

        <View style={estilos.filaEstado}>
          <Text style={estilos.etiquetaCampo}>Enlace RTDB:</Text>
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

        <View style={estilos.filaEstado}>
          <Text style={estilos.etiquetaCampo}>Estructura Central:</Text>
          <Text
            style={[
              estilos.valorCampo,
              { color: estaInicializado ? '#047857' : '#b45309' },
            ]}
          >
            {estaInicializado ? 'Inicializada' : 'Sin inicializar'}
          </Text>
        </View>
      </View>

      <View style={estilos.bloqueTecnico}>
        <Text style={estilos.tituloSeccion}>DATOS REALES EN RTDB</Text>

        {cargando ? (
          <ActivityIndicator size="small" color="#2563eb" style={estilos.cargador} />
        ) : error ? (
          <View style={estilos.cajaAlerta}>
            <Text style={estilos.textoAlerta}>Aviso técnico: {error}</Text>
          </View>
        ) : !estaInicializado ? (
          <View style={estilos.cajaInfo}>
            <Text style={estilos.textoInfo}>
              La estructura base de Central aún no existe en la RTDB. Pulsa el botón inferior para
              crear la estructura base inicial de forma segura e idempotente.
            </Text>
          </View>
        ) : (
          <View>
            <View style={estilos.filaEstado}>
              <Text style={estilos.etiquetaCampo}>Categorías registradas:</Text>
              <Text style={estilos.valorCampo}>{resumen?.totalCategorias ?? 0}</Text>
            </View>
            {resumen?.categorias && resumen.categorias.length > 0 && (
              <View style={estilos.filaDetalle}>
                <Text style={estilos.textoDetalle}>
                  {resumen.categorias.map((c) => c.nombre).join(', ')}
                </Text>
              </View>
            )}

            <View style={estilos.filaEstado}>
              <Text style={estilos.etiquetaCampo}>Capacidades definidas:</Text>
              <Text style={estilos.valorCampo}>{resumen?.totalCapacidades ?? 0}</Text>
            </View>
            {resumen?.capacidades && resumen.capacidades.length > 0 && (
              <View style={estilos.filaDetalle}>
                <Text style={estilos.textoDetalle}>
                  {resumen.capacidades.map((c) => c.nombre).join(', ')}
                </Text>
              </View>
            )}

            <View style={estilos.filaEstado}>
              <Text style={estilos.etiquetaCampo}>Negocios registrados:</Text>
              <Text style={estilos.valorCampo}>{resumen?.totalNegocios ?? 0}</Text>
            </View>
          </View>
        )}
      </View>

      {mensajeOperacion && (
        <View style={estilos.cajaExito}>
          <Text style={estilos.textoExito}>{mensajeOperacion}</Text>
        </View>
      )}

      <View style={estilos.contenedorBotones}>
        {!estaInicializado && (
          <TouchableOpacity
            style={[
              estilos.botonPrimario,
              (ejecutandoInicializacion || cargando) && estilos.botonDeshabilitado,
            ]}
            onPress={inicializar}
            disabled={ejecutandoInicializacion || cargando}
            activeOpacity={0.8}
          >
            <Text style={estilos.textoBotonPrimario}>
              {ejecutandoInicializacion ? 'Inicializando...' : 'Inicializar estructura base'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={estilos.botonSecundario}
          onPress={recargar}
          disabled={cargando || ejecutandoInicializacion}
          activeOpacity={0.8}
        >
          <Text style={estilos.textoBotonSecundario}>
            {cargando ? 'Consultando RTDB...' : 'Revalidar lectura RTDB'}
          </Text>
        </TouchableOpacity>
      </View>
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
  filaDetalle: {
    paddingVertical: 2,
    paddingBottom: 6,
  },
  textoDetalle: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
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
  cajaInfo: {
    backgroundColor: '#f3f4f6',
    padding: 10,
    borderRadius: 4,
    marginTop: 4,
  },
  textoInfo: {
    color: '#4b5563',
    fontSize: 12,
    lineHeight: 18,
  },
  cajaExito: {
    backgroundColor: '#d1fae5',
    padding: 10,
    borderRadius: 4,
    marginBottom: 12,
  },
  textoExito: {
    color: '#065f46',
    fontSize: 13,
    fontWeight: '500',
  },
  contenedorBotones: {
    gap: 10,
    marginTop: 8,
  },
  botonPrimario: {
    backgroundColor: '#047857',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  textoBotonPrimario: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  botonSecundario: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  textoBotonSecundario: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
