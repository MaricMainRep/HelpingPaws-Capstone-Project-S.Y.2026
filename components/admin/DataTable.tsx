'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, Search, Users, X, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: string;
  label: string;
  render?: (value: any, item: T) => React.ReactNode;
  sortable?: boolean;
}

export interface FilterOption {
  key: string;
  label: string;
  options?: { value: string; label: string }[];
  inputType?: 'date' | 'text' | 'number';
  inputValue?: string;
  onInputChange?: (value: string) => void;
}

interface DataTableProps<T extends { id?: number }> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  loading?: boolean;
  actions?: (item: T) => React.ReactNode;
  searchable?: boolean;
  searchKeys?: string[];
  filters?: FilterOption[];
}

export function DataTable<T extends { id?: number }>({
  data,
  columns,
  onRowClick,
  loading = false,
  actions,
  searchable = true,
  searchKeys,
  filters = [],
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const itemsPerPage = 10;

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const aVal = (a as any)[sortKey];
      const bVal = (b as any)[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDir === 'asc' ? 1 : -1;
      if (bVal == null) return sortDir === 'asc' ? -1 : 1;
      if (typeof aVal === 'boolean' || typeof bVal === 'boolean') {
        const aBool = aVal ? 1 : 0;
        const bBool = bVal ? 1 : 0;
        return sortDir === 'asc' ? aBool - bBool : bBool - aBool;
      }
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      if (aStr < bStr) return sortDir === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortDir]);

  const filteredData = useMemo(() => {
    let result = sortedData;
    
    if (Object.keys(activeFilters).length > 0) {
      result = result.filter((item) => {
        return Object.entries(activeFilters).every(([key, value]) => {
          if (!value) return true;
          const itemValue = (item as any)[key];
          if (itemValue === null || itemValue === undefined) {
            return value.toLowerCase() === 'true';
          }
          const strVal = String(itemValue).toLowerCase();
          const filterVal = value.toLowerCase();
          return strVal === filterVal || (filterVal === 'true' && itemValue === true) || (filterVal === 'false' && itemValue === false);
        });
      });
    }
    
    if (!search.trim()) return result;
    
    const searchLower = search.toLowerCase();
    
    return result.filter((item) => {
      const keysToSearch = searchKeys || columns.map(col => col.key);
      
      return keysToSearch.some((key) => {
        let value: any;
        
        if (key.includes('.')) {
          const keys = key.split('.');
          value = keys.reduce((obj: any, k: string) => {
            if (obj === undefined || obj === null) return undefined;
            if (Array.isArray(obj)) {
              return obj[0]?.[k];
            }
            return obj?.[k];
          }, item);
        } else {
          value = (item as any)[key];
        }
        
        if (value === undefined || value === null) return false;
        
        const stringValue = String(value).toLowerCase();
        return stringValue.includes(searchLower);
      });
    });
  }, [data, search, columns, searchKeys, activeFilters, sortedData]);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleFilterChange = (key: string, value: string) => {
    setActiveFilters((prev) => {
      if (value) {
        return { ...prev, [key]: value };
      } else {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
    });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setActiveFilters({});
    setSearch('');
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  const hasActiveFilters = Object.keys(activeFilters).length > 0 || search.trim();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="relative">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {columns.map((col) => (
                  <TableHead key={String(col.key)} className="font-semibold text-center">
                    {col.label}
                  </TableHead>
                ))}
                {actions && <TableHead className="text-center w-[200px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, idx) => (
                <TableRow key={idx}>
                  {columns.map((col) => (
                    <TableCell key={String(col.key)}>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell className="text-center whitespace-nowrap w-[200px]">
                      <div className="flex justify-center gap-2">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-20" />
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      {(filters.length > 0 || searchable) && (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
          {searchable && (
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
          )}
          {filters.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-end">
              {filters.map((filter) => {
                if (filter.inputType) {
                  return (
                    <input
                      key={filter.key}
                      type={filter.inputType}
                      value={filter.inputValue || ''}
                      onChange={(e) => filter.onInputChange?.(e.target.value)}
                      placeholder={filter.label}
                      className="h-10 rounded-md border border-border bg-background px-3 py-2 text-sm min-w-[120px]"
                    />
                  );
                }
                return (
                  <select
                    key={filter.key}
                    value={activeFilters[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    className="h-10 rounded-md border border-border bg-background px-2 sm:px-3 py-2 text-sm min-w-[120px] sm:min-w-[140px]"
                  >
                    <option value="">{filter.label}</option>
                    {(filter.options || []).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                );
              })}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {paginatedData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground">No data found</p>
          </div>
        ) : (
          paginatedData.map((item) => (
            <div
              key={item.id}
              className={cn(
                'bg-card border border-border rounded-lg p-4',
                onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''
              )}
              onClick={() => onRowClick?.(item)}
            >
              <div className="space-y-3">
                {columns.map((col) => (
                  <div key={String(col.key)} className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{col.label}</span>
                    <span className="text-sm font-medium text-foreground text-right">
                      {col.render
                        ? col.render((item as any)[col.key], item)
                        : String((item as any)[col.key] || '-')}
                    </span>
                  </div>
                ))}
                {actions && (
                  <div className="flex justify-end gap-2 pt-2 border-t border-border">
                    {actions(item)}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                return (
                  <TableHead
                    key={String(col.key)}
                    className={cn(
                      'font-semibold text-center',
                      col.sortable !== false ? 'cursor-pointer select-none hover:bg-muted/70 transition-colors' : '',
                      isSorted ? 'text-primary' : ''
                    )}
                    onClick={col.sortable !== false ? () => handleSort(col.key) : undefined}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {col.label}
                      {col.sortable !== false && (
                        isSorted
                          ? sortDir === 'asc'
                            ? <ArrowUp className="h-3 w-3" />
                            : <ArrowDown className="h-3 w-3" />
                          : <ArrowUpDown className="h-3 w-3 opacity-40" />
                      )}
                    </div>
                  </TableHead>
                );
              })}
              {actions && <TableHead className="text-center w-[200px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="text-center py-8 text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-8 w-8 text-muted-foreground/50" />
                    <p>No data found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item) => (
                <TableRow
                  key={item.id}
                  className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((col) => (
                    <TableCell key={String(col.key)} className="text-center">
                      {col.render
                        ? col.render((item as any)[col.key], item)
                        : String((item as any)[col.key] || '-')}
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell className="text-center whitespace-nowrap w-[200px]">
                      {actions(item)}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground text-center sm:text-left">
            Page {currentPage} of {totalPages} ({filteredData.length} total)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
