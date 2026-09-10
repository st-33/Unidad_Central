import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { Negocio, Categoria, DefinicionCapacidad, ClaveCapacidad } from '../../../contratos';

interface PropsDetalleNegocio {
  readonly negocio: Negocio | null;
  readonly categorias: readonly Categoria[];
  readonly capacidadesCatalogo: readonly DefinicionCapacidad[];
  readonly guardandoCapacidad: boolean;
  readonly onAlternarCapacidad: (claveCapacidad: ClaveCapacidad, activa: boolean) => void;
}

export const DetalleNegocio: React.FC<PropsDetalleNegocio> = ({
  negocio,
  categorias,
  capacidadesCatalogo,
  guardandoCapacidad,
  onAlternarCapacidad,
}) => {
  if (!negocio) {
    return (
      <View style={estilos.contenedorSinSeleccion}>
        <View style={estilos.iconoPlaceholder}>
          <Text style={estilos.textoIcono}>📋</Text>
        </View>
        <Text style={estilos.tituloSinSeleccion}>Selecciona un negocio</Text>
        <Text style={estilos.subtituloSinSeleccion}>
          Elige un negocio del listado para gestionar sus capacidades operativas.
        </Text>
      </View>
    );
  }

  const categoria = categorias.find((c) => c.categoria_id === negocio.categoria_id);

  // Validación defensiva: log de debugging
  React.useEffect(() => {
    if (!categoria) {
      console.warn(`[DetalleNegocio] Categoría no encontrada para negocio "${negocio.nombre_comercial}" (categoria_id: ${negocio.categoria_id})`);
    } else if (!categoria.capacidades_permitidas || !Array.isArray(categoria.capacidades_permitidas)) {
      console.error(`[DetalleNegocio] Categoría "${categoria.nombre}" no tiene capacidades_permitidas válidas:`, categoria);
    }
  }, [categoria, negocio]);

  // Filtrar capacidades: solo mostrar las que la categoría permite
  const capacidadesRelevantes = React.useMemo(() => {
    // Si no hay categoría o no tiene capacidades permitidas, mostrar todas
    if (!categoria || !categoria.capacidades_permitidas || !Array.isArray(categoria.capacidades_permitidas)) {
      console.warn(`[DetalleNegocio] Mostrando todas las capacidades porque la categoría no tiene restricciones válidas`);
      return capacidadesCatalogo;
    }
    
    const filtradas = capacidadesCatalogo.filter((cap) =>
      categoria.capacidades_permitidas.includes(cap.clave)
    );
    
    console.log(`[DetalleNegocio] Capacidades filtradas para ${categoria.nombre}:`, filtradas.map(c => c.clave));
    return filtradas;
  }, [categoria, capacidadesCatalogo]);

  return (
    <View style={estilos.contenedor}>
      {/* Cabecera del detalle */}
      <View style={estilos.cabeceraDetalle}>
        <View style={estilos.bloqueIdentidad}>
          <Text style={estilos.nombreComercial}>{negocio.nombre_comercial}</Text>
          <Text style={estilos.categoria}>
            {categoria?.nombre ?? negocio.categoria_id} • {negocio.activo ? '🟢 Activo' : '🔴 Inactivo'}
          </Text>
        </View>

        {guardandoCapacidad && (
          <View style={estilos.indicadorGuardado}>
            <ActivityIndicator size="small" color="#059669" />
            <Text style={estilos.textoGuardado}>Guardando...</Text>
          </View>
        )}
      </View>

      {/* Sección de capacidades operativas */}
      <View style={estilos.seccionCapacidades}>
        <Text style={estilos.tituloSeccion}>Capacidades</Text>

        {capacidadesRelevantes.length === 0 ? (
          <View style={estilos.estadoVacio}>
            <Text style={estilos.textoVacio}>
              No hay capacidades disponibles para esta categoría.
            </Text>
          </View>
        ) : (
          <View style={estilos.listaCapacidades}>
            {capacidadesRelevantes.map((cap) => {
              const ajuste = negocio.configuracion.capacidades[cap.clave];
              const estaHabilitada = Boolean(ajuste?.activa);

              return (
                <View
                  key={cap.id}
                  style={[
                    estilos.tarjetaCapacidad,
                    estaHabilitada && estilos.tarjetaCapacidadHabilitada,
                  ]}
                >
                  <View style={estilos.infoCapacidad}>
                    <Text style={estilos.nombreCapacidad}>
                      {estaHabilitada ? '✅' : '⚪'} {cap.nombre}
                    </Text>
                    <Text style={estilos.descripcionCapacidad}>{cap.descripcion}</Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      estilos.botonAlternar,
                      estaHabilitada ? estilos.botonDeshabilitar : estilos.botonHabilitar,
                      guardandoCapacidad && estilos.botonDeshabilitado,
                    ]}
                    onPress={() => onAlternarCapacidad(cap.clave, !estaHabilitada)}
                    disabled={guardandoCapacidad}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        estilos.textoBotonAlternar,
                        estaHabilitada ? estilos.textoDeshabilitar : estilos.textoHabilitar,
                      ]}
                    >
                      {estaHabilitada ? 'Desactivar' : 'Activar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
};

const estilos = StyleSheet.create({
  contenedor: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginBottom: 16,
  },
  contenedorSinSeleccion: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  iconoPlaceholder: {
    marginBottom: 12,
  },
  textoIcono: {
    fontSize: 32,
  },
  tituloSinSeleccion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  subtituloSinSeleccion: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  cabeceraDetalle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 16,
    marginBottom: 20,
  },
  bloqueIdentidad: {
    flex: 1,
  },
  nombreComercial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  categoria: {
    fontSize: 14,
    color: '#6b7280',
  },
  indicadorGuardado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  textoGuardado: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  seccionCapacidades: {
    gap: 12,
  },
  tituloSeccion: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  listaCapacidades: {
    gap: 12,
  },
  tarjetaCapacidad: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tarjetaCapacidadHabilitada: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  infoCapacidad: {
    flex: 1,
    marginRight: 16,
  },
  nombreCapacidad: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  descripcionCapacidad: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  botonAlternar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  botonHabilitar: {
    backgroundColor: '#059669',
  },
  botonDeshabilitar: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  botonDeshabilitado: {
    opacity: 0.5,
  },
  textoBotonAlternar: {
    fontSize: 13,
    fontWeight: '600',
  },
  textoHabilitar: {
    color: '#ffffff',
  },
  textoDeshabilitar: {
    color: '#dc2626',
  },
  estadoVacio: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textoVacio: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
