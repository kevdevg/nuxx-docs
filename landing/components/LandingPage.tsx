import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../services/store';
import { Button } from './Button';
import {
  ArrowRight, CheckCircle2, Layout, ShieldCheck,
  BarChart3, Globe, MessageSquare, Upload, Clock, Users, Puzzle,
  Instagram, MessageCircle, Sun, Moon
} from 'lucide-react';
import {
  motion, useScroll, useTransform, useSpring,
  useMotionValue, useMotionTemplate, MotionValue
} from 'motion/react';

const VIDEO_SRC_WEBM = 'https://assets.nuxx.app/nux/hero-background.webm';
const VIDEO_SRC_MP4 = 'https://assets.nuxx.app/nux/hero-background.mp4';
const VIDEO_POSTER = 'https://assets.nuxx.app/nux/hero-background-poster.png';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onRegister }) => {
  const { t, language, toggleLanguage, theme, toggleTheme } = useApp();
  const isDark = theme === 'dark';
  const [isScrolled, setIsScrolled]     = useState(false);
  const [vh, setVh]                     = useState(800);
  const [isMobile, setIsMobile]         = useState(false);
  const [videoError, setVideoError]     = useState(false);

  const containerRef    = useRef<HTMLDivElement>(null);
  const videoRefDesktop = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const updateVh = () => {
      setVh(window.innerHeight);
      setIsMobile(window.innerWidth < 768);
    };
    updateVh();
    window.addEventListener('resize', updateVh);
    return () => window.removeEventListener('resize', updateVh);
  }, []);

  const { scrollY, scrollYProgress } = useScroll({ container: containerRef });

  const smoothProgress   = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const navBgLight       = useTransform(scrollY, [0, 100], ['rgba(255,255,255,0)', 'rgba(255,255,255,0.9)']);
  const navBgDark        = useTransform(scrollY, [0, 100], ['rgba(17,24,39,0)', 'rgba(17,24,39,0.9)']);
  const navBg            = isDark ? navBgDark : navBgLight;
  const navBlur          = useTransform(scrollY, [0, 100], ['blur(0px)', 'blur(12px)']);
  const navOpacity       = useTransform(scrollY, [0, vh * 0.8, vh], [1, 1, 0]);
  const navPointerEvents = useTransform(navOpacity, (v) => v > 0.1 ? 'auto' : 'none');

  // Autoplay video on desktop only (mobile shows poster image)
  useEffect(() => {
    if (isMobile) return;
    const v = videoRefDesktop.current;
    if (v) {
      v.playbackRate = 1.8;
      v.play().catch(() => {});
    }
  }, [isMobile]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onScroll = () => setIsScrolled(container.scrollTop > 50);
    container.addEventListener('scroll', onScroll);
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-auto snap-y snap-mandatory font-sans text-gray-900 dark:text-gray-100 overflow-x-hidden selection:bg-nuxx-purple selection:text-white"
    >
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-nuxx-purple via-blue-500 to-purple-600 z-[60] origin-left"
        style={{ scaleX: smoothProgress }}
      />

      {/* ── Navigation ── */}
      <motion.nav
        style={{ backgroundColor: navBg, backdropFilter: navBlur, opacity: navOpacity, pointerEvents: navPointerEvents }}
        className={`fixed w-full z-50 border-b transition-all duration-300 ${
          isScrolled ? 'border-gray-200 dark:border-gray-700 shadow-lg dark:shadow-gray-900/50 py-1' : 'border-transparent py-2 md:py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 md:h-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 cursor-pointer"
            >
              <img src="https://assets.nuxx.app/nux/logo.png" alt="NUXX" className="h-8 md:h-10 w-auto" />
            </motion.div>
            <div className="flex items-center gap-2 md:gap-4">
              <motion.button
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                onClick={toggleLanguage}
                className="px-2 py-1.5 md:px-3 md:py-2 text-xs md:text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-nuxx-purple dark:hover:text-nuxx-yellow transition-colors"
              >
                {language === 'en' ? 'ES' : 'EN'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 15 }} whileTap={{ scale: 0.95 }}
                onClick={toggleTheme}
                className="p-1.5 md:p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-nuxx-purple dark:hover:text-nuxx-yellow hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {isDark ? <Sun className="w-4 h-4 md:w-5 md:h-5" /> : <Moon className="w-4 h-4 md:w-5 md:h-5" />}
              </motion.button>
              {/* <button
                onClick={onLogin}
                className="text-xs md:text-sm font-semibold text-gray-700 hover:text-nuxx-purple transition-colors px-3 py-1.5 md:px-4 md:py-2 rounded-lg hover:bg-gray-100"
              >
                {t.landing.clientLogin}
              </button>
              <Button
                onClick={onRegister}
                className="text-xs md:text-sm px-3 py-1.5 md:px-4 md:py-2 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40"
              >
                {t.landing.getStartedFree}
              </Button> */}
            </div>
          </div>
        </div>
      </motion.nav>

      {/* ══════════════════════════════════════════════
          SECTION 1 — Hero
      ══════════════════════════════════════════════ */}
      <section className="relative h-screen snap-start overflow-hidden bg-gray-50 dark:bg-gray-900">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] md:w-[500px] md:h-[500px] bg-purple-300/20 dark:bg-purple-600/15 rounded-full blur-[100px] md:blur-[120px]" />
          <div className="absolute bottom-[-5%] right-[10%] w-[300px] h-[300px] md:w-[400px] md:h-[400px] bg-blue-300/15 dark:bg-blue-600/10 rounded-full blur-[80px] md:blur-[100px]" />
        </div>

        {/* ── MOBILE layout ── */}
        <div className="md:hidden h-full flex flex-col pt-16 relative z-10">
          <motion.div
            className="flex-1 flex flex-col justify-center px-5 pt-4 pb-2 min-h-0"
          >
            <motion.div
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="inline-flex self-start items-center gap-1.5 px-3 py-1 mb-4 rounded-full bg-purple-100 dark:bg-purple-900/40 text-nuxx-purple dark:text-purple-300 text-[10px] font-bold tracking-widest uppercase whitespace-nowrap"
            >
              <Puzzle className="w-3 h-3" /> {t.landing.modularAgency}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              className="text-[2.6rem] font-heading font-black tracking-tighter leading-[0.9] mb-3"
            >
              {t.landing.heroTitle.split(' ').map((word: string, i: number) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.07, duration: 0.6 }}
                  className="inline-block mr-2"
                >
                  {word}
                </motion.span>
              ))}
              <br />
              <motion.span
                initial={{ backgroundPosition: '0% 50%' }}
                animate={{ backgroundPosition: '100% 50%' }}
                transition={{ duration: 5, repeat: Infinity, repeatType: 'reverse' }}
                className="bg-clip-text text-transparent bg-gradient-to-r from-nuxx-purple via-blue-600 to-purple-600 bg-[length:200%_auto]"
              >
                {t.landing.heroSubtitle}
              </motion.span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45 }}
              className="text-sm text-gray-500 dark:text-gray-400 mb-5 leading-relaxed font-light max-w-xs"
            >
              {t.landing.heroDesc}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col gap-2.5"
            >
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onRegister}
                className="group w-full px-6 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2"
              >
                {t.landing.startProject}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Mobile hero image (no video to reduce page weight) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
            className="relative h-[36vh] flex-shrink-0 mx-4 mb-4 rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/15 dark:bg-gray-900"
          >
            <img
              src={VIDEO_POSTER}
              alt="Nuxx agency interface"
              className="w-full h-full object-cover object-center"
            />
          </motion.div>

        </div>

        {/* ── DESKTOP layout ── */}
        <motion.div
          className="hidden md:flex absolute top-0 left-0 z-20 flex-col justify-start pt-32 pl-8 sm:pl-12 lg:pl-20 max-w-[56%] sm:max-w-[52%]"
        >
          <motion.div
            initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="inline-flex self-start items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-purple-100 dark:bg-purple-900/40 text-nuxx-purple dark:text-purple-300 text-sm font-bold tracking-wider uppercase"
          >
            <Puzzle className="w-4 h-4" /> {t.landing.modularAgency}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="text-7xl lg:text-8xl font-heading font-black tracking-tighter leading-[0.88] mb-6"
          >
            {t.landing.heroTitle.split(' ').map((word: string, i: number) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.7 }}
                className="inline-block mr-3"
              >
                {word}
              </motion.span>
            ))}
            <br />
            <motion.span
              initial={{ backgroundPosition: '0% 50%' }}
              animate={{ backgroundPosition: '100% 50%' }}
              transition={{ duration: 5, repeat: Infinity, repeatType: 'reverse' }}
              className="bg-clip-text text-transparent bg-gradient-to-r from-nuxx-purple via-blue-600 to-purple-600 bg-[length:200%_auto]"
            >
              {t.landing.heroSubtitle}
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.55 }}
            className="text-lg text-gray-600 dark:text-gray-400 mb-10 leading-relaxed font-light max-w-md"
          >
            {t.landing.heroDesc}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.72 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }}
              onClick={onRegister}
              className="group px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold text-base shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 flex items-center justify-center gap-3"
            >
              {t.landing.startProject}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Desktop video */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, x: 60, y: 40 }}
          animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          className="hidden md:block absolute bottom-0 right-0 z-10 w-[58%] lg:w-[52%] aspect-video"
        >
          <div className="relative w-full h-full overflow-hidden dark:bg-gray-900">
            <video
              ref={videoRefDesktop}
              muted
              playsInline
              autoPlay
              loop
              poster={VIDEO_POSTER}
              onError={() => {
                console.error("Video error on desktop");
                setVideoError(true);
              }}
              className={`w-full h-full object-cover object-center ${videoError ? 'hidden' : ''}`}
            >
              <source src={VIDEO_SRC_WEBM} type="video/webm" />
              <source src={VIDEO_SRC_MP4} type="video/mp4" />
            </video>
            {videoError && (
              <img
                src={VIDEO_POSTER}
                alt="Agency dashboard"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
          </div>
        </motion.div>


      </section>

      {/* ══════════════════════════════════════════════
          SECTION 2 — How It Works (PURPLE)
      ══════════════════════════════════════════════ */}
      <section className="min-h-screen snap-start flex flex-col justify-center relative overflow-hidden bg-[#5b21b6]">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-purple-400/20 rounded-full blur-[120px]" />
          <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-violet-900/40 rounded-full blur-[100px]" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-16 md:py-0">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.9 }}
            className="text-center mb-12 md:mb-24"
          >
            <h2 className="text-3xl sm:text-4xl md:text-7xl font-heading font-black mb-4 md:mb-8 tracking-tight text-white">
              {t.landing.howItWorks}
            </h2>
            <p className="text-base md:text-2xl text-purple-200 max-w-2xl mx-auto font-light">
              {t.landing.howItWorksDesc}
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16">
            {[
              { number: '01', icon: Upload, title: t.landing.steps.upload.title,  description: t.landing.steps.upload.desc,  accent: false },
              { number: '02', icon: Users,  title: t.landing.steps.approve.title, description: t.landing.steps.approve.desc, accent: true  },
              { number: '03', icon: Clock,  title: t.landing.steps.track.title,   description: t.landing.steps.track.desc,   accent: false },
            ].map((step, index) => (
              <PurpleStepCard key={index} {...step} index={index} scrollYProgress={scrollYProgress} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SECTION 3 — Features (WHITE)
      ══════════════════════════════════════════════ */}
      <section className="min-h-screen snap-start flex flex-col justify-center bg-white dark:bg-gray-900 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full py-16 md:py-0">
          <motion.div
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
            viewport={{ once: true }} transition={{ duration: 1 }}
            className="text-center mb-8 md:mb-10"
          >
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-heading font-black mb-3 md:mb-4 tracking-tight text-gray-900 dark:text-white">
              {t.landing.featuresTitle}
            </h2>
            <p className="text-base md:text-xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto font-light">
              {t.landing.featuresDesc}
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            {[
              { icon: Layout,        title: t.landing.features.management.title,  description: t.landing.features.management.desc,  gradient: 'from-purple-500 to-purple-600' },
              { icon: MessageSquare, title: t.landing.features.interactive.title, description: t.landing.features.interactive.desc, gradient: 'from-blue-400 to-blue-500'     },
              { icon: ShieldCheck,   title: t.landing.features.security.title,    description: t.landing.features.security.desc,    gradient: 'from-indigo-500 to-violet-600' },
            ].map((feature, index) => (
              <WhiteFeatureCard key={index} {...feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SECTION 4 — CTA (dark)
      ══════════════════════════════════════════════ */}
      <section className="min-h-screen snap-start flex flex-col justify-center bg-gray-900 text-white relative overflow-hidden">
        <motion.div
          style={{
            scale:   useTransform(scrollYProgress, [0.7, 1], [1, 1.2]),
            opacity: useTransform(scrollYProgress, [0.7, 0.9], [0.1, 0.3]),
          }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent"
        />
        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 text-center py-16 md:py-0">
          <motion.h2
            initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }} transition={{ duration: 0.8 }}
            className="text-4xl sm:text-5xl md:text-8xl font-heading font-black mb-6 md:mb-10 tracking-tighter"
          >
            {t.landing.ctaTitle}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: 0.2 }}
            className="text-base md:text-2xl text-gray-400 mb-8 md:mb-14 max-w-3xl mx-auto font-light"
          >
            {t.landing.ctaDesc}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: 0.4 }}
            className="flex justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -5 }} whileTap={{ scale: 0.95 }}
              onClick={onRegister}
              className="group px-8 py-4 md:px-12 md:py-6 bg-white text-gray-900 rounded-2xl font-bold text-base md:text-xl shadow-2xl hover:shadow-white/20 transition-all duration-300 flex items-center justify-center gap-3"
            >
              {t.landing.startFreeTrial}
              <ArrowRight className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-2 transition-transform" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════ */}
      <footer className="min-h-screen snap-start flex flex-col justify-center bg-black text-white py-16 md:py-24 border-t border-gray-900 relative z-10">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 mb-12 md:mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} className="md:col-span-2"
            >
              <div className="flex items-center gap-3 mb-6 md:mb-8">
                <img src="https://assets.nuxx.app/nux/logo.png" alt="NUXX" className="h-8 md:h-10 w-auto" />
              </div>
              <p className="text-base md:text-xl text-gray-500 mb-6 md:mb-8 max-w-md leading-relaxed">{t.landing.footerDesc}</p>
              <div className="flex gap-4 md:gap-6">
                <motion.a href="https://instagram.com" target="_blank" rel="noopener noreferrer" whileHover={{ y: -5, color: '#fff' }}
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full border border-gray-800 flex items-center justify-center text-gray-500 cursor-pointer transition-colors">
                  <Instagram className="w-4 h-4 md:w-5 md:h-5" />
                </motion.a>
                <motion.a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" whileHover={{ y: -5, color: '#fff' }}
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full border border-gray-800 flex items-center justify-center text-gray-500 cursor-pointer transition-colors">
                  <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.27 8.27 0 0 0 4.83 1.54V6.78a4.85 4.85 0 0 1-1.06-.09z"/></svg>
                </motion.a>
                <motion.a href="mailto:hola@nuxx.app" whileHover={{ y: -5, color: '#fff' }}
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full border border-gray-800 flex items-center justify-center text-gray-500 cursor-pointer transition-colors">
                  <Globe className="w-4 h-4 md:w-5 md:h-5" />
                </motion.a>
                <motion.a href="#contact" whileHover={{ y: -5, color: '#fff' }}
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full border border-gray-800 flex items-center justify-center text-gray-500 cursor-pointer transition-colors">
                  <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
                </motion.a>
              </div>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
            viewport={{ once: true }} transition={{ delay: 0.5 }}
            className="pt-8 md:pt-12 border-t border-gray-900 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 text-gray-600 text-sm md:text-base"
          >
            <p>&copy; {new Date().getFullYear()} Nuxx Agency. {t.landing.rightsReserved}</p>
            <p className="font-medium">{t.landing.modularAgency}</p>
          </motion.div>
        </div>
      </footer>
    </div>
  );
};

// ─── Purple Step Card ─────────────────────────────────────────────────────────
interface PurpleStepCardProps {
  number: string;
  icon: React.ElementType;
  title: string;
  description: string;
  accent: string;
  index: number;
  scrollYProgress: MotionValue<number>;
}

const PurpleStepCard = ({ number, icon: Icon, title, description, accent, index, scrollYProgress }: PurpleStepCardProps) => {
  const yParallax      = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const rotateParallax = useTransform(scrollYProgress, [0, 1], [0, index % 2 === 0 ? 20 : -20]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay: index * 0.15 }}
      className="relative group"
    >
      <div className="flex md:flex-col md:items-center md:text-center items-start gap-4 md:gap-0">
        <motion.div
          whileHover={{ scale: 1.1, rotate: 10, y: -10 }}
          className={`flex-shrink-0 w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-xl md:shadow-2xl md:mb-8 transition-all duration-500 relative z-10 border bg-yellow-400/25 border-yellow-300/50 hover:bg-yellow-400 hover:border-yellow-300`}
        >
          <Icon className={`w-8 h-8 md:w-12 md:h-12 text-purple-800`} />
        </motion.div>
        <motion.div
          style={{ y: yParallax, rotate: rotateParallax }}
          className="hidden md:flex absolute -top-12 left-0 right-0 justify-center text-[12rem] font-black text-white/5 -z-10 select-none pointer-events-none"
        >
          {number}
        </motion.div>
        <div className="flex-1 md:flex-none">
          <span className="md:hidden text-xs font-black text-white/30 tracking-widest mb-1 block">{number}</span>
          <h3 className="text-xl md:text-3xl font-heading font-black mb-2 md:mb-6 text-white tracking-tight">{title}</h3>
          <p className="text-sm md:text-xl text-purple-200 leading-relaxed md:max-w-sm font-light">{description}</p>
        </div>
      </div>
    </motion.div>
  );
};

// ─── White Feature Card ────────────────────────────────────────────────────────
interface WhiteFeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
  index: number;
}

const WhiteFeatureCard = ({ icon: Icon, title, description, gradient, index }: WhiteFeatureCardProps) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [8, -8]);
  const rotateY = useTransform(x, [-100, 100], [-8, 8]);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - (rect.left + rect.width  / 2));
    y.set(event.clientY - (rect.top  + rect.height / 2));
  }
  function handleMouseLeave() { x.set(0); y.set(0); }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      style={{ rotateX, rotateY, perspective: 1000 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative p-6 md:p-8 rounded-2xl md:rounded-[2rem] bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-transparent hover:shadow-[0_20px_50px_-12px_rgba(109,40,217,0.12)] dark:hover:shadow-[0_20px_50px_-12px_rgba(109,40,217,0.25)] transition-all duration-500 overflow-hidden cursor-pointer"
    >
      <motion.div
        style={{
          background: useMotionTemplate`radial-gradient(300px circle at ${x}px ${y}px, rgba(139,92,246,0.08), transparent 80%)`
        }}
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
      />
      <div className="relative z-10 flex md:flex-col items-start gap-4 md:gap-0">
        <motion.div
          whileHover={{ rotate: 12, scale: 1.08 }}
          className={`flex-shrink-0 w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br ${gradient} rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg md:mb-6 transition-all duration-500`}
        >
          <Icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
        </motion.div>
        <div className="flex-1 md:flex-none">
          <h3 className="text-base md:text-xl font-heading font-black mb-1.5 md:mb-3 text-gray-900 dark:text-white group-hover:text-nuxx-purple dark:group-hover:text-purple-400 transition-colors duration-300 tracking-tight">
            {title}
          </h3>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 leading-relaxed font-light">{description}</p>
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            whileHover={{ opacity: 1, x: 0 }}
            className="mt-3 md:mt-6 flex items-center gap-1.5 text-nuxx-purple text-xs md:text-sm font-bold"
          >
            Saber más <ArrowRight className="w-3 h-3 md:w-3.5 md:h-3.5" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};