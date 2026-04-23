# 🤖 AI 자동 블로그 시스템 — 전체 정리

> **목표**: 영유아 프로그램 블로그를 2시간마다 AI가 자동으로 글을 작성·검수·이미지 생성 후,  
> 사람(나)이 최종 승인하면 티스토리 + 블로그스팟에 동시 발행하는 웹앱 시스템

---

## ✅ 확정된 결정사항

| 항목 | 결정 내용 |
|---|---|
| 블로그 주제 | **영유아 성장 프로그램** (유아체육·발레·방송댄스 등) |
| AI 글쓰기 | **Gemini + Claude** (에이전트별 역할 분담) |
| 이미지 생성 | **Nano Banana** (Gemini 2.5 Flash Image API) |
| 발행 방식 | 최종 승인은 **사람이 직접** (버튼 클릭 후 발행) |
| 발행 플랫폼 | **티스토리 API** + **Blogger API v3** (계정 기 생성) |
| 프론트엔드 | **Next.js 14** + Vercel 배포 |
| 데이터베이스 | **Supabase** (글 히스토리·에이전트 로그·주제 관리) |
| 스케줄러 | **Vercel Cron Jobs** (2시간마다 자동 실행) |

---

## 📋 블로그 주제 전략

### 메인 카테고리
> **영유아 성장 프로그램** 하나로 통합

### 세부 주제 아이디어

| 유형 | 예시 키워드 |
|---|---|
| 발달 단계별 | "4세 소근육 발달 운동", "6세 균형감각 키우는 댄스" |
| 문제 해결형 | "에너지 넘치는 아이 집콕 체육", "층간소음 없는 유아 운동" |
| 교구 리뷰 | "유아 트램펄린 추천", "유아 체육 매트 비교" |
| 프로그램 정보 | "유아발레 언제 시작하면 좋을까", "방송댄스 vs 발레 비교" |
| 기관 정보 | "유아스포츠단 선정 팁", "지역 무료 유아 체육 시설" |

---

## 🤖 6 에이전트 구조

### 전체 플로우

```
[스케줄러: 2시간마다]
        ↓
[주제 선정 엔진] — 이전 글 컨텍스트 참조 → 연속성 유지
        ↓
  ┌──────────────────────────────────┐
  │  작가 A  (정보/데이터) — Claude  │
  │  작가 B  (스토리텔링) — Claude   │  → 3개 초안 동시 생성
  │  작가 C  (SEO 최적화) — Gemini   │
  └──────────────────────────────────┘
        ↓
  ┌───────────────────────────────────┐
  │  검수 A  (E-E-A-T 기준) — Claude  │  → 각자 독립 평가 + 점수
  │  검수 B  (SEO 기준)    — Gemini   │
  └───────────────────────────────────┘
        ↓
  [토론 라운드: A ↔ B 의견 교환 2라운드 → 최종 선정]
        ↓
  [최종 에디터: 채택 글 + 보완점 반영 → 최종본 완성]
        ↓
  [이미지 에이전트: 글 요약 → Nano Banana로 썸네일 생성]
        ↓
  ⏸️  [대기: 사람(나)이 대시보드에서 검토 후 승인 버튼 클릭]
        ↓
  [발행 에이전트: 티스토리 + 블로그스팟 동시 발행]
```

### 에이전트별 AI 모델 배분

| 에이전트 | AI 모델 | 역할 |
|---|---|---|
| 작가 A | **Claude Sonnet** | 정보/데이터 중심, 신뢰성 높은 문장 |
| 작가 B | **Claude Sonnet** | 감성적 스토리텔링, 부모 공감 문체 |
| 작가 C | **Gemini Flash** | SEO 구조 최적화, 빠른 처리 |
| 검수 A | **Claude Sonnet** | 비판적 분석, E-E-A-T 품질 평가 |
| 검수 B | **Gemini Flash** | SEO 기준 체계적 채점 |
| 이미지 | **Nano Banana** | Gemini 2.5 Flash Image API |

