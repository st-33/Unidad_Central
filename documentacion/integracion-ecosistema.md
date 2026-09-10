# Integración de Central con el Ecosistema ADI

## PRINCIPIO FUNDAMENTAL

**Central es la AUTORIDAD DE CONFIGURACIÓN ESTRUCTURAL, no una autoridad operativa.**

Central SOLO inyecta hacia los repositorios operativos:
- **Identidad del negocio** (id, nombre comercial)
- **Categoría sectorial** (id, nombre, clave)
- **Capacidades habilitadas** (lista de claves activas)
- **Estado operativo** (activo/inactivo)

Central NO conoce ni administra:
- ❌ Tarifas de productos o servicios
- ❌ Inventarios de productos
- ❌ Disponibilidad de repartidores
- ❌ Pedidos en curso o históricos
- ❌ Horarios operativos específicos
- ❌ Zonas de reparto
- ❌ Métricas de negocio o analítica

---

## CONTRATOS DE EXPORTACIÓN

Central expone tres tipos de payloads definidos en `/contratos/exportacion.ts`:

### 1. ConfiguracionNegocioExportada

Payload principal que un repositorio operativo consume para conocer su contexto.

```typescript
{
  idNegocio: "neg-puerto-libres",
  nombreComercial: "Marisquería Puerto Libres",
  categoriaId: "cat-marisquerias",
  categoriaNombre: "Marisquerías",
  categoriaClave: "marisquerias",
  capacidadesActivas: ["mostrador", "bascula"],
  activo: true
}
```

**Método del servicio:**
```typescript
ServicioCentral.exportarConfiguracionNegocio(negocioId: string)
  → Resultado<ConfiguracionNegocioExportada, Error>
```

**Uso típico:**
- Al iniciar una aplicación operativa (Marisquerías, Verdulerías), consulta su configuración
- Basándose en `capacidadesActivas`, habilita o deshabilita módulos (ej: si "bascula" está activa, mostrar integración de báscula)
- Usa `categoriaClave` para cargar lógica específica del sector

---

### 2. CategoriaExportada

Información de la categoría sectorial.

```typescript
{
  id: "cat-marisquerias",
  clave: "marisquerias",
  nombre: "Marisquerías",
  descripcion: "Comercio y distribución de pescados y mariscos",
  capacidadesPermitidas: ["mostrador", "bascula", "reparto"]
}
```

**Método del servicio:**
```typescript
ServicioCentral.exportarCategoria(categoriaId: string)
  → Resultado<CategoriaExportada, Error>
```

**Uso típico:**
- Validar que un negocio pertenece a la categoría correcta
- Conocer qué capacidades puede tener un negocio de esta categoría
- Generar informes o dashboards por categoría

---

### 3. CapacidadExportada

Catálogo global de capacidades disponibles.

```typescript
[
  {
    clave: "mostrador",
    nombre: "Atención en mostrador",
    descripcion: "Venta y atención presencial en barra o mostrador"
  },
  {
    clave: "bascula",
    nombre: "Integración con báscula",
    descripcion: "Pesaje y cálculo por peso para venta a granel"
  }
]
```

**Método del servicio:**
```typescript
ServicioCentral.exportarCatalogoCapacidades()
  → Resultado<readonly CapacidadExportada[], Error>
```

**Uso típico:**
- Generar UIs dinámicas que muestren capacidades disponibles
- Documentación automática de funcionalidades del sistema
- Validación de configuraciones en tiempo de desarrollo

---

## PUNTOS DE SALIDA DE DATOS

### Desde Firebase RTDB

Los repositorios operativos pueden leer directamente de RTDB si tienen acceso:

```
central/
├── categorias/
│   └── {categoriaId}/          # Datos completos de categoría
├── capacidades/
│   └── {capacidadId}/          # Definiciones globales
└── negocios/
    └── {negocioId}/            # Datos completos del negocio
        ├── id
        ├── nombre
        ├── nombreComercial
        ├── categoriaId
        ├── activo
        └── configuracion/
            └── capacidades/
                ├── {clave}: { activa: boolean }
```

**Reglas de lectura recomendadas:**
- Los repositorios operativos deben tener permiso de SOLO LECTURA en `central/*`
- Central tiene permiso de ESCRITURA en `central/*`
- Usar listeners de RTDB para reaccionar a cambios en configuración

---

### Desde API REST (futuro)

Cuando se implemente una API REST para Central, los endpoints serían:

```
GET /api/central/negocios/{negocioId}/configuracion
→ ConfiguracionNegocioExportada

GET /api/central/categorias/{categoriaId}
→ CategoriaExportada

GET /api/central/capacidades
→ CapacidadExportada[]
```

