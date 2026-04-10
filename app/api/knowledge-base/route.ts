import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { DEV_BYPASS_UID, isDevUser } from '@/lib/auth/is-dev-user'

export async function GET(request: NextRequest) {
  try {
    if (!isDevUser(request)) {
      const { supabase } = await createServerSupabase(request)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const query = searchParams.get('q')

    // Use service role key to bypass RLS
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    let dbQuery = supabaseAdmin
      .from('knowledge_base')
      .select('id, category, title, content, metadata, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (category) {
      dbQuery = dbQuery.eq('category', category)
    }

    if (query) {
      dbQuery = dbQuery.ilike('content', `%${query}%`)
    }

    const { data: entries, error } = await dbQuery

    if (error) {
      console.error('Error fetching knowledge base:', error)
      return NextResponse.json(
        { error: 'Failed to fetch knowledge base entries' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      entries: entries || [],
    })
  } catch (error) {
    console.error('Knowledge base GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch knowledge base' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    let userId: string | null = null

    if (isDevUser(request)) {
      userId = DEV_BYPASS_UID
    } else {
      const { supabase } = await createServerSupabase(request)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      userId = session.user.id
    }

    const body = await request.json()
    const { category, title, content, metadata } = body

    if (!category || !title || !content) {
      return NextResponse.json(
        { error: 'category, title, and content are required' },
        { status: 400 }
      )
    }

    const validCategories = ['transfer', 'script', 'sop', 'disposition']
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      )
    }

    // Use service role key to bypass RLS
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // Note: embedding field is intentionally omitted for MVP
    // For full RAG, an OpenAI embedding call would be needed here
    const { data: entry, error } = await supabaseAdmin
      .from('knowledge_base')
      .insert({
        category,
        title,
        content,
        metadata: metadata || {},
        // embedding: will need OpenAI API call for actual embeddings
      })
      .select('id, category, title, content, metadata, created_at, updated_at')
      .single()

    if (error) {
      console.error('Error creating knowledge base entry:', error)
      return NextResponse.json(
        { error: 'Failed to create knowledge base entry' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      entry,
    })
  } catch (error) {
    console.error('Knowledge base POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create knowledge base entry' },
      { status: 500 }
    )
  }
}
