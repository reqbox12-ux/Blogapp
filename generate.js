import { GoogleGenerativeAI } from "@google/generative-ai";
import { marked } from "marked";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL = "gemini-2.5-flash";
const IMAGE_MODEL = "gemini-2.5-flash-image";

// ── 콘솔 색상 ──────────────────────────────────────────
const C = {
  reset: "\x1b[0m", bright: "\x1b[1m",
  blue: "\x1b[34m", green: "\x1b[32m", yellow: "\x1b[33m",
  magenta: "\x1b[35m", cyan: "\x1b[36m", red: "\x1b[31m",
  gray: "\x1b[90m", white: "\x1b[37m",
};
function log(agent, msg, color = C.white) {
  const t = new Date().toLocaleTimeString("ko-KR");
  console.log(`${C.gray}[${t}]${C.reset} ${color}${C.bright}[${agent}]${C.reset} ${msg}`);
}
function section(title) {
  const line = "━".repeat(55);
  console.log(`\n${C.cyan}${line}\n  ${title}\n${line}${C.reset}\n`);
}

// ── 글쓰기 기준 ─────────────────────────────────────────
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

// ── 에이전트 페르소나 ────────────────────────────────────
const PERSONAS = {
  writerA: `당신은 "데이터 박사"입니다.
20년 경력의 영유아 발달 전문가로, 국내외 연구 자료와 통계를 기반으로 신뢰할 수 있는 정보를 제공합니다.
스타일: 연구 결과·통계·전문가 견해를 풍부하게 인용. "~연구에 따르면", "전문가는 ~라고 말합니다" 같은 표현. 데이터 기반의 권위 있는 문체.`,

  writerB: `당신은 "공감 맘"입니다.
두 아이를 키우는 워킹맘 블로거로, 육아의 어려움과 기쁨을 직접 경험한 실전 육아 전문가입니다.
스타일: 실제 경험 공유 ("저도 처음엔 몰랐는데요"). 부모의 감정에 공감하는 따뜻한 문체. 독자가 "이건 나 얘기다!" 싶게 만드는 공감 요소.`,

  writerC: `당신은 "SEO 마스터"입니다.
디지털 마케팅 전문가로, 검색 알고리즘을 이해하고 최상위 노출을 위한 구조화된 콘텐츠를 작성합니다.
스타일: 검색 의도를 즉각 파악해 답변. 명확한 H1→H2→H3 구조. 키워드를 자연스럽게 배치. 목차·불렛·번호 목록으로 스캔 가능한 구성.`,

  reviewerA: `당신은 "E-E-A-T 검수관"입니다.
Google 품질 평가 기준(경험·전문성·권위성·신뢰성)으로 블로그 글을 평가합니다.
평가 관점: 실제 경험이 담겼는가 / 전문 지식이 충분한가 / 신뢰할 출처·근거가 있는가 / 편향 없이 정확한가 / 애드센스 정책 적합한가`,

  reviewerB: `당신은 "SEO 분석관"입니다.
기술적 SEO 관점에서 블로그 글을 분석하고 최적화 방향을 제시합니다.
평가 관점: 키워드가 제목·인트로·소제목에 자연스럽게 포함됐는가 / 헤딩 구조와 가독성이 적절한가 / 검색 의도에 맞는가 / 제목·메타설명이 클릭을 유도하는가`,

  editor: `당신은 "수석 편집장"입니다.
두 검수관의 피드백을 종합해 최고 수준의 최종 블로그 포스트를 완성하는 책임자입니다.
역할: 채택 초안 기반으로 보완점 전부 반영. 격식체·맞춤법·분량(1,500자 이상) 최종 확인. SEO와 E-E-A-T 기준 동시 만족.`,
};

// ── 에이전트 호출 ────────────────────────────────────────
async function callAgent(name, system, prompt, color = C.white) {
  log(name, "작업 시작...", color);
  const model = genAI.getGenerativeModel({ model: MODEL, systemInstruction: system });
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  log(name, `완료 ✓  (${text.length.toLocaleString()}자)`, color);
  return text;
}

