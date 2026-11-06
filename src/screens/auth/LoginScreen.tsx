import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Role } from '../../types';
import { DEMO_ACCOUNTS } from '../../data/centralDemoData';
import { GlobalHeader } from '../../components/layout/GlobalHeader';

export const LoginScreen: React.FC = () => {
  const { login, loginWithGoogle } = useAuth();
  const { t } = useLanguage();

  const [selectedRole, setSelectedRole] = useState<Role>('mother');
  const [identifier, setIdentifier] = useState('priya.sharma@example.com');
  const [password, setPassword] = useState('demo1234');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const roleConfigs = {
    mother: {
      title: t('loginHeader'),
      description: t('loginSubtitle'),
      label: t('roleMother'),
      placeholder: 'priya.sharma@example.com',
      defaultId: 'priya.sharma@example.com',
      defaultPass: 'demo1234',
      type: 'email',
      helper: t('motherLoginHelp'),
    },
    worker: {
      title: t('loginHeader'),
      description: t('loginSubtitle'),
      label: t('roleWorker'),
      placeholder: 'HW-44120',
      defaultId: 'HW-44120',
      defaultPass: 'demo1234',
      type: 'text',
      helper: t('workerLoginHelp'),
    },
    supervisor: {
      title: t('loginHeader'),
      description: t('loginSubtitle'),
      label: t('roleSupervisor'),
      placeholder: 'SUP-2025-012',
      defaultId: 'SUP-2025-012',
      defaultPass: 'demo1234',
      type: 'text',
      helper: t('supervisorLoginHelp'),
    },
  };

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setIdentifier(roleConfigs[role].defaultId);
    setPassword(roleConfigs[role].defaultPass);
    setErrorMessage(null);
    setInfoNotice(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoNotice(null);
    setIsSubmitting(true);

    try {
      const result = await login(selectedRole, identifier, password);
      if (!result.success && result.error) {
        setErrorMessage(result.error);
      }
    } catch {
      setErrorMessage(t('authUnavailable'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setInfoNotice(null);
    setIsGoogleLoading(true);
    try {
      const res = await loginWithGoogle(selectedRole);
      if (!res.success && res.error) {
        setErrorMessage(res.error);
      }
    } catch {
      setErrorMessage(t('authFailed'));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const config = roleConfigs[selectedRole];

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col font-sans">
      {/* Global Header with Language Selector */}
      <GlobalHeader />

      <main className="flex-1 flex flex-col justify-center relative w-full bg-surface px-4 sm:px-6 pt-20 pb-12 max-w-lg mx-auto">
        <div className="flex flex-col w-full max-w-sm sm:max-w-md mx-auto py-2">
          {/* Official Emblem & Wordmark */}
          <div className="flex flex-col items-center text-center my-2">
            <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
              <img
                alt="JanmaSaathi Emblem"
                className="w-full h-full object-contain"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBqcYasAZML1Fa6KJkcwGoVOSGmdPcfbjGn7Jy9ApOU4vL1Tfw3LJlOSd57TLN83HqWSbsIB3J9Xrp1PlOOsjoe6fEVZvi3OksqRLpZCBFSOkiYgXaiRC0ko_Dcm0zlbhZVdvO4XfiZ8EIAnwMNUAweTpebdW9R7_As01emoQ0Klj0hsF42cqnda7XS_bj0lbvFsDobCJJVlkWEAZxf1fZpvPgda2Q5R4ibnXahKqJqKT3Xu_p5E8oRgwSsWDBU1YuF"
              />
            </div>
            <span className="font-serif text-2xl sm:text-3xl font-bold text-primary-container mt-1">
              {t('appName')}
            </span>
            <p className="font-sans text-xs sm:text-sm text-secondary mt-0.5 px-2">
              {t('tagline')}
            </p>
          </div>

          {/* 3-Role Selection Tabs */}
          <div
            aria-label="Select User Role"
            className="w-full bg-surface-container-high p-1 rounded-xl flex items-center justify-between mb-4 shadow-sm border border-outline-variant/40"
            role="tablist"
          >
            <button
              aria-selected={selectedRole === 'mother'}
              className={`flex-1 py-2 text-center rounded-lg text-xs font-semibold transition-all duration-150 ${
                selectedRole === 'mother'
                  ? 'bg-primary-container text-on-primary shadow-sm'
                  : 'text-on-surface hover:text-primary'
              }`}
              onClick={() => handleRoleSelect('mother')}
              type="button"
            >
              {t('roleMother')}
            </button>
            <button
              aria-selected={selectedRole === 'worker'}
              className={`flex-1 py-2 text-center rounded-lg text-xs font-semibold transition-all duration-150 ${
                selectedRole === 'worker'
                  ? 'bg-primary-container text-on-primary shadow-sm'
                  : 'text-on-surface hover:text-primary'
              }`}
              onClick={() => handleRoleSelect('worker')}
              type="button"
            >
              {t('roleWorker')}
            </button>
            <button
              aria-selected={selectedRole === 'supervisor'}
              className={`flex-1 py-2 text-center rounded-lg text-xs font-semibold transition-all duration-150 ${
                selectedRole === 'supervisor'
                  ? 'bg-primary-container text-on-primary shadow-sm'
                  : 'text-on-surface hover:text-primary'
              }`}
              onClick={() => handleRoleSelect('supervisor')}
              type="button"
            >
              {t('roleSupervisor')}
            </button>
          </div>

          {/* Role Header Description */}
          <div className="flex flex-col mb-4">
            <h1 className="font-serif text-xl font-bold text-on-surface mb-1">
              {config.title}
            </h1>
            <p className="font-sans text-xs text-secondary leading-relaxed min-h-[30px]">
              {config.description}
            </p>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3 mb-4 rounded-lg bg-error-container/60 border border-error/30 text-xs text-error font-medium flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Info Notice Banner */}
          {infoNotice && (
            <div className="p-3 mb-4 rounded-lg bg-surface-container-high border border-outline-variant text-xs text-on-surface font-medium flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary-container shrink-0 mt-0.5">info</span>
              <div className="flex-1 flex justify-between items-start gap-2">
                <span>{infoNotice}</span>
                <button
                  type="button"
                  onClick={() => setInfoNotice(null)}
                  className="text-secondary hover:text-on-surface"
                  aria-label="Dismiss notice"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            </div>
          )}

          {/* Credential Form */}
          <form className="flex flex-col space-y-4" onSubmit={handleSubmit}>
            <div className="flex flex-col space-y-1">
              <label className="font-sans text-xs font-semibold text-on-surface" htmlFor="identity-input">
                {t('enterIdentifier')}
              </label>
              <div className="relative w-full">
                <input
                  id="identity-input"
                  className="w-full h-12 px-3 rounded-lg bg-surface-container-lowest text-on-surface font-sans text-sm border border-outline-variant focus:outline-none focus:border-primary-container transition-colors shadow-sm"
                  placeholder={config.placeholder}
                  required
                  type={config.type}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>
              <p className="font-sans text-[11px] text-secondary mt-0.5">
                {config.helper}
              </p>
            </div>

            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-sans text-xs font-semibold text-on-surface" htmlFor="password-input">
                  {t('enterPassword')}
                </label>
                <button
                  className="font-sans text-xs text-primary-container hover:underline"
                  onClick={() => setInfoNotice(t('demoPassNote'))}
                  type="button"
                >
                  {t('forgotPassword')}
                </button>
              </div>
              <div className="relative w-full flex items-center">
                <input
                  id="password-input"
                  className="w-full h-12 pl-3 pr-11 rounded-lg bg-surface-container-lowest text-on-surface font-sans text-sm border border-outline-variant focus:outline-none focus:border-primary-container transition-colors shadow-sm"
                  placeholder="demo1234"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  aria-label="Toggle password visibility"
                  className="absolute right-0 top-0 bottom-0 px-3 flex items-center justify-center text-secondary hover:text-on-surface"
                  onClick={() => setShowPassword(!showPassword)}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Demo Verification Helper */}
            <div className="p-2.5 rounded-lg bg-surface-container border border-outline-variant/50 text-[11px] text-secondary flex items-center justify-between">
              <span>{t('demoPassNote')}</span>
              <button
                type="button"
                onClick={() => {
                  setIdentifier(DEMO_ACCOUNTS[selectedRole].identifier);
                  setPassword(DEMO_ACCOUNTS[selectedRole].password);
                  setErrorMessage(null);
                  setInfoNotice(null);
                }}
                className="text-primary-container font-semibold hover:underline"
              >
                {t('autofillDemo')}
              </button>
            </div>

            <div className="pt-2">
              <button
                className="w-full h-12 bg-primary-container text-on-primary font-sans text-sm font-semibold rounded-lg shadow-sm hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                type="submit"
                disabled={isSubmitting || isGoogleLoading}
              >
                <span>{isSubmitting ? '...' : t('loginButton')}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>

            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-outline-variant/60 w-full"></div>
              <span className="bg-surface px-2 font-sans text-[11px] text-secondary uppercase tracking-wider shrink-0">
                {t('orDivider')}
              </span>
              <div className="border-t border-outline-variant/60 w-full"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting || isGoogleLoading}
              className="w-full h-12 bg-surface-container-lowest text-on-surface font-sans text-sm font-semibold rounded-lg border border-outline-variant shadow-sm hover:bg-surface-container-low transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isGoogleLoading ? '...' : t('googleSignIn')}</span>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};
