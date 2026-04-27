import type { PagedResult } from "@/core/api/types";

type PagedResultDto<T> = {
  items?: T[] | null;
  pageIndex?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
};

export function toNullableTrimmed(value: string | null | undefined) {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : null;
}

export function mapPagedResultDto<TDto, TModel>(
  dto: PagedResultDto<TDto>,
  mapItem: (item: TDto) => TModel,
): PagedResult<TModel> {
  return {
    items: (dto.items ?? []).map(mapItem),
    pageIndex: dto.pageIndex ?? 0,
    pageSize: dto.pageSize ?? 0,
    totalCount: dto.totalCount ?? 0,
    totalPages: dto.totalPages ?? 0,
    hasPreviousPage: dto.hasPreviousPage ?? false,
    hasNextPage: dto.hasNextPage ?? false,
  };
}
