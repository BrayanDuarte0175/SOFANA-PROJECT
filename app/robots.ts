import type { MetadataRoute } from "next";

// Solo la landing es indexable; todo lo privado queda fuera.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/$",
        disallow: [
          "/pista",
          "/torneos",
          "/highlights",
          "/rallies",
          "/match-points",
          "/citas",
          "/tour",
          "/playlist",
          "/vault",
          "/perfil",
          "/login",
        ],
      },
    ],
  };
}
