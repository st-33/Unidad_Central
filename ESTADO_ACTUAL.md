# Estado Actual de Unidad Central

**Fecha**: 2026-09-08  
**Versión**: 1.0.1  
**Estado**: ✅ OPERATIVO (Interfaz simplificada)

---

## Resumen Ejecutivo

Unidad Central está limpia, coherente, funcional y lista para ser consumida por los repositorios operativos del ecosistema ADI.

### Validaciones

✅ **TypeScript**: Compilación sin errores  
✅ **Pruebas**: 10/10 pasando  
✅ **Jerarquía**: CAPACIDAD → CATEGORÍA → NEGOCIO consolidada y validada  
✅ **Nomenclatura**: Consistente en español latino  
✅ **Autoridad**: Sin fugas hacia dominios operativos  
✅ **Exportación**: Contratos listos para consumo externo  
✅ **RTDB**: Estructura limpia bajo `central/*`  
✅ **Documentación**: README + arquitectura + integración

---

## Arquitectura

### Jerarquía Canónica

```
CAPACIDAD GLOBAL
  │  Definición reusable
  │  disponible: boolean
  │  ej: "mostrador", "bascula", "reparto", "horno"
  ↓
CATEGORÍA
  │  Define universo de capacidades aplicables
  │  capacidadesPermitidas: ClaveCapacidad[]
  │  ej: Marisquerías → ["mostrador", "bascula", "reparto"]
  │       Servicio a Domicilio → ["reparto"]
  ↓
NEGOCIO
  │  Pertenece a una categoría
  │  Activa/desactiva capacidades permitidas
  │  configuracion.capacidades: { activa: boolean }
  │  ej: "Puerto Libres" → activa ["mostrador", "bascula"]
```

### Validaciones del Motor de Capacidades

El método `alternarCapacidadNegocio` valida en orden:

1. ✅ El negocio existe
2. ✅ La capacidad existe globalmente
3. ✅ La capacidad está disponible (no obsoleta)
4. ✅ La categoría del negocio permite esa capacidad
5. ✅ Solo entonces actualiza el estado

**Bloquea operaciones absurdas:**
- No puedes activar "horno" en ADIRepart (Servicio a Domicilio solo permite "reparto")
- No puedes activar capacidades obsoletas (disponible: false)

---

## Estructura RTDB

```
central/
  ├── sistema/              # Estado de inicialización
  ├── categorias/           # Catálogo de categorías
  │   └── {categoriaId}     # capacidadesPermitidas incluido
  ├── negocios/             # Registro de negocios
  │   └── {negocioId}       # Solo capacidades permitidas por su categoría
  └── capacidades/          # Definiciones globales de capacidades
      └── {capacidadId}     # disponible flag incluido
```

**Limpieza aplicada:**
- Los negocios **solo contienen las capacidades permitidas por su categoría**
- No hay capacidades "basura" en la configuración (ej: ADIRepart ya no tiene mostrador: false)
- Estructura mínima y coherente

---

## Contratos de Exportación

### ConfiguracionNegocioExportada

Payload principal que los repositorios operativos consumen:

```typescript
{
  idNegocio: "neg-puerto-libres",
  nombreComercial: "Marisquería Puerto Libres",
  categoriaId: "cat-marisquerias",
  categoriaNombre: "Marisquerías",
  categoriaClave: "marisquerias",
  capacidadesActivas: ["mostrador", "bascula"],  // Solo activas
  activo: true
}
```

### Métodos de Servicio

```typescript
// 1. Configuración de un negocio
ServicioCentral.exportarConfiguracionNegocio(negocioId)

// 2. Catálogo de capacidades disponibles
ServicioCentral.exportarCatalogoCapacidades()

// 3. Información de categoría
ServicioCentral.exportarCategoria(categoriaId)
```

---

## Límites de Autoridad

### Central SÍ Administra

✅ Identidades de negocios (id, nombre, categoría)  
✅ Estructura de categorías (qué capacidades permiten)  
✅ Catálogo de capacidades (definiciones globales)  
✅ Configuración de capacidades por negocio (activa/inactiva)

### Central NO Administra

❌ Pedidos, ventas, transacciones  
❌ Inventarios, productos, precios  
❌ Repartidores, rutas, zonas de reparto  
❌ Horarios operativos  
❌ Usuarios, permisos locales  
❌ Métricas, KPIs, analítica  
❌ Cocina, producción, impresión  
❌ Tarifas, descuentos, promociones

---

## Datos Base

### Categorías (4)

1. **Marisquerías** → Permite: mostrador, bascula, reparto
2. **Servicio a Domicilio** → Permite: reparto
3. **Verdulerías** → Permite: mostrador, bascula, reparto
4. **Hornos de Pan** → Permite: mostrador, horno, reparto

