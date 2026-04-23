import fs from "fs";
export const runtime = "edge";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: "글을 찾을 수 없습니다." }, { status: 404 });

    return NextResponse.json({ 
      id: data.id,
      title: data.title,
      keywords: data.tags ? data.tags.split("|").map((t: string) => t.trim()) : [],
      metaDesc: data.meta_desc,
      fullHtml: data.html,
      generatedAt: data.created_at
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
