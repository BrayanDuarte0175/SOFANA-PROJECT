import type { Metadata } from "next";
import Link from "next/link";
import { getSpaceContext } from "@/lib/space";
import { createClient } from "@/lib/supabase/server";
import { signPath } from "@/lib/storage";
import { NavLinks, MobileNav } from "@/components/app/nav-links";
import { UserMenu } from "@/components/app/user-menu";
import { NotificationsBell } from "@/components/app/notifications-bell";
import { RealtimeRefresh } from "@/components/app/realtime-refresh";
import { TennisBall } from "@/components/tennis/tennis-ball";

// Las rutas privadas jamás se indexan.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { me, space, userId } = await getSpaceContext();
  const supabase = await createClient();
  const [avatarUrl, { data: notifications }] = await Promise.all([
    signPath("avatars", me.avatar_url),
    supabase
      .from("notifications")
      .select("*")
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <RealtimeRefresh spaceId={space.id} />
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4">
          <Link
            href="/pista"
            className="flex items-center gap-2 font-display text-xl tracking-tight"
          >
            <TennisBall className="size-6" />
            SOFANA
          </Link>
          <NavLinks />
          <div className="flex items-center gap-1">
            <NotificationsBell userId={userId} initial={notifications ?? []} />
            <UserMenu name={me.display_name} avatarUrl={avatarUrl} />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-6 md:pb-10">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
