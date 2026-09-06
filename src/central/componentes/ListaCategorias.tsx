import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { Categoria, IdentificadorUnico, Negocio } from '../../../contratos';

interface PropsListaCategorias {
  readonly categorias: readonly Categoria[];
  readonly negocios: readonly Negocio[];
  readonly categoriaSeleccionadaId: IdentificadorUnico | null;
  readonly onSeleccionarCategoria: (id: IdentificadorUnico | null) => void;
}

export const ListaCategorias: React.FC<PropsListaCategorias> = ({
  categorias,
  negocios,
  categoriaSeleccionadaId,
  onSeleccionarCategoria,
}) => {
  // Cuenta de negocios por categoría
  const conteoPorCategoria = React.useMemo(() => {
    const mapa = new Map<string, number>();
    for (const neg of negocios) {
      const actual = mapa.get(neg.categoriaId) ?? 0;
      mapa.set(neg.categoriaId, actual + 1);
    }
    return mapa;
  }, [negocios]);

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.cabeceraSeccion}>
        <Text style={estilos.tituloSeccion}>CATEGORÍAS DE LA RED</Text>
        <Text style={estilos.conteoTotal}>{categorias.length} registradas</Text>
      </View>

      <View style={estilos.listaPills}>
        {/* Opción para ver todas */}
        <TouchableOpacity
          style={[
            estilos.pillCategoria,
            categoriaSeleccionadaId === null && estilos.pillCategoriaActiva,
          ]}
          onPress={() => onSeleccionarCategoria(null)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              estilos.textoPill,
              categoriaSeleccionadaId === null && estilos.textoPillActivo,
            ]}
          >
            Todas ({negocios.length})
          </Text>
        </TouchableOpacity>

        {categorias.map((cat) => {
          const seleccionada = categoriaSeleccionadaId === cat.id;
          const cantidad = conteoPorCategoria.get(cat.id) ?? 0;

          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                estilos.pillCategoria,
                seleccionada && estilos.pillCategoriaActiva,
              ]}
              onPress={() => onSeleccionarCategoria(cat.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  estilos.textoPill,
                  seleccionada && estilos.textoPillActivo,
                ]}
              >
                {cat.nombre} ({cantidad})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tarjetas resumen de categorías */}
      <View style={estilos.grillaCategorias}>
        {categorias.map((cat) => {
          const seleccionada = categoriaSeleccionadaId === cat.id;
          const cantidad = conteoPorCategoria.get(cat.id) ?? 0;

          return (
            <TouchableOpacity
              key={`card-${cat.id}`}
              style={[
                estilos.tarjetaCategoria,
                seleccionada && estilos.tarjetaCategoriaSeleccionada,
              ]}
              onPress={() => onSeleccionarCategoria(cat.id)}
              activeOpacity={0.8}
            >
              <View style={estilos.filaTituloCategoria}>
                <Text style={estilos.nombreCategoria}>{cat.nombre}</Text>
                <View style={estilos.badgeConteo}>
                  <Text style={estilos.textoBadgeConteo}>{cantidad} neg.</Text>
                </View>
              </View>
              <Text style={estilos.claveCategoria}>Clave: {cat.clave}</Text>
              <Text style={estilos.descripcionCategoria} numberOfLines={2}>
                {cat.descripcion}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const estilos = StyleSheet.create({
  contenedor: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cabeceraSeccion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tituloSeccion: {
    fontSize: 11,
    fontWeight: '800',
    color: '#374151',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  conteoTotal: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  listaPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  pillCategoria: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  pillCategoriaActiva: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  textoPill: {
    fontSize: 12,
    color: '#4b5563',
    fontWeight: '600',
  },
  textoPillActivo: {
    color: '#ffffff',
  },
  grillaCategorias: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tarjetaCategoria: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tarjetaCategoriaSeleccionada: {
    borderColor: '#059669',
    backgroundColor: '#ecfdf5',
  },
  filaTituloCategoria: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nombreCategoria: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  badgeConteo: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  textoBadgeConteo: {
    fontSize: 10,
    color: '#374151',
    fontWeight: '700',
  },
  claveCategoria: {
    fontSize: 10,
    color: '#059669',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  descripcionCategoria: {
    fontSize: 11,
    color: '#6b7280',
    lineHeight: 15,
  },
});
