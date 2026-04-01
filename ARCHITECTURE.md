# Architecture

This document explains **why** the Saju & MBTI platform is built the way it is.

## The core idea

사주 만세력 계산은 빠르지만, LLM 텍스트 생성은 느리고 비싸며, 프론트엔드에서의 바이럴 이미지 생성(DOM to Image)은 온갖 파편화 버그를 만들어냅니다.

The key insight: **1명의 연산으로 10,000명의 유저를 먹여 살리는 캐싱 구조(The Caching Wall)**와, **클라이언트 환경을 믿지 않는 서버 사이드 렌더링**이 이 아키텍처의 핵심입니다. 비용(Cost)과 지연 시간(Latency)을 최대로 압축합니다.

```
Client (Browser)                  Serverless (Vercel)             Cache (Supabase RDBMS)
────────────────                  ───────────────────             ──────────────────────
                                  ┌──────────────────────┐
  POST /api/analyze               │  Route Handler       │
  { saju_hash, mbti: "INTJ" }     │  • Hash Generator    │
  ─────────────────────────────→  │  • Read Cache DB     │ ──────→ [SELECT WHERE hash = ?]
                                  └───────────┬──────────┘
                                              │ Miss
                                  ┌───────────▼──────────┐
                                  │  Saju Engine Lib     │
                                  │  • Calc 8-characters │
                                  └───────────┬──────────┘
                                              │
                                  ┌───────────▼──────────┐
                                  │  LLM (GPT-4o-mini)   │
                                  │  • 3~5초 소요          │
                                  └───────────┬──────────┘
                                              │
                                  ┌───────────▼──────────┐
  Return { reading, ogURL }       │  Write Cache DB      │ ──────→ [INSERT INTO Cache]
  ←─────────────────────────────  └──────────────────────┘
```

Cache Miss일 때는 최대 ~5초의 지연과 프롬프트 비용이 발생하지만, Cache Hit일 때는 서버리스 콜드스타트 제외 ~100ms 지연 및 0원의 비용으로 처리됩니다. 사주+MBTI 조합은 유한합니다.

## Why Next.js & Vercel

1. **Edge Image Generation (`@vercel/og`).**
   - 클라이언트에서 `html2canvas`로 썸네일을 구우려고 하면 iOS/Android 파편화, 웹폰트 로딩 타이밍 이슈로 글자가 무조건 깨집니다. 
   - Vercel의 Edge 런타임에서 React 컴포넌트를 즉시 PNG로 렌더링하여 URL로 반환합니다. 가장 빠르고 가장 안전한 바이럴 루프 엔진입니다.

2. **Server Components (RSC).**
   - 만세력을 추출하는 캘린더/천문 계산 라이브러리는 무겁습니다(Timezone, 역사적 윤달 데이터 등). 이 무거운 연산을 클라이언트로 1바이트도 넘기지 않습니다. 전적으로 서버에서 실행(RSC)합니다.

3. **Built-in API Routes.**
   - 프론트엔드와 백엔드(API)를 단일 레포지토리 내에서 타입(TypeScript)을 완벽히 호환하며 작성할 수 있습니다. 

## The Caching Model

이 앱의 아킬레스건은 'LLM API 비용'입니다. 

1. **The Hash Key:** `sha256(만세력_8글자_표준화 + MBTI + 카테고리(예: 직업운))`
2. **Read:** 클라이언트가 입력을 마치면 무조건 이 Hash를 기준으로 Supabase의 `SajuCache` 테이블을 찌릅니다.
3. **Write:** 없다면, 그때서야 OpenAI 비동기 호출을 타고 캐시 DB에 꽂아 넣습니다. 
4. **Bypass:** 생년월일시에서 '시간'을 모른다고 선택한 경우, 6글자(삼주육자)만으로 Hash를 묶어 캐싱 범위를 아득히 넓힙니다.

## Security & Privacy model

- **Stateless:** 유저의 생년월일과 이름은 `POST` 바디로 날아오지만 DB의 '유저 프로필' 테이블에 원본 평문(Plain-text)으로 절대로 저장하지 않습니다. 
- **Decoupled Cache:** 캐시에 저장되는 데이터의 로우(Row) 형태는 `id`, `hash_key`, `llm_result_text` 뿐입니다. 특정 유저(A)가 언제 태어났는지 역추적할 수 없습니다.

## What's intentionally not here

- **No Custom User Auth System.** 초기 MVP에서 로그인(Auth.js 등)은 의도적으로 배제합니다. 마찰(Friction) 없는 온보딩이 성공의 핵심이므로 카카오톡 로그인조차 묻지 않고 바로 생년월일을 받습니다. 인증이 필요한 커스텀 유료 결제(Phase 2)는 나중에 고민합니다.
- **No Client-side State Mess.** Redux나 Zustand 같은 무거운 상태 관리 매니저를 도입하지 않습니다. 온보딩 5스텝은 URL Params 혹은 가벼운 React Context만으로 끝냅니다.
- **No Python AI Backend.** LLM API를 호출하는 데 굳이 Python (FastAPI/Flask) 백엔드를 띄울 이유가 없습니다. Next.js 서버리스 함수로도 스트리밍(Streaming) 텍스트를 클라이언트로 밀어주는 역할이 완벽히 커버됩니다. 인프라 복잡도를 더하지 않습니다.
