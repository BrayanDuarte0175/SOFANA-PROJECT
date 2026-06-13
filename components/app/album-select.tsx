"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const NONE = "__none__";

export interface AlbumOption {
  id: string;
  title: string;
}

/** Selector de álbum con opción "Sin álbum". Devuelve null si no hay. */
export function AlbumSelect({
  id = "album",
  albums,
  value,
  onChange,
  label = "Álbum",
}: {
  id?: string;
  albums: AlbumOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  label?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value ?? NONE}
        onValueChange={(v) => onChange(v === NONE ? null : v)}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>Sin álbum</SelectItem>
          {albums.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
