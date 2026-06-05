'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { PageHeader } from '@/components/admin/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useFilters } from '@/hooks/useAPI';
import { toast } from '@/lib/toast';
import { Filter, Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import type { FilterCategory, FilterOption } from '@/lib/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function FiltersPage() {
  const { categories, isLoading, mutate } = useFilters();
  const [openCategory, setOpenCategory] = useState(false);
  const [openOption, setOpenOption] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FilterCategory | null>(null);
  const [editingOption, setEditingOption] = useState<FilterOption | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<FilterCategory | null>(null);
  const [optionToDelete, setOptionToDelete] = useState<FilterOption | null>(null);
  
  const [categoryKey, setCategoryKey] = useState('');
  const [categoryLabel, setCategoryLabel] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [optionValue, setOptionValue] = useState('');
  const [optionLabel, setOptionLabel] = useState('');
  const [optionSortOrder, setOptionSortOrder] = useState(0);

  const resetCategoryForm = () => {
    setCategoryKey('');
    setCategoryLabel('');
    setCategoryDescription('');
    setEditingCategory(null);
  };

  const resetOptionForm = () => {
    setOptionValue('');
    setOptionLabel('');
    setOptionSortOrder(0);
    setEditingOption(null);
  };

  const handleSaveCategory = async () => {
    try {
      const url = `${API_URL}/api/filters/`;
      const method = editingCategory ? 'PATCH' : 'POST';
      const body = editingCategory
        ? { type: 'category', id: editingCategory.id, label: categoryLabel, description: categoryDescription }
        : { action: 'create_category', key: categoryKey, label: categoryLabel, description: categoryDescription };
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(body),
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to save category');
      
      mutate();
      setOpenCategory(false);
      resetCategoryForm();
      toast.success(editingCategory ? 'Category updated' : 'Category created');
    } catch (error) {
      toast.error('Failed to save category');
    }
  };

  const handleSaveOption = async () => {
    try {
      const url = `${API_URL}/api/filters/`;
      const method = editingOption ? 'PATCH' : 'POST';
      const body = editingOption
        ? { type: 'option', id: editingOption.id, label: optionLabel, sort_order: optionSortOrder, value: optionValue }
        : { action: 'create_option', category_id: selectedCategory?.id, value: optionValue, label: optionLabel, sort_order: optionSortOrder };
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(body),
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to save option');
      
      mutate();
      setOpenOption(false);
      resetOptionForm();
      toast.success(editingOption ? 'Option updated' : 'Option created');
    } catch (error) {
      toast.error('Failed to save option');
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    try {
      const res = await fetch(`${API_URL}/api/filters/?id=${categoryToDelete.id}&type=category`, { 
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete');
      mutate();
      setCategoryToDelete(null);
      toast.success('Category deleted');
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  const handleDeleteOption = async () => {
    if (!optionToDelete) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    try {
      const res = await fetch(`${API_URL}/api/filters/?id=${optionToDelete.id}&type=option`, { 
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete');
      mutate();
      setOptionToDelete(null);
      toast.success('Option deleted');
    } catch (error) {
      toast.error('Failed to delete option');
    }
  };

  const openEditCategory = (category: FilterCategory) => {
    setEditingCategory(category);
    setCategoryLabel(category.label);
    setCategoryDescription(category.description || '');
    setOpenCategory(true);
  };

  const openAddOption = (category: FilterCategory) => {
    setSelectedCategory(category);
    resetOptionForm();
    setOpenOption(true);
  };

  const openEditOption = (option: FilterOption) => {
    setEditingOption(option);
    setOptionValue(option.value);
    setOptionLabel(option.label);
    setOptionSortOrder(option.sort_order);
    setOpenOption(true);
  };

  if (isLoading) {
    return (
      <Sidebar>
        <PageHeader title="Filter Management" description="Manage dynamic filter options" />
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </Card>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <PageHeader 
        title="Filter Management" 
        description="Manage dynamic filter options for tables"
        action={
          <Dialog open={openCategory} onOpenChange={(open) => { setOpenCategory(open); if (!open) resetCategoryForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Filter Category'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {!editingCategory && (
                  <FieldGroup>
                    <FieldLabel>Key (unique identifier)</FieldLabel>
                    <Input
                      value={categoryKey}
                      onChange={(e) => setCategoryKey(e.target.value)}
                      placeholder="e.g., user_role"
                    />
                  </FieldGroup>
                )}
                <FieldGroup>
                  <FieldLabel>Label (display name)</FieldLabel>
                  <Input
                    value={categoryLabel}
                    onChange={(e) => setCategoryLabel(e.target.value)}
                    placeholder="e.g., User Role"
                  />
                </FieldGroup>
                <FieldGroup>
                  <FieldLabel>Description</FieldLabel>
                  <Input
                    value={categoryDescription}
                    onChange={(e) => setCategoryDescription(e.target.value)}
                    placeholder="Optional description"
                  />
                </FieldGroup>
                <Button onClick={handleSaveCategory} className="w-full">
                  {editingCategory ? 'Update' : 'Create'} Category
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="space-y-6">
        {categories.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Filter className="h-8 w-8 text-primary" />
            </div>
            <p className="text-muted-foreground">No filter categories yet</p>
            <p className="text-sm text-muted-foreground mt-2">Create a category to start adding filter options</p>
          </Card>
        ) : (
          categories.map((category: FilterCategory) => (
            <Card key={category.id} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{category.label}</h3>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">Key: {category.key}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openAddOption(category)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Option
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEditCategory(category)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setCategoryToDelete(category)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              
              {category.filter_options && category.filter_options.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium">Sort</th>
                        <th className="text-left p-3 text-sm font-medium">Value</th>
                        <th className="text-left p-3 text-sm font-medium">Label</th>
                        <th className="text-right p-3 text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {category.filter_options.map((option: FilterOption) => (
                        <tr key={option.id} className="border-t">
                          <td className="p-3">
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                          </td>
                          <td className="p-3 font-mono text-sm">{option.value}</td>
                          <td className="p-3">{option.label}</td>
                          <td className="p-3 text-right">
                            <Button variant="ghost" size="icon" onClick={() => openEditOption(option)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setOptionToDelete(option)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No options yet</p>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Edit/Add Option Dialog */}
      <Dialog open={openOption} onOpenChange={(open) => { setOpenOption(open); if (!open) resetOptionForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingOption ? 'Edit Option' : 'Add Filter Option'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editingOption && (
              <FieldGroup>
                <FieldLabel>Value (stored in DB)</FieldLabel>
                <Input
                  value={optionValue}
                  onChange={(e) => setOptionValue(e.target.value)}
                  placeholder="e.g., ADMIN"
                />
              </FieldGroup>
            )}
            <FieldGroup>
              <FieldLabel>Label (display name)</FieldLabel>
              <Input
                value={optionLabel}
                onChange={(e) => setOptionLabel(e.target.value)}
                placeholder="e.g., Admin"
              />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Sort Order</FieldLabel>
              <Input
                type="number"
                value={optionSortOrder}
                onChange={(e) => setOptionSortOrder(parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </FieldGroup>
            <Button onClick={handleSaveOption} className="w-full">
              {editingOption ? 'Update' : 'Create'} Option
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation */}
      <ConfirmDialog
        open={!!categoryToDelete}
        title="Delete Category"
        description={`Are you sure you want to delete "${categoryToDelete?.label}"? All options under this category will also be deleted.`}
        actionLabel="Delete"
        onConfirm={handleDeleteCategory}
        onCancel={() => setCategoryToDelete(null)}
        variant="destructive"
      />

      {/* Delete Option Confirmation */}
      <ConfirmDialog
        open={!!optionToDelete}
        title="Delete Option"
        description={`Are you sure you want to delete "${optionToDelete?.label}"?`}
        actionLabel="Delete"
        onConfirm={handleDeleteOption}
        onCancel={() => setOptionToDelete(null)}
        variant="destructive"
      />
    </Sidebar>
  );
}