// ── META 파싱 ────────────────────────────────────────────
function parseMeta(text) {
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

// ── 이미지 생성 (Nano Banana) ──────────────────────────
async function generateThumbnail(topic, keywords, outDir) {
  log("이미지 에이전트", "썸네일 생성 중...", C.yellow);
  try {
    const model = genAI.getGenerativeModel({
      model: IMAGE_MODEL,
      generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
    });

    const prompt = `Create a warm, professional blog thumbnail image for a Korean parenting blog post about: "${topic}".
Keywords: ${keywords.slice(0, 3).join(", ")}.
Style: Soft pastel colors, clean and modern, child-friendly, suitable for a family/parenting blog. 
Include visual elements related to young children (ages 3-7) and the topic. 
No text overlay. Horizontal 16:9 ratio. High quality, photorealistic or illustrated style.`;

    const result = await model.generateContent(prompt);
    const parts = result.response.candidates?.[0]?.content?.parts || [];
    const imgPart = parts.find(p => p.inlineData?.mimeType?.startsWith("image/"));

    if (imgPart) {
      const imgBuffer = Buffer.from(imgPart.inlineData.data, "base64");
      const ext = imgPart.inlineData.mimeType.split("/")[1] || "png";
      const imgPath = path.join(outDir, `thumbnail.${ext}`);
      fs.writeFileSync(imgPath, imgBuffer);
      log("이미지 에이전트", `완료 ✓  (${(imgBuffer.length / 1024).toFixed(1)}KB) → thumbnail.${ext}`, C.yellow);
      return imgPath;
    } else {
      log("이미지 에이전트", "이미지 파트 없음 — 스킵", C.red);
      return null;
    }
  } catch (err) {
    log("이미지 에이전트", `오류: ${err.message} — 스킵`, C.red);
    return null;
  }
}

// ── HTML 생성 ─────────────────────────────────────────────
function generateHTML({ title, keywords, metaDesc, content, thumbnailPath, topic, generatedAt }) {
  const htmlBody = marked.parse(content);
  const thumbnailTag = thumbnailPath
    ? `<img src="thumbnail.${path.extname(thumbnailPath).slice(1)}" alt="${title}" class="thumbnail">`
    : "";

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${metaDesc}">
  <meta name="keywords" content="${keywords.join(", ")}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${metaDesc}">
  <title>${title}</title>
  <style>
    :root {
      --primary: #6c63ff;
      --accent: #ff6584;
      --bg: #fafafa;
      --card: #ffffff;
      --text: #2d2d2d;
      --muted: #777;
      --border: #e8e8e8;
      --radius: 12px;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.85;
      font-size: 16px;
    }
    .wrapper {
      max-width: 780px;
      margin: 0 auto;
      padding: 40px 24px 80px;
    }
    .thumbnail {
      width: 100%;
      border-radius: var(--radius);
      margin-bottom: 32px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }
    .meta-keywords {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 24px;
    }
    .meta-keywords span {
      background: #f0eeff;
      color: var(--primary);
      border-radius: 20px;
      padding: 4px 14px;
      font-size: 13px;
      font-weight: 500;
    }
    h1 {
      font-size: 28px;
      font-weight: 800;
      line-height: 1.4;
      color: #1a1a1a;
      margin-bottom: 12px;
    }
    h2 {
      font-size: 22px;
      font-weight: 700;
      margin: 40px 0 16px;
      color: #1a1a1a;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--border);
    }
    h3 {
      font-size: 18px;
      font-weight: 700;
      margin: 28px 0 12px;
      color: #333;
    }
    p { margin-bottom: 18px; }
    ul, ol {
      padding-left: 24px;
      margin-bottom: 18px;
    }
    li { margin-bottom: 8px; }
    strong { color: var(--primary); font-weight: 700; }
    blockquote {
      border-left: 4px solid var(--primary);
      padding: 12px 20px;
      background: #f7f6ff;
      border-radius: 0 8px 8px 0;
      margin: 24px 0;
      color: #444;
    }
    .post-footer {
      margin-top: 60px;
      padding-top: 24px;
      border-top: 1px solid var(--border);
      font-size: 13px;
      color: var(--muted);
    }
    @media (max-width: 600px) {
      h1 { font-size: 22px; }
      h2 { font-size: 18px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    ${thumbnailTag}
    <div class="meta-keywords">
      ${keywords.map(k => `<span>#${k}</span>`).join("")}
    </div>
    <h1>${title}</h1>
    <div class="post-content">
      ${htmlBody}
    </div>
    <div class="post-footer">
      <p>📅 ${generatedAt} | 🏷️ ${keywords[0] || topic}</p>
    </div>
  </div>
</body>
</html>`;
}

// ── 업로드용 HTML 본문만 (티스토리/블로그스팟 API용) ────────
function generateUploadHTML({ title, keywords, metaDesc, content, thumbnailPath }) {
  const htmlBody = marked.parse(content);
  const thumbnailTag = thumbnailPath
    ? `<img src="thumbnail.${path.extname(thumbnailPath).slice(1)}" alt="${title}" style="width:100%;border-radius:12px;margin-bottom:24px;">`
    : "";
  const keywordTags = keywords.map(k =>
    `<span style="display:inline-block;background:#f0eeff;color:#6c63ff;border-radius:20px;padding:3px 12px;font-size:13px;margin:0 4px 4px 0;">#${k}</span>`
  ).join("");

  return `<!-- 메타설명: ${metaDesc} -->
${thumbnailTag}
<div style="margin-bottom:20px;">${keywordTags}</div>
${htmlBody}`;
}

// ── 메인 파이프라인 ─────────────────────────────────────────
async function generateBlogPost(topic) {
  console.clear();
  section("🤖 AI 블로그 자동화 시스템 v2");
  console.log(`📌 주제: ${C.bright}${topic}${C.reset}\n`);

  // 출력 폴더 생성 (포스트별 개별 폴더)
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outDir = path.join(__dirname, "output", timestamp);
  fs.mkdirSync(outDir, { recursive: true });
  log("시스템", `출력 폴더 생성 → output/${timestamp}/`, C.gray);

  // ─ Phase 1: 작가 3명 동시 초안 ─────────────────────────
  section("📝 Phase 1 | 작가 3명 동시 초안 작성");

  const writerPrompt = `다음 주제로 블로그 글을 작성해 주세요.
주제: ${topic}
블로그 카테고리: 영유아 성장 프로그램 (유아체육·발레·방송댄스 등)
${GUIDELINES}`;

  const [draftA, draftB, draftC] = await Promise.all([
    callAgent("작가A (데이터 박사)", PERSONAS.writerA, writerPrompt, C.blue),
    callAgent("작가B (공감 맘)  ", PERSONAS.writerB, writerPrompt, C.magenta),
    callAgent("작가C (SEO 마스터)", PERSONAS.writerC, writerPrompt, C.yellow),
  ]);

  // 초안 3개 모두 개별 저장
  fs.writeFileSync(path.join(outDir, "draft_A_데이터박사.md"), draftA, "utf-8");
  fs.writeFileSync(path.join(outDir, "draft_B_공감맘.md"), draftB, "utf-8");
  fs.writeFileSync(path.join(outDir, "draft_C_SEO마스터.md"), draftC, "utf-8");
  log("시스템", "초안 3개 저장 완료 (draft_A/B/C.md)", C.gray);

  // ─ Phase 2: 검수관 2명 평가 ────────────────────────────
  section("🔍 Phase 2 | 검수관 2명 평가");

  const reviewPrompt = `아래 3개의 블로그 초안을 평가해 주세요.
주제: ${topic}

## 초안 A (데이터 박사)
${draftA}

## 초안 B (공감 맘)
${draftB}

## 초안 C (SEO 마스터)
${draftC}

각 초안을 다음 형식으로 평가:
### 초안 A
점수: (0~100)
장점:
단점:

### 초안 B
점수: (0~100)
장점:
단점:

### 초안 C
점수: (0~100)
장점:
단점:

### 추천
추천 초안: (A/B/C)
이유:`;

  const [reviewA, reviewB] = await Promise.all([
    callAgent("검수관A (E-E-A-T)", PERSONAS.reviewerA, reviewPrompt, C.green),
    callAgent("검수관B (SEO)   ", PERSONAS.reviewerB, reviewPrompt, C.cyan),
  ]);

  fs.writeFileSync(path.join(outDir, "review_A_EEAT.md"), reviewA, "utf-8");
  fs.writeFileSync(path.join(outDir, "review_B_SEO.md"), reviewB, "utf-8");
  log("시스템", "검수 결과 저장 완료 (review_A/B.md)", C.gray);

  // ─ Phase 3: 토론 → 최종 초안 선정 ──────────────────────
  section("💬 Phase 3 | 토론 & 최종 초안 선정");

  const debatePrompt = `두 검수관의 평가를 종합하여 최종 채택 초안을 결정해 주세요.

## 검수관A (E-E-A-T) 평가:
${reviewA}

## 검수관B (SEO) 평가:
${reviewB}

아래 형식으로 답변:
최종 채택 초안: (A 또는 B 또는 C)
채택 근거: (3문장 이내)
반드시 반영할 보완점:
1.
2.
3.
4.
5.`;

  const debate = await callAgent("토론 조율자", PERSONAS.editor, debatePrompt, C.red);
  fs.writeFileSync(path.join(outDir, "debate.md"), debate, "utf-8");

  // 채택 초안 결정
  let selectedDraft = draftA, selectedName = "A";
  if (/최종 채택 초안:\s*B/i.test(debate)) { selectedDraft = draftB; selectedName = "B"; }
  else if (/최종 채택 초안:\s*C/i.test(debate)) { selectedDraft = draftC; selectedName = "C"; }
  log("토론", `초안 ${selectedName} 채택됨`, C.bright);

  // ─ Phase 4: 최종 편집장 ─────────────────────────────────
  section("✍️  Phase 4 | 최종 편집장 완성본 작성");

  const finalPrompt = `채택된 초안과 검수관 보완 요청을 바탕으로 최종 블로그 포스트를 완성해 주세요.

## 채택 초안 (${selectedName}):
${selectedDraft}

## 토론 결과 & 보완 요청:
${debate}

## 최종본 기준:
${GUIDELINES}

⚠️ 주의: 반드시 공백 제외 1,500자 이상. 격식체 완벽 유지. 보완점 전부 반영. 출력 형식(---META--- / ---CONTENT---) 반드시 준수.`;

  const finalPost = await callAgent("수석 편집장 (최종)", PERSONAS.editor, finalPrompt, C.bright);
  const parsed = parseMeta(finalPost);

  fs.writeFileSync(path.join(outDir, "final_post.md"), finalPost, "utf-8");
  log("시스템", "최종 포스트 저장 완료 (final_post.md)", C.gray);

  // ─ Phase 5: 이미지 생성 ────────────────────────────────
  section("🖼️  Phase 5 | 썸네일 이미지 생성 (Nano Banana)");
  const thumbnailPath = await generateThumbnail(topic, parsed.keywords, outDir);

  // ─ Phase 6: HTML 변환 & 저장 ────────────────────────────
  section("📄 Phase 6 | HTML 변환 & 저장");

  const generatedAt = new Date().toLocaleString("ko-KR");
  const htmlFull = generateHTML({ ...parsed, thumbnailPath, topic, generatedAt });
  const htmlUpload = generateUploadHTML({ ...parsed, thumbnailPath });

  fs.writeFileSync(path.join(outDir, "preview.html"), htmlFull, "utf-8");
  fs.writeFileSync(path.join(outDir, "upload_body.html"), htmlUpload, "utf-8");
  log("시스템", "HTML 저장 완료 (preview.html / upload_body.html)", C.gray);

  // ─ meta.json 저장 ────────────────────────────────────────
  const meta = {
    id: timestamp,
    topic,
    title: parsed.title,
    keywords: parsed.keywords,
    metaDesc: parsed.metaDesc,
    selectedDraft: selectedName,
    thumbnailPath: thumbnailPath ? path.basename(thumbnailPath) : null,
    generatedAt,
    charCount: parsed.content.length,
    files: {
      draftA: "draft_A_데이터박사.md",
      draftB: "draft_B_공감맘.md",
      draftC: "draft_C_SEO마스터.md",
      reviewA: "review_A_EEAT.md",
      reviewB: "review_B_SEO.md",
      debate: "debate.md",
      finalMd: "final_post.md",
      previewHtml: "preview.html",
      uploadHtml: "upload_body.html",
    },
  };
  fs.writeFileSync(path.join(outDir, "meta.json"), JSON.stringify(meta, null, 2), "utf-8");
  log("시스템", "meta.json 저장 완료", C.gray);

  // ─ 완료 ─────────────────────────────────────────────────
  section("🎉 모든 작업 완료!");
  console.log(`📁 폴더: ${C.green}output/${timestamp}/${C.reset}`);
  console.log(`\n생성된 파일:`);
  console.log(`  ${C.blue}draft_A_데이터박사.md${C.reset}  (${draftA.length.toLocaleString()}자)`);
  console.log(`  ${C.magenta}draft_B_공감맘.md${C.reset}      (${draftB.length.toLocaleString()}자)`);
  console.log(`  ${C.yellow}draft_C_SEO마스터.md${C.reset}   (${draftC.length.toLocaleString()}자)`);
  console.log(`  ${C.green}review_A_EEAT.md${C.reset}`);
  console.log(`  ${C.cyan}review_B_SEO.md${C.reset}`);
  console.log(`  ${C.red}debate.md${C.reset}`);
  console.log(`  ${C.bright}final_post.md${C.reset}          (${parsed.content.length.toLocaleString()}자)`);
  console.log(`  ${C.bright}preview.html${C.reset}           ← 미리보기용`);
  console.log(`  ${C.bright}upload_body.html${C.reset}       ← 블로그 업로드용`);
  if (thumbnailPath) console.log(`  ${C.yellow}thumbnail.*${C.reset}            ← 썸네일 이미지`);
  console.log(`  ${C.gray}meta.json${C.reset}              ← 메타데이터`);

  console.log(`\n${C.cyan}제목:${C.reset} ${parsed.title}`);
  console.log(`${C.cyan}키워드:${C.reset} ${parsed.keywords.join(" | ")}`);
  console.log(`${C.cyan}메타설명:${C.reset} ${parsed.metaDesc}\n`);

  return { outDir, meta, parsed };
}

// ── 실행 ─────────────────────────────────────────────────
const topic = process.argv[2] || "유아발레 시작 나이, 언제 보내면 좋을까?";
generateBlogPost(topic).catch((err) => {
  console.error(`${C.red}[오류] ${err.message}${C.reset}`);
  process.exit(1);
});
