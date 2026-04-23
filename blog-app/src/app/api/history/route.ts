import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

const OUTPUT_DIR = path.join(process.cwd(), "..", "output");

export async function GET() {
  try {
    if (!fs.existsSync(OUTPUT_DIR)) {
      return NextResponse.json({ history: [] });
    }

    const folders = fs.readdirSync(OUTPUT_DIR);
    const history = folders
      .map(folder => {
        const metaPath = path.join(OUTPUT_DIR, folder, "meta.json");
        if (fs.existsSync(metaPath)) {
          try {
            return JSON.parse(fs.readFileSync(metaPath, "utf-8"));
          } catch (e) {
            return null;
          }
        }
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => b.id.localeCompare(a.id)); // 최신순

    return NextResponse.json({ history });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
