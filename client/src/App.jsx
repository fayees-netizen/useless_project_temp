import { useState, useRef, useEffect } from 'react';

const MAX_CHARS = 800;
const PLACEHOLDER_NOTE =
  "The doctor is in. Paste a snippet below and describe what's been troubling it lately.";

const PERSONAS = [
  {
    id: 'empathetic',
    name: 'The Empathetic Therapist',
    icon: '🛋️',
    tagline: 'Aggressively tender',
    soft: '#DCEEFF',
    radius: 'rounded-[26px_10px_26px_10px]',
  },
  {
    id: 'techLead',
    name: 'The Devastated Tech Lead',
    icon: '😫',
    tagline: 'Dramatic, sleep-deprived',
    soft: '#FFE1E1',
    radius: 'rounded-[10px_26px_10px_26px]',
  },
  {
    id: 'intern',
    name: 'The Unhinged Intern',
    icon: '🤩',
    tagline: 'Caffeinated, screaming',
    soft: '#FFF3C4',
    radius: 'rounded-[26px_26px_10px_10px]',
  },
  {
    id: 'stackOverflow',
    name: 'Toxic StackOverflow Mod',
    icon: '🤓',
    tagline: 'Disdainful, closed as duplicate',
    soft: '#E7E9EE',
    radius: 'rounded-[10px_10px_26px_26px]',
  },
  {
    id: 'mallu',
    name: 'The Mallu Tech Bro',
    icon: '☕',
    tagline: 'Manglish, chayakada roasts',
    soft: '#FCE7D6',
    radius: 'rounded-[18px_18px_18px_18px]',
  }
];

const LOADING_MESSAGES = [
  'Reading your code with an open mind...',
  'Untangling the braces...',
  'Checking your semicolon anxiety...',
  'Reading between the divs...',
  'Weighing honesty vs. kindness...',
  'Finding the right words...',
  'Almost ready with some thoughts...',
];

