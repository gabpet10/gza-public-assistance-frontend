type Primitive = string | number | boolean | null | undefined;
type PrimitiveOrArray = Primitive | Primitive[];

export function buildQueryString(parameters: Record<string, PrimitiveOrArray>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(parameters)) {
    if (Array.isArray(value)) {
      const filtered = value.filter(
        (item) => item !== undefined && item !== null && item !== "",
      );

      if (filtered.length === 0) {
        continue;
      }

      filtered.forEach((item) => {
        searchParams.append(key, String(item));
      });
      continue;
    }

    if (value === undefined || value === null || value === "") {
      continue;
    }

    searchParams.set(key, String(value));
  }

  const rendered = searchParams.toString();
  return rendered ? `?${rendered}` : "";
}
