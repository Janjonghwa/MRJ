import StepperForm from '@/components/StepperForm';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-6 lg:p-24 relative overflow-hidden bg-black text-[var(--color-hanok-text)]">
      
      {/* Video Background (User provided or fallback to nature placeholder) */}
      <video 
        autoPlay 
        loop 
        muted 
        playsInline 
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      >
        <source src="/hanok-bg.mp4" type="video/mp4" />
      </video>
      
      {/* Cinematic Dark Overlay */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black/80 via-black/60 to-black/90 z-0" />

      {/* Main Content */}
      <div className="z-10 w-full max-w-lg mt-12 md:mt-24">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif text-[var(--color-hanok-accent)] mb-4 tracking-normal drop-shadow-lg">명리재(命理齋)</h1>
          <p className="text-sm font-sans tracking-[0.2em] md:tracking-[0.3em] text-white/70 uppercase">천 년의 데이터로 당신의 잠재력을 해독합니다</p>
        </header>

        {/* Premium Glassmorphism Container */}
        <section className="bg-black/30 backdrop-blur-xl rounded-3xl p-8 md:p-10 shadow-2xl border border-white/10 ring-1 ring-white/5">
          <StepperForm />
        </section>
      </div>
    </main>
  );
}