---

## ✍️ 글쓰기 기준 (에이전트 공통 지침)

### 1. 애드센스 승인 기준 (유튜브 영상 기반)

- ✅ **격식체 문어체** 사용 (`~합니다`, `~입니다`)
- ✅ 공백 제외 **1,500자 이상**
- ✅ 이미지 글당 **1장** (로딩 속도 보호)
- ✅ **정보성 콘텐츠**만 (일기·잡담 금지)
- ✅ **맞춤법** 완벽 준수
- ✅ **단일 카테고리** 주제 집중

### 2. SEO 글쓰기 형식 (2025 최신 기준)

- ✅ **키워드 전략**: 롱테일 키워드 1개 메인 + 관련어 3~5개 자연 배치
- ✅ **제목(H1)**: 핵심 키워드 포함, 클릭 유도
- ✅ **소제목(H2/H3)**: 계층 구조 (H1→H2→H3 순서 유지)
- ✅ **인트로**: 첫 100자 내 메인 키워드 포함 + 독자 질문에 즉시 답변
- ✅ **단락 구성**: 2~4줄 이내, 불렛/넘버링 활용
- ✅ **내부 링크**: 이전 글 연결 (연속성 + 체류 시간↑)
- ✅ **이미지 Alt 태그**: 키워드 포함한 묘사 텍스트
- ✅ **메타 설명**: 150자 이내, 키워드 + 클릭 유도
- ✅ **E-E-A-T**: 실제 경험·데이터·신뢰 근거 포함

### 검수 평가 기준 (100점)

| 항목 | 점수 |
|---|---|
| 콘텐츠 품질 (정확성, 깊이, 신뢰성) | 30점 |
| SEO 최적화 (키워드 배치, 구조, 메타) | 25점 |
| 가독성 (문장 길이, 구성, 흐름) | 20점 |
| 애드센스 적합 (격식체, 글자수) | 15점 |
| 연속성 (이전 글과의 연결) | 10점 |

---

## 🔑 API 키 발급 방법

### 1. 티스토리 Client ID + Secret

```
👉 https://www.tistory.com/guide/api/manage/register

1. 티스토리 로그인
2. 위 URL 접속 → 앱 등록
3. 입력 정보:
   - 서비스명: 원하는 이름
   - 서비스 URL: http://localhost:3000
   - CallBack URL: http://localhost:3000/api/auth/tistory/callback
4. 등록 완료 → Client ID / Secret Key 저장
```

### 2. Google Blogger API (블로그스팟 발행)

```
👉 https://console.cloud.google.com/

1. Google Cloud Console 접속
2. 새 프로젝트 생성 (예: BlogAutoSystem)
3. API 및 서비스 → 라이브러리 → "Blogger API v3" 검색 → 사용 설정
4. API 및 서비스 → 사용자 인증 정보
   → OAuth 2.0 클라이언트 ID 생성
   → 유형: 웹 애플리케이션
   → 리디렉션 URI: http://localhost:3000/api/auth/google/callback
5. Client ID + Client Secret 저장
```

### 3. Gemini API 키 (글쓰기 + Nano Banana 이미지)

```
👉 https://aistudio.google.com/app/apikey

1. Google AI Studio 접속
2. "API 키 만들기" 클릭
3. 위에서 만든 Cloud 프로젝트 선택
4. API 키 복사 저장
   → 이 키 하나로 Gemini 텍스트 + Nano Banana 이미지 둘 다 사용 가능!
```

### 4. Claude API 키 (작가·검수 에이전트)

```
👉 https://console.anthropic.com/

1. Anthropic Console 회원가입/로그인
2. "API Keys" 메뉴 → "Create Key"
3. API 키 복사 저장 (한 번만 표시됨!)
4. 선불 충전: 처음 $5~10 충전으로 테스트 충분
```

