import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import type { Categoria, IdentificadorUnico } from '../../../contratos';

interface PropsModalCrearNegocio {
  readonly visible: boolean;
  readonly categorias: readonly Categoria[];
  readonly creando: boolean;
  readonly onCerrar: () => void;
  readonly onCrear: (datos: DatosNuevoNegocio) => void;
}

export interface DatosNuevoNegocio {
  readonly nombre: string;
  readonly nombreComercial: string;
  readonly categoriaId: IdentificadorUnico;
  readonly codigoAcceso: string;
}

export const ModalCrearNegocio: React.FC<PropsModalCrearNegocio> = ({
  visible,
  categorias,
  creando,
  onCerrar,
  onCrear,
}) => {
  const [nombre, setNombre] = useState('');
  const [nombreComercial, setNombreComercial] = useState('');
  const [categoriaId, setCategoriaId] = useState<string>('');
  const [codigoAcceso, setCodigoAcceso] = useState('');

  const puedeCrear = Boolean(
    nombre.trim() &&
    nombreComercial.trim() &&
    categoriaId &&
    codigoAcceso.trim() &&
    !creando
  );

  const manejarCrear = () => {
    if (!puedeCrear) return;

    onCrear({
      nombre: nombre.trim(),
      nombreComercial: nombreComercial.trim(),
      categoriaId,
      codigoAcceso: codigoAcceso.trim().toUpperCase(),
    });
  };

  const reiniciarFormulario = () => {
    setNombre('');
    setNombreComercial('');
    setCategoriaId('');
    setCodigoAcceso('');
  };

  const manejarCerrar = () => {
    reiniciarFormulario();
    onCerrar();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={manejarCerrar}
    >
      <View style={estilos.overlay}>
        <View style={estilos.modal}>
          <ScrollView style={estilos.contenido}>
            <Text style={estilos.titulo}>Crear Nuevo Negocio</Text>
            <Text style={estilos.descripcion}>
              Registra un nuevo negocio en la Unidad Central. Se creará automáticamente la estructura en la base de datos.
            </Text>

            <View style={estilos.campo}>
              <Text style={estilos.etiqueta}>Nombre del Negocio</Text>
              <TextInput
                style={estilos.input}
                placeholder="Ej: Marisquería El Puerto"
                value={nombre}
                onChangeText={setNombre}
                editable={!creando}
              />
            </View>

            <View style={estilos.campo}>
              <Text style={estilos.etiqueta}>Nombre Comercial</Text>
              <TextInput
                style={estilos.input}
                placeholder="Ej: El Puerto - Mariscos Frescos"
                value={nombreComercial}
                onChangeText={setNombreComercial}
                editable={!creando}
              />
            </View>

            <View style={estilos.campo}>
              <Text style={estilos.etiqueta}>Código de Acceso</Text>
              <TextInput
                style={estilos.input}
                placeholder="Ej: PUERTO-24"
                value={codigoAcceso}
                onChangeText={setCodigoAcceso}
                autoCapitalize="characters"
                editable={!creando}
              />
              <Text style={estilos.ayuda}>
                Código único que identificará este negocio en el sistema
              </Text>
            </View>

            <View style={estilos.campo}>
              <Text style={estilos.etiqueta}>Categoría</Text>
              <View style={estilos.listaCategorias}>
                {categorias.map((categoria) => (
                  <TouchableOpacity
                    key={categoria.id}
                    style={[
                      estilos.opcionCategoria,
                      categoriaId === categoria.id && estilos.opcionCategoriaSeleccionada,
                    ]}
                    onPress={() => setCategoriaId(categoria.id)}
                    disabled={creando}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        estilos.textoOpcionCategoria,
                        categoriaId === categoria.id && estilos.textoOpcionCategoriaSeleccionada,
                      ]}
                    >
                      {categoria.nombre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={estilos.acciones}>
            <TouchableOpacity
              style={estilos.botonCancelar}
              onPress={manejarCerrar}
              disabled={creando}
              activeOpacity={0.7}
            >
              <Text style={estilos.textoBotonCancelar}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                estilos.botonCrear,
                !puedeCrear && estilos.botonDeshabilitado,
              ]}
              onPress={manejarCrear}
              disabled={!puedeCrear}
              activeOpacity={0.7}
            >
              {creando ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={estilos.textoBotonCrear}>Crear Negocio</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const estilos = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  contenido: {
    padding: 24,
  },
  titulo: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  descripcion: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 24,
  },
  campo: {
    marginBottom: 20,
  },
  etiqueta: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  ayuda: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  listaCategorias: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  opcionCategoria: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
  },
  opcionCategoriaSeleccionada: {
    borderColor: '#059669',
    backgroundColor: '#f0fdf4',
  },
  textoOpcionCategoria: {
    fontSize: 13,
    color: '#4b5563',
    fontWeight: '500',
  },
  textoOpcionCategoriaSeleccionada: {
    color: '#059669',
    fontWeight: '600',
  },
  acciones: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    padding: 16,
    gap: 12,
  },
  botonCancelar: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  textoBotonCancelar: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  botonCrear: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#059669',
  },
  botonDeshabilitado: {
    opacity: 0.5,
  },
  textoBotonCrear: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});