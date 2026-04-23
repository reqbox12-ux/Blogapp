import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { marked } from "marked";

const OUTPUT_DIR = path.join(process.cwd(), "..", "output");

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const folderPath = path.join(OUTPUT_DIR, id);

  if (!fs.existsSync(folderPath)) {
    return NextResponse.json({ error: "폴더를 찾을 수 없습니다." }, { status: 404 });
  }

  try {
    const meta = JSON.parse(fs.readFileSync(path.join(folderPath, "meta.json"), "utf-8"));
    const htmlPath = path.join(folderPath, "upload_body.html");
    const html = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, "utf-8") : "";

    return NextResponse.json({ ...meta, fullHtml: html });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
