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
      <div className="z-10 w-full max-w-7xl mt-8 md:mt-20 px-4">
        <header className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-serif text-[var(--color-hanok-accent)] mb-6 tracking-normal drop-shadow-lg leading-tight">
            명리재<br/>
            <span className="text-3xl md:text-5xl opacity-80">(命理齋)</span>
          </h1>
          <p className="text-sm md:text-base font-sans tracking-[0.3em] text-white/70 uppercase">천 년의 데이터로 당신의 잠재력을 해독합니다</p>
        </header>

        {/* StepperForm will now manage its own internal spacing and card style */}
        <StepperForm />
      </div>
    </main>
  );
}
