# La Tiendita Barrazas - Sistema de Contabilidad

Sistema de contabilidad para llevar el control diario de ventas de un negocio. Construido con Next.js 16, React 19, TypeScript, Tailwind CSS 4 y Supabase.

## 🚀 Características

- ✅ Registro diario de ventas con múltiples métodos de pago (Cash, ATH, Tarjetas)
- ✅ Cálculos automáticos de totales y validación de sumas
- ✅ Prevención de registros duplicados
- ✅ **Ver y editar registros existentes**
- ✅ **Historial completo de cambios (auditoría)**
- ✅ **Sistema de usuarios para tracking de modificaciones**
- ✅ Análisis de estadísticas (promedio, máximo, mínimo)
- ✅ Reportes con exportación a CSV
- ✅ Interfaz moderna y responsive
- ✅ Base de datos en la nube con Supabase

## 📋 Requisitos Previos

- Node.js 18+ instalado
- Una cuenta de Supabase (gratis en [supabase.com](https://supabase.com))
- npm o pnpm

## 🛠️ Instalación

### 1. Clonar o descargar el proyecto

```bash
cd "La tiendita Barrazas"
```

### 2. Instalar dependencias

```bash
npm install
# o
pnpm install
```

### 3. Configurar Supabase

#### 3.1. Crear un proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Espera a que el proyecto esté listo (toma unos 2 minutos)

#### 3.2. Ejecutar los scripts SQL

**IMPORTANTE:** Ejecuta TODOS los scripts en orden:

1. **Script 1: Tablas principales** (`scripts/001_create_accounting_tables.sql`)
   - Crea: `daily_records`, `sales_data`, `payment_methods`, `summary_data`

2. **Script 2: Tabla de auditoría** (`scripts/002_create_audit_table.sql`)
   - Crea: `audit_log`

3. **Script 3: Caja Menor** (`scripts/003_create_caja_menor_table.sql`)
   - Crea: `caja_menor_records`

4. **Script 4: Empleados** (`scripts/004_create_employees_table.sql`) ← **NUEVO**
   - Crea: `employees`, `employee_payments`

**Para cada script:**
1. Ve a **SQL Editor** en Supabase
2. Crea una nueva query
3. Copia y pega el contenido del script
4. Ejecuta (Run)
5. Verifica en **Table Editor** que las tablas se crearon

#### 3.3. Obtener las credenciales

1. Ve a **Settings** → **API**
2. Copia los siguientes valores:
   - **Project URL** (ejemplo: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public key** (comienza con `eyJ...`)

### 4. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto (al lado de `package.json`):

```env
NEXT_PUBLIC_SUPABASE_URL=tu_project_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

Reemplaza los valores con tus credenciales de Supabase.

### 5. Ejecutar el proyecto

```bash
npm run dev
# o
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📁 Estructura del Proyecto

```
La tiendita Barrazas/
├── app/
│   ├── analysis/          # Página de análisis estadístico
│   ├── daily/             # Formulario de registro diario
│   ├── reports/           # Página de reportes y exportación
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx           # Página de inicio
│   └── globals.css        # Estilos globales
├── components/
│   └── ui/                # Componentes de UI (shadcn)
├── lib/
│   ├── supabase/
│   │   └── client.ts      # Cliente de Supabase
│   └── utils.ts           # Utilidades
├── scripts/
│   └── 001_create_accounting_tables.sql  # Schema de la BD
├── .env                   # Variables de entorno (no incluido)
├── package.json           # Dependencias
└── tsconfig.json          # Configuración de TypeScript
```

## 💡 Uso

### Registrar ventas del día

1. En la página principal, haz clic en "Registrar ventas de hoy"
2. **Primera vez**: El sistema te pedirá tu nombre (para el historial de cambios)
3. Selecciona la fecha (por defecto es hoy)
4. Completa los campos:
   - **Ventas Brutas**: Total de ventas antes de impuestos
   - **Cargos y Comisiones**: Impuestos o comisiones
   - **Ventas Netas**: Ventas después de impuestos
5. Completa los métodos de pago (Cash, ATH, DC, CC)
6. Completa la sección de resumen:
   - **Caja Menor**: Efectivo guardado en caja menor
   - **Depósito**: Cantidad depositada al banco
7. El sistema validará automáticamente que las sumas cuadren
8. Confirma y guarda el registro
9. **Se registrará automáticamente en el historial** con tu nombre

### Ver y editar registros

1. En la página principal, haz clic en cualquier registro
2. Verás todos los detalles organizados por sección
3. Al final, verás el **Historial de Cambios** (quién creó/editó y cuándo)
4. Haz clic en "✏️ Editar" para modificar el registro
5. Realiza los cambios necesarios
6. Guarda los cambios (se registrarán automáticamente en el historial)
7. Puedes eliminar el registro con "🗑️ Eliminar" (requiere confirmación)

### Ver análisis

- Ve a la sección "Análisis" para ver:
  - Total de ventas acumulado
  - Promedio diario
  - Día con mayor venta
  - Día con menor venta

### Ver reportes

- Ve a "Reportes" para ver todos los registros en tabla
- Puedes exportar los datos a CSV para análisis adicional

## 🔒 Seguridad

⚠️ **Importante**: Este sistema no tiene autenticación de usuarios. La seguridad depende de:

1. Las políticas RLS de Supabase permiten acceso total (configuradas en el SQL)
2. Solo quien tenga acceso a la URL y las credenciales puede acceder
3. **No compartas tu archivo `.env`** con nadie
4. Para producción, considera implementar autenticación con Supabase Auth

## 🐛 Solución de Problemas

### Error de conexión a Supabase

- Verifica que las variables en `.env` sean correctas
- Asegúrate de que el archivo `.env` esté en la raíz del proyecto
- Reinicia el servidor de desarrollo después de cambiar `.env`

### Las tablas no existen

- Asegúrate de haber ejecutado el script SQL en el editor de Supabase
- Verifica en Supabase Dashboard → Table Editor que las tablas existan

### Error de TypeScript

- Ejecuta `npm run lint` para ver errores
- Asegúrate de tener todas las dependencias instaladas

## 📦 Dependencias Principales

- **Next.js 16**: Framework de React
- **React 19**: Biblioteca de UI
- **TypeScript**: Tipado estático
- **Tailwind CSS 4**: Framework de CSS
- **Supabase**: Backend as a Service
- **shadcn/ui**: Componentes de UI
- **Recharts**: Gráficos (preparado para uso futuro)
- **date-fns**: Manejo de fechas

## 🚀 Deploy en Vercel

### Pasos Rápidos

1. **Ejecuta todos los scripts SQL en Supabase:**
   - `scripts/001_create_accounting_tables.sql`
   - `scripts/002_create_audit_table.sql`
   - `scripts/003_create_caja_menor_table.sql`
   - `scripts/004_create_employees_table.sql` ← **NUEVO**

2. **Sube tu código a GitHub/GitLab/Bitbucket**

3. **Conecta con Vercel:**
   - Ve a [vercel.com](https://vercel.com)
   - Click en "Add New Project"
   - Importa tu repositorio
   - Vercel detectará automáticamente Next.js

4. **Configura Variables de Entorno en Vercel:**
   - Ve a **Settings** → **Environment Variables**
   - Agrega:
     - `NEXT_PUBLIC_SUPABASE_URL` = tu URL de Supabase
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = tu anon key de Supabase
   - Marca para **Production**, **Preview** y **Development**

5. **Deploy:**
   - Click en "Deploy"
   - Espera 2-3 minutos
   - ¡Listo! Tu app estará en `https://tu-proyecto.vercel.app`

### 📋 Checklist Pre-Deployment

- [ ] Todos los scripts SQL ejecutados en Supabase
- [ ] Código subido a un repositorio Git
- [ ] Variables de entorno configuradas en Vercel
- [ ] Build local funciona (`npm run build`)

### 🔍 Verificación Post-Deployment

1. Abre la URL de producción
2. Verifica que la página carga correctamente
3. Prueba crear un registro para verificar conexión con Supabase
4. Revisa los logs en Vercel si hay errores

### 📖 Documentación Completa

Ver `VERCEL_DEPLOYMENT.md` para instrucciones detalladas y troubleshooting.

## 📝 Notas

- Los registros se pueden hacer para fechas pasadas
- El sistema advierte si intentas crear un registro duplicado para la misma fecha
- Todas las cantidades monetarias usan 2 decimales
- Los cálculos se realizan en tiempo real mientras escribes

## 🤝 Soporte

Si encuentras problemas o tienes preguntas sobre el código, revisa:

1. Los logs de la consola del navegador (F12)
2. Los logs del servidor en la terminal
3. La documentación de [Next.js](https://nextjs.org/docs)
4. La documentación de [Supabase](https://supabase.com/docs)

## 📄 Licencia

Este proyecto fue creado para uso personal/comercial de La Tiendita Barrazas.

---

**Generado con v0.app** - Mejorado y corregido con correcciones de seguridad, validación y performance.

