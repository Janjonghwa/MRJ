"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Share2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function StepperForm() {
  const LOADING_MESSAGES = [
    "오행(木火土金水) 밸런스 패치 진행 중 ☯️...",
    "서버실에 향 피우고 있습니다 🙇‍♂️...",
    "타고난 팔자의 숨겨진 코드를 해독하고 있어요 📜",
    "올해 숨겨진 재물운을 영혼까지 끌어모으는 중... 💸",
    "내 팔자에 숨은 귀인 레이더망 가동 중 📡",
    "일 안 하고 돈 벌 방법이 있는지 분석 중입니다 🧐",
    "우주가 점지해 준 내 인연 언제 오나 탐색 중 👀",
    "명리학 빅데이터 베이스에 접속 중 🔌",
    "사주팔자 최적화 알고리즘 구동 중 ⚙️",
    "오아시스 같은 나의 휴식처는 어디일까 찾는 중 🏖️"
  ];

  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    gender: '',
    year: '2000',
    month: '1',
    day: '1',
    isLunar: false,
    hour: '', // 0-23
    mbti: '',
    category: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [result, setResult] = useState<{ reading: string; sajuData: any } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setLoadingMessageIndex(Math.floor(Math.random() * LOADING_MESSAGES.length));
      interval = setInterval(() => {
        setLoadingMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const prevStep = () => setStep(s => Math.max(0, s - 1));
  const nextStep = () => setStep(s => s + 1);

  const updateForm = (key: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const submitForm = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/saju', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gender: formData.gender,
          year: parseInt(formData.year),
          month: parseInt(formData.month),
          day: parseInt(formData.day),
          hour: formData.hour ? parseInt(formData.hour) : undefined,
          isLunar: formData.isLunar,
          mbti: formData.mbti,
          category: formData.category,
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '분석 중 오류가 발생했습니다.');

      setResult(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: '명리재(命理齋) - 나의 운명',
      text: '나의 사주와 MBTI로 보는 가장 소름 돋는 운명 해독 리포트를 확인해보세요!',
      url: window.location.origin,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('공유 취소됨', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.origin);
        alert('사주 링크가 클립보드에 복사되었습니다. 친구에게 공유해보세요!');
      } catch (err) {
        console.error('클립보드 실패', err);
      }
    }
  };

  const steps = [
    // Step 0: Intro
    <div key="step0" className="flex flex-col gap-8 2xl:gap-12 text-center items-center py-4 2xl:py-8">
      <div className="space-y-4 2xl:space-y-8">
        <h2 className="text-3xl 2xl:text-5xl font-serif text-[var(--color-hanok-accent)] leading-tight">과거의 지혜, 현대의 통찰</h2>
        <p className="text-lg 2xl:text-2xl text-white/80 font-sans leading-loose 2xl:leading-[2.5] break-keep">
          천 년의 통찰력이 담긴 명리학과<br />
          현대의 성향 분석 도구인 MBTI를 결합하여,<br />
          당신만이 가진 <span className="text-[var(--color-hanok-accent)] font-bold">고유한 강점과 잠재력</span>을 해독합니다.
        </p>
      </div>
      <button
        onClick={() => setStep(1)}
        className="mt-6 2xl:mt-10 w-full py-5 2xl:py-8 text-black font-bold text-lg 2xl:text-2xl tracking-widest rounded-xl bg-[var(--color-hanok-accent)] transition-all hover:brightness-110 shadow-[0_0_20px_rgba(229,192,123,0.3)] animate-pulse"
      >
        내 운명 분석하기
      </button>
    </div>,

    // Step 1: Gender
    <div key="step1" className="flex flex-col gap-6 2xl:gap-10 items-center">
      <h2 className="text-2xl 2xl:text-4xl text-white font-serif text-center">당신의 성별을 알려주세요</h2>
      <div className="flex gap-4 2xl:gap-6 w-full">
        {[
          { label: '남성', value: 'male' },
          { label: '여성', value: 'female' }
        ].map(g => (
          <button
            key={g.value}
            onClick={() => { updateForm('gender', g.value); setStep(2); }}
            className={`flex-1 py-4 2xl:py-6 rounded-xl border transition-all duration-300 font-serif text-lg 2xl:text-2xl tracking-wide ${formData.gender === g.value ? 'bg-[#E5C07B] text-black border-transparent shadow-[0_0_15px_rgba(229,192,123,0.4)]' : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-[#E5C07B]/50'}`}
          >
            {g.label}
          </button>
        ))}
      </div>
    </div>,

    // Step 2: Birthday
    <div key="step2" className="flex flex-col gap-6 2xl:gap-10">
      <h2 className="text-2xl 2xl:text-4xl text-white font-serif text-center">생년월일을 알려주세요</h2>
      <div className="flex flex-col gap-4 2xl:gap-6">
        <label className="flex items-center gap-2 text-sm 2xl:text-xl justify-end text-white/60 hover:text-white transition-colors cursor-pointer">
          <input type="checkbox" checked={formData.isLunar} onChange={(e) => updateForm('isLunar', e.target.checked)} className="accent-[var(--color-hanok-accent)] w-4 h-4 2xl:w-6 2xl:h-6" />
          음력입니다
        </label>
        <div className="grid grid-cols-3 gap-3 md:gap-4 2xl:gap-6">
          <div className="relative flex items-center">
            <input type="number" placeholder="YYYY" className="w-full p-4 2xl:p-6 pr-6 2xl:pr-8 bg-white/5 border border-white/10 rounded-xl text-center text-white 2xl:text-2xl placeholder-white/30 focus:outline-none focus:border-[var(--color-hanok-accent)] transition-colors" value={formData.year} onChange={e => updateForm('year', e.target.value)} />
            <span className="absolute right-3 md:right-4 2xl:right-6 text-white/40 text-xs md:text-sm 2xl:text-xl font-serif pointer-events-none">년</span>
          </div>
          <div className="relative flex items-center">
            <input type="number" placeholder="MM" min="1" max="12" className="w-full p-4 2xl:p-6 pr-6 2xl:pr-8 bg-white/5 border border-white/10 rounded-xl text-center text-white 2xl:text-2xl placeholder-white/30 focus:outline-none focus:border-[var(--color-hanok-accent)] transition-colors" value={formData.month} onChange={e => updateForm('month', e.target.value)} />
            <span className="absolute right-3 md:right-4 2xl:right-6 text-white/40 text-xs md:text-sm 2xl:text-xl font-serif pointer-events-none">월</span>
          </div>
          <div className="relative flex items-center">
            <input type="number" placeholder="DD" min="1" max="31" className="w-full p-4 2xl:p-6 pr-6 2xl:pr-8 bg-white/5 border border-white/10 rounded-xl text-center text-white 2xl:text-2xl placeholder-white/30 focus:outline-none focus:border-[var(--color-hanok-accent)] transition-colors" value={formData.day} onChange={e => updateForm('day', e.target.value)} />
            <span className="absolute right-3 md:right-4 2xl:right-6 text-white/40 text-xs md:text-sm 2xl:text-xl font-serif pointer-events-none">일</span>
          </div>
        </div>
        <button
          disabled={!formData.year || !formData.month || !formData.day}
          onClick={() => setStep(3)}
          className="mt-6 w-full py-4 2xl:py-6 text-black font-bold text-lg 2xl:text-2xl tracking-widest rounded-xl bg-[var(--color-hanok-accent)] disabled:opacity-30 disabled:grayscale transition-all hover:brightness-110"
        >
          다음으로
        </button>
      </div>
    </div>,

    // Step 3: Time
    <div key="step3" className="flex flex-col gap-6 2xl:gap-10">
      <h2 className="text-2xl 2xl:text-4xl text-white font-serif text-center">태어난 시간은 언제인가요?</h2>
      <div className="flex flex-col gap-4 2xl:gap-6">
        <select
          className="p-4 2xl:p-6 bg-black/60 border border-white/10 rounded-xl outline-none text-white 2xl:text-2xl focus:border-[var(--color-hanok-accent)] transition-colors appearance-none"
          value={formData.hour}
          onChange={e => updateForm('hour', e.target.value)}
        >
          <option value="" className="bg-zinc-900 text-white">모름</option>
          {Array.from({ length: 24 }).map((_, i) => (
            <option key={i} value={i} className="bg-zinc-900 text-white">{i}시 ({i}:00 ~ {i}:59)</option>
          ))}
        </select>
        <button
          onClick={() => setStep(4)}
          className="mt-6 w-full py-4 2xl:py-6 text-black font-bold text-lg 2xl:text-2xl tracking-widest rounded-xl bg-[var(--color-hanok-accent)] transition-all hover:brightness-110"
        >
          다음으로
        </button>
      </div>
    </div>,

    // Step 4: MBTI
    <div key="step4" className="flex flex-col gap-6 2xl:gap-10">
      <h2 className="text-2xl 2xl:text-4xl text-white font-serif text-center">마지막으로 MBTI를 선택해주세요</h2>
      <div className="grid grid-cols-4 gap-3 2xl:gap-5">
        {['ISTJ', 'ISFJ', 'INFJ', 'INTJ', 'ISTP', 'ISFP', 'INFP', 'INTP', 'ESTP', 'ESFP', 'ENFP', 'ENTP', 'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ'].map(m => (
          <button
            key={m}
            onClick={() => { updateForm('mbti', m); /* Do not auto-submit here directly to allow user to verify */ }}
            className={`p-3 2xl:p-5 text-sm 2xl:text-xl font-sans tracking-wider rounded-xl border transition-all ${formData.mbti === m ? 'bg-[var(--color-hanok-accent)] text-black font-bold border-transparent shadow-[0_0_10px_rgba(229,192,123,0.3)]' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-[var(--color-hanok-accent)]/50'}`}
          >
            {m}
          </button>
        ))}
      </div>
      <button
        disabled={!formData.mbti}
        onClick={() => setStep(5)}
        className="mt-6 w-full py-5 2xl:py-6 text-black font-bold text-lg 2xl:text-2xl tracking-widest rounded-xl bg-[var(--color-hanok-accent)] disabled:opacity-30 disabled:grayscale transition-all hover:brightness-110"
      >
        다음으로
      </button>
    </div>,

    // Step 5: Category
    <div key="step5" className="flex flex-col gap-6 2xl:gap-10">
      <h2 className="text-2xl 2xl:text-4xl text-white font-serif text-center">어떤 결과가 가장 궁금하신가요?</h2>
      <div className="grid grid-cols-2 gap-3 2xl:gap-5">
        {['☯️ 나의 기본 사주', '☀️ 오늘의 운세', '✨ 올해의 운세', '💼 취업 및 직무', '❤️ 연애 및 배우자', '💰 재물 및 투자', '🌿 건강 및 멘탈'].map((c, i) => (
          <button
            key={c}
            onClick={() => { updateForm('category', c); }}
            className={`p-4 2xl:p-6 text-center text-[15px] 2xl:text-xl font-sans tracking-tight rounded-xl border transition-all ${i === 0 ? 'col-span-2' : ''} ${formData.category === c ? 'bg-[var(--color-hanok-accent)] text-black font-bold border-transparent shadow-[0_0_10px_rgba(229,192,123,0.3)]' : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-[var(--color-hanok-accent)]/50'}`}
          >
            {c}
          </button>
        ))}
      </div>
      <button
        disabled={!formData.category}
        onClick={submitForm}
        className="mt-6 w-full py-5 2xl:py-6 text-black font-bold text-lg 2xl:text-2xl tracking-widest rounded-xl bg-[var(--color-hanok-accent)] disabled:opacity-30 disabled:grayscale transition-all hover:brightness-110"
      >
        분석 시작하기
      </button>
    </div>
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 2xl:py-24 gap-8 2xl:gap-12 w-full max-w-xl 2xl:max-w-3xl mx-auto">
        <Loader2 className="w-16 h-16 animate-spin text-[var(--color-hanok-accent)] drop-shadow-[0_0_15px_rgba(229,192,123,0.5)]" />
        <AnimatePresence mode="wait">
          <motion.h2
            key={loadingMessageIndex}
            initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
            transition={{ duration: 0.4 }}
            className="text-lg md:text-2xl 2xl:text-3xl font-serif text-white tracking-wide text-center"
          >
            {LOADING_MESSAGES[loadingMessageIndex]}
          </motion.h2>
        </AnimatePresence>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <h2 className="text-xl font-serif text-red-700">문제가 발생했습니다</h2>
        <p className="text-sm text-gray-600">{error}</p>
        <button onClick={() => { setError(null); }} className="px-6 py-2 border rounded-full">다시 시도</button>
      </div>
    );
  }

  if (result) {
    return (
      <div className="flex flex-col gap-16 2xl:gap-24 animate-in fade-in zoom-in-95 duration-1000 w-full max-w-6xl 2xl:max-w-[85rem] mx-auto">
        {/* Title Section - Cleaned up as requested */}
        <div className="text-center py-10">
          <h2 className="text-4xl md:text-6xl 2xl:text-[5.5rem] font-serif text-white tracking-tight">당신의 사주 해석</h2>
        </div>

        {/* Result Content Area - Truly Wide Editorial Layout */}
        <div className="bg-black/40 border border-white/10 rounded-[3rem] 2xl:rounded-[4rem] p-4 md:p-16 2xl:p-24 backdrop-blur-2xl shadow-2xl ring-1 ring-white/5">
          <div className="prose prose-invert prose-stone max-w-none font-sans leading-relaxed text-left text-white/90 px-4 md:px-0">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h3: ({ node, ...props }) => (
                  <h3 className="text-2xl md:text-4xl 2xl:text-5xl font-serif text-[var(--color-hanok-accent)] mt-16 2xl:mt-24 first:mt-0 mb-8 2xl:mb-12 pb-4 2xl:pb-6 border-b border-white/10 tracking-tight" {...props} />
                ),
                h4: ({ node, ...props }) => (
                  <h4 className="text-xl md:text-2xl 2xl:text-3xl font-bold text-white mt-12 2xl:mt-16 mb-6 2xl:mb-8 flex items-center gap-3 before:content-[''] before:w-1.5 2xl:before:w-2 before:h-6 2xl:before:h-8 before:bg-[var(--color-hanok-accent)] before:rounded-full" {...props} />
                ),
                p: ({ node, ...props }) => <p className="mb-8 2xl:mb-12 leading-[1.8] 2xl:leading-[2] break-keep text-[17px] md:text-lg 2xl:text-2xl text-white/80" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-none space-y-4 2xl:space-y-6 my-8 2xl:my-10 pl-0" {...props} />,
                li: ({ node, ...props }) => (
                  <li className="relative pl-8 2xl:pl-10 text-[17px] md:text-lg 2xl:text-2xl leading-relaxed 2xl:leading-[1.9] text-white/70 before:content-['•'] before:absolute before:left-0 before:text-[var(--color-hanok-accent)] before:font-black before:text-2xl 2xl:before:text-3xl" {...props} />
                ),
                strong: ({ node, ...props }) => <strong className="text-[var(--color-hanok-accent)] font-bold px-1" {...props} />,
                hr: () => <hr className="my-16 border-white/5" />,
              }}
            >
              {result.reading}
            </ReactMarkdown>
          </div>
        </div>
        <div className="flex flex-col gap-3 mt-8">
          <button onClick={handleShare} className="w-full py-4 flex flex-row items-center justify-center gap-2 text-black font-bold text-lg tracking-widest rounded-xl bg-[#E5C07B] transition-all hover:brightness-110 shadow-[0_0_15px_rgba(229,192,123,0.3)]">
            <Share2 className="w-5 h-5" /> 내 운세 공유하기
          </button>
          <button onClick={() => { setResult(null); setStep(5); }} className="w-full py-4 border border-[#E5C07B] text-[#E5C07B] font-bold tracking-widest rounded-xl hover:bg-[#E5C07B]/10 transition-all font-sans">
            다른 운세 골라보기
          </button>
          <button onClick={() => { setResult(null); setStep(0); }} className="w-full py-4 border border-white/20 text-white/70 rounded-xl hover:bg-white/10 hover:text-white transition-all tracking-wider font-sans">
            처음부터 다시 진입
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[500px] w-full max-w-xl 2xl:max-w-2xl mx-auto bg-black/30 backdrop-blur-xl rounded-3xl p-8 md:p-10 2xl:p-16 shadow-2xl border border-white/10 ring-1 ring-white/5">
      {step > 0 && (
        <div className="mb-2 flex justify-start">
          <button onClick={prevStep} className="py-2 text-xs tracking-widest text-[var(--color-hanok-accent)]/80 hover:text-[var(--color-hanok-accent)] transition-colors uppercase font-sans flex items-center gap-2">
            &larr; 이전
          </button>
        </div>
      )}
      <div className={step > 0 ? "pt-2 flex-grow flex flex-col justify-center" : "pt-8 flex-grow flex flex-col justify-center"}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {steps[step]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress Dots */}
      {step > 0 && (
        <div className="mt-auto pt-10 flex justify-center gap-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`w-2 h-2 rounded-full transition-all duration-500 ${step === i ? 'bg-[var(--color-hanok-accent)] w-6' : 'bg-white/20'}`} />
          ))}
        </div>
      )}
    </div>
  );
}