### Capacidades (4)

1. **mostrador** — Atención en mostrador (disponible: true)
2. **bascula** — Integración con báscula (disponible: true)
3. **reparto** — Reparto a domicilio (disponible: true)
4. **horno** — Producción de horneado (disponible: true)

### Negocios (4)

1. **Puerto Libres** (Marisquerías) → Activa: mostrador, bascula
2. **ADIRepart** (Servicio a Domicilio) → Activa: reparto
3. **Verdulería** (Verdulerías) → Activa: mostrador, bascula
4. **Horno de Pan** (Hornos de Pan) → Activa: mostrador, horno

---

## Suite de Pruebas

**10/10 pruebas pasando**

### Configuración Firebase (2)
1. ✅ Apunta exclusivamente a base-principal-ma1
2. ✅ Adaptador genera opciones correctas

### Lógica Operativa (8)
1. ✅ Inicialización idempotente
2. ✅ Activar/desactivar capacidades aisladamente
3. ✅ Negocios independientes en la misma categoría
4. ✅ Validación de categoría obligatoria
5. ✅ JERARQUÍA: Bloquea capacidades no permitidas por categoría
6. ✅ JERARQUÍA: Categorías definen capacidades correctamente
7. ✅ EXPORTACIÓN: Configuración para consumo externo
8. ✅ EXPORTACIÓN: Catálogo excluye capacidades no disponibles

---

## Componentes UI

### Activos (5)

1. **CabeceraCentral** — Conexión, inicialización, recarga
2. **BannersEstado** — Errores y mensajes de operación
3. **ListaCategorias** — Selector de categorías con filtrado
4. **ListaNegocios** — Listado filtrable por categoría
5. **DetalleNegocio** — Inspección e administración de capacidades

**Optimización aplicada:**
- DetalleNegocio filtra capacidades por categoría del negocio
- Solo muestra las capacidades relevantes
- Estado vacío cuando no hay capacidades para la categoría

---

## Archivos Relevantes

### Contratos (7 archivos)
- `contratos/identidad.ts`
- `contratos/categoria.ts` ← capacidadesPermitidas
- `contratos/capacidad.ts` ← disponible
- `contratos/configuracion.ts`
- `contratos/negocio.ts`
- `contratos/exportacion.ts` ← 3 payloads de exportación
- `contratos/index.ts`

### Lógica (1 archivo)
- `src/central/logica/servicio-central.ts` ← 5 validaciones + 3 métodos de exportación

### Persistencia (5 archivos)
- `src/central/persistencia/rutas-rtdb.ts`
- `src/central/persistencia/repositorio-categorias.ts`
- `src/central/persistencia/repositorio-negocios.ts`
- `src/central/persistencia/repositorio-capacidades.ts`
- `src/central/persistencia/repositorio-sistema.ts`

### Componentes UI (5 archivos)
- `src/central/componentes/CabeceraCentral.tsx`
- `src/central/componentes/BannersEstado.tsx`
- `src/central/componentes/ListaCategorias.tsx`
- `src/central/componentes/ListaNegocios.tsx`
- `src/central/componentes/DetalleNegocio.tsx` ← Filtrado inteligente

### Estado (1 archivo)
- `src/central/estado/useEstadoCentral.ts`

### Documentación (3 archivos)
- `README.md` ← Guía de inicio rápido
- `documentacion/arquitectura-central.md` ← Arquitectura completa
- `documentacion/integracion-ecosistema.md` ← Guía de integración

---

## Próximos Pasos Sugeridos

### Fase 8 — API REST de Central
- Exponer endpoints HTTP para consulta remota
- Autenticación y rate limiting
- Cache y optimización de consultas

### Fase 9 — Sincronización Reactiva
- Webhooks cuando cambia configuración
- Eventos RTDB para notificar repositorios
- Invalidación automática de cache

### Fase 10 — Dashboard de Salud
- Panel de consumidores de Central
- Métricas de uso por negocio
- Detección de configuraciones huérfanas

---

## Comandos Útiles

```bash
# Desarrollo
npm start

# Pruebas
npm test

# Verificación completa
npm run verificar

# Verificar tipos
npm run check-types
```

---

## Conclusión

✅ **Central está operativo y listo para el ecosistema ADI**

La jerarquía CAPACIDAD → CATEGORÍA → NEGOCIO está consolidada, validada y libre de inconsistencias. Los contratos de exportación permiten a otros repositorios consumir configuración estructural sin que Central invada dominios operativos.

**Unidad Central cumple su rol como autoridad administrativa del ecosistema.**

---

**Última actualización**: 2026-09-06  
**Mantenedor**: Equipo ADI Ecosystem
