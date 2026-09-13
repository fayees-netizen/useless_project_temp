import { useState } from 'react';

const USERNAME_CHECKS = [
  { id: 'length', label: '3–20 characters', test: (v) => v.length >= 3 && v.length <= 20 },
  { id: 'start', label: 'Starts with a letter', test: (v) => /^[A-Za-z]/.test(v) },
  { id: 'chars', label: 'Only letters, numbers, and underscores', test: (v) => /^[A-Za-z0-9_]*$/.test(v) },
];

// Password rules are intentionally undisclosed up front — only the first
// unmet one is ever shown, so the person fixes them one at a time.
const PASSWORD_RULES = [
  {
    id: 'len',
    hint: 'Needs at least 8 characters. Baby steps.',
    test: (v) => v.length >= 8,
  },
  {
    id: 'number',
    hint: 'Needs at least one number. Progress should be measurable.',
    test: (v) => /[0-9]/.test(v),
  },
  {
    id: 'upper',
    hint: 'Needs an uppercase letter. Main character energy.',
    test: (v) => /[A-Z]/.test(v),
  },
  {
    id: 'special',
    hint: 'Needs a special character — ! @ # $ % or similar. Let it out.',
    test: (v) => /[!@#$%^&*()\-_+=]/.test(v),
  },
  {
    id: 'calm',
    hint: 'Must contain the word "calm" somewhere. Say it, mean it.',
    test: (v) => /calm/i.test(v),
  },
  {
    id: 'digitSum',
    hint: 'The digits in your password must add up to an even number. We will not explain why.',
    test: (v) => {
      const digits = v.match(/[0-9]/g);
      if (!digits) return false;
      const sum = digits.reduce((total, d) => total + Number(d), 0);
      return sum % 2 === 0;
    },
  },
  {
    id: 'noPassword',
    hint: 'Cannot contain the word "password". We\'ve seen your type.',
    test: (v) => !/password/i.test(v),
  },
];

function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const usernameValid = username.length > 0 && USERNAME_CHECKS.every((c) => c.test(username));

  const passwordResults = PASSWORD_RULES.map((rule) => ({
    ...rule,
    passed: password.length > 0 && rule.test(password),
  }));
  const passedCount = passwordResults.filter((r) => r.passed).length;
  const currentRule = passwordResults.find((r) => !r.passed);
  const passwordValid = password.length > 0 && !currentRule;

  const canSubmit = usernameValid && passwordValid;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) {
      setShake(true);
      setTimeout(() => setShake(false), 450);
      return;
    }
    setSubmitted(true);
    setTimeout(() => {
      onLoginSuccess?.(username);
    }, 900);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-confetti text-ink font-body flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md rounded-[34px_14px_34px_14px] border-4 border-ink bg-white p-8 text-center shadow-[6px_6px_0_#1E2A38] animate-[pop_0.3s_ease]">
          <div className="w-16 h-16 mx-auto rounded-full border-[3px] border-ink bg-[#D8FBE6] flex items-center justify-center text-3xl mb-4">
            ✅
          </div>
          <h1 className="font-display font-bold text-xl text-ink mb-1.5">
            You're checked in, {username}.
          </h1>
          <p className="text-sm text-[#64748b] font-semibold leading-relaxed">
            Every constraint resolved, no notes withheld. The doctor will see you now.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-confetti text-ink font-body flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">

        {/* Header */}
        <header className="flex items-center gap-4 rounded-[32px_14px_32px_14px] border-4 border-ink bg-white px-6 py-4 shadow-[6px_6px_0_#1E2A38] mb-8 animate-[pop_0.5s_ease]">
          <div className="w-14 h-14 shrink-0 rounded-[50%_45%_50%_45%] border-4 border-ink bg-[#38B6FF] flex items-center justify-center text-2xl animate-[bob_3s_ease-in-out_infinite]">
            🔑
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-ink">Code Crisis Hotline</h1>
            <p className="text-sm text-[#57626f] font-semibold mt-0.5">Patient check-in</p>
          </div>
        </header>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className={`rounded-[34px_14px_34px_14px] border-4 border-ink bg-white p-6 md:p-7 shadow-[6px_6px_0_#1E2A38] ${
            shake ? 'animate-[shake_0.45s_ease]' : ''
          }`}
        >
          <p className="font-display font-bold text-lg text-ink mb-1">Session Login</p>
          <p className="text-sm text-[#64748b] font-semibold mb-5">
            We just need a name and a password that behaves.
          </p>

          {/* Username */}
          <label className="block font-display font-bold text-sm text-ink mb-2" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. buggy_ben"
            autoComplete="username"
            className="w-full rounded-[16px] border-[3px] border-dashed border-[#F5C99B] bg-[#FFFCF4] px-4 py-2.5 font-mono text-sm text-ink placeholder-[#b9c2d6] outline-none focus:border-solid focus:border-[#2F80FF] transition-colors"
          />
          <ul className="mt-2.5 mb-6 space-y-1">
            {USERNAME_CHECKS.map((check) => {
              const ok = username.length > 0 && check.test(username);
              return (
                <li
                  key={check.id}
                  className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                    ok ? 'text-[#2FCB7A]' : 'text-[#94a3b8]'
                  }`}
                >
                  <span>{ok ? '✓' : '○'}</span>
                  {check.label}
                </li>
              );
            })}
          </ul>

          {/* Password */}
          <div className="flex items-center justify-between mb-2">
            <label className="font-display font-bold text-sm text-ink" htmlFor="password">
              Session Password
            </label>
            <span className="font-mono text-xs font-bold text-[#94a3b8]">
              {passedCount}/{PASSWORD_RULES.length} resolved
            </span>
          </div>

          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Type here and we'll flag what's wrong"
              autoComplete="new-password"
              className="w-full rounded-[16px] border-[3px] border-dashed border-[#F5C99B] bg-[#FFFCF4] px-4 py-2.5 pr-16 font-mono text-sm text-ink placeholder-[#b9c2d6] outline-none focus:border-solid focus:border-[#2F80FF] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 font-display text-xs font-bold text-[#57626f]"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          {/* Progress dots */}
          <div className="flex gap-1.5 mt-3">
            {PASSWORD_RULES.map((rule, i) => (
              <span
                key={rule.id}
                className={`w-2.5 h-2.5 rounded-full border-[2px] border-ink transition-colors ${
                  i < passedCount ? 'bg-[#2FCB7A]' : 'bg-white'
                }`}
              />
            ))}
          </div>

          {/* Current constraint / success */}
          {password.length === 0 ? (
            <p className="mt-3 text-xs font-semibold text-[#94a3b8]">
              Start typing — we'll flag one requirement at a time.
            </p>
          ) : currentRule ? (
            <div
              key={currentRule.id}
              className="mt-3 flex items-start gap-2 rounded-[14px] border-[3px] border-ink bg-[#FFE1E1] px-3 py-2 animate-[pop_0.25s_ease]"
            >
              <span className="text-base leading-none">🚩</span>
              <p className="text-sm font-bold text-ink leading-snug">{currentRule.hint}</p>
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-2 rounded-[14px] border-[3px] border-ink bg-[#D8FBE6] px-3 py-2 animate-[pop_0.25s_ease]">
              <span className="text-base leading-none">✅</span>
              <p className="text-sm font-bold text-ink">All constraints resolved. Cleared for entry.</p>
            </div>
          )}

          <button
            type="submit"
            className={`w-full mt-6 font-display font-bold text-base rounded-full border-[3px] border-ink px-6 py-2.5 shadow-[4px_4px_0_#1E2A38] transition-transform hover:-translate-y-0.5 hover:-rotate-1 hover:shadow-[6px_7px_0_#1E2A38] active:translate-x-0 active:translate-y-0 active:shadow-[1px_1px_0_#1E2A38] ${
              canSubmit ? 'bg-[#2FCB7A] text-white' : 'bg-[#E7E9EE] text-[#94a3b8]'
            }`}
          >
            {canSubmit ? '💚 Enter Session' : '🔒 Enter Session'}
          </button>
        </form>

        <p className="text-center text-xs font-bold text-[#94a3b8] mt-6">
          No diagnostics. No judgment. Just a login form. 💕
        </p>
      </div>
    </div>
  );
}

export default LoginPage;