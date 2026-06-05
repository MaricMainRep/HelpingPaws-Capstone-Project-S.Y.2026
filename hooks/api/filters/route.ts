import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoryKey = searchParams.get('category');
    const includeInactive = searchParams.get('include_inactive') === 'true';

    if (categoryKey) {
      // Get specific category with its options
      const { data: category, error: categoryError } = await supabase
        .from('filter_categories')
        .select('*')
        .eq('key', categoryKey)
        .single();

      if (categoryError) {
        return NextResponse.json({ error: categoryError.message }, { status: 404 });
      }

      let query = supabase
        .from('filter_options')
        .select('*')
        .eq('category_id', category.id)
        .order('sort_order', { ascending: true });

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data: options, error: optionsError } = await query;

      if (optionsError) {
        return NextResponse.json({ error: optionsError.message }, { status: 400 });
      }

      return NextResponse.json({ category, options });
    }

    // Get all categories with their options
    let categoriesQuery = supabase
      .from('filter_categories')
      .select('*')
      .order('label', { ascending: true });

    if (!includeInactive) {
      categoriesQuery = categoriesQuery.eq('is_active', true);
    }

    const { data: categories, error: categoriesError } = await categoriesQuery;

    if (categoriesError) {
      return NextResponse.json({ error: categoriesError.message }, { status: 400 });
    }

    // Get all options for these categories
    const categoryIds = categories?.map((c) => c.id) || [];
    
    let optionsQuery = supabase
      .from('filter_options')
      .select('*')
      .in('category_id', categoryIds)
      .order('sort_order', { ascending: true });

    if (!includeInactive) {
      optionsQuery = optionsQuery.eq('is_active', true);
    }

    const { data: allOptions, error: optionsError } = await optionsQuery;

    if (optionsError) {
      return NextResponse.json({ error: optionsError.message }, { status: 400 });
    }

    // Group options by category
    const categoriesWithOptions = categories?.map((cat) => ({
      ...cat,
      options: allOptions?.filter((opt) => opt.category_id === cat.id) || [],
    }));

    return NextResponse.json({ categories: categoriesWithOptions });
  } catch (error) {
    console.error('Error fetching filters:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, key, label, description, value, category_id, sort_order } = body;

    if (action === 'create_category') {
      const { data, error } = await supabase
        .from('filter_categories')
        .insert({ key, label, description })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ category: data });
    }

    if (action === 'create_option') {
      const { data, error } = await supabase
        .from('filter_options')
        .insert({ category_id, value, label, sort_order: sort_order || 0 })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ option: data });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error creating filter:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, type, ...updates } = body;

    if (type === 'category') {
      const { data, error } = await supabase
        .from('filter_categories')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ category: data });
    }

    if (type === 'option') {
      const { data, error } = await supabase
        .from('filter_options')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ option: data });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Error updating filter:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const type = searchParams.get('type');

    if (!id || !type) {
      return NextResponse.json({ error: 'ID and type required' }, { status: 400 });
    }

    if (type === 'category') {
      const { error } = await supabase
        .from('filter_categories')
        .delete()
        .eq('id', id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    if (type === 'option') {
      const { error } = await supabase
        .from('filter_options')
        .delete()
        .eq('id', id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Error deleting filter:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
