import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

// Server-only client using the service role key — bypasses RLS so admin
// moderation (viewing pending reviews, approve/reject/delete) actually works.
// The anon key can only ever see status='approved' rows by RLS design, which
// is exactly why pending reviews never reached the admin panel before this.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// In-memory fallback if neither reviews table nor site_content is ready
let memoryReviews = [];

async function getStoredReviews(useAdminClient = false) {
  try {
    // 1. Try dedicated reviews table
    const client = useAdminClient ? supabaseAdmin : supabase;
    const { data, error } = await client
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      return { reviews: data, source: 'table' };
    }
  } catch (e) {
    // ignore and try site_content
  }

  try {
    // 2. Try site_content JSON table
    const { data, error } = await supabase
      .from('site_content')
      .select('value')
      .eq('key', 'product_reviews')
      .maybeSingle();

    if (!error && data?.value && Array.isArray(data.value)) {
      return { reviews: data.value, source: 'site_content' };
    }
  } catch (e) {
    // fallback
  }

  return { reviews: memoryReviews, source: 'memory' };
}

async function saveReviewsFallback(reviewsList) {
  memoryReviews = reviewsList;
  try {
    await supabase.from('site_content').upsert({
      key: 'product_reviews',
      value: reviewsList,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error('Failed to save to site_content fallback', e);
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const slug = searchParams.get('slug');
    const status = searchParams.get('status');
    const isAdmin = searchParams.get('admin') === 'true';

    const { reviews } = await getStoredReviews(isAdmin);

    let filtered = [...reviews];

    if (!isAdmin) {
      // Non-admins only see approved reviews
      filtered = filtered.filter((r) => r.status === 'approved');
    } else if (status && status !== 'all') {
      filtered = filtered.filter((r) => r.status === status);
    }

    if (productId || slug) {
      filtered = filtered.filter(
        (r) =>
          (productId && r.product_id === productId) ||
          (slug && (r.product_slug === slug || r.slug === slug))
      );
    }

    return NextResponse.json({ reviews: filtered });
  } catch (error) {
    return NextResponse.json({ error: error.message, reviews: [] }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { product_id, product_slug, product_name, user_name, user_email, rating, comment } = body;

    if (!user_name || !comment || !rating) {
      return NextResponse.json({ error: 'Name, rating and review text are required.' }, { status: 400 });
    }

    if (!user_email) {
      return NextResponse.json({ error: 'You must be logged in to submit a review.' }, { status: 401 });
    }

    const newReview = {
      id: crypto.randomUUID(),
      product_id: product_id || null,
      product_slug: product_slug || null,
      product_name: product_name || 'Product',
      user_name: user_name.trim(),
      user_email: user_email?.trim() || null,
      rating: Math.min(5, Math.max(1, Number(rating) || 5)),
      comment: comment.trim(),
      status: 'pending', // Pending admin approval
      created_at: new Date().toISOString(),
    };

    // Attempt direct table insert
    let inserted = false;
    try {
      const { error } = await supabase.from('reviews').insert(newReview);
      if (!error) inserted = true;
    } catch (e) {
      inserted = false;
    }

    // If table didn't take it, update fallback store
    if (!inserted) {
      const { reviews } = await getStoredReviews();
      const updated = [newReview, ...reviews];
      await saveReviewsFallback(updated);
    }

    return NextResponse.json({
      success: true,
      review: newReview,
      message: 'Your review has been submitted for moderation and will appear once approved by admin.',
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { id, status } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status required' }, { status: 400 });
    }

    let updatedTable = false;
    try {
      const { error } = await supabaseAdmin.from('reviews').update({ status }).eq('id', id);
      if (!error) updatedTable = true;
    } catch (e) {
      updatedTable = false;
    }

    // Always update fallback store to keep in sync
    const { reviews } = await getStoredReviews(true);
    const updatedList = reviews.map((r) => (r.id === id ? { ...r, status } : r));
    await saveReviewsFallback(updatedList);

    return NextResponse.json({ success: true, status });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    try {
      await supabaseAdmin.from('reviews').delete().eq('id', id);
    } catch (e) {
      // ignore
    }

    const { reviews } = await getStoredReviews(true);
    const updatedList = reviews.filter((r) => r.id !== id);
    await saveReviewsFallback(updatedList);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
