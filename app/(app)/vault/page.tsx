import type { Metadata } from "next";
import { Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSpaceContext } from "@/lib/space";
import { signPaths } from "@/lib/storage";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/tennis/empty-state";
import { StaggerList, StaggerItem } from "@/components/motion/fade-in";
import { ReactionsBar } from "@/components/app/reactions-bar";
import { VaultUploadDialog } from "./vault-upload";
import { VaultItemActions } from "./vault-item-actions";

export const metadata: Metadata = { title: "El Vault" };

export default async function VaultPage() {
  const { space, userId } = await getSpaceContext();
  const supabase = await createClient();

  const { data: media } = await supabase
    .from("vault_media")
    .select("*")
    .eq("space_id", space.id)
    .order("created_at", { ascending: false });

  const { data: reactions } = await supabase
    .from("reactions")
    .select("*")
    .eq("space_id", space.id)
    .eq("target_type", "vault_media");

  const signed = await signPaths(
    "vault",
    (media ?? []).map((m) => m.storage_path),
  );

  return (
    <div>
      <PageHeader
        title="El Vault"
        subtitle="La bóveda privada: solo ustedes dos tienen la llave."
        action={<VaultUploadDialog spaceId={space.id} />}
      />

      <p className="mb-6 flex items-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm text-secondary-foreground">
        <Lock className="size-4 shrink-0" aria-hidden />
        Todo lo de aquí vive en un almacenamiento privado y se sirve con
        enlaces firmados que caducan en minutos. Nada es accesible por URL
        pública.
      </p>

      {!media || media.length === 0 ? (
        <EmptyState
          title="La bóveda está vacía"
          hint="Sube las fotos y videos que son solo para ustedes."
        />
      ) : (
        <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {media.map((item) => {
            const url = signed.get(item.storage_path);
            const itemReactions = (reactions ?? []).filter(
              (r) => r.target_id === item.id,
            );
            return (
              <StaggerItem key={item.id}>
                <figure className="group overflow-hidden rounded-2xl border bg-card">
                  <div className="relative">
                    {url ? (
                      item.media_type === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={url}
                          alt={item.caption ?? ""}
                          loading="lazy"
                          className="aspect-square w-full object-cover"
                        />
                      ) : (
                        <video
                          src={url}
                          controls
                          preload="metadata"
                          className="aspect-square w-full bg-black object-contain"
                        />
                      )
                    ) : (
                      <div className="flex aspect-square items-center justify-center text-sm text-muted-foreground">
                        No disponible
                      </div>
                    )}
                    <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                      <VaultItemActions item={item} />
                    </div>
                  </div>
                  <figcaption className="flex flex-col gap-2 p-3">
                    {item.caption ? (
                      <p className="text-sm">{item.caption}</p>
                    ) : null}
                    <ReactionsBar
                      targetType="vault_media"
                      targetId={item.id}
                      reactions={itemReactions}
                      userId={userId}
                    />
                  </figcaption>
                </figure>
              </StaggerItem>
            );
          })}
        </StaggerList>
      )}
    </div>
  );
}
