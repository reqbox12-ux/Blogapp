import fs from "fs";
export const runtime = "edge";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('id, title, tags, meta_desc, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const history = data.map(post => ({
      id: post.id,
      title: post.title,
      keywords: post.tags ? post.tags.split("|").map((t: string) => t.trim()) : [],
      metaDesc: post.meta_desc,
      generatedAt: post.created_at
    }));

    return NextResponse.json({ history });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