function App() {
  const [code, setCode] = useState('');
  const [note, setNote] = useState(PLACEHOLDER_NOTE);
  const [isHealing, setIsHealing] = useState(false);
  const [avgHealing, setAvgHealing] = useState(null);
  const [activePersona, setActivePersona] = useState(null);
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  
  const sessionCount = useRef(6); // "Session 07" is the next one
  const currentAudio = useRef(null); // Tracks the active ElevenLabs audio

  useEffect(() => {
    if (!isHealing) return;
    setLoadingMsgIndex(0);
    const id = setInterval(() => {
      setLoadingMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 1600);
    return () => clearInterval(id);
  }, [isHealing]);

  const handleHealCode = async (personaId) => {
    // 👈 ADD THIS: Stop any previously playing audio
    if (currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current = null;
    }
    
    if (!code.trim() || isHealing) return;

    setIsHealing(true);
    setNote('Sitting with the syntax. This may take a moment...');
    const startedAt = performance.now();

    try {
      const res = await fetch('http://localhost:3000/api/heal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, persona: personaId }),
      });

      const data = await res.json();
      const finalNote = data.message || data.error || "The session ended without a clear takeaway.";
      setNote(finalNote);
      
      const elapsedSeconds = (performance.now() - startedAt) / 1000;
      setAvgHealing((prev) => (prev ? (prev + elapsedSeconds) / 2 : elapsedSeconds));
      sessionCount.current += 1;

      // 👇 ADD THIS: Fetch the ElevenLabs audio buffer using the native script
      const audioRes = await fetch('http://localhost:3000/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: data.audioText || finalNote, persona: personaId }),
      });
      // 👇 ADD THESE DEBUG LINES RIGHT HERE:
      console.log("Audio response status:", audioRes.status);
      const audioBlob = await audioRes.blob();
      console.log("Audio blob size:", audioBlob.size);

      if (audioRes.ok && audioBlob.size > 100) {
        const audioUrl = URL.createObjectURL(audioBlob);
        currentAudio.current = new Audio(audioUrl);
        currentAudio.current.play().catch((err) => {
          console.error("Audio playback blocked:", err);
        });
      } else {
        console.error("Audio blob is too small or request failed, check backend!");
      }
      
      if (audioRes.ok) {
        const audioBlob = await audioRes.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        currentAudio.current = new Audio(audioUrl);
        currentAudio.current.play().catch((err) => {
          console.error("Audio playback blocked:", err);
        });
      }

    } catch (err) {
      setNote('Even the therapist is overwhelmed right now. (Connection error)');
    } finally {
      setIsHealing(false);
      setShowPersonaModal(false);
    }
  };
  const openPersonaModal = () => {
    if (!code.trim() || isHealing) return;
    setShowPersonaModal(true);
  };

  const handleSelectPersona = (personaId) => {
    setActivePersona(personaId);
    handleHealCode(personaId);
  };

  const handleClear = () => {
    setCode('');
    setNote(PLACEHOLDER_NOTE);
    setActivePersona(null);
    // 👈 ADD THIS:
    if (currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current = null;
    }
  };

  const charCount = code.length;
  const sessionLabel = String(sessionCount.current + 1).padStart(2, '0');
  const active = PERSONAS.find((p) => p.id === activePersona);

  return (
    <div className="min-h-screen bg-confetti text-ink font-body">
      <div className="max-w-3xl mx-auto px-5 py-8 md:py-12">

        {/* Header */}
        <header className="flex items-center justify-between gap-3 flex-wrap rounded-[32px_14px_32px_14px] border-4 border-ink bg-white px-6 py-4 shadow-[6px_6px_0_#1E2A38] animate-[pop_0.5s_ease]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-[50%_45%_50%_45%] border-4 border-ink bg-[#FF4D4D] flex items-center justify-center font-display text-sm font-bold text-white animate-[bob_3s_ease-in-out_infinite] [transform-origin:center]">
              SOS
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-ink">
                Code Crisis Hotline
              </h1>
              <p className="text-sm text-[#57626f] font-semibold mt-0.5">
                Confidential care for unstable software
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border-[3px] border-ink bg-[#D8FBE6] px-4 py-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2FCB7A] shadow-[0_0_0_4px_rgba(47,203,122,0.3)] animate-[twinkle_1.6s_ease_infinite]" />
            <span className="font-display text-sm font-bold text-ink">Open for patients</span>
          </div>
        </header>

        {/* Intake / hero */}
        <section className="relative text-center pt-12 pb-8 px-2">
          <span className="hidden sm:inline absolute top-0 left-[6%] text-3xl animate-[bob_2.6s_ease-in-out_infinite] [animation-delay:0.2s]">✨</span>
          <span className="hidden sm:inline absolute top-2 right-[7%] text-3xl animate-[bob_2.6s_ease-in-out_infinite] [animation-delay:0.6s]">🩹</span>
          <span className="hidden sm:inline absolute bottom-1 left-[18%] text-2xl animate-[bob_2.6s_ease-in-out_infinite] [animation-delay:1s]">💊</span>
          <span className="hidden sm:inline absolute bottom-0 right-[20%] text-2xl animate-[bob_2.6s_ease-in-out_infinite] [animation-delay:1.4s]">🌈</span>
          <span className="hidden sm:inline absolute top-5 left-[38%] text-xl text-[#FFD23F] animate-[twinkle_1.8s_ease_infinite] [animation-delay:0.3s]">★</span>
          <span className="hidden sm:inline absolute bottom-3 right-[12%] text-xl text-[#FFD23F] animate-[twinkle_1.8s_ease_infinite] [animation-delay:1s]">✦</span>

          <span className="inline-flex items-center rounded-[20px_6px_20px_6px] border-[3px] border-ink bg-[#FFD23F] px-4 py-1.5 font-display text-sm font-bold -rotate-3 shadow-[4px_4px_0_#1E2A38]">
            Intake · Session {sessionLabel}
          </span>

          <h2 className="font-display font-extrabold text-[clamp(30px,6vw,50px)] leading-[1.15] mt-5">
            Your code is{' '}
            <span className="relative inline-block text-[#FF4D4D]">
              scared
              <svg viewBox="0 0 200 20" preserveAspectRatio="none" className="absolute -left-1.5 -right-1.5 -bottom-3.5 w-[calc(100%+12px)] h-5">
                <path d="M2 12 Q 20 2, 40 11 T 80 10 T 120 12 T 160 8 T 198 11" stroke="#38B6FF" strokeWidth="6" fill="none" strokeLinecap="round" />
              </svg>
            </span>
            , not broken.
          </h2>
          <p className="max-w-xl mx-auto mt-4 text-[#4b5563] font-semibold leading-relaxed">
            Linters judge you. We give your buggy code emotional support. Paste the
            snippet and we'll take it from here.
          </p>
        </section>

        {/* Snippet / couch */}
        <section className="rounded-[34px_14px_34px_14px] border-4 border-ink bg-white p-5 md:p-6 mb-7 shadow-[6px_6px_0_#1E2A38]">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-display font-bold text-base">Your snippet, on the couch 🛋️</span>
            <span className="font-mono text-xs font-bold text-[#94a3b8]">
              {charCount} / {MAX_CHARS}
            </span>
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value.slice(0, MAX_CHARS))}
            placeholder={'const connect = async () => {\n  const db = await database.connect()\n  finally {\n    db.close()\n  }\n}'}
            className="w-full h-52 md:h-64 mt-3.5 rounded-[20px] border-[3px] border-dashed border-[#F5C99B] bg-[#FFFCF4] p-4 font-mono text-sm text-ink placeholder-[#b9c2d6] outline-none focus:border-solid focus:border-[#2F80FF] resize-none transition-colors"
            spellCheck={false}
          />

          <div className="flex items-center gap-3.5 mt-4 flex-wrap">
            <button
              onClick={openPersonaModal}
              disabled={isHealing || !code.trim()}
              className="font-display font-bold text-base rounded-full border-[3px] border-ink bg-[#2FCB7A] text-white px-6 py-2.5 shadow-[4px_4px_0_#1E2A38] transition-transform hover:-translate-y-0.5 hover:-translate-x-0.5 hover:-rotate-1 hover:shadow-[6px_7px_0_#1E2A38] active:translate-x-0 active:translate-y-0 active:shadow-[1px_1px_0_#1E2A38] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:rotate-0 disabled:hover:shadow-[4px_4px_0_#1E2A38]"
            >
              {isHealing ? 'Listening empathetically…' : '💚 Heal Code'}
            </button>
            <button
              onClick={handleClear}
              disabled={isHealing}
              className="font-display font-bold text-base rounded-full border-[3px] border-ink bg-white text-ink px-5 py-2.5 shadow-[4px_4px_0_#1E2A38] transition-transform hover:-translate-y-0.5 hover:-translate-x-0.5 hover:rotate-1 hover:shadow-[6px_7px_0_#1E2A38] disabled:opacity-40"
            >
              🗑️ Clear
            </button>

            {avgHealing !== null && (
              <span className="ml-auto font-display font-bold text-xs text-[#94a3b8]">
                Avg. healing: {avgHealing.toFixed(1)}s
              </span>
            )}
          </div>
        </section>

        {/* Therapist notes */}
        <section>
          <p className="font-display text-base font-bold text-[#3f4a5a] mb-3 ml-1">
            Therapist Notes 📝
          </p>
          <div className="rounded-[14px_34px_34px_34px] border-4 border-ink bg-white p-5 md:p-6 flex gap-4 shadow-[6px_6px_0_#1E2A38] transition-transform">
            <div
              style={{ backgroundColor: active?.soft || '#EDEFF3' }}
              className="w-[52px] h-[52px] shrink-0 rounded-full border-[3px] border-ink flex items-center justify-center text-2xl"
            >
              {active?.icon || '🩺'}
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-ink mb-1.5">
                {active?.name || 'No session yet'}
              </h3>
              <p
                className={`text-[#374151] font-semibold leading-relaxed whitespace-pre-wrap transition-opacity duration-300 ${
                  isHealing ? 'opacity-50' : 'opacity-100'
                }`}
              >
                {note}
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="flex items-center justify-between flex-wrap gap-2 mt-8 font-display text-xs font-bold text-[#94a3b8]">
          <span>No diagnostics. No judgment. Just gentle refactors. 💕</span>
          <span>Confidential · v0.4 · Team Krypsis</span>
        </footer>
      </div>

      {/* Persona picker / loading modal */}
      {showPersonaModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E2A38]/60 backdrop-blur-sm px-4 animate-[pop_0.2s_ease]"
          onClick={() => !isHealing && setShowPersonaModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl rounded-[34px_14px_34px_14px] border-4 border-ink bg-white p-6 md:p-7 shadow-[8px_8px_0_#1E2A38] animate-[pop_0.25s_ease]"
          >
            {!isHealing && (
              <button
                onClick={() => setShowPersonaModal(false)}
                aria-label="Close"
                className="absolute -top-3.5 -right-3.5 w-10 h-10 rounded-full border-[3px] border-ink bg-white font-display font-bold text-lg shadow-[3px_3px_0_#1E2A38] hover:-translate-y-0.5 hover:-rotate-6 transition-transform"
              >
                ✕
              </button>
            )}

            {isHealing ? (
              /* Loading screen */
              <div className="flex flex-col items-center text-center py-8 px-2">
                <div className="relative mb-6 w-24 h-24 flex items-center justify-center">
                  <span className="absolute inset-0 rounded-full border-[3px] border-dashed border-[#2F80FF] animate-spin [animation-duration:2.6s]" />
                  <span
                    style={{ backgroundColor: active?.soft }}
                    className="w-16 h-16 rounded-full border-[3px] border-ink flex items-center justify-center text-3xl animate-[bob_1.6s_ease-in-out_infinite]"
                  >
                    {active?.icon}
                  </span>
                </div>

                <p className="font-display font-bold text-base text-ink mb-2">
                  {active?.name} is on it…
                </p>
                <p
                  key={loadingMsgIndex}
                  className="text-sm text-[#64748b] font-semibold min-h-[20px] animate-[pop_0.3s_ease]"
                >
                  {LOADING_MESSAGES[loadingMsgIndex]}
                </p>

                <div className="flex gap-1.5 mt-5">
                  <span className="w-2.5 h-2.5 rounded-full bg-ink animate-[bob_1s_ease-in-out_infinite]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-ink animate-[bob_1s_ease-in-out_infinite] [animation-delay:0.2s]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-ink animate-[bob_1s_ease-in-out_infinite] [animation-delay:0.4s]" />
                </div>
              </div>
            ) : (
              /* Persona picker */
              <>
                <p className="font-display text-lg font-bold text-ink mb-1">
                  Choose your therapist 🎈
                </p>
                <p className="text-sm text-[#64748b] font-semibold mb-4">
                  Who should sit with your code today?
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {PERSONAS.map((persona) => (
                    <button
                      key={persona.id}
                      onClick={() => handleSelectPersona(persona.id)}
                      className={`flex flex-col items-center gap-2 border-[3.5px] border-ink ${persona.radius} bg-white p-4 text-center transition-transform duration-150 shadow-[4px_4px_0_#1E2A38] hover:-translate-y-1 hover:-rotate-1 hover:shadow-[6px_6px_0_#1E2A38] active:translate-x-0 active:translate-y-0 active:shadow-[1px_1px_0_#1E2A38]`}
                    >
                      <span
                        style={{ backgroundColor: persona.soft }}
                        className="w-14 h-14 rounded-full border-[3px] border-ink flex items-center justify-center text-2xl"
                      >
                        {persona.icon}
                      </span>
                      <span className="font-display font-bold text-sm leading-tight text-ink">
                        {persona.name}
                      </span>
                      <span className="hidden md:block text-xs font-bold text-[#64748b] leading-tight">
                        {persona.tagline}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;