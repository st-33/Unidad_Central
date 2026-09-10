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
      const actual = mapa.get(neg.categoria_id) ?? 0;
      mapa.set(neg.categoria_id, actual + 1);
    }
    return mapa;
  }, [negocios]);

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.tituloSeccion}>Categorías</Text>

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
    </View>
  );
};

const estilos = StyleSheet.create({
  contenedor: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tituloSeccion: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  listaPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillCategoria: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  pillCategoriaActiva: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  textoPill: {
    fontSize: 13,
    color: '#4b5563',
    fontWeight: '600',
  },
  textoPillActivo: {
    color: '#ffffff',
  },
});
