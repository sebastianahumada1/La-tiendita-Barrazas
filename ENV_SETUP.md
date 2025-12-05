# Configuración de Variables de Entorno

## Instrucciones Rápidas

Crea un archivo llamado `.env` en la raíz del proyecto con el siguiente contenido:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_project_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

## ¿Dónde obtener estos valores?

### 1. NEXT_PUBLIC_SUPABASE_URL

1. Ve a tu proyecto en [supabase.com](https://supabase.com)
2. Ve a **Settings** (⚙️) → **API**
3. Busca la sección "Project URL"
4. Copia la URL (se ve algo así: `https://xxxxxxxxxxxxx.supabase.co`)

### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY

1. En la misma página (**Settings** → **API**)
2. Busca la sección "Project API keys"
3. Copia el valor de **anon** / **public** (empieza con `eyJ...`)
4. **NO copies** el service_role key (ese es privado y no debe usarse en el frontend)

## Ejemplo de archivo .env

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmno.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ubyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwMDAwMDAwLCJleHAiOjE5NTUwMDAwMDB9.ejemplo_token_largo
```

## Verificación

Después de crear el archivo `.env`:

1. Reinicia el servidor de desarrollo (`npm run dev`)
2. Abre el navegador en `http://localhost:3000`
3. Abre la consola del navegador (F12)
4. Si ves errores de Supabase, verifica que:
   - El archivo se llame exactamente `.env` (con el punto al inicio)
   - Esté en la raíz del proyecto (al lado de `package.json`)
   - Los valores no tengan espacios extras o comillas

## Seguridad

⚠️ **NUNCA** subas el archivo `.env` a GitHub o lo compartas públicamente.

El archivo `.gitignore` ya está configurado para ignorar `.env` automáticamente.

## Problemas Comunes

### "Invalid API key"
- Verifica que copiaste el **anon** key, no el service_role key
- Asegúrate de que no haya espacios antes o después de los valores

### "Failed to fetch"
- Verifica que la URL sea correcta (debe incluir `https://`)
- Verifica que tu proyecto de Supabase esté activo

### "Table does not exist"
- Ejecuta el script SQL: `scripts/001_create_accounting_tables.sql`
- Ve a Supabase → SQL Editor → Nueva query → Pega el contenido → Ejecuta

