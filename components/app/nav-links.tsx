"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Trophy,
  Sparkles,
  MessagesSquare,
  Medal,
  CalendarHeart,
  Plane,
  Music,
  Lock,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { href: "/pista", label: "Pista", icon: LayoutDashboard },
  { href: "/torneos", label: "Torneos", icon: Trophy },
  { href: "/highlights", label: "Highlights", icon: Sparkles },
  { href: "/rallies", label: "Rallies", icon: MessagesSquare },
  { href: "/match-points", label: "Match Points", icon: Medal },
  { href: "/citas", label: "Citas", icon: CalendarHeart },
  { href: "/tour", label: "El Tour", icon: Plane },
  { href: "/playlist", label: "Playlist", icon: Music },
  { href: "/vault", label: "El Vault", icon: Lock },
] as const;

// En móvil: estos van fijos en la barra; el resto, en el menú "Más".
const MOBILE_PRIMARY = NAV_ITEMS.slice(0, 3);
const MOBILE_MORE = NAV_ITEMS.slice(3);

/** Links de navegación de escritorio (header). */
export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Secciones"
      className="no-scrollbar hidden items-center gap-1 overflow-x-auto md:flex"
    >
      {NAV_ITEMS.map(({ href, label }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-sm transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Barra inferior móvil: 3 secciones principales + un menú "Más" con
 * el resto (con sus iconos), como en la mayoría de apps móviles.
 */
export function MobileNav() {
  const pathname = usePathname();
  const moreActive = MOBILE_MORE.some((i) => pathname.startsWith(i.href));

  return (
    <nav
      aria-label="Secciones"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur md:hidden"
    >
      <ul className="flex justify-around">
        {MOBILE_PRIMARY.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex w-16 flex-col items-center gap-0.5 px-1 py-2 text-[10px]",
                  active ? "text-primary dark:text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
        <li>
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "flex w-16 flex-col items-center gap-0.5 px-1 py-2 text-[10px] outline-none",
                moreActive ? "text-primary dark:text-primary" : "text-muted-foreground",
              )}
            >
              <MoreHorizontal className="size-5" aria-hidden />
              Más
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              side="top"
              sideOffset={8}
              className="mb-1 w-48"
            >
              {MOBILE_MORE.map(({ href, label, icon: Icon }) => (
                <DropdownMenuItem key={href} asChild>
                  <Link href={href}>
                    <Icon className="size-4" aria-hidden />
                    {label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </li>
      </ul>
    </nav>
  );
}