---

## FLUJO DE INTEGRACIÓN TÍPICO

### Inicio de aplicación operativa (ej: Marisquerías)

```typescript
// 1. Consultar configuración desde Central
const resultado = await servicioCentral.exportarConfiguracionNegocio("neg-puerto-libres");

if (!resultado.exito) {
  throw new Error("No se pudo obtener configuración de Central");
}

const config = resultado.datos;

// 2. Validar que el negocio está activo
if (!config.activo) {
  mostrarPantallaMantenimiento();
  return;
}

// 3. Habilitar módulos según capacidades activas
if (config.capacidadesActivas.includes("mostrador")) {
  habilitarModuloMostrador();
}

if (config.capacidadesActivas.includes("bascula")) {
  habilitarIntegracionBascula();
}

if (config.capacidadesActivas.includes("reparto")) {
  habilitarModuloReparto();
}

// 4. Usar datos de categoría para lógica específica
if (config.categoriaClave === "marisquerias") {
  cargarCatalogoPescadosMariscos();
} else if (config.categoriaClave === "verdulerias") {
  cargarCatalogoFrutasVerduras();
}

// 5. Mostrar nombre comercial en la UI
setTituloPantalla(config.nombreComercial);
```

---

## LÍMITES DE AUTORIDAD

### ✅ Central SÍ administra:

1. **Identidades de negocios**
   - Registro de nuevos negocios
   - Activación/desactivación de negocios
   - Nombres comerciales y razones sociales

2. **Estructura de categorías**
   - Creación de categorías sectoriales
   - Definición de capacidades permitidas por categoría
   - Relación negocio ↔ categoría

3. **Catálogo de capacidades**
   - Definición global de capacidades
   - Marcado de capacidades como disponibles/en desuso
   - Asignación de capacidades a categorías

4. **Configuración de capacidades por negocio**
   - Activación/desactivación de capacidades específicas
   - Validación de que las capacidades pertenezcan a la categoría
   - Persistencia de estados de capacidades

---

### ❌ Central NO administra:

1. **Operación de negocios**
   - Pedidos, ventas, transacciones
   - Inventarios de productos
   - Precios y tarifas

2. **Logística**
   - Disponibilidad de repartidores
   - Rutas de reparto
   - Zonas de cobertura

3. **Recursos operativos**
   - Usuarios del sistema operativo (cajeros, administradores locales)
   - Permisos específicos del negocio
   - Configuraciones técnicas (impresoras, básculas, terminales)

4. **Analítica y reportes operativos**
   - Métricas de venta
   - Informes de rendimiento
   - KPIs de negocio

---

## VERIFICACIÓN DE LÍMITES

Para garantizar que Central no filtre autoridad incorrecta, auditar:

1. **Contratos de exportación** (`contratos/exportacion.ts`)
   - Solo exponen: identidad, categoría, capacidades activas
   - No incluyen: precios, inventarios, horarios, zonas

2. **Métodos de ServicioCentral** (`src/central/logica/servicio-central.ts`)
   - Métodos `exportar*` solo devuelven datos estructurales
   - No hay métodos como `obtenerPreciosNegocio`, `listarRepartidoresDisponibles`

3. **Estructura RTDB** (`src/central/persistencia/rutas-rtdb.ts`)
   - Nodo `central/*` solo contiene: categorías, capacidades, negocios
   - No contiene: `pedidos/*`, `inventarios/*`, `repartidores/*`

---

## PRÓXIMOS PASOS DE INTEGRACIÓN

### Fase 8 (futuro): API REST de Central
- Exponer endpoints HTTP para consulta de configuración
- Implementar autenticación y autorización
- Rate limiting y caché

### Fase 9 (futuro): Sincronización reactiva
- Webhooks cuando cambia configuración de un negocio
- Eventos de RTDB que notifiquen a repositorios operativos
- Invalidación de caché automática

### Fase 10 (futuro): Dashboard de salud del ecosistema
- Panel que muestre qué repositorios consumen datos de Central
- Métricas de consultas por negocio
- Detección de negocios huérfanos (sin consumidores)

---

## RESUMEN EJECUTIVO

✅ **Central define ESTRUCTURA**: categorías, capacidades, identidades  
✅ **Central NO opera NEGOCIOS**: sin precios, inventarios, pedidos  
✅ **Punto de salida canónico**: `ServicioCentral.exportar*`  
✅ **Contratos claros**: `/contratos/exportacion.ts`  
✅ **Sin fugas de autoridad**: Auditar que solo se exporta configuración estructural  