### 📋 준비할 키 목록 체크리스트

- [ ] 티스토리 Client ID
- [ ] 티스토리 Client Secret
- [ ] Google OAuth Client ID
- [ ] Google OAuth Client Secret
- [ ] Gemini API Key (AI Studio)
- [ ] Claude API Key (Anthropic)

---

## 💰 예상 월 비용 (2시간마다 발행 = 약 360개/월)

| 항목 | 단가 | 월 예상 |
|---|---|---|
| Gemini 2.5 Flash | 입력 $0.075/1M토큰 | ~$2~3 |
| Claude Sonnet API | 입력 $3/1M토큰 | ~$8~12 |
| Nano Banana (이미지) | ~$0.02/장 | ~$7 |
| Vercel | 무료 플랜 | $0 |
| Supabase | 무료 플랜 | $0 |
| **합계** | | **약 $17~22/월** |

---

## 🗂️ DB 스키마 (Supabase)

```sql
-- 발행된 글 히스토리
posts (
  id, title, content, summary, category,
  keywords[], meta_description,
  image_url, image_alt,
  status: 'draft' | 'pending_approval' | 'published',
  tistory_post_id, blogspot_post_id,
  published_at, created_at
)

-- 에이전트 실행 로그
agent_runs (
  id, run_at, topic, status,
  writer_a_draft, writer_b_draft, writer_c_draft,
  reviewer_a_scores, reviewer_b_scores,
  debate_log, final_content,
  selected_writer, image_prompt, image_url
)

-- 주제 + 시리즈 관리
topic_series (
  id, series_name, category,
  posts_count, last_posted_at,
  next_topic_hint, context_summary,
  is_active
)
```

---

## 🗓️ 구현 단계 로드맵

| 단계 | 내용 | 예상 기간 |
|---|---|---|
| Phase 1 | Next.js 프로젝트 초기화 + Supabase DB 생성 | 1일 |
| Phase 2 | 6 에이전트 엔진 + 오케스트레이션 로직 | 2~3일 |
| Phase 3 | Nano Banana 이미지 에이전트 연동 | 1일 |
| Phase 4 | 티스토리 + 블로그스팟 API 발행 연동 | 1~2일 |
| Phase 5 | Vercel Cron 스케줄러 + 연속성 관리 | 1일 |
| Phase 6 | 대시보드 UI 완성 + 승인 워크플로우 | 1~2일 |
| **합계** | | **약 7~10일** |

---

## 🖥️ 대시보드 화면 구성

```
┌──────────────────────────────────────────────────────────┐
│  🤖 AI 블로그 자동화 시스템             [설정] [로그아웃] │
├────────────┬─────────────────────────────────────────────┤
│            │  📊 현재 진행 상황                           │
│ 📋 대시보드 │  [✍️ 작가들 초안 작성 중...]                │
│ 📝 주제 관리│  ■■■■■□□□□□ 50%                            │
│ ⏳ 승인 대기│                                            │
│ 📊 발행 로그│  다음 발행 예정: 01:45 후                  │
│ ⚙️ 설정    │  ──────────────────────────────────────    │
│            │  ⏸️ 승인 대기 중인 글 (2건)                 │
│            │  [영유아 발레 시작 시기 완벽 가이드]  [승인] │
│            │  [유아체육 집에서 하는 방법 5가지]    [승인] │
│            │  ──────────────────────────────────────    │
│            │  ✅ 최근 발행 완료                          │
│            │  [티스토리] 방송댄스 vs 발레 비교  ✅       │
│            │  [블로그스팟] 방송댄스 vs 발레 비교 ✅      │
└────────────┴─────────────────────────────────────────────┘
```

---

> [!IMPORTANT]
> **다음 단계**: API 키 6개를 모두 발급받으면 바로 구현을 시작합니다! 🚀  
> 발급하시다 막히는 부분이 있으면 언제든지 말씀해 주세요.
