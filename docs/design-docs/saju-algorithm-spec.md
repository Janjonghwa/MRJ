# Saju Algorithm Spec

## 1. Problem
명리학 연산(만세력)은 수학적/천문학적 결정론이 필요합니다. LLM에 생년월일을 주고 "사주를 뽑으라"고 하면 환각(Hallucination)으로 기둥을 틀리게 세웁니다. 반대로, 하드코딩된 템플릿 문장으로 사주 리포트를 출력해 주면 유저가 읽다가 지루해서 이탈합니다. 결론: **계산은 코드가 100% 담당하고, 윤색(Empathy)만 LLM이 담당해야 합니다.**

## 2. Approach: The 3-Stage Pipeline

```
[UI / Client]
      │ POST { year, month, day, time_code, is_lunar, mbti }
      ▼
[Stage 1: Deterministic Engine] (JS 오픈소스 만세력 라이브러리)
      │ 
      │ => Returns: { saju_hash, stems, branches, dayMaster, elements }
      ▼
[Stage 2: The Cache Wall] (Supabase)
      │ SELECT result_md FROM SajuCache WHERE hash = $1
      │
      ├── (HIT) ───────────┐ => 0.1s. Return cached MD.
      │                    │
      └── (MISS) ─┐        │ 
                  ▼        │
[Stage 3: LLM Generation]  │ (OpenAI GPT-4o-mini)
                  │        │ Prompt injection. Timeout 10s.
                  ▼        │
[DB Write] ───────┘        │ => INSERT INTO SajuCache
                  │        │
                  ▼        ▼
           [Returns Markdown String]
```

## 3. Data Flow & Shadow Paths (에러 파이프라인)

입력값(생년월일)부터 LLM 응답까지의 데이터 플로우는 4가지 경로(Happy / 3 Shadow)를 가집니다.

* **Happy Path:** 유저가 올바른 생년월일과 MBTI를 입력 → 캐시 조회 → LLM 연산 → 결과 노출. (3~5초)
* **Shadow Path 1 (무효한 / 누락된 날짜 Input):** `ValidationError`. 존재하지 않는 날짜(예: 2월 30일). 프론트엔드 Zod 스키마에서 1차 차단. 백엔드에서 400 Bad Request 에러 반환.
* **Shadow Path 2 (OpenAI API 타임아웃/500):** `LlmAPIError`. 연말/연초 OpenAI 서버 스파이크 발생. Vercel Route Handler에 10초 `AbortController` 적용. 10초 초과 시 캐시에 `null` 저장 없이 "서버가 혼잡합니다. 10초 뒤 다시 시도해 주세요." Exception 반환. 조용히 터지는 Silent Failure 방지.
* **Shadow Path 3 (시간 모름 엣지 케이스):** 유저가 `태어난 시간 모름` 선택. `time_code = "unknown"`. 만세력 엔진은 삼주육자(6글자)만 반환. 해시 충돌 방지를 위해 "시간미상" 파라미터를 명시적으로 Hash String에 포함하여 다른 결과와 격리.

## 4. Hash Key Design

캐시벽(Cache Wall)을 뚫고 들어오는 중복 연산을 제거하는 암호화 키입니다.

```javascript
const rawString = `${year}-${month}-${day}-${time_code}-${is_lunar}-${mbti}-${category}`;
const hashKey = crypto.createHash('sha256').update(rawString).digest('hex');
```

## 5. System Prompt Constraints

GPT-4o-mini가 엉뚱한 대답을 하지 못하도록 프롬프트에 하드 제약(Hard limits)을 겁니다.

* **금칙어:** "사주에 ~가 많습니다", "음양오행", "태어난 시간이 불분명하네요" (기계적인 문구 금지).
* **의무어:** 리포트 3문단 중 마지막 문단은 반드시 구체적인 '행동 지침(Actionable Advice)'으로 끝맺음. 
* **구조 강제:** JSON이 아닌 `Markdown` 포맷으로 즉시 렌더링 가능한 Text만 반환하도록 강제.

## 6. What needs to happen next
1. 깃허브에서 검증된 JS 만세력 라이브러리(`q-saju` 등) 포크 혹은 클론 후 내부 유틸리티 로직으로 편입 테스트 (`npm run test:saju`).
2. Supabase SQL 에디터에서 `SajuCache` 테이블 마이그레이션 생성.
