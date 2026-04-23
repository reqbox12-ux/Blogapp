import { GoogleGenerativeAI } from "@google/generative-ai";
export const runtime = "edge";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const MODEL = "gemini-2.5-flash";

const GUIDELINES = `
[글쓰기 필수 기준]
- 격식체 문어체(합니다/입니다/~ㄹ 수 있습니다) 사용
- 공백 제외 1,500자 이상
- 순수 정보성 콘텐츠 (일기·잡담·광고성 문구 절대 금지)
- 맞춤법·띄어쓰기 완벽 준수

[SEO 최적화]
- 롱테일 키워드 1개 메인 + 관련어 3~5개 자연 배치
- H1 제목: 핵심 키워드 포함, 클릭 유도형
- H2/H3 소제목으로 계층 구조 유지
- 인트로 첫 100자 내 메인 키워드 등장
- 단락 2~4줄 이내, 불렛/번호 목록 적극 활용
- E-E-A-T: 실제 경험·데이터·신뢰 근거 포함

[출력 형식 - 반드시 준수]
---META---
제목: (H1 제목)
키워드: (키워드1) | (키워드2) | (키워드3)
메타설명: (150자 이내 요약)
---CONTENT---
(HTML 본문: <p>, <h2>, <ul> 태그 등을 사용한 구조화된 본문)
`;

export async function POST(req: Request) {
  try {
    const { title } = await req.json();
    const model = genAI.getGenerativeModel({ model: MODEL });
    
    const prompt = `
    주제: ${title}
    
    ${GUIDELINES}
    
    위 가이드라인에 맞춰 블로그 글을 작성해줘. 
    전문가 3명의 의견을 종합한 최상의 퀄리티여야 해.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // 파싱 로직
    const metaMatch = text.match(/---META---([\s\S]*?)---CONTENT---/);
    const contentMatch = text.match(/---CONTENT---([\s\S]*)/);
    
    let tags = "", metaDesc = "", html = text;
    
    if (metaMatch && contentMatch) {
      const metaBlock = metaMatch[1];
      const tagsMatch = metaBlock.match(/키워드:\s*(.*)/);
      const descMatch = metaBlock.match(/메타설명:\s*(.*)/);
      
      tags = tagsMatch ? tagsMatch[1].trim() : "";
      metaDesc = descMatch ? descMatch[1].trim() : "";
      html = contentMatch[1].trim();
    }

    // Supabase 저장
    const id = new Date().toISOString().replace(/[:.]/g, "-");
    const { error: dbError } = await supabase
      .from('posts')
      .insert([
        { id, title, tags, meta_desc: metaDesc, html, created_at: new Date().toISOString() }
      ]);

    if (dbError) throw dbError;

    return NextResponse.json({ id, title, tags, metaDesc, html });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
