# 🌙 명리재 (命理齋) - Digital Hanok Saju

> 당신의 사주와 MBTI가 그리는 단 하나의 이야기.
> 현대적인 UI/UX와 전통 명리학, 그리고 AI가 결합된 프리미엄 초개인화 사주 분석 웹 애플리케이션입니다.

<img width="2520" height="1276" alt="image" src="https://github.com/user-attachments/assets/b0784e09-50b3-4035-bdaa-4e7e571133a6" />

---

## 📖 목차
- [프로젝트 소개](#-프로젝트-소개)
- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [환경 변수 설정](#-환경-변수-설정)
- [설치 및 실행](#-설치-및-실행)
- [프로젝트 구조](#-프로젝트-구조)

---

## 📌 프로젝트 소개
**명리재(命理齋)** 는 딱딱하고 복잡한 기존의 명리학 서비스를 벗어나, **'디지털 한옥'** 특유의 정적이고 고급스러운 디자인을 제공하는 사주 분석 서비스입니다. 
사용자의 생년월일, 태어난 시간뿐만 아니라 **MBTI**를 결합하여 개개인의 성향에 맞춘 입체적인 분석을 고도화된 AI(LLM)를 통해 제공합니다. 

단순히 사주를 보는 것에 그치지 않고, 인스타그램 스토리 공유 및 지인과의 연결(궁합 등)을 유도하는 **바이럴 루프(Viral Loop)** 시스템이 내장되어 있어 사용자 간 자연스러운 확산을 돕습니다.

---

## ✨ 주요 기능
- **대화형 온보딩 (1 Screen 1 Question):** 유저의 인지 부하를 최소화하기 위해 한 화면에 하나의 질문만 표시하는 부드러운 스텝퍼(Stepper) 폼 UI 적용.
- **정밀한 융합 분석 (만세력 + AI):** 내장된 `manseryeok` 로직으로 명식을 추출하고, Google Generative AI(Gemini)를 통해 사주 오행과 MBTI를 결합한 흡입력 있는 스토리텔링 리포트 생성.
- **프리미엄 UI/UX (Digital Hanok):** 여백의 미, 부드러운 페이드 트랜지션, 그리고 전통적인 모티브(수묵화, 윤도, 오행 심볼 등)를 세련되게 살린 애니메이션 뷰.
- **다이내믹 소셜 공유 (Dynamic OG Image):** Vercel API를 활용하여 유저 개인의 오행 및 결과 키워드가 합성된 동적 OpenGraph(OG) 이미지를 생성하여 카카오톡, 인스타그램 등에 최적화된 공유 경험 제공.
- **바이럴 궁합 풀이 루프:** 공유된 링크를 통해 유입된 지인이 본인의 정보를 입력하면, 원작성자와 다각도로 분석된 특별 궁합 리포트를 제공하여 신규 유저 유입을 강력하게 창출.

---

## 🛠 기술 스택
### Frontend
- **Framework:** [Next.js 16 (App Router)](https://nextjs.org/)
- **Library:** [React 19](https://react.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Animation:** [Framer Motion](https://www.framer.com/motion/)
- **State Management:** [Zustand 5](https://zustand-demo.pmnd.rs/)
- **Icons:** [Lucide React](https://lucide.dev/)

### Backend & AI
- **Database / ORM:** [PostgreSQL (Supabase)](https://supabase.com/), [Prisma](https://www.prisma.io/)
- **AI Integration:** [Groq Cloud](https://groq.com/) (Llama 3.3 70B Versatile)
- **Fortune / Logic Engine:** `manseryeok` 

---

## ⚙️ 환경 변수 설정
프로젝트를 로컬 환경에서 실행하려면 루트 디렉토리에 `.env.local` 파일을 생성하고 다음 변수들을 설정해야 합니다.

```env
# Database 연동 (Supabase / Prisma)
DATABASE_URL="postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE_NAME]?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE_NAME]"

# Groq API Key
GROQ_API_KEY="your_groq_api_key_here"

# 배포된 사이트 URL (OG 이미지 및 공유 링크 생성용)
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

---

## 🚀 설치 및 실행

1. **저장소 클론하기**
```bash
git clone https://github.com/your-username/saju2.git
cd saju2
```

2. **의존성 패키지 설치하기**
```bash
npm install
```

3. **데이터베이스 스키마 푸시 (Prisma)**
```bash
npx prisma db push
```

4. **로컬 개발 서버 실행하기**
```bash
npm run dev
```

5. **브라우저 접속**
서버가 성공적으로 실행되면 [http://localhost:3000](http://localhost:3000)에서 앱을 확인할 수 있습니다.

---

## 📁 프로젝트 핵심 구조
```text
saju2/
├── docs/                     # 기획서, UX 플로우 및 설계 문서 모음
├── prisma/                   # 데이터베이스 스키마(schema.prisma) 파일
├── src/
│   ├── app/                  # Next.js App Router (페이지, API 라우트, OG 라우트 등)
│   ├── components/           # 재사용 가능한 공통 UI 컴포넌트
│   ├── lib/                  # 유틸리티, DB 클라이언트 세팅 및 코어 로직
│   └── ...
├── tailwind.config.ts        # Tailwind CSS 커스텀 (디지털 한옥 테마 컬러 등)
└── package.json
```
