# 🚀 Guía de Deployment en Vercel

## 📋 Requisitos Previos

1. ✅ Cuenta en [Vercel](https://vercel.com) (gratis)
2. ✅ Proyecto en [Supabase](https://supabase.com) configurado
3. ✅ Scripts SQL ejecutados en Supabase
4. ✅ Código en un repositorio Git (GitHub, GitLab, o Bitbucket)

## 🔧 Pasos para Deployment

### 1. Preparar el Repositorio Git

```bash
# Si aún no tienes un repositorio Git
git init
git add .
git commit -m "Initial commit"
git remote add origin tu_repositorio_url
git push -u origin main
```

### 2. Ejecutar Scripts SQL en Supabase

Asegúrate de haber ejecutado todos los scripts SQL en Supabase:

1. `scripts/001_create_accounting_tables.sql`
2. `scripts/002_create_audit_table.sql`
3. `scripts/003_create_caja_menor_table.sql`
4. `scripts/004_create_employees_table.sql` ← **NUEVO**

### 3. Conectar Proyecto en Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Click en **"Add New Project"**
3. Importa tu repositorio desde GitHub/GitLab/Bitbucket
4. Vercel detectará automáticamente que es un proyecto Next.js

### 4. Configurar Variables de Entorno

En la configuración del proyecto en Vercel:

1. Ve a **Settings** → **Environment Variables**
2. Agrega las siguientes variables:

```
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

**Importante:** 
- Marca estas variables para **Production**, **Preview** y **Development**
- Reemplaza los valores con tus credenciales reales de Supabase

### 5. Configurar Build Settings

Vercel debería detectar automáticamente:
- **Framework Preset:** Next.js
- **Build Command:** `next build` (automático)
- **Output Directory:** `.next` (automático)
- **Install Command:** `npm install` (automático)

### 6. Deploy

1. Click en **"Deploy"**
2. Espera a que el build termine (2-3 minutos)
3. Una vez completado, tendrás una URL de producción

## ✅ Verificación Post-Deployment

1. **Verifica que la aplicación carga correctamente**
2. **Prueba crear un registro** para verificar la conexión con Supabase
3. **Revisa los logs** en Vercel si hay errores

## 🔍 Troubleshooting

### Error: "Failed to fetch"
- Verifica que las variables de entorno estén correctamente configuradas
- Asegúrate de que `NEXT_PUBLIC_SUPABASE_URL` incluya `https://`
- Verifica que tu proyecto de Supabase esté activo

### Error: "Table does not exist"
- Ejecuta todos los scripts SQL en Supabase
- Verifica que las tablas existan en Supabase → Table Editor

### Error de Build
- Revisa los logs de build en Vercel
- Asegúrate de que todas las dependencias estén en `package.json`
- Verifica que no haya errores de TypeScript

## 📝 Notas Importantes

- **Variables de entorno:** Solo las variables que comienzan con `NEXT_PUBLIC_` son accesibles en el cliente
- **Base de datos:** Asegúrate de que las políticas RLS en Supabase permitan las operaciones necesarias
- **Dominio personalizado:** Puedes configurar un dominio personalizado en Vercel → Settings → Domains

## 🎉 ¡Listo!

Una vez desplegado, tu aplicación estará disponible en una URL como:
`https://tu-proyecto.vercel.app`

