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
          .select('llm_result')
          .eq('hash_key', cacheKey)
          .single();

        if (data?.llm_result) {
          return NextResponse.json({
            reading: data.llm_result,
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
- #### 🎒 오늘의 럭키 아이템 (옷 색깔, 악세서리, 음식 등 구체적으로)
- #### 🎯 오늘 이거 하면 개이득 (꼭 해야 할 행동 1가지)
- #### 🚫 오늘 이건 ㄹㅇ 손절해 (피해야 할 것 1가지)
- #### 🏆 오늘의 메인 퀘스트 (오늘의 핵심 미션)
- #### 🛡️ 서브 퀘스트 (하면 좋은 행동)
- #### 🤝 버프 파트너 (오늘 만나면 버프 받는 사람 유형)

"좋을 수도 있어요" 같은 말 쓰면 탈락. 단정 지을 것.`;

    } else if (category?.includes("올해")) {
      categoryInstruction = `올해 운의 흐름을 분기별로 정리해줘.

반드시 포함할 것:
- #### 📅 올해의 전체 테마 (한 문장으로 임팩트 있게)
- #### 🚀 인생 버프 터지는 시기 TOP 2 (월 단위로 콕 집어서)
- #### ⚠️ 디버프 조심해야 할 시기 (주의할 기간)
- #### ✂️ 올해 반드시 손절해야 할 것 (인간관계/습관/상황 중 1가지)
- #### ⬆️ 올해 레벨업 포인트 (성장할 수 있는 영역)
- #### 🏁 연말 최종 목표 (구체적 지표 제시)

월별로 주절주절 나열하지 말고, 핵심만 임팩트있게.`;

    } else if (category?.includes("취업") || category?.includes("커리어")) {
      categoryInstruction = `이 사주의 커리어 운을 찐으로 분석해줘.

반드시 포함할 것:
- #### 🧬 타고난 직무 DNA (이 사람한테 찰떡인 분야 3가지)
- #### ❌ 빌런 회사 유형 (절대 가면 안 되는 회사 특징)
- #### 💎 면접 킬링 포인트 (이 사람만의 대체 불가능한 강점)
- #### ⏳ 이직/취업 골든타임 (합격 확률 가장 높은 시기)
- #### 👥 사수 및 팀 매칭 (어떤 유형이랑 일해야 시너지 나는지)
- #### 🏮 번아웃 주의보 (언제 멘탈 붕괴 오는지)
- #### 💰 N잡 및 사이드 허슬 추천 (이 사주 전용 부업)

"열심히 하면 됩니다" 같은 말 금지. 구체적 액션 위주로.`;

    } else if (category?.includes("연애") || category?.includes("배우자")) {
      const partnerGender = gender === 'male' ? '여자' : '남자';
      categoryInstruction = `이 사주의 연애 패턴을 낱낱이 까발려줘.

반드시 포함할 것:
- #### 💘 연애 유형 진단 (집착형/쿨형/밀당형/올인형 등)
- #### ⚡ 연애 킬링 파트 (이 사람의 치명적 매력 포인트)
- #### 🚩 연애 레드플래그 (주의해야 할 본인의 습관)
- #### 👤 이상형 스펙 공개 (${partnerGender} 기준):
  ㄴ **외형 (심층 분석)**: 
    - **키**: ${partnerGender === '남자' ? '172~192 사이' : '155~174 사이'}의 매우 구체적인 숫자 단 1개만 출력. (예: ${partnerGender === '남자' ? '176cm, 179cm, 182cm, 184cm' : '161cm, 164cm, 167cm, 169cm'} 등 매번 다르게). 단, 무조건 165, 170, 180 등 딱 떨어지는 숫자는 가장 피할 것!
    - **비주얼**: 동물상(해당 동물 이모지 같이 출력), 체형, 스타일을 생생하게 묘사
    - **내면**: 성격, 가치관, 대화 스타일의 확실한 캐릭터성
    - **라이프스타일**: 구체적이고 현대적인 직업 및 라이프스타일
    
    [💡 Few-Shot 예시 풀 (아래의 컨셉들을 참고해 사주와 어울리게 창의적으로 전개)]
    - 조합 1: 순둥한 대형견상 🐶 + 푸근하고 듬직한 체형 + 꾸안꾸 캐주얼룩 + 오지랖 넓은 해결사 + 성수동 로스터리 카페 사장
    - 조합 2: 츤데레 고양이상 🐱 + 슬림탄탄 잔근육 + 시크한 포멀 정장핏 + 완벽주의 팩트체커 + 여의도 펀드매니저
    - 조합 3: 매혹적인 여우상 🦊 + 글래머러스 체형 + 로맨틱 페미닌 + 뼈 때리는 현실주의자 + 다국적 IT기업 PM
    (위 예시처럼 '동물상+체형+스타일+성격+구체적 직업'을 아주 디테일하고 매력적으로 묘사할 것)
    
- #### 📅 인연 터지는 시기 (연도/월 단위로)
- #### 📍 어디서 만남? (구체적 만남의 장소나 채널)
- #### 🔞 이런 사람은 ㄹㅇ 거르세요 (상극인 유형)

"좋은 사람 만날 거예요" 이런 말 쓰면 0점.`;

    } else if (category?.includes("재물") || category?.includes("투자") || category?.includes("돈")) {
      categoryInstruction = `이 사주의 돈 복을 팩트로 분석해줘.

반드시 포함할 것:
- #### 💰 재물 그릇 크기 (솔직하게 진단)
- #### 💸 돈 버는 스타일 (이 사람 전용 수익 모델)
- #### 🕳️ 돈이 새는 구멍 TOP 2 (지출 원인 2가지)
- #### 📈 재테크 찰떡 vs 손절 (추천하는 투자와 피해야 할 투자)
- #### 🌊 돈복 터지는 골든 타임 (언제 투자할까요?)
- #### 🏰 40대 미래 재정 상태 (미래 시나리오)
- #### 💡 이번 달 짠테크 조언 1가지

"아끼면 됩니다" 이런 말 금지.`;

    } else if (category?.includes("건강") || category?.includes("멘탈")) {
      categoryInstruction = `이 사주의 건강/멘탈 상태를 진단해줘.

반드시 포함할 것:
- #### 🦴 타고난 체질 진단 (약한 장기나 주의 부위)
- #### 🧠 멘탈 유형 (멘탈 복원력 정도)
- #### 🚨 몸이 보내는 적신호 (스트레스 시그널)
- #### 🏋️ 사주 맞춤 운동 루틴 (헬스? 필라테스? 러닝? 수영? 등)
- #### 🛀 멘탈 케어 솔루션 (이 사람한테 진짜 효과 있는 것)
- #### 🏥 올해 건강 주의 시기 (컨디션 난조 올 달)
- #### 💊 추천 영양제 및 식단 2가지

"푹 쉬세요" 같은 말 쓰면 탈락.`;

    } else if (category?.includes("인간관계") || category?.includes("대인")) {
      categoryInstruction = `이 사주의 인간관계 패턴을 분석해줘.

반드시 포함할 것:
- #### 🎭 관계 속 포지션 (인싸/아싸/전략적 소외 등)
- #### 🌓 첫인상 vs 실체 (사람들이 오해하는 포인트)
- #### 🔐 찐친으로 가는 관문 (이 사람의 마음을 여는 기준)
- #### 💣 관계 손절 포인트 (이런 행동 하면 아웃)
- #### 🐉 피해야 할 상극 유형 (절대 안 맞는 사람 특징)
- #### 👯 베프 궁합 MBTI TOP 3
- #### 🏢 조직 내 인맥 관리 (직장 생존 전략)
- #### 📅 올해의 귀인 vs 빌런 시기`;

    } else {
      categoryInstruction = `이 사주+MBTI 조합을 종합 분석해줘.

반드시 포함할 것:
- #### 📜 한 줄 운명 요약 (이 사람을 정의하는 한 문장)
- #### 🔨 타고난 먼치킨 포인트 TOP 3 (독보적 강점)
- #### 🃏 숨겨진 히든카드 (본인도 모르는 잠재력)
- #### 🥊 ㄹㅇ 뼈 때리는 팩폭 (고쳐야 할 치명적 약점)
- #### 🔄 지금 반복 중인 실수 (빠져나와야 할 굴레)
- #### 🗝️ 이번 달 운세 키워드
- #### 🏔️ 올해 가장 중요한 메인 퀘스트
- #### 🎬 10년 후 미래 시나리오`;
    }

    const today = new Date();
    const currentDateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

    // ============================================
    // 🔥 MZ 타겟 메인 프롬프트
    // ============================================
    const prompt = `너는 사주 빅데이터를 해독하여 MZ세대 감성으로 전달하는 '명리재(命理齋)'의 힙한 AI 사주 해석 엔진이야.
사람인 척(예: 인간 인플루언서, 상담사) 하지 말고, 객관적인 시스템이면서도 센스 넘치고 트렌디한 디지털 인사이트 포지션을 유지해.

[캐릭터 설정]
- 정체성: 수십만 건의 사주 데이터를 분석하는 차갑지만 예리한 최첨단 AI. (절대 사람 행세 금지)
- 톤앤매너: 군더더기 없는 팩트 폭격. 그러나 딱딱하지 않고 MZ 유행어와 재밌는 비유를 자유자재로 구사.
- 스탠스: 쓸데없는 희망고문이나 불필요한 감정 이입("제가 봐드릴게요", "언니가 말야" 식의 화법) 없이, 통찰력 있는 브리핑 모드.

오늘 날짜: ${currentDateStr}

[분석 대상]
- 성별: ${gender === 'male' ? '남자' : '여자'}
- 사주팔자: ${sajuHanja} / ${sajuKorean}
- MBTI: ${mbti.toUpperCase()}
- 요청 카테고리: ${category || '종합운'}

[말투 규칙] ⚠️ 이거 진짜 중요함
1. 한국어만 사용. 한자 절대 금지(MBTI 같은 영어 고유명사만 예외).
2. 마크다운 굵은 글씨(**)는 내가 강조하라고 지정한 항목(예: **키**, **비주얼**, **내면**, **라이프스타일**, **DO**, **DON'T** 등)에만 정확히 사용해. 일반 문장 중간에 아스테리스크를 막 쓰면 절대 안 돼.
3. <think> 같은 태그 출력 절대 금지.
4. 반말과 존댓말 적절히 섞어서 친근하게.
5. 이모지 적극 활용해서 가독성 높이기 (단, 한 문장에 3개 이상 남발 금지).
6. "~입니다", "~습니다"로 끝나는 딱딱한 문장 금지.
7. MZ 감성 단어 사용: 개이득, 손절, 갓생, 킹받다, 버프, 디버프, 레벨업 등.
8. 모호한 표현 금지. "좋을 수도", "나쁠 수도" 이런 말 쓰면 0점. 단정 지어서 말할 것.
9. 되도록 예시와 동일한 출력보단 창의적이고 독창적인 결과물을 만들어줘.

[마크다운 스타일 가이드]
- **절대 주의**: 데이터 나열 금지. 분석 내용 첫머리에 사주팔자를 그대로 나열하지 말 것.
- 섹션 제목은 ### 사용.
- 상세 항목 제목은 #### 사용 (예: #### 💡 이직 골든타임).
- 불렛 포인트는 반드시 '-' 기호만 사용. (•, *, ㄴ 사용 금지).
- 들여쓰기가 필요한 경우 '-' 앞에 공백 2개를 넣어 계층 구조를 명확히 할 것.

[카테고리별 세부 지시]
${categoryInstruction}

[출력 형식] - 이 구조 반드시 지켜!

### 👤 당신의 프로필 분석
(이 사주+MBTI 조합을 재밌는 비유로 한 줄 요약)

### 🎯 찐 분석 리포트
(카테고리에 맞는 상세 분석. 위 지시사항 빠짐없이 포함)

### 🔮 이번 달 한 줄 예언
(이번 달 키워드를 임팩트있게 한 문장으로)

### ✅ 오늘부터 실천 리스트
- **DO**: (지금 당장 할 것 1가지)
- **DON'T**: (반드시 피할 것 1가지)
- **LUCKY ITEM**: (오늘의 행운 아이템)

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
        temperature: 0.7,
        max_tokens: 2200,
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
        .insert([{ hash_key: cacheKey, llm_result: textReading }])
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
