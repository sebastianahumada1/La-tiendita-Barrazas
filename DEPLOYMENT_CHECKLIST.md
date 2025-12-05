# ✅ Checklist de Deployment en Vercel

## 📋 Antes de Deployar

### 1. Base de Datos (Supabase)
- [ ] Script `001_create_accounting_tables.sql` ejecutado
- [ ] Script `002_create_audit_table.sql` ejecutado
- [ ] Script `003_create_caja_menor_table.sql` ejecutado
- [ ] Script `004_create_employees_table.sql` ejecutado
- [ ] Verificado que todas las tablas existen en Supabase → Table Editor

### 2. Código
- [ ] Código subido a repositorio Git (GitHub/GitLab/Bitbucket)
- [ ] Build local funciona: `npm run build` (sin errores críticos)
- [ ] Aplicación funciona en local: `npm run dev`

### 3. Variables de Entorno
- [ ] Tienes tu `NEXT_PUBLIC_SUPABASE_URL` de Supabase
- [ ] Tienes tu `NEXT_PUBLIC_SUPABASE_ANON_KEY` de Supabase

## 🚀 Proceso de Deployment

### Paso 1: Conectar con Vercel
- [ ] Ir a [vercel.com](https://vercel.com) e iniciar sesión
- [ ] Click en "Add New Project"
- [ ] Importar repositorio desde GitHub/GitLab/Bitbucket
- [ ] Vercel detecta automáticamente Next.js ✅

### Paso 2: Configurar Variables de Entorno
- [ ] Ir a **Settings** → **Environment Variables**
- [ ] Agregar `NEXT_PUBLIC_SUPABASE_URL` con tu URL de Supabase
- [ ] Agregar `NEXT_PUBLIC_SUPABASE_ANON_KEY` con tu anon key
- [ ] Marcar ambas variables para:
  - [ ] Production
  - [ ] Preview
  - [ ] Development

### Paso 3: Deploy
- [ ] Click en "Deploy"
- [ ] Esperar a que el build termine (2-3 minutos)
- [ ] Verificar que el build fue exitoso (sin errores rojos)

## ✅ Verificación Post-Deployment

### Funcionalidad Básica
- [ ] La página principal carga correctamente
- [ ] No hay errores en la consola del navegador (F12)
- [ ] El título muestra "La tiendita Barrazas"

### Conexión con Supabase
- [ ] Crear un nuevo registro desde "Nuevo Registro Caja Fuerte"
- [ ] Verificar que se guarda correctamente
- [ ] Verificar que aparece en "Últimos registros"

### Funcionalidades Principales
- [ ] Ver un registro (click en cualquier registro)
- [ ] Editar un registro
- [ ] Ver reportes
- [ ] Crear registro de Caja Menor
- [ ] Ver registros de Caja Menor

## 🔍 Troubleshooting

### Si el build falla:
1. Revisa los logs en Vercel
2. Verifica que todas las dependencias estén en `package.json`
3. Ejecuta `npm run build` localmente para ver errores

### Si hay errores de conexión a Supabase:
1. Verifica que las variables de entorno estén correctas en Vercel
2. Verifica que la URL incluya `https://`
3. Verifica que tu proyecto de Supabase esté activo

### Si las tablas no existen:
1. Ejecuta todos los scripts SQL en Supabase
2. Verifica en Supabase → Table Editor

## 📝 Notas Finales

- ✅ El proyecto está configurado para Vercel
- ✅ Analytics de Vercel ya está incluido
- ✅ `.gitignore` está configurado correctamente
- ✅ Build funciona correctamente

## 🎉 ¡Listo!

Una vez completado el checklist, tu aplicación estará disponible en:
`https://tu-proyecto.vercel.app`

