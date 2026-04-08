import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { calculateFourPillars } from 'manseryeok';

export const maxDuration = 60; // Vercel 서버 타임아웃 60초로 연장

// Initialize clients safely
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Allow using either GEMINI_API_KEY variable (if they just swapped string) or OPENROUTER_API_KEY
const apiKey = process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || '';

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

    let categoryInstruction = "";
    if (category?.includes("오늘")) {
      categoryInstruction = `오전/오후/저녁 시간대별로 오늘의 기운을 쪼개서 분석하세요. 
"오늘 이거 하면 개이득", "이건 절대 하지 마세요" 식으로 
당장 따라할 수 있는 행운 아이템·장소·행동을 콕 집어 말하세요.
모호한 말 쓰면 실패입니다.`;

    } else if (category?.includes("올해")) {
      categoryInstruction = `올해 운의 흐름을 월별로 잡되, 
반드시 "올해 절대 놓치면 안 되는 타이밍 TOP 2"와 
"올해 이 사람/상황은 거르세요" 1가지를 명확히 짚어주세요.
"좋을 수도 있어요" 같은 말은 금지. 단정 지을 것.`;

    } else if (category?.includes("취업")) {
      categoryInstruction = `직무 추천은 기본이고, 
이 사주가 버티는 직장 환경 vs 도망쳐야 할 환경을 구분해서 알려주세요.
"이 달에 지원하면 합격 확률 올라가요" 식으로 시기도 콕 집어주세요.
면접장에서 써먹을 수 있는 이 사람만의 무기도 1가지 짚어주세요.`;

    } else if (category?.includes("연애") || category?.includes("배우자")) {
      const partnerGender = gender === 'male' ? '여성' : '남성';
      categoryInstruction = `이 사람의 연애 패턴(집착형/쿨형/밀당형 등)을 정확히 짚고,
앞으로 만날 파트너(${partnerGender})의 외적·내적 특징을 
머릿속에 바로 그려질 만큼 구체적으로 묘사하세요.
(예: 예상 키, 체형, 얼굴상[강아지상/고양이상 등], 분위기, 직업군)
"언제쯤 만나게 되는지" 시기도 반드시 포함하세요.`;

    } else if (category?.includes("재물") || category?.includes("투자")) {
      categoryInstruction = `이 사주의 재물 그릇 크기부터 솔직하게 말하고,
돈이 새는 구체적인 약점(예: 홧김 비용, 지인 보증 등)을 팩폭하세요.
재테크 성향(단타형/장기형/부동산형 등)과 
"돈이 터지는 시기"를 구체적으로 알려주세요.`;

    } else if (category?.includes("건강") || category?.includes("멘탈")) {
      categoryInstruction = `타고난 신체 약점과 멘탈 취약 패턴을 직접적으로 짚고,
이 사람에게 실제로 맞는 운동법과 힐링 루틴을 구체적으로 제안하세요.
"멘탈 터졌을 때 응급처치법" 1가지도 반드시 포함하세요.
뜬구름 잡는 "마음을 편히 하세요" 같은 말은 금지.`;

    } else {
      categoryInstruction = `이 사주+MBTI 조합이 가진 독보적인 강점 3가지를 압축해서 말하고,
지금 이 사람이 반복하고 있을 가장 큰 실수 1가지를 
뼈 때리지만 피가 되는 방식으로 팩폭하세요.`;
    }

    const today = new Date();
    const currentDateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

    const prompt = `당신은 '명리재'의 독설 명리학자입니다. 
틀린 말 한마디 없지만 뼈 때리는 직언으로 유명합니다.
(오늘 기준일: ${currentDateStr})

아래 사주팔자를 보고 **${category || '기본 사주'}** 리포트를 써주세요.
거짓 위로, 뜬구름 잡는 소리, AI 냄새 나는 말투 절대 금지.

[사용자 정보]
- 성별: ${gender === 'male' ? '남성' : '여성'}
- 사주팔자: ${sajuHanja} / ${sajuKorean}
- MBTI: ${mbti.toUpperCase()}

[말투 규칙 - 이게 핵심임]
- 유튜브 쇼츠 자막 스타일. 짧고 강하게.
- 존댓말 쓰되 팩폭은 세게. (~해요체 유지하되 핵심은 직격탄)
- 오글거리는 한자어, 시적 표현 쓰면 실패임
- "~할 수 있어요" 같은 애매한 말 금지. 단정 지어서 말할 것.
- 이모지 1~2개만. 남발 금지.
- 마크다운 볼드(**) 글머리 기호 안에서 절대 사용 금지
- <think> 등 사고과정 절대 출력 금지. 한국어만.

[카테고리별 핵심 지시]
${categoryInstruction}

[출력 형식 - 반드시 준수]
### 🔮 한 줄 핵심 팩폭
- (이 사주의 본질을 1~2줄로. 듣는 순간 "ㄷㄷ"할 만큼 정확하게)

### 📊 상세 해부
- (분석 1 - 구체적 수치나 시기 포함하면 신뢰도 올라감)
- (분석 2 - 이 사람의 패턴/습관/약점 콕 집어서)
- (분석 3 - 주변 사람/환경과의 관계 포함)

### 💡 지금 당장 할 것 vs 하지 말 것
- 할 것: (오늘부터 바로 적용 가능한 행동 1가지)
- 하지 말 것: (이 사주가 반드시 피해야 할 함정 1가지)
`;

    const aiResponseFinal = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b", // OpenRouter의 GPT-OSS 120B 모델로 변경
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      })
    });

    if (!aiResponseFinal.ok) {
      const errorData = await aiResponseFinal.json();
      console.error("Groq API Error:", errorData);
      throw new Error("AI 생성 오류 (Groq)");
    }

    const result = await aiResponseFinal.json();
    let textReading = result.choices[0].message.content;

    // Remove any <think> tags and their contents that Qwen/Reasoning models might erroneously output
    textReading = textReading.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

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
