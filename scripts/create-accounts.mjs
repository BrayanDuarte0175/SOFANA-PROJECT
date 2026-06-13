// ============================================================
// SOFANA — Crea las dos cuentas de la pareja.
// Uso:
//   node scripts/create-accounts.mjs tu@email.com TuPassword ella@email.com SuPassword
//
// Requiere .env.local con NEXT_PUBLIC_SUPABASE_URL y
// SUPABASE_SERVICE_ROLE_KEY (solo se usa aquí, nunca en la app).
// El registro público queda deshabilitado en Supabase, así que
// este script (o el dashboard) es la única vía de alta.
// ============================================================

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

function loadEnvLocal() {
  try {
    const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {
    // .env.local no existe; se asume que las vars ya están en el entorno.
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const [emailA, passA, emailB, passB] = process.argv.slice(2);
if (!emailA || !passA || !emailB || !passB) {
  console.error("Uso: node scripts/create-accounts.mjs <emailA> <passA> <emailB> <passB>");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

for (const [email, password] of [
  [emailA, passA],
  [emailB, passB],
]) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    console.error(`✗ ${email}: ${error.message}`);
  } else {
    console.log(`✓ Cuenta creada: ${email} (${data.user.id})`);
  }
}

console.log("\nListo. Inicia sesión primero tú (se crea El Match) y luego ella (reclama su lugar).");
