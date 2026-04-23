import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const MODEL = "gemini-2.5-flash";

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "주제를 입력해주세요." }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: MODEL });
    const prompt = `당신은 블로그 전문가이자 SEO 전문가입니다. 
다음 주제에 대해 클릭을 유도하고 검색 엔진 최적화(SEO)에 최적인 블로그 제목 10개를 제안해주세요. 
주제: ${topic}

[조건]
1. 한국어 사용
2. 제목은 서로 다른 스타일로 제안 (정보 전달형, 질문형, 가이드형, 자극형 등)
3. 불필요한 서술 없이 제목만 한 줄씩 출력해주세요. 
4. 각 제목 앞에 번호를 붙여주세요 (1. ~ 10.)`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    const titles = text
      .split("\n")
      .map(t => t.replace(/^\d+\.\s*/, "").trim())
      .filter(t => t.length > 0)
      .slice(0, 10);

    return NextResponse.json({ titles });
  } catch (error: any) {
    console.error("Title Generation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
