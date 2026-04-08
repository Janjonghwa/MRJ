import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { calculateFourPillars } from 'manseryeok';

export const maxDuration = 60;

// Initialize clients safely
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Use Groq API Key and specific model name as requested
const apiKey = process.env.GROQ_API_KEY || '';
const apiUrl = "https://api.groq.com/openai/v1/chat/completions";
const modelId = "openai/gpt-oss-120b";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { gender, year, month, day, isLunar, hour, mbti, category } = body;

    const birthInfo = {
      year: Number(year),
      month: Number(month),
      day: Number(day),
      hour: (hour === undefined || hour === null || hour === '') ? 12 : Number(hour),
      minute: 0,
      isLunar: Boolean(isLunar),
    };

    const sajuResult = calculateFourPillars(birthInfo);
    const sajuHanja = sajuResult.toHanjaString();
    const sajuKorean = sajuResult.toString();

    const hashInput = `${gender}-${year}-${month}-${day}-${isLunar}-${hour}-${mbti}-${category || 'base'}-v2`;
    const cacheKey = crypto.createHash('sha256').update(hashInput).digest('hex');

    if (supabase) {
      try {
        const { data } = await supabase
          .from('SajuCache')
          .select('reading')
          .eq('cache_key', cacheKey)
          .single();

        if (data?.reading) {
          return NextResponse.json({
            reading: data.reading,
            sajuData: { hanja: sajuHanja, korean: sajuKorean }
          });
        }
      } catch (cacheErr) {
        console.warn('Cache read error:', cacheErr);
      }
    }




    // ============================================
    // 🔥 MZ 타겟 카테고리별 지시사항 (대폭 업그레이드)
    // ============================================
    let categoryInstruction = "";

    if (category?.includes("오늘")) {
      categoryInstruction = `오늘 운세를 시간대별로 쪼개서 분석해줘 (오전/오후/저녁).

반드시 포함할 것:
- "오늘의 럭키 아이템" (옷 색깔, 악세서리, 음식 등 구체적으로)
- "오늘 이거 하면 개이득" 행동 1가지
- "오늘 이건 ㄹㅇ 손절해" 피해야 할 것 1가지  
- "오늘의 메인 퀘스트" (오늘 꼭 해야 할 미션)
- "서브 퀘스트" (하면 좋은 것)
- "오늘 만나면 버프 받는 사람 유형" (예: 안경 쓴 사람, 검은 옷 입은 사람 등)

"좋을 수도 있어요" 같은 말 쓰면 탈락. 단정 지을 것.`;

    } else if (category?.includes("올해")) {
      categoryInstruction = `올해 운의 흐름을 분기별로 정리해줘.

반드시 포함할 것:
- "올해의 테마" (한 문장으로)
- "인생 버프 터지는 시기" TOP 2 (월 단위로 콕 집어서)
- "디버프 조심해야 할 시기" 1가지
- "올해 반드시 손절해야 할 것" (인간관계/습관/상황 중 1가지)
- "올해 레벨업 포인트" (성장할 수 있는 영역)
- "연말에 이거 달성하면 대성공" 구체적 목표 제시

월별로 주절주절 나열하지 말고, 핵심만 임팩트있게.`;

    } else if (category?.includes("취업") || category?.includes("커리어")) {
      categoryInstruction = `이 사주의 커리어 운을 찐으로 분석해줘.

반드시 포함할 것:
- "타고난 직무 DNA" (이 사람한테 찰떡인 분야 3가지)
- "절대 가면 안 되는 회사 유형" (조직문화, 업무스타일 등)
- "면접에서 쓸 수 있는 킬링 포인트" (이 사람만의 강점)
- "이직/취업 골든타임" (언제 넣어야 붙을 확률 높은지)
- "사수/동료 궁합" (어떤 유형이랑 일해야 시너지 나는지)
- "번아웃 주의보" (언제, 어떤 상황에서 터지기 쉬운지)
- "N잡/부업 추천" (이 사주한테 맞는 사이드 허슬)

"열심히 하면 됩니다" 같은 말 금지. 구체적 액션 위주로.`;

    } else if (category?.includes("연애") || category?.includes("배우자")) {
      const partnerGender = gender === 'male' ? '여자' : '남자';
      categoryInstruction = `이 사주의 연애 패턴을 낱낱이 까발려줘.

반드시 포함할 것:
- "연애 유형 진단" (집착형/쿨형/밀당형/올인형/귀차니즘형 등)
- "연애할 때 킬링 파트" (이 사람의 치명적 매력 포인트)
- "연애 레드플래그" (이 사람이 연애하면서 주의해야 할 본인의 습관)
- "이상형 스펙 공개" (${partnerGender} 기준):
  ㄴ 외형: 예상 키, 체형, 얼굴상(강아지상/고양이상/곰상 등), 패션스타일
  ㄴ 내면: 성격, 가치관, 대화 스타일
  ㄴ 직업군/라이프스타일
- "인연 터지는 시기" (연도/월 단위로)
- "어디서 만남?" (앱? 소개팅? 동호회? 등 구체적 채널)
- "이런 사람은 ㄹㅇ 거르세요" (상극인 유형)

"좋은 사람 만날 거예요" 이런 말 쓰면 0점.`;

    } else if (category?.includes("재물") || category?.includes("투자") || category?.includes("돈")) {
      categoryInstruction = `이 사주의 돈 복을 팩트로 분석해줘.

반드시 포함할 것:
- "재물 그릇 크기" (ㄹㅇ 솔직하게. 대박형? 꾸준형? 손에서 새는형?)
- "돈 버는 스타일" (본업 올인형/투잡형/투자형/로또형 등)
- "돈이 새는 구멍" TOP 2 (홧김소비? 지인찬스? 굿즈? 등)
- "재테크 궁합":
  ㄴ 찰떡: (주식? 부동산? 코인? 적금? 사업?)
  ㄴ 손절각: (이 사람이 손대면 안 되는 것)
- "돈복 터지는 시기" (언제 투자하면 개이득인지)
- "40대 예상 재정 상태" (지금 뭘 해야 그때 웃는지)
- "이번 달 돈 관련 조언" 1가지

"아끼면 됩니다" 이런 말 금지.`;

    } else if (category?.includes("건강") || category?.includes("멘탈")) {
      categoryInstruction = `이 사주의 건강/멘탈 상태를 진단해줘.

반드시 포함할 것:
- "타고난 체질" (오행 기반으로 약한 장기, 주의할 부위)
- "멘탈 유형" (유리멘탈/강철멘탈/롤러코스터형 등)
- "스트레스 받으면 나타나는 증상" (몸이 보내는 시그널)
- "이 사주 맞춤 운동법" (헬스? 필라테스? 러닝? 수영? 등)
- "힐링 루틴 추천" (이 사람한테 진짜 효과 있는 것)
- "멘탈 붕괴 시 응급처치법" (구체적 행동 1가지)
- "올해 건강 주의 시기" (언제 컨디션 난조 오는지)
- "추천 영양제/음식" 2가지

"푹 쉬세요" 같은 말 쓰면 탈락.`;

    } else if (category?.includes("인간관계") || category?.includes("대인")) {
      categoryInstruction = `이 사주의 인간관계 패턴을 분석해줘.

반드시 포함할 것:
- "관계 유형" (인싸/아싸/선택적 인싸/찐친 올인형 등)  
- "첫인상 vs 알고보면" (사람들이 처음에 오해하는 것)
- "찐친 조건" (이 사람이 진짜 마음 여는 기준)
- "인간관계 레드플래그" (이런 행동 하면 손절당함)
- "상극인 유형" (이 사람과 절대 안 맞는 사람 특징)
- "베프 궁합 MBTI" TOP 3
- "직장 상사/동료 궁합" (어떤 유형이랑 일하면 개꿀/지옥?)
- "가족관계 이슈" (있다면 어떻게 풀어야 하는지)
- "올해 인간관계 운" (새로운 인연? 기존 관계 정리?)`;

    } else {
      // 기본 종합운
      categoryInstruction = `이 사주+MBTI 조합을 종합 분석해줘.

반드시 포함할 것:
- "한 줄 요약" (이 사람을 한 문장으로)
- "타고난 먼치킨 포인트" TOP 3 (독보적 강점)
- "숨겨진 히든카드" (본인도 모르는 잠재력)
- "ㄹㅇ 찐 약점" (뼈 때리지만 피가 되는 팩폭)
- "지금 반복하고 있을 실수" 1가지
- "이번 달 운세 키워드" (한 단어로)
- "올해 가장 중요한 미션" 1가지
- "10년 후 예상 시나리오" (지금 뭘 하냐에 따라 갈리는 두 가지 경로)`;
    }

    const today = new Date();
    const currentDateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

    // ============================================
    // 🔥 MZ 타겟 메인 프롬프트
    // ============================================
    const prompt = `너는 "사주계의 유재석"이라 불리는 MZ 전문 사주 상담사야.
전통 명리학 지식은 빠삭하면서, MZ세대 말투와 감성을 완벽히 이해하고 있어.
재미있으면서도 소름 끼치게 정확한 분석으로 유명함.

[캐릭터 설정]
- 10년차 명리학 전문가 + 심리상담사 자격증 보유
- 인스타 팔로워 50만의 인플루언서
- "팩폭하지만 결국 응원해주는 언니/오빠" 포지션
- 절대 거짓 위로 안 함. 근데 상처 주려고 말하는 게 아니라 진심으로 도와주려는 느낌

오늘 날짜: ${currentDateStr}

[분석 대상]
- 성별: ${gender === 'male' ? '남자' : '여자'}
- 사주팔자: ${sajuHanja} / ${sajuKorean}
- MBTI: ${mbti.toUpperCase()}
- 요청 카테고리: ${category || '종합운'}

[말투 규칙] ⚠️ 이거 진짜 중요함
1. 한국어만 사용. 한자 절대 금지(MBTI 같은 영어 고유명사만 예외).
2. 마크다운 굵은 글씨(**)를 글머리 기호(-) 안에서 사용 금지.
3. <think> 같은 태그 출력 절대 금지.
4. 반말과 존댓말 적절히 섞어서 친근하게.
5. 이모지 적극 활용해서 가독성 높이기.
6. "~입니다", "~습니다"로 끝나는 딱딱한 문장 금지.
7. MZ 감성 단어 사용: 개이득, 손절, 럭키비키, 찐, 레전드, 갓생, 킹받다, 버프, 디버프, 레벨업 등
8. 근데 너무 억지로 유행어 쓰면 어색하니까 자연스럽게.
9. 모호한 표현 금지. "좋을 수도", "나쁠 수도" 이런 말 쓰면 0점.

[카테고리별 세부 지시]
${categoryInstruction}

[출력 형식] - 이 구조 반드시 지켜!

### 👤 프로필 분석
(이 사주+MBTI 조합을 재밌는 비유로 한 줄 요약)

### 🎯 찐 분석 리포트
(카테고리에 맞는 상세 분석. 위 지시사항 빠짐없이 포함)

### 🔮 이번 달 한 줄 예언
(이번 달 키워드를 임팩트있게 한 문장으로)

### ✅ 오늘부터 실천 리스트
- DO: (지금 당장 할 것 1가지)
- DON'T: (반드시 피할 것 1가지)
- LUCKY ITEM: (오늘의 행운 아이템)

### 💬 마지막 한 마디
(뼈 때리지만 결국 응원이 되는 마무리 멘트. 2~3문장)
`;

    const aiResponseFinal = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          {
            role: "system",
            content: "너는 MZ세대 감성을 완벽히 이해하는 사주 전문가야. 재밌고 임팩트있게 분석하되, 핵심은 정확하게 짚어줘. 한국어로만 답변해."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 2000,
      })
    });

    if (!aiResponseFinal.ok) {
      const errorData = await aiResponseFinal.json();
      console.error("API Error:", errorData);
      throw new Error("AI 생성 오류");
    }

    const result = await aiResponseFinal.json();
    let textReading = result.choices[0].message.content;

    textReading = textReading.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    if (supabase) {
      supabase
        .from('SajuCache')
        .insert([{ cache_key: cacheKey, reading: textReading }])
        .then(({ error }) => {
          if (error) console.error('Cache save error:', error);
        });
    }

    return NextResponse.json({
      reading: textReading,
      sajuData: {
        hanja: sajuHanja,
        korean: sajuKorean
      }
    });

  } catch (err: any) {
    console.error('Saju API Error:', err);
    return NextResponse.json({
      error: '앗, 우주의 기운이 잠시 흔들렸어요 🌀 다시 시도해주세요!'
    }, { status: 500 });
  }
}
