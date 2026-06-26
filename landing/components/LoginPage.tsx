import React, { useState, useEffect } from 'react';
import { useApp } from '../services/store';
import { UserRole } from '../types';
import {
  Loader2, LogIn, Mail, Lock, AlertCircle, Check, RefreshCw,
  Zap, Clock, Coffee,
  Building, FileText, ArrowRight, ArrowLeft,
  CheckCircle2, User, Layout, Smartphone, BarChart3,
  ShoppingCart, Server, HelpCircle, Globe, ChevronDown, ChevronUp
} from 'lucide-react';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'motion/react';

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = `
  .progress-bar-fill { transition: width 0.5s cubic-bezier(0.4,0,0.2,1); }
  .card-sel-shadow  { box-shadow: 0 2px 4px -1px rgba(0,0,0,.04), 0 1px 2px -1px rgba(0,0,0,.03); }
  .card-sel-active  { box-shadow: 0 8px 12px -3px rgba(147,51,234,.12), 0 3px 5px -2px rgba(147,51,234,.06); }
  ::-webkit-scrollbar { width:5px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:#e5e7eb; border-radius:10px; }
  ::-webkit-scrollbar-thumb:hover { background:#d1d5db; }
`;

// ─── Selection Card ────────────────────────────────────────────────────────────
const SelectionCard = ({
  title, icon: Icon, selected, onClick,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    type="button" onClick={onClick}
    className={`relative flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl border-2 transition-all duration-200 group
      ${selected ? 'border-purple-600 bg-purple-50/60 card-sel-active'
                 : 'border-gray-100 bg-white hover:border-purple-200 hover:shadow-md card-sel-shadow'}`}
  >
    <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-3 transition-all duration-200
      ${selected ? 'bg-purple-600 text-white'
                 : 'bg-gray-50 text-gray-400 group-hover:bg-purple-50 group-hover:text-purple-500'}`}>
      <Icon className="w-5 h-5 sm:w-7 sm:h-7" />
    </div>
    <span className={`font-bold text-xs sm:text-sm text-center leading-tight transition-colors duration-200
      ${selected ? 'text-purple-900' : 'text-gray-600 group-hover:text-purple-700'}`}>
      {title}
    </span>
    {selected && (
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
        className="absolute top-2 right-2 w-4 h-4 sm:w-5 sm:h-5 bg-purple-600 rounded-full flex items-center justify-center shadow-sm">
        <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
      </motion.div>
    )}
  </button>
);

// ─── Input Field ───────────────────────────────────────────────────────────────
interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ElementType;
  error?: string;
}
const InputField = ({ label, icon: Icon, error, ...props }: InputFieldProps) => (
  <div className="w-full">
    <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">{label}</label>
    <div className="relative">
      {Icon && <Icon className={`absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 pointer-events-none
        ${error ? 'text-red-400' : 'text-gray-400'}`} />}
      <input {...props}
        className={`w-full ${Icon ? 'pl-10 sm:pl-12' : 'pl-3.5 sm:pl-4'} pr-4 py-3 sm:py-4 border-2 rounded-xl bg-white outline-none
          transition-all placeholder:text-gray-300 text-sm sm:text-base
          ${error ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                  : 'border-gray-100 focus:border-purple-500 focus:ring-4 focus:ring-purple-100'}`}
      />
    </div>
    {error && (
      <p className="text-xs text-red-500 mt-1 ml-0.5 font-semibold flex items-center gap-1">
        <AlertCircle className="w-3 h-3 shrink-0" /> {error}
      </p>
    )}
  </div>
);

// ─── Textarea Field ────────────────────────────────────────────────────────────
const TextareaField = ({
  label, placeholder, value, onChange, error, optional = false, rows = 3,
}: {
  label: string; placeholder?: string; value: string; onChange: (v: string) => void;
  error?: string; optional?: boolean; rows?: number;
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between gap-2">
      <label className="text-xs sm:text-sm font-bold text-gray-700 leading-snug">{label}</label>
      {optional && <span className="text-[10px] sm:text-xs font-bold text-gray-300 uppercase tracking-widest shrink-0">Opcional</span>}
    </div>
    <textarea
      className={`w-full p-3 sm:p-4 border-2 rounded-xl bg-white outline-none resize-none transition-all
        placeholder:text-gray-300 text-xs sm:text-sm focus:ring-4
        ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                : 'border-gray-100 focus:border-purple-500 focus:ring-purple-100'}`}
      placeholder={placeholder} rows={rows} value={value}
      onChange={(e) => onChange(e.target.value)}
    />
    {error && (
      <p className="text-xs text-red-500 font-semibold flex items-center gap-1">
        <AlertCircle className="w-3 h-3 shrink-0" /> {error}
      </p>
    )}
  </div>
);

// ─── Step Illustration ─────────────────────────────────────────────────────────
const StepIllustration = ({ step }: { step: number }) => {
  const configs: Record<number, { bg: string; shapes: React.ReactNode }> = {
    1: {
      bg: 'from-purple-50 to-violet-100',
      shapes: (<>
        <circle cx="160" cy="160" r="120" fill="#a78bfa" opacity="0.15" />
        <circle cx="160" cy="160" r="75"  fill="#7c3aed" opacity="0.18" />
        <circle cx="160" cy="160" r="35"  fill="#6d28d9" opacity="0.35" />
        <circle cx="240" cy="90"  r="28"  fill="#c4b5fd" opacity="0.4"  />
        <circle cx="80"  cy="230" r="20"  fill="#ddd6fe" opacity="0.5"  />
        <rect x="200" y="200" width="60" height="60" rx="16" fill="#8b5cf6" opacity="0.2" transform="rotate(20 230 230)" />
      </>),
    },
    2: {
      bg: 'from-blue-50 to-indigo-100',
      shapes: (<>
        <rect x="50"  y="50"  width="100" height="100" rx="20" fill="#818cf8" opacity="0.2" />
        <rect x="170" y="80"  width="80"  height="80"  rx="16" fill="#6366f1" opacity="0.25" />
        <rect x="80"  y="170" width="120" height="60"  rx="14" fill="#a5b4fc" opacity="0.3" />
        <rect x="210" y="180" width="50"  height="80"  rx="12" fill="#4f46e5" opacity="0.2" />
        <circle cx="55" cy="220" r="22" fill="#c7d2fe" opacity="0.4" />
      </>),
    },
    3: {
      bg: 'from-emerald-50 to-teal-100',
      shapes: (<>
        <path d="M160 60 L230 120 L200 210 L120 210 L90 120 Z" fill="#34d399" opacity="0.2" />
        <circle cx="160" cy="155" r="55" fill="#10b981" opacity="0.2" />
        <path d="M100 240 Q160 180 220 240" stroke="#6ee7b7" strokeWidth="6" fill="none" opacity="0.6" />
        <circle cx="80"  cy="90"  r="20" fill="#a7f3d0" opacity="0.5" />
        <circle cx="250" cy="200" r="15" fill="#6ee7b7" opacity="0.4" />
      </>),
    },
    4: {
      bg: 'from-pink-50 to-rose-100',
      shapes: (<>
        <rect x="60" y="90" width="200" height="130" rx="24" fill="#fb7185" opacity="0.15" />
        <rect x="80" y="110" width="160" height="20"  rx="8"  fill="#f43f5e" opacity="0.2" />
        <rect x="80" y="140" width="120" height="12"  rx="6"  fill="#fda4af" opacity="0.35" />
        <rect x="80" y="162" width="80"  height="12"  rx="6"  fill="#fda4af" opacity="0.25" />
        <circle cx="250" cy="80"  r="30" fill="#fecdd3" opacity="0.5" />
        <circle cx="70"  cy="230" r="18" fill="#fda4af" opacity="0.4" />
      </>),
    },
    5: {
      bg: 'from-violet-50 to-purple-100',
      shapes: (<>
        <path d="M160 50 L200 130 L160 220 L120 130 Z" fill="#7c3aed" opacity="0.15" />
        <circle cx="160" cy="140" r="65" fill="#8b5cf6" opacity="0.12" />
        <path d="M100 200 L130 140 L160 180 L190 100 L220 160" stroke="#a78bfa" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
        <circle cx="100" cy="200" r="8" fill="#7c3aed" opacity="0.4" />
        <circle cx="220" cy="160" r="8" fill="#7c3aed" opacity="0.4" />
        <circle cx="65"  cy="235" r="16" fill="#ddd6fe" opacity="0.5" />
        <circle cx="255" cy="75"  r="20" fill="#c4b5fd" opacity="0.4" />
      </>),
    },
    6: {
      bg: 'from-fuchsia-50 to-pink-100',
      shapes: (<>
        <circle cx="160" cy="160" r="100" fill="#e879f9" opacity="0.15" />
        <path d="M110 110 L210 210 M210 110 L110 210" stroke="#d946ef" strokeWidth="8" opacity="0.3" />
        <rect x="130" y="130" width="60" height="60" rx="12" fill="#f5d0fe" opacity="0.5" />
        <circle cx="80" cy="80" r="22" fill="#fae8ff" opacity="0.6" />
        <circle cx="240" cy="240" r="18" fill="#fae8ff" opacity="0.5" />
      </>),
    },
  };
  const cfg = configs[step] ?? configs[1];
  return (
    <div className={`w-56 h-56 lg:w-64 lg:h-64 rounded-3xl bg-gradient-to-br ${cfg.bg} flex items-center justify-center shadow-inner overflow-hidden`}>
      <svg viewBox="0 0 320 320" className="w-full h-full">{cfg.shapes}</svg>
    </div>
  );
};

// ─── Continue Button ───────────────────────────────────────────────────────────
const ContinueBtn = ({ onClick, loading = false, label }: { onClick: () => void; loading?: boolean; label: string }) => (
  <button type="button" onClick={onClick} disabled={loading}
    className="w-full py-3.5 sm:py-4 bg-purple-600 text-white rounded-2xl font-black text-base sm:text-lg hover:bg-purple-700 active:scale-[0.98] transition-all shadow-xl shadow-purple-200/70 flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed">
    {loading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <>{label} <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" /></>}
  </button>
);

// ─── Props ─────────────────────────────────────────────────────────────────────
interface LoginPageProps {
  initialMode?: 'LOGIN' | 'REGISTER';
  onBack?: () => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────
export const LoginPage: React.FC<LoginPageProps> = ({ initialMode = 'LOGIN', onBack }) => {
  const {
    signIn, signUp, resendVerification,
    isLoading, authError, currentUser,
    t, language, toggleLanguage,
  } = useApp();

  const TOTAL_STEPS = 6;

  const [isRegistering,         setIsRegistering]         = useState(initialMode === 'REGISTER');
  const [registrationStep,      setRegistrationStep]      = useState(1);
  const [isVerificationPending, setIsVerificationPending] = useState(false);
  const [loadingAuth,           setLoadingAuth]           = useState(false);
  const [showTaxAccordion,      setShowTaxAccordion]      = useState(false);
  const [showExtraFeatures,     setShowExtraFeatures]     = useState(false);
  const [showExtraDetails,      setShowExtraDetails]      = useState(false);
  const [direction,             setDirection]             = useState<1 | -1>(1);
  const [errors,                setErrors]                = useState<Record<string, string>>({});

  useEffect(() => { setIsRegistering(initialMode === 'REGISTER'); }, [initialMode]);

  // ── State ──────────────────────────────────────────────────────────────────
  const [regData, setRegData] = useState({
    role: '', needs: [] as string[], timeline: '',
    name: '', email: '', password: '',
    companyName: '', taxId: '', sector: 'Tech',
    projectName: '', projectTargetAudience: '', projectProblem: '',
    projectCoreFeatures: '',
    projectSecondaryFeatures: '', projectIntegrations: '',
    projectDataToSave: '', projectRolesPermissions: '',
    projectExportsReports: '', projectVisualBranding: '', projectVisualAssets: '',
  });

  const [loginData, setLoginData] = useState({ email: '', password: '' });

  const setField = <K extends keyof typeof regData>(k: K, v: typeof regData[K]) =>
    setRegData(p => ({ ...p, [k]: v }));
  const clearErr = (k: string) => setErrors(p => ({ ...p, [k]: '' }));

  // ── Validation ─────────────────────────────────────────────────────────────
  const validateStep = (): boolean => {
    const d   = regData;
    const req = t.common.required ?? 'Requerido';
    const errs: Record<string, string> = {};

    switch (registrationStep) {
      case 1: if (!d.role)         errs.role  = req; break;
      case 2: if (!d.needs.length) errs.needs = req; break;
      case 3: if (!d.timeline)     errs.timeline = req; break;

      case 4: {
        if (!d.name.trim())                      errs.name     = req;
        if (!d.email.trim())                     errs.email    = req;
        else if (!/\S+@\S+\.\S+/.test(d.email)) errs.email    = t.auth.invalidEmail  ?? 'Email inválido';
        if (!d.password)                         errs.password = req;
        else if (d.password.length < 6)          errs.password = t.auth.passwordLength ?? 'Mínimo 6 caracteres';
        if (!d.companyName.trim())               errs.companyName = req;
        break;
      }

      case 5: {
        if (!d.projectName.trim())          errs.projectName         = req;
        if (!d.projectCoreFeatures.trim())  errs.projectCoreFeatures = req;
        break;
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goNext = () => { setDirection(1); setRegistrationStep(s => s + 1); };
  const handleNext = () => { if (validateStep()) goNext(); };

  const selectAndAdvance = (field: 'role' | 'timeline', value: string) => {
    setField(field, value);
    setErrors({});
    setDirection(1);
    setRegistrationStep(s => s + 1);
  };

  const handleBack = () => {
    setErrors({});
    setDirection(-1);
    if (registrationStep > 1) setRegistrationStep(s => s - 1);
    else if (isRegistering)   setIsRegistering(false);
    else                      onBack?.();
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (skip = false) => {
    if (isRegistering) {
      if (!skip && !validateStep()) return;

      setLoadingAuth(true);
      try {
        const response = await fetch('/api/public/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: regData.projectName,
            briefing: {
              brand: {
                name: regData.projectName,
                personality: '',
                tone: '',
                values: []
              },
              visual: {
                colors: regData.projectVisualBranding,
                typography: '',
                logo_assets: regData.projectVisualAssets
              },
              target_audience: {
                description: regData.projectTargetAudience,
                pain_points: [regData.projectProblem],
                goals: []
              },
              solution: {
                value_proposition: '',
                core_features: [regData.projectCoreFeatures],
                secondary_features: [regData.projectSecondaryFeatures]
              },
              technical: {
                integrations: [regData.projectIntegrations],
                data_storage: regData.projectDataToSave,
                roles_permissions: regData.projectRolesPermissions,
                exports: regData.projectExportsReports
              },
              meta: {
                needs: regData.needs,
                timeline: regData.timeline,
                sector: regData.sector,
                client_name: regData.name,
                client_email: regData.email,
                client_company: regData.companyName
              }
            }
          })
        });

        if (response.ok) {
          setIsSuccess(true);
        } else {
          setErrors({ submit: 'Error al enviar el formulario.' });
        }
      } catch (err) {
        setErrors({ submit: 'Error de red.' });
      } finally {
        setLoadingAuth(false);
      }

    }
  };

  const handleResendEmail = async () => {
    setLoadingAuth(true);
    try {
      await resendVerification(regData.email);
      Swal.fire({ icon: 'success', title: 'Email enviado',
        text: 'Un nuevo enlace fue enviado a tu bandeja.',
        toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
    } catch (err: unknown) {
      Swal.fire({ icon: 'error', title: t.common.error, text: (err as Error).message ?? 'Error al reenviar.' });
    } finally { setLoadingAuth(false); }
  };

  // ── Step meta ──────────────────────────────────────────────────────────────
  const stepMeta: Record<number, { title: string; subtitle: string }> = {
    1: { title: t.auth.step1Title ?? '¿Cuál es tu rol?',           subtitle: t.auth.step1Subtitle ?? 'Cuéntanos sobre ti.'                    },
    2: { title: t.auth.step2Title ?? '¿Qué necesitas construir?',  subtitle: t.auth.step2Subtitle ?? 'Puedes elegir varias opciones.'          },
    3: { title: t.auth.step3Title ?? '¿Cuándo quieres lanzar?',    subtitle: t.auth.step3Subtitle ?? 'Solo una idea general está bien.'        },
    4: { title: t.auth.step4Title ?? 'Tu cuenta y empresa',        subtitle: t.auth.step4Subtitle ?? `Bienvenido${regData.name ? `, ${regData.name}` : ''}.` },
    5: { title: t.auth.step5Title ?? 'Tu proyecto',                subtitle: t.auth.step5Subtitle ?? 'Cuéntanos qué necesitas construir.'      },
    6: { title: t.auth.step6Title ?? 'Detalles finales',           subtitle: t.auth.step6Subtitle ?? 'Todo esto puedes completarlo después.'   },
  };

  // ── Animation ──────────────────────────────────────────────────────────────
  const variants = {
    enter:  (d: number) => ({ x: d > 0 ?  48 : -48, opacity: 0 }),
    center:              ({ x: 0, opacity: 1 }),
    exit:   (d: number) => ({ x: d > 0 ? -48 :  48, opacity: 0 }),
  };
  const transition = { duration: 0.22, ease: [0.4, 0, 0.2, 1] } as const;
  const animKey    = isRegistering ? registrationStep : 'login';

  // ── Accordion ──────────────────────────────────────────────────────────────
  const Accordion = ({
    label, open, onToggle, children,
  }: { label: string; open: boolean; onToggle: () => void; children: React.ReactNode }) => (
    <div className="border border-gray-100 rounded-xl sm:rounded-2xl overflow-hidden bg-white">
      <button type="button" onClick={onToggle}
        className="w-full px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors">
        <span className="text-xs sm:text-sm font-bold text-gray-500">{label}</span>
        {open ? <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
              : <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="p-3.5 sm:p-4 border-t border-gray-100 space-y-3 sm:space-y-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="min-h-screen bg-[#F9F7F4] flex items-center justify-center">
      <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600 animate-spin" />
    </div>
  );

  if (isVerificationPending) return (
    <div className="min-h-screen bg-[#F9F7F4] flex items-center justify-center p-4">
      <style>{styles}</style>
      <div className="bg-white p-7 sm:p-10 rounded-3xl shadow-xl w-full max-w-sm sm:max-w-md text-center space-y-5 sm:space-y-6 border border-gray-100">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
          <Mail className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-2">
            {t.auth.checkEmail ?? 'Revisa tu correo'}
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">
            {t.auth.verifyLink ?? 'Te enviamos un enlace de verificación a'}{' '}
            <span className="font-bold text-purple-600">{regData.email}</span>
          </p>
        </div>
        <div className="flex flex-col gap-3 pt-1">
          <button onClick={() => { setIsVerificationPending(false); setIsRegistering(false); setRegistrationStep(1); }}
            className="w-full py-3.5 sm:py-4 bg-purple-600 text-white rounded-2xl font-black text-sm sm:text-base hover:bg-purple-700 active:scale-[0.98] transition-all shadow-lg shadow-purple-200/70">
            {t.auth.backToLogin ?? 'Volver al inicio de sesión'}
          </button>
          <button onClick={handleResendEmail} disabled={loadingAuth}
            className="w-full py-3.5 sm:py-4 bg-gray-50 text-gray-600 rounded-2xl font-bold text-sm hover:bg-gray-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            {loadingAuth ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {t.auth.resendEmail ?? 'Reenviar correo'}
          </button>
        </div>
      </div>
    </div>
  );

  if (isSuccess) return (
    <div className="min-h-screen bg-[#F9F7F4] flex items-center justify-center p-4">
      <style>{styles}</style>
      <div className="bg-white p-7 sm:p-10 rounded-3xl shadow-xl w-full max-w-sm sm:max-w-md text-center space-y-5 sm:space-y-6 border border-gray-100">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
          <Check className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-2">
            ¡Gracias por enviarnos tu proyecto!
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">
            Hemos registrado toda la información. Nuestro equipo la revisará y nos pondremos en contacto contigo pronto.
          </p>
        </div>
        <div className="flex flex-col gap-3 pt-1">
          <button onClick={() => window.location.reload()}
            className="w-full py-3.5 sm:py-4 bg-purple-600 text-white rounded-2xl font-black text-sm sm:text-base hover:bg-purple-700 active:scale-[0.98] transition-all shadow-lg shadow-purple-200/70">
            Volver al Inicio
          </button>
        </div>
      </div>
    </div>
  );

  // ── Main render ────────────────────────────────────────────────────────────
  const currentMeta = isRegistering ? stepMeta[registrationStep] : null;

  return (
    <div className="min-h-screen bg-[#F9F7F4] flex flex-col font-sans selection:bg-purple-100 selection:text-purple-900">
      <style>{styles}</style>

      {/* Progress bar */}
      {isRegistering && (
        <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
          <div className="h-full bg-purple-600 progress-bar-fill"
            style={{ width: `${(registrationStep / TOTAL_STEPS) * 100}%` }} />
        </div>
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 pointer-events-none">
        <button onClick={handleBack} aria-label="Volver"
          className="pointer-events-auto p-2 hover:bg-white rounded-full transition-colors text-gray-400 hover:text-purple-600 hover:shadow-sm">
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <button onClick={toggleLanguage}
          className="pointer-events-auto px-3 py-1.5 sm:px-4 sm:py-2 bg-white text-gray-600 rounded-xl font-bold border border-gray-100 hover:border-purple-200 transition-all shadow-sm text-xs sm:text-sm">
          {language === 'en' ? 'ES' : 'EN'}
        </button>
      </header>

      {/* Layout */}
      <main className="flex-1 flex flex-col md:flex-row pt-14 sm:pt-16 min-h-screen overflow-hidden">

        {/* ── Left panel: illustration + title (desktop only) ── */}
        <div className="hidden md:flex md:w-[42%] lg:w-[45%] p-10 lg:p-12 flex-col justify-center items-start bg-white border-r border-gray-50 overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div key={animKey} custom={direction} variants={variants}
              initial="enter" animate="center" exit="exit" transition={transition}
              className="w-full max-w-sm lg:max-w-md space-y-6 lg:space-y-8">
              <div className="space-y-2.5">
                <h2 className="text-3xl lg:text-5xl font-black text-gray-900 leading-tight tracking-tight">
                  {isRegistering ? currentMeta!.title : (t.auth.loginTitle ?? 'Bienvenido de vuelta')}
                </h2>
                <p className="text-base lg:text-lg text-gray-400 font-medium">
                  {isRegistering ? currentMeta!.subtitle : (t.auth.loginSubtitle ?? 'Accede a tu panel de control.')}
                </p>
              </div>
              {isRegistering && <StepIllustration step={registrationStep} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Right panel: form ── */}
        <div className="flex-1 flex flex-col justify-start md:justify-center items-center px-4 sm:px-8 md:px-10 lg:px-12 py-6 overflow-y-auto">
          <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg">

            {/* Mobile title */}
            <div className="md:hidden mb-5 sm:mb-7 space-y-1">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
                {isRegistering ? currentMeta!.title : (t.auth.loginTitle ?? 'Bienvenido de vuelta')}
              </h2>
              <p className="text-sm text-gray-400 font-medium">
                {isRegistering ? currentMeta!.subtitle : (t.auth.loginSubtitle ?? '')}
              </p>
            </div>

            {/* Progress dots */}
            {isRegistering && (
              <div className="flex items-center gap-1.5 sm:gap-2 mb-5 sm:mb-8">
                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                  <div key={i}
                    className={`h-1 sm:h-1.5 rounded-full transition-all duration-300
                      ${i < registrationStep - 1
                        ? 'w-4 sm:w-4 bg-purple-600'
                        : i === registrationStep - 1
                          ? 'flex-1 bg-purple-400'
                          : 'w-4 sm:w-4 bg-gray-200'
                      }`}
                  />
                ))}
              </div>
            )}

            {/* Auth error */}
            <AnimatePresence>
              {authError && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="mb-4 sm:mb-6 flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 px-3.5 sm:px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold">
                  <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Animated step */}
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div key={animKey} custom={direction} variants={variants}
                initial="enter" animate="center" exit="exit" transition={transition} className="w-full">

                {/* ── LOGIN ── */}
                {!isRegistering && (
                  <div className="space-y-4 sm:space-y-5">
                    <InputField label={t.auth.email ?? 'Correo Electrónico'} icon={Mail}
                      placeholder="nombre@empresa.com" type="email" value={loginData.email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setLoginData(p => ({ ...p, email: e.target.value })); setErrors({}); }}
                      error={errors.email} />
                    <InputField label={t.auth.password ?? 'Contraseña'} icon={Lock}
                      placeholder="••••••••" type="password" value={loginData.password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setLoginData(p => ({ ...p, password: e.target.value })); setErrors({}); }}
                      error={errors.password} />
                    <button type="button" onClick={() => handleSubmit()} disabled={loadingAuth}
                      className="w-full py-3.5 sm:py-4 bg-purple-600 text-white rounded-2xl font-black text-base sm:text-lg hover:bg-purple-700 active:scale-[0.98] transition-all shadow-xl shadow-purple-200/70 flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed">
                      {loadingAuth ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                        : <><LogIn className="w-4 h-4 sm:w-5 sm:h-5" /> {t.auth.signIn ?? 'Iniciar Sesión'}</>}
                    </button>
                    <div className="text-center pt-1">
                      <button type="button"
                        onClick={() => { setIsRegistering(true); setRegistrationStep(1); setErrors({}); }}
                        className="text-gray-400 font-bold hover:text-purple-600 transition-colors text-xs sm:text-sm">
                        {t.auth.noAccount ?? '¿No tienes cuenta? Regístrate'}
                      </button>
                    </div>
                  </div>
                )}

                {/* ── STEP 1: Role ── */}
                {isRegistering && registrationStep === 1 && (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
                      {[
                        { id: 'founder',  icon: User,   label: t.auth.roles?.founder  ?? 'Founder / CEO'   },
                        { id: 'techLead', icon: Server, label: t.auth.roles?.techLead ?? 'Tech Lead / CTO' },
                        { id: 'pm',       icon: Layout, label: t.auth.roles?.pm       ?? 'Product Manager' },
                      ].map(item => (
                        <SelectionCard key={item.id} title={item.label} icon={item.icon}
                          selected={regData.role === item.id}
                          onClick={() => selectAndAdvance('role', item.id)} />
                      ))}
                    </div>
                    {errors.role && (
                      <p className="text-xs text-red-500 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.role}
                      </p>
                    )}
                    <button type="button" onClick={() => { setIsRegistering(false); onBack?.(); }}
                      className="w-full text-center text-xs sm:text-sm text-gray-400 font-bold hover:text-purple-600 transition-colors pt-2">
                      {t.auth.haveAccount ?? '¿Ya tienes cuenta? Inicia sesión'}
                    </button>
                  </div>
                )}

                {/* ── STEP 2: Needs ── */}
                {isRegistering && registrationStep === 2 && (
                  <div className="space-y-3 sm:space-y-5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
                      {[
                        { id: 'webApp',    icon: Globe,        label: t.auth.needs?.webApp    ?? 'App Web'        },
                        { id: 'mobileApp', icon: Smartphone,   label: t.auth.needs?.mobileApp ?? 'App Móvil'     },
                        { id: 'dashboard', icon: BarChart3,    label: t.auth.needs?.dashboard ?? 'Dashboard'     },
                        { id: 'ecommerce', icon: ShoppingCart, label: t.auth.needs?.ecommerce ?? 'E-commerce'    },
                        { id: 'backend',   icon: Server,       label: t.auth.needs?.backend   ?? 'API / Backend' },
                        { id: 'notSure',   icon: HelpCircle,   label: t.auth.needs?.notSure   ?? 'No sé aún'     },
                      ].map(item => (
                        <SelectionCard key={item.id} title={item.label} icon={item.icon}
                          selected={regData.needs.includes(item.id)}
                          onClick={() => {
                            const next = regData.needs.includes(item.id)
                              ? regData.needs.filter(n => n !== item.id)
                              : [...regData.needs, item.id];
                            setField('needs', next); clearErr('needs');
                          }} />
                      ))}
                    </div>
                    {errors.needs && (
                      <p className="text-xs text-red-500 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.needs}
                      </p>
                    )}
                    <ContinueBtn onClick={handleNext} label={t.auth.nextStep ?? 'Continuar'} />
                  </div>
                )}

                {/* ── STEP 3: Timeline ── */}
                {isRegistering && registrationStep === 3 && (
                  <div className="space-y-2.5 sm:space-y-4">
                    {[
                      { id: 'now',   icon: Zap,    bg: 'bg-emerald-50', color: 'text-emerald-600', label: t.auth.timeline?.now   ?? 'Menos de 1 mes — ¡Ya!'     },
                      { id: 'soon',  icon: Clock,  bg: 'bg-amber-50',   color: 'text-amber-600',   label: t.auth.timeline?.soon  ?? '1–3 meses — Pronto'         },
                      { id: 'later', icon: Coffee, bg: 'bg-blue-50',    color: 'text-blue-600',    label: t.auth.timeline?.later ?? 'Más de 3 meses — Con calma' },
                    ].map(item => (
                      <button key={item.id} type="button" onClick={() => selectAndAdvance('timeline', item.id)}
                        className={`w-full flex items-center gap-3.5 sm:gap-5 p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 transition-all duration-200 group
                          ${regData.timeline === item.id
                            ? 'border-purple-600 bg-purple-50/60 card-sel-active'
                            : 'border-gray-100 bg-white hover:border-purple-200 hover:shadow-md card-sel-shadow'}`}>
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all duration-200 shrink-0
                          ${regData.timeline === item.id ? 'bg-purple-600 text-white' : `${item.bg} ${item.color} group-hover:scale-105`}`}>
                          <item.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <span className={`font-black text-sm sm:text-base flex-1 text-left transition-colors duration-200
                          ${regData.timeline === item.id ? 'text-purple-900' : 'text-gray-900'}`}>
                          {item.label}
                        </span>
                        {regData.timeline === item.id && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className="w-4 h-4 sm:w-5 sm:h-5 bg-purple-600 rounded-full flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                          </motion.div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* ── STEP 4: Account + Company ── */}
                {isRegistering && registrationStep === 4 && (
                  <div className="space-y-4 sm:space-y-5">
                    <div className="space-y-3 sm:space-y-4">
                      <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest">
                        {t.auth.sectionAccount ?? 'Acceso'}
                      </p>
                      <InputField label={t.auth.fullName ?? 'Nombre Completo'}
                        placeholder="Juan García" value={regData.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setField('name', e.target.value); clearErr('name'); }}
                        error={errors.name} />
                      <InputField label={t.auth.email ?? 'Correo Electrónico'} icon={Mail}
                        placeholder="nombre@empresa.com" type="email" value={regData.email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setField('email', e.target.value); clearErr('email'); }}
                        error={errors.email} />
                      <InputField label={t.auth.password ?? 'Contraseña'} icon={Lock}
                        placeholder="••••••••" type="password" value={regData.password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setField('password', e.target.value); clearErr('password'); }}
                        error={errors.password} />
                    </div>

                    <div className="border-t border-gray-100 pt-4 sm:pt-5 space-y-3 sm:space-y-4">
                      <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest">
                        {t.auth.sectionCompany ?? 'Empresa'}
                      </p>
                      <InputField label={t.auth.companyName ?? 'Nombre de la Empresa'} icon={Building}
                        placeholder="Acme Corporation" value={regData.companyName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setField('companyName', e.target.value); clearErr('companyName'); }}
                        error={errors.companyName} />
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">
                          {t.auth.sector ?? 'Sector'}
                        </label>
                        <select
                          className="w-full p-3 sm:p-4 border-2 border-gray-100 rounded-xl bg-white outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all text-sm sm:text-base"
                          value={regData.sector} onChange={(e) => setField('sector', e.target.value)}>
                          <option value="Tech">{t.auth.sectors?.tech    ?? 'Tecnología'}</option>
                          <option value="FinTech">{t.auth.sectors?.fintech ?? 'FinTech'}</option>
                          <option value="Health">{t.auth.sectors?.health  ?? 'Salud'}</option>
                          <option value="Retail">{t.auth.sectors?.retail  ?? 'Retail'}</option>
                          <option value="Other">{t.auth.sectors?.other    ?? 'Otro'}</option>
                        </select>
                      </div>

                      <Accordion label={t.auth.optionalBilling ?? 'Facturación (Opcional)'}
                        open={showTaxAccordion} onToggle={() => setShowTaxAccordion(v => !v)}>
                        <InputField label={t.auth.taxId ?? 'ID Fiscal / RUT'} icon={FileText}
                          placeholder="US-12345" value={regData.taxId}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField('taxId', e.target.value)} />
                      </Accordion>
                    </div>

                    <ContinueBtn onClick={handleNext} label={t.auth.nextStep ?? 'Continuar'} />
                  </div>
                )}

                {/* ── STEP 5: Project ── */}
                {isRegistering && registrationStep === 5 && (
                  <div className="space-y-3 sm:space-y-5">
                    <InputField
                      label={t.auth.projectName ?? '¿Cómo se llama tu proyecto?'}
                      placeholder="Mi Startup Increíble"
                      value={regData.projectName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setField('projectName', e.target.value); clearErr('projectName'); }}
                      error={errors.projectName} />

                    <TextareaField
                      label={t.auth.projectTargetAudience ?? '¿A quién va dirigida la aplicación?'}
                      placeholder="Describe tu usuario final: ¿clientes externos, equipo interno, un público específico?"
                      value={regData.projectTargetAudience}
                      onChange={v => setField('projectTargetAudience', v)}
                      rows={2}
                      optional />

                    <TextareaField
                      label={t.auth.projectProblem ?? '¿Qué problema concreto estás resolviendo?'}
                      placeholder="Explica la situación actual que hace que este software sea necesario."
                      value={regData.projectProblem}
                      onChange={v => setField('projectProblem', v)}
                      rows={2}
                      optional />

                    <TextareaField
                      label={t.auth.projectCoreFeatures ?? '¿Qué debería poder hacer la aplicación?'}
                      placeholder="Lista las funciones principales que son indispensables para lanzar."
                      value={regData.projectCoreFeatures}
                      onChange={v => { setField('projectCoreFeatures', v); clearErr('projectCoreFeatures'); }}
                      rows={3}
                      error={errors.projectCoreFeatures} />

                    <Accordion label={t.auth.moreFeatures ?? 'Más detalles (Opcional)'}
                      open={showExtraFeatures} onToggle={() => setShowExtraFeatures(v => !v)}>
                      <TextareaField
                        label={t.auth.projectSecondaryFeatures ?? '¿Qué funciones serían un plus, pero no urgentes?'}
                        placeholder="Características para una segunda fase..."
                        value={regData.projectSecondaryFeatures}
                        onChange={v => setField('projectSecondaryFeatures', v)}
                        rows={2}
                        optional />
                      <TextareaField
                        label={t.auth.projectIntegrations ?? '¿Necesita integrarse con algún sistema externo?'}
                        placeholder="Pasarelas de pago, CRMs, APIs, WhatsApp, etc."
                        value={regData.projectIntegrations}
                        onChange={v => setField('projectIntegrations', v)}
                        rows={2}
                        optional />
                    </Accordion>

                    <ContinueBtn onClick={handleNext} label={t.auth.nextStep ?? 'Continuar'} />
                  </div>
                )}

                {/* ── STEP 6: Data, access & visual ── */}
                {isRegistering && registrationStep === 6 && (
                  <div className="space-y-3 sm:space-y-5">
                    <p className="text-xs sm:text-sm text-gray-400 font-medium leading-relaxed bg-gray-50 rounded-xl px-3.5 sm:px-4 py-3 border border-gray-100">
                      {t.auth.step6Note ?? 'Estas preguntas nos ayudan a preparar una propuesta más precisa. Puedes completarlas ahora o después.'}
                    </p>

                    <TextareaField
                      label={t.auth.projectDataToSave ?? '¿Qué información necesita guardar la app?'}
                      placeholder="Usuarios, productos, pedidos, historial, etc."
                      value={regData.projectDataToSave}
                      onChange={v => setField('projectDataToSave', v)}
                      rows={2}
                      optional />

                    <TextareaField
                      label={t.auth.projectRolesPermissions ?? '¿Quién la usará y con qué permisos?'}
                      placeholder="Administrador, cliente, vendedor — ¿qué puede ver o hacer cada uno?"
                      value={regData.projectRolesPermissions}
                      onChange={v => setField('projectRolesPermissions', v)}
                      rows={2}
                      optional />

                    <Accordion label={t.auth.moreDetails ?? 'Exportaciones y branding (Opcional)'}
                      open={showExtraDetails} onToggle={() => setShowExtraDetails(v => !v)}>
                      <TextareaField
                        label={t.auth.projectExportsReports ?? '¿Necesitas exportar o generar documentos automáticamente?'}
                        placeholder="Facturas PDF, reportes Excel, gráficas de desempeño..."
                        value={regData.projectExportsReports}
                        onChange={v => setField('projectExportsReports', v)}
                        rows={2}
                        optional />
                      <TextareaField
                        label={t.auth.projectVisualBranding ?? '¿Tienes definida una paleta de colores y tipografía?'}
                        placeholder="Si ya tienes branding, compártelo. Si no, podemos proponerte opciones."
                        value={regData.projectVisualBranding}
                        onChange={v => setField('projectVisualBranding', v)}
                        rows={2}
                        optional />
                      <TextareaField
                        label={t.auth.projectVisualAssets ?? '¿Cuentas con logo e imágenes para el proyecto?'}
                        placeholder="Indica si ya los tienes listos o si necesitas que los desarrollemos."
                        value={regData.projectVisualAssets}
                        onChange={v => setField('projectVisualAssets', v)}
                        rows={2}
                        optional />
                    </Accordion>

                    <div className="flex flex-col gap-2.5 sm:gap-3 pt-1">
                      <button type="button" disabled={loadingAuth}
                        onClick={() => handleSubmit(false)}
                        className="w-full py-3.5 sm:py-4 bg-purple-600 text-white rounded-2xl font-black text-base sm:text-lg hover:bg-purple-700 active:scale-[0.98] transition-all shadow-xl shadow-purple-200/70 flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed">
                        {loadingAuth
                          ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                          : <><CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> {t.auth.completeReg ?? 'Completar Registro'}</>}
                      </button>
                      <button type="button" disabled={loadingAuth}
                        onClick={() => handleSubmit(true)}
                        className="py-2 text-gray-400 font-bold hover:text-purple-600 transition-colors text-xs sm:text-sm text-center disabled:opacity-40">
                        {t.auth.completeLater ?? 'Completar después →'}
                      </button>
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>

            {/* Bottom padding so last element is not hidden behind any OS nav bars */}
            <div className="h-8 sm:h-4" />
          </div>
        </div>
      </main>
    </div>
  );
};