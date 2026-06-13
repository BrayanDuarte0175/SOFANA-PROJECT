import type { Metadata } from "next";
import { getSpaceContext } from "@/lib/space";
import { createClient } from "@/lib/supabase/server";
import { signPath } from "@/lib/storage";
import { PageHeader } from "@/components/app/page-header";
import { ProfileForm } from "./profile-form";
import { AccountSecurity } from "./account-security";

export const metadata: Metadata = { title: "Perfil" };

export default async function PerfilPage() {
  const { me, partner, space } = await getSpaceContext();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [myAvatar, partnerAvatar] = await Promise.all([
    signPath("avatars", me.avatar_url),
    signPath("avatars", partner?.avatar_url),
  ]);

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Perfil"
        subtitle="Tu ficha de jugador/a en este match."
      />
      <div className="flex flex-col gap-6">
        <ProfileForm
          me={me}
          myAvatarUrl={myAvatar}
          partner={partner}
          partnerAvatarUrl={partnerAvatar}
          spaceName={space.name}
        />
        <AccountSecurity currentEmail={user?.email ?? ""} />
      </div>
    </div>
  );
}
