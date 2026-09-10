# Unidad Central

Autoridad administrativa del ecosistema ADI.

## ¿Qué es Unidad Central?

Central gestiona el catálogo maestro de **categorías**, **negocios** y **capacidades** que son consumidas por los repositorios operativos del ecosistema.

### Jerarquía Canónica

```
CAPACIDAD GLOBAL → CATEGORÍA → NEGOCIO
```

- **Capacidad**: Funcionalidad global (ej: "mostrador", "reparto", "horno")
- **Categoría**: Define qué capacidades aplican a su tipo de negocio (ej: Marisquerías permite mostrador + bascula + reparto)
- **Negocio**: Activa/desactiva las capacidades permitidas por su categoría

### Autoridad de Central

**SÍ administra:**
- ✅ Identidades de negocios
- ✅ Estructura de categorías
- ✅ Catálogo de capacidades
- ✅ Configuración de capacidades por negocio

**NO administra:**
- ❌ Operación de negocios (pedidos, ventas)
- ❌ Logística (repartidores, rutas)
- ❌ Recursos operativos (inventarios, precios)
- ❌ Analítica (métricas, KPIs)

## Inicio Rápido

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm start

# Ejecutar pruebas
npm test

# Verificar sistema
npm run verificar
```

## Estructura

```
contratos/           # Contratos puros de dominio
src/central/         # Lógica, persistencia, estado y UI
documentacion/       # Arquitectura e integración
pruebas/             # Suite de pruebas
```

## Exportación de Configuración

Central expone tres métodos para que otros repositorios consuman datos:

```typescript
// 1. Configuración de un negocio
await servicioCentral.exportarConfiguracionNegocio("neg-puerto-libres");

// 2. Catálogo de capacidades
await servicioCentral.exportarCatalogoCapacidades();

// 3. Información de categoría
await servicioCentral.exportarCategoria("cat-marisquerias");
```

## Documentación

- [Arquitectura de Central](./documentacion/arquitectura-central.md)
- [Guía de Integración](./documentacion/integracion-ecosistema.md)

## Estado

✅ TypeScript sin errores  
✅ 10/10 pruebas pasando  
✅ Jerarquía validada  
✅ Contratos de exportación listos  
✅ Sin fugas de autoridad

---

**Unidad Central** — Catálogo maestro del ecosistema ADI
