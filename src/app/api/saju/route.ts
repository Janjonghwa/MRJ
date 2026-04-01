import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { calculateFourPillars } from 'manseryeok';

export const maxDuration = 60; // Vercel 서버 타임아웃 60초로 연장

// Initialize clients safely
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Allow using either GEMINI_API_KEY variable (if they just swapped string) or GROQ_API_KEY
const groqApiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || '';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { gender, year, month, day, isLunar, hour, mbti, category } = body;

    // 1. Calculate Saju (Four Pillars)
    const birthInfo = {
      year: Number(year),
      month: Number(month),
      day: Number(day),
      hour: (hour === undefined || hour === null || hour === '') ? 12 : Number(hour), // fallback hour if unknown
      minute: 0,
      isLunar: Boolean(isLunar),
    };

    const sajuResult = calculateFourPillars(birthInfo);
    const sajuHanja = sajuResult.toHanjaString();   // e.g. "甲子년 乙丑월 丙寅일 丁卯시"
    const sajuKorean = sajuResult.toString();       // e.g. "갑자년 을축월 병인일 정묘시"

    // 2. Generate Cache Key
    const hashInput = `${gender}-${year}-${month}-${day}-${isLunar}-${hour}-${mbti}-${category || 'base'}`;
    const cacheKey = crypto.createHash('sha256').update(hashInput).digest('hex');

    // 3. Check Supabase Cache
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('SajuCache')
          .select('reading')
          .eq('cache_key', cacheKey)
          .single();

        if (data && data.reading) {
          return NextResponse.json({
            reading: data.reading,
            sajuData: { hanja: sajuHanja, korean: sajuKorean }
          });
        }
      } catch (cacheErr) {
        console.warn('Cache read error (table might not exist):', cacheErr);
      }
    }

    // 4. Generate Reading via Groq

    let categoryInstruction = "";
    if (category?.includes("오늘")) {
        categoryInstruction = "오늘 하루의 기운을 시간대별(오전/오후/저녁)로 쪼개어 분석하고, 오늘 하루 도파민을 채워줄 구체적인 행운의 아이템, 추천하는 장소나 먹거리, 조심해야 할 사소한 행동까지 2030 세대가 당장 따라해볼 수 있는 매우 디테일한 하루 가이드를 제공하세요.";
    } else if (category?.includes("올해")) {
        categoryInstruction = "올해 전체적인 운의 흐름을 월별 포인트(터닝포인트가 되는 특정 달 지정)로 나누어 설명하고, 특히 '올해 절대 놓치면 안 될 3가지 대박 기회'와 '절대 피해야 할 1가지 똥차(사람/상황)'를 명확히 짚어주어 청년층의 과몰입을 유발하는 디테일한 연간 분석을 제공하세요.";
    } else if (category?.includes("취업")) {
        categoryInstruction = "단순한 직무 추천을 넘어, '나와 찰떡궁합인 직장 분위기(워라밸 vs 빡센 성장)', '면접 프리패스를 부르는 나만의 면접장 무기', '이직/합격 운이 폭발하는 구체적인 시기(N월 등)'를 반드시 포함하여 취준생과 주니어 직장인이 열광할 만한 소름 돋는 커리어 통찰을 제공하세요.";
    } else if (category?.includes("연애") || category?.includes("배우자")) {
        const partnerGender = gender === 'male' ? '매력적인 여성' : '매력적인 남성';
        categoryInstruction = `나의 연애 스타일과 만남이 예상되는 시기/환경(동호회, 모임, 온라인 등)을 분석하고, 특히 앞으로 만나게 될 **찐 파트너(${partnerGender})의 구체적인 외적/내적 특징(예: 예상되는 키, 체형, 얼굴상[강아지상/고양이상 등], 패션 스타일 등 머릿속에 바로 그려질 만큼 상세한 외모 및 분위기 묘사)**을 반드시 짚어주어 과몰입을 유발하는 연애 인사이트를 제공하세요.`;
    } else if (category?.includes("재물") || category?.includes("투자")) {
        categoryInstruction = "타고난 재물 그릇의 크기와 함께, '나의 돈이 줄줄 새는 구체적인 취약점(예: 홧김 비용, 탕진잼 등)', '대박이 날 수 있는 나만의 재테크 성향(단타형 vs 장기안정형 vs 리스크 선호형)', '재물운이 터지는 구체적 시기와 조력자 특징'을 낱낱이 파헤쳐 자산 증식에 실질적 도움이 되는 도파민 폭발 금전운을 분석하세요.";
    } else if (category?.includes("건강") || category?.includes("멘탈")) {
        categoryInstruction = "나의 선천적인 신체 약점과 특유의 멘탈 취약점(유리멘탈, 번아웃, 과호흡 등)을 짚고, 이를 타파하기 위해 '나에게 찰떡인 구체적인 운동법(필라테스, 홈트, 등산 등)'과 '최고의 힐링 루틴', 그리고 멘탈이 붕괴됐을 때 응급 처치법을 디테일하게 제공하세요.";
    } else {
        categoryInstruction = "사주와 MBTI가 결합된 나만의 찐 정체성과 독보적인 무기를 3가지로 압축해 설명하고, 현생(현실)을 살아가는 데 있어 뼈 때리지만 피가 되고 살이 되는 팩트 폭격 조언을 구체적인 예시와 함께 날려주세요.";
    }

    const prompt = `당신은 최고급 디지털 한옥 '명리재(命理齋)'를 운영하는 수석 명리학자이자 현대 심리학자입니다.
사용자 정보(사주팔자+MBTI)를 바탕으로, [ ${category || '나의 기본 사주'} ]에 맞춘 운명 해독 리포트를 작성해주세요.

[사용자 정보]
- 성별: ${gender === 'male' ? '남성' : '여성'}
- 사주팔자: ${sajuHanja} (${sajuKorean})
- MBTI: ${mbti.toUpperCase()}
- 분석 주제: ${category || '나의 기본 사주'}

[작성 가이드라인 - 매우 중요]
1. 내용이 장황하거나 이해하기 어렵지 않도록 **매우 간결하고 직관적인 MZ세대 맞춤형 현대적 어투**를 사용하세요. (어려운 한자어, 시적인 은유 절대 금지)
2. '명리재'의 품격 있는 존댓말(~해요, ~입니다)을 유지하되, 핵심을 팩트 폭격하듯 정확히 찌르는 실용적인 조언을 하세요.
3. ${categoryInstruction}
4. AI가 작성한 티가 나지 않도록, 글머리 기호 안에서 **굵은 글씨(**마크다운)** 형식(예: **장점:**)을 절대 사용하지 마세요. 자연스러운 한 문장으로 부드럽게 쓰세요.
5. 반드시 아래의 마크다운 구조와 글머리 기호(-)를 엄격히 지켜서 짧고 임팩트 있게 작성하세요. (도입부 인사말 등 군말 절대 생략)

[출력 구조]
### 🔮 명리재 핵심 코멘트
- (${category || '나의 기본 사주'}와 관련된 핵심 운을 1~2줄로 알기 쉽게 요약)

### 📊 이모저모 상세 분석
- (주제와 관련된 직관적인 분석 내용 1)
- (주제와 관련된 직관적인 분석 내용 2)
- (주제와 관련된 직관적인 분석 내용 3)

### 💡 명리재의 행동 처방 (팁)
- (뜬구름 잡는 소리 제외하고 당장 적용할 수 있는 구체적인 액션 플랜 1)
- (장점은 키우고 위험은 피하는 실전 팁 2)
`;

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      })
    });

    if (!groqResponse.ok) {
      const errorData = await groqResponse.json();
      console.error("Groq API Error:", errorData);
      throw new Error("AI 생성 오류 (Groq)");
    }

    const result = await groqResponse.json();
    const textReading = result.choices[0].message.content;

    // 5. Save to Supabase (Fire and forget)
    if (supabase) {
      supabase
        .from('SajuCache')
        .insert([{ cache_key: cacheKey, reading: textReading }])
        .then(({ error }) => {
          if (error) console.error('Cache save error:', error);
        });
    }

    // 6. Return response
    return NextResponse.json({
      reading: textReading,
      sajuData: {
        hanja: sajuHanja,
        korean: sajuKorean
      }
    });

  } catch (err: any) {
    console.error('Saju API Error:', err);
    return NextResponse.json({ error: '운명 해독 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }, { status: 500 });
  }
}
