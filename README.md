# SOFANA 🎾

App web privada para dos. Recuerdos (Highlights), preguntas y respuestas
(Rallies), promesas (Match Points), citas (Próximos partidos), viajes
(El Tour) y una bóveda privada de fotos y videos (El Vault). Todo con
estética de tenis y control total y simétrico para ambos.

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS v4 ·
shadcn/ui · Framer Motion · Supabase (Postgres + Auth + Storage).

---

## 1. Puesta en marcha local

```bash
npm install
cp .env.example .env.local   # y completa los valores (ver abajo)
npm run dev                  # http://localhost:3000
```

### Variables de entorno (`.env.local`)

| Variable | Dónde encontrarla | Notas |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | Pública |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | Pública; el RLS protege los datos |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API | **Solo server-side.** Únicamente la usa `scripts/create-accounts.mjs`. Jamás con prefijo `NEXT_PUBLIC_` |

## 2. Configurar Supabase (una sola vez)

### 2.1 Aplicar las migraciones

En el dashboard de Supabase → **SQL Editor**, pega y ejecuta EN ORDEN
el contenido de:

1. `supabase/migrations/0001_initial_schema.sql` — tablas e índices.
2. `supabase/migrations/0002_rls_policies.sql` — Row Level Security
   (cada política lleva un comentario que explica qué hace).
3. `supabase/migrations/0003_storage.sql` — buckets **privados**
   (`memories`, `vault`, `avatars`) y sus políticas.
4. `supabase/migrations/0004_music.sql` — La Playlist: tabla `songs`
   (enlaces de Spotify/YouTube o audios subidos) y bucket privado
   `music`.
5. `supabase/migrations/0005_pairing_function.sql` — emparejamiento
   confiable (`join_or_create_space`).
6. `supabase/migrations/0006_events.sql` — Torneos: tablas `events`
   y `event_days` con jornadas, sorpresas selladas e importancia.
7. `supabase/migrations/0007_event_days_author_only.sql` — solo el
   autor de una jornada puede editarla o borrarla.
8. `supabase/migrations/0008_events_shared_and_details.sql` — torneos
   compartidos (`is_shared`) y detalles por jornada (`details`).
9. `supabase/migrations/0009_albums.sql` — álbumes de Highlights y
   enlace opcional de cada viaje del Tour a un álbum.
10. `supabase/migrations/0010_notifications.sql` — notificaciones.
11. `supabase/migrations/0011_rallies_rules.sql` — borrar rally solo
    el autor + contador de ediciones de respuesta.
12. `supabase/migrations/0012_realtime.sql` — publica las tablas en
    Realtime (cambios al instante).

> Alternativa con CLI: `npx supabase link --project-ref <ref>` y
> `npx supabase db push`.

### 2.2 Deshabilitar el registro público

Dashboard → **Authentication → Sign In / Up** → desactiva
**"Allow new users to sign up"**. Así nadie más puede crear cuentas.

### 2.3 Crear las dos cuentas

Opción A — script (recomendada):

```bash
node scripts/create-accounts.mjs tu@email.com TuPassword ella@email.com SuPassword
```

Opción B — manual: Dashboard → **Authentication → Users → Add user**
(marca *Auto Confirm User*), una vez por cada cuenta.

### 2.4 El emparejamiento es automático

1. Inicia sesión tú primero: se crea el space ("El Match").
2. Cuando ella inicie sesión por primera vez, ocupa el lugar libre
   automáticamente. Desde ahí, ambos ven y administran lo mismo.

## 3. Seguridad (resumen)

- **RLS en todas las tablas**: solo los dos miembros del space leen o
  escriben sus filas; cualquier otra persona (incluso autenticada, si
  existiera) no ve nada.
- **Storage 100 % privado**: los buckets no son públicos; las fotos y
  videos se sirven con *signed URLs* generadas en el servidor que
  caducan a los 10 minutos. Las políticas de storage solo permiten
  acceder a archivos dentro de la carpeta del propio space.
- **Subidas validadas**: tipo MIME y tamaño se validan en el cliente y
  además el bucket los rechaza en el servidor (50 MB máx., solo
  imágenes/video).
- **Sin registro público** + emparejamiento protegido por trigger SQL.
- **La service role key nunca toca el cliente**: la app funciona solo
  con la anon key + RLS; la service key solo la usa el script de
  creación de cuentas.
- **Rutas privadas con `noindex`** y bloqueadas en `robots.txt`; el
  middleware exige sesión en todo lo que no sea landing o login.

## 4. Despliegue en Vercel

1. Sube el repo a GitHub y conéctalo en [vercel.com](https://vercel.com).
2. En **Project → Settings → Environment Variables** añade
   `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   (no necesitas la service key en Vercel).
3. Deploy. Listo: misma base de datos, mismas cuentas.

### Recuperación de contraseña / cambio de correo

En Supabase → **Authentication → URL Configuration** pon tu **Site URL**
(en local `http://localhost:3000`, en producción tu dominio de Vercel) y
agrega a **Redirect URLs** la ruta `…/auth/callback`. Los enlaces de
recuperación y de confirmación de correo usan esa ruta. El envío de
correos usa el SMTP integrado de Supabase (limitado); para producción
conviene configurar un SMTP propio en **Authentication → Emails**.

## 5. Estructura

```
app/
  page.tsx            # Landing pública
  login/              # Acceso
  (app)/              # Zona privada (noindex)
    pista/            # Dashboard "Pista Central" (con hero del torneo activo)
    torneos/          # Torneos: eventos multi-día con jornadas personalizables
    highlights/       # Recuerdos con fotos/videos + álbumes
    rallies/          # Preguntas y respuestas
    match-points/     # Promesas
    citas/            # Agenda de citas
    tour/             # Viajes con checklist
    playlist/         # La Playlist: música (Spotify/YouTube o audio subido)
    vault/            # Bóveda privada
    perfil/           # Nombre, avatar y nombre del match
components/           # UI (shadcn) + componentes temáticos de tenis
lib/                  # Clientes Supabase, actions, helpers
supabase/migrations/  # SQL versionado (esquema + RLS + storage)
scripts/              # create-accounts.mjs
```
# SOFANA-PROJECT
