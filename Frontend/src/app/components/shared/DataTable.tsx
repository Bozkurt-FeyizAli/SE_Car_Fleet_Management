import React, { useState, useMemo } from "react";
import { Search, Plus, Pencil, Trash2, Eye } from "lucide-react";
import { Button } from "../ui/button";

export interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  onAdd?: () => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onView?: (item: T) => void;
  customActions?: (item: T) => React.ReactNode;
  addLabel?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchPlaceholder = "Ara...",
  searchKeys = [],
  onAdd,
  onEdit,
  onDelete,
  onView,
  customActions,
  addLabel = "Yeni Ekle",
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim() || searchKeys.length === 0) return data;
    const q = search.toLowerCase();
    return data.filter((item) =>
      searchKeys.some((key) => {
        const val = item[key];
        return val && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, searchKeys]);

  const hasActions = onEdit || onDelete || onView || customActions;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-input-background text-sm"
          />
        </div>
        {onAdd && (
          <Button onClick={onAdd} size="sm" className="shrink-0">
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline sm:inline">{addLabel}</span>
            <span className="xs:hidden sm:hidden">Ekle</span>
          </Button>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm rounded-lg border border-border">
            Kayit bulunamadi
          </div>
        ) : (
          filtered.map((item, idx) => (
            <div
              key={item.id ?? idx}
              className="rounded-lg border border-border bg-card p-3 space-y-2"
            >
              {columns.map((col) => (
                <div key={col.key} className="flex items-start justify-between gap-2">
                  <span className="text-xs text-muted-foreground shrink-0 min-w-[70px] pt-0.5">
                    {col.header}
                  </span>
                  <div className="text-sm text-right flex-1 min-w-0">{col.render(item)}</div>
                </div>
              ))}
              {hasActions && (
                <div className="flex items-center justify-end gap-1 pt-2 border-t border-border">
                  {customActions && customActions(item)}
                  {onView && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(item)}
                      className="h-8 px-2 text-xs gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Goruntule
                    </Button>
                  )}
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(item)}
                      className="h-8 px-2 text-xs gap-1"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Duzenle
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(item)}
                      className="h-8 px-2 text-xs gap-1 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Sil
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto rounded-lg border border-border">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-left text-xs text-muted-foreground whitespace-nowrap">
                  {col.header}
                </th>
              ))}
              {hasActions && (
                <th className="px-4 py-3 text-right text-xs text-muted-foreground">Islemler</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (hasActions ? 1 : 0)} className="px-4 py-8 text-center text-muted-foreground text-sm">
                  Kayit bulunamadi
                </td>
              </tr>
            ) : (
              filtered.map((item, idx) => (
                <tr key={item.id ?? idx} className="hover:bg-muted/30 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-sm whitespace-nowrap">
                      {col.render(item)}
                    </td>
                  ))}
                  {hasActions && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {customActions && customActions(item)}
                        {onView && (
                          <Button variant="ghost" size="icon" onClick={() => onView(item)} className="h-7 w-7">
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {onEdit && (
                          <Button variant="ghost" size="icon" onClick={() => onEdit(item)} className="h-7 w-7">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button variant="ghost" size="icon" onClick={() => onDelete(item)} className="h-7 w-7 text-destructive hover:text-destructive">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-muted-foreground">
        Toplam {filtered.length} kayit
      </div>
    </div>
  );
}