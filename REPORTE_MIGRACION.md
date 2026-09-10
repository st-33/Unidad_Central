# Reporte de Migración Estructural - Unidad Central

## Fecha: 2026-09-07

## CAMBIOS REALIZADOS

### 1. IDENTIDAD CANÓNICA

**Migración completada:**
- Contratos actualizados a formato snake_case:
  - `Negocio`: `negocio_id`, `categoria_id`, `nombre_comercial`
  - `Categoria`: `categoria_id`, `capacidades_permitidas`
  - Agregados: `ruta_operativa`, `alias[]`

**Resolución de alias legacy:**
- Creado `repositorio-alias.ts` para mapear identificadores antiguos
- Estructura: `central/alias/{id_legacy} -> negocio_id`
- Métodos: `registrarAlias()`, `resolverAlias()`, `listarAliasDeNegocio()`

**Migración no destructiva:**
- Rutas RTDB existentes mantienen compatibilidad
- Los negocios base incluyen ruta_operativa y alias
- No se eliminaron estructuras previas

### 2. CONFIGURACIÓN ESTRUCTURAL

**Central como fuente de verdad para:**
- Identidad (negocio_id, categoria_id)
- Categoría
- Estado operativo
- Capacidades estructurales
- Modalidad comercial
- Estado comercial

**Estructura RTDB:**
```
central/
  negocios/{negocio_id}/
    (datos del negocio)
  categorias/{categoria_id}/
    (datos de categoría)
  capacidades/{capacidad_id}/
    (definiciones globales)
  alias/{id_legacy} -> negocio_id
  comercial/ (nuevo)
```

**Exclusiones confirmadas:**
- NO incluye: impresión, inventario, pedidos, cocina, mesas, misiones, repartidores, rutas

### 3. NODO COMERCIAL MÍNIMO

**Contrato creado:** `contratos/comercial.ts`
- `InformacionComercial`
- `ModalidadComercial`: suscripcion | por_uso | hibrido
- `EstadoComercial`: activo | suspendido | moroso | prueba
- `EstadoSuscripcion`: vigente | vencida | cancelada | ninguna
- `ConfiguracionPeaje`: tarifa_base, moneda, habilitado

**Repositorio creado:** `repositorio-comercial.ts`
- `obtener(negocioId)` → InformacionComercial
- `guardar(info)` → void
- `actualizarEstadoComercial()`
- `actualizarEstadoSuscripcion()`

**Métodos en ServicioCentral:**
- `inicializarComercialNegocio()` - Idempotente
- `obtenerComercialNegocio()`
- `actualizarEstadoComercial()`

**NO implementado aún:**
- Pasarela de pago
- SAT / timbrado
- Facturación real

### 4. RECIBO COBRABLE

**Contrato creado:** `contratos/recibo.ts`
- `ReciboEjecucion`:
  - evento_id
  - negocio_id_origen
  - negocio_id_proveedor
  - tipo_operacion
  - mision_id
  - estado
  - timestamp_entrega
  - tarifa_aplicada
  - canal_origen
  - idempotencia_key
  - metadatos

- `ResultadoProcesamiento`:
  - recibo_id
  - cargo_aplicado
  - monto_cargo
  - razon
  - timestamp_procesamiento

**Regla comercial implementada:**
- Suscripción vigente → cargo 0
- Sin suscripción + peaje habilitado → tarifa aplicada
- Peaje deshabilitado → cargo 0

**Métodos en ServicioCentral:**
- `procesarRecibo(recibo)` → ResultadoProcesamiento
  - Valida estado 'completado'
  - Verifica idempotencia
  - Aplica regla comercial
  - Persiste recibo y resultado
- `obtenerRecibosNegocio(negocioId)` → ReciboEjecucion[]

**Repositorio creado:** `repositorio-recibos.ts`
- Estructura:
  - `central/recibos/{evento_id}`
  - `central/procesamientos/{evento_id}`

**Nota:** Servicio a Domicilio no fue modificado. Central está preparado para consumir el contrato cuando esté listo.

### 5. VERIFICACIÓN

**Compilación:** ✅ Sin errores
- TypeScript compila limpiamente
- Tipos coherentes en toda la codebase

**Pruebas:** ✅ 10/10 pasadas
```
✔ Configuración de Firebase (2 pruebas)
✔ Lógica Operativa de Central (8 pruebas)
  - Inicialización idempotente
  - Activación/desactivación de capacidades
  - Configuraciones independientes por negocio
  - Validación de categoría
  - Jerarquía de capacidades
  - Exportación de configuración
```

**Archivos actualizados:**
- `/contratos/negocio.ts`
- `/contratos/categoria.ts`
- `/contratos/comercial.ts` (nuevo)
- `/contratos/recibo.ts` (nuevo)
- `/src/central/logica/servicio-central.ts`
- `/src/central/persistencia/rutas-rtdb.ts`
- `/src/central/persistencia/repositorio-alias.ts` (nuevo)
- `/src/central/persistencia/repositorio-comercial.ts` (nuevo)
- `/src/central/persistencia/repositorio-recibos.ts` (nuevo)
- `/src/central/persistencia/repositorio-negocios.ts`
- `/src/central/componentes/DetalleNegocio.tsx`
- `/src/central/componentes/ListaNegocios.tsx`
- `/src/central/componentes/ListaCategorias.tsx`
- `/src/central/pantallas/PantallaCentral.tsx`
- `/src/central/estado/useEstadoCentral.ts`
- `/pruebas/contratos-y-servicio-central.test.ts`

## CONTRATOS LISTOS PARA CONSUMO

### ConfiguracionNegocioExportada
Payload que Central exporta a otros servicios:
```typescript
{
  idNegocio: string
  nombreComercial: string
  categoriaId: string
  categoriaNombre: string
  categoriaClave: string
  capacidadesActivas: ClaveCapacidad[]
  activo: boolean
}
```

### ReciboEjecucion
Contrato que Servicio a Domicilio debe enviar a Central:
```typescript
{
  evento_id: string
  negocio_id_origen: string
  negocio_id_proveedor: string
  tipo_operacion: TipoOperacionCobrable
  mision_id?: string
  estado: EstadoRecibo
  timestamp_entrega: number
  tarifa_aplicada: number
  moneda: string
  canal_origen: CanalOrigen
  idempotencia_key: string
  metadatos?: Record<string, unknown>
}
```

## BLOQUEOS REALES

Ninguno.

## PRÓXIMOS PASOS RECOMENDADOS

1. **Integrar Servicio a Domicilio:**
   - Implementar emisión de ReciboEjecucion al completar misiones
   - Llamar a `ServicioCentral.procesarRecibo()` desde listener

2. **Registro de alias para negocios existentes:**
   - Usar `RepositorioAlias.registrarAlias()` para mapear identificadores legacy

3. **Inicialización comercial:**
   - Ejecutar `inicializarComercialNegocio()` para cada negocio activo
   - Definir modalidad (suscripción vs por_uso)

4. **Preparar para fase de cobros:**
   - Estructuras listas para recibir procesamiento de pagos
   - Esperar definición de pasarela y facturación
