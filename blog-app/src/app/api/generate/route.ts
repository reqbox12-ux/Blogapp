import { GoogleGenerativeAI } from "@google/generative-ai";
export const runtime = "edge";
import { marked } from "marked";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const MODEL = "gemini-2.5-flash";

const GUIDELINES = `
[글쓰기 필수 기준]
- 격식체 문어체(합니다/입니다/~ㄹ 수 있습니다) 사용
- 공백 제외 1,500자 이상
- 순수 정보성 콘텐츠 (일기·잡담·광고성 문구 절대 금지)
- 맞춤법·띄어쓰기 완벽 준수
- 단일 주제 집중

[SEO 최적화]
- 롱테일 키워드 1개 메인 + 관련어 3~5개 자연 배치
- H1 제목: 핵심 키워드 포함, 클릭 유도형
- H2/H3 소제목으로 계층 구조 유지
- 인트로 첫 100자 내 메인 키워드 등장
- 단락 2~4줄 이내, 불렛/번호 목록 적극 활용
- E-E-A-T: 실제 경험·데이터·신뢰 근거 포함

[출력 형식 - 반드시 준수]
---META---
제목: (클릭 유도형 H1 제목)
키워드: (메인키워드) | (관련어1) | (관련어2) | (관련어3) | (관련어4)
메타설명: (150자 이내)
---CONTENT---
(마크다운 형식 본문)
`;

const PERSONAS = {
  writerA: `당신은 "데이터 박사"입니다. 연구 결과·통계·전문가 견해를 풍부하게 인용. 데이터 기반의 권위 있는 문체.`,
  writerB: `당신은 "공감 맘"입니다. 실제 경험 공유, 부모의 감정에 공감하는 따뜻한 문체.`,
  writerC: `당신은 "SEO 마스터"입니다. 명확한 H1→H2→H3 구조. 키워드를 자연스럽게 배치.`,
  reviewerA: `당신은 "E-E-A-T 검수관"입니다. 구글 품질 평가 기준(경험·전문성·권위성·신뢰성)으로 평가.`,
  reviewerB: `당신은 "SEO 분석관"입니다. 기술적 SEO 관점에서 분석.`,
  editor: `당신은 "수석 편집장"입니다. 두 검수관의 피드백을 종합해 최고 수준의 최종본 완성.`,
};

async function callAgent(system: string, prompt: string) {
  const model = genAI.getGenerativeModel({ model: MODEL, systemInstruction: system });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

function parseMeta(text: string) {
  const metaMatch = text.match(/---META---([\s\S]*?)---CONTENT---/);
  const contentMatch = text.match(/---CONTENT---([\s\S]*)/);
  if (!metaMatch || !contentMatch) return { title: "", keywords: [], metaDesc: "", content: text };

  const metaBlock = metaMatch[1];
  const title = (metaBlock.match(/제목:\s*(.+)/) || [])[1]?.trim() || "";
  const keywordsRaw = (metaBlock.match(/키워드:\s*(.+)/) || [])[1]?.trim() || "";
  const keywords = keywordsRaw.split("|").map(k => k.trim()).filter(Boolean);
  const metaDesc = (metaBlock.match(/메타설명:\s*(.+)/) || [])[1]?.trim() || "";
  const content = contentMatch[1].trim();

  return { title, keywords, metaDesc, content };
}

export async function POST(req: Request) {
  try {
    const { title: topic } = await req.json();
    if (!topic) return NextResponse.json({ error: "제목이 없습니다." }, { status: 400 });

    // Step 1: Drafts
    const writerPrompt = `다음 주제로 블로그 글을 작성해 주세요.\n주제: ${topic}\n${GUIDELINES}`;
    const [draftA, draftB, draftC] = await Promise.all([
      callAgent(PERSONAS.writerA, writerPrompt),
      callAgent(PERSONAS.writerB, writerPrompt),
      callAgent(PERSONAS.writerC, writerPrompt),
    ]);

    // Step 2: Reviews
    const reviewPrompt = `아래 3개의 블로그 초안을 평가해 주세요.\n주제: ${topic}\n\n[초안A]\n${draftA}\n\n[초안B]\n${draftB}\n\n[초안C]\n${draftC}\n\n형식: 점수/장점/단점/추천초안`;
    const [reviewA, reviewB] = await Promise.all([
      callAgent(PERSONAS.reviewerA, reviewPrompt),
      callAgent(PERSONAS.reviewerB, reviewPrompt),
    ]);

    // Step 3: Debate
    const debatePrompt = `두 검수관의 평가를 보고 최종 채택 초안(A/B/C)과 보완점을 결정하세요.\n[검수관A]\n${reviewA}\n\n[검수관B]\n${reviewB}`;
    const debate = await callAgent(PERSONAS.editor, debatePrompt);

    // Step 4: Final
    let selectedDraft = draftA;
    if (/채택 초안:\s*B/i.test(debate)) selectedDraft = draftB;
    else if (/채택 초안:\s*C/i.test(debate)) selectedDraft = draftC;

    const finalPrompt = `채택된 초안과 보완점을 바탕으로 최종본을 완성하세요.\n\n[채택초안]\n${selectedDraft}\n\n[보완점]\n${debate}\n\n${GUIDELINES}`;
    const finalPost = await callAgent(PERSONAS.editor, finalPrompt);

    const parsed = parseMeta(finalPost);
    const htmlBody = marked.parse(parsed.content);

    // 태그를 쉼표로 구분된 문자열로
    const tags = parsed.keywords.join(", ");

    return NextResponse.json({
      title: parsed.title,
      tags,
      metaDesc: parsed.metaDesc,
      html: htmlBody,
      markdown: parsed.content
    });

  } catch (error: any) {
    console.error("Generation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
