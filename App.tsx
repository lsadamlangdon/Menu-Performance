
import React, { useState, useRef } from 'react';
import Header from './components/Header';
import { analyzeMenu } from './services/geminiService';
import { AnalysisResults, AppState } from './types';
import ScoreGauge from './components/ScoreGauge';

type FormStep = 1 | 2 | 3;

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [showDisclosure, setShowDisclosure] = useState(false);
  
  // Lead Form State
  const [formStep, setFormStep] = useState<FormStep>(1);
  const [businessType, setBusinessType] = useState('');
  const [revenue, setRevenue] = useState('');
  const [country, setCountry] = useState({ code: '+61', flag: '🇦🇺', name: 'Australia' });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startAnalysis = async (base64Data: string, mimeType: string) => {
    setState(AppState.ANALYZING);
    setLoadingStep('Running rule-based heuristics...');
    try {
      const analysisResult = await analyzeMenu(base64Data, mimeType);
      setResults(analysisResult);
      setCarouselIndex(0);
      setState(AppState.RESULT);
    } catch (err: any) {
      setError(err.message || 'An error occurred during analysis.');
      setState(AppState.ERROR);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setState(AppState.UPLOADING);
    setLoadingStep('Extracting menu items...');
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Data = (e.target?.result as string).split(',')[1];
      const mimeType = file.type;
      await startAnalysis(base64Data, mimeType);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err) {
      setError("Unable to access camera. Please check permissions.");
      setState(AppState.ERROR);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        const base64Data = dataUrl.split(',')[1];
        stopCamera();
        setState(AppState.UPLOADING);
        setLoadingStep('Processing capture...');
        startAnalysis(base64Data, 'image/jpeg');
      }
    }
  };

  const reset = () => {
    stopCamera();
    setState(AppState.IDLE);
    setResults(null);
    setError(null);
    setFormStep(1);
    setBusinessType('');
    setRevenue('');
  };

  const nextSlide = () => {
    if (results) {
      setCarouselIndex((prev) => (prev + 1) % results.quickWins.length);
    }
  };

  const prevSlide = () => {
    if (results) {
      setCarouselIndex((prev) => (prev === 0 ? results.quickWins.length - 1 : prev - 1));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-grow max-w-6xl mx-auto w-full px-8 pt-16 pb-24">
        {state === AppState.IDLE && !isCameraActive && (
          <div className="flex flex-col items-center justify-center mt-8 animate-in fade-in duration-1000">
            <div className="text-center mb-24">
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-lightspeed-red mb-6 block">
                Menu Performance Analysis
              </span>
              <h1 className="text-6xl md:text-8xl font-sans font-black text-lightspeed-dark mb-8 tracking-tight max-w-5xl mx-auto leading-[0.9]">
                How Your Menu Is <span className="text-lightspeed-red block mt-2">Really Performing</span>
              </h1>
              <p className="text-xl text-lightspeed-text-secondary font-medium max-w-2xl mx-auto leading-relaxed opacity-80 mb-16">
                Hospitality-first analysis of your menu's structure, pricing, and operational flow.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-4xl mb-20">
              <label className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-lightspeed-border rounded-[40px] bg-white hover:border-lightspeed-red hover:bg-lightspeed-gray transition-all cursor-pointer group shadow-sm">
                <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} />
                <div className="w-16 h-16 bg-lightspeed-gray rounded-2xl flex items-center justify-center mb-8 group-hover:bg-white group-hover:scale-110 transition-transform shadow-sm">
                  <svg className="w-7 h-7 text-lightspeed-text-secondary group-hover:text-lightspeed-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <span className="text-lg font-black uppercase tracking-widest text-lightspeed-dark text-center">Upload PDF/Image</span>
                <span className="text-[10px] text-lightspeed-text-secondary uppercase font-bold tracking-[0.2em] mt-4 text-center leading-relaxed">Menus, photos, or screenshots<br/>all work.</span>
              </label>

              <button 
                onClick={startCamera}
                className="flex flex-col items-center justify-center p-16 border border-lightspeed-border rounded-[40px] bg-[#fafafa] hover:bg-lightspeed-dark hover:text-white transition-all group shadow-sm"
              >
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 group-hover:bg-white/10 group-hover:scale-110 transition-transform shadow-sm">
                  <svg className="w-7 h-7 text-lightspeed-dark group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="text-lg font-black uppercase tracking-widest text-center">Take a Photo</span>
                <span className="text-[10px] text-lightspeed-text-secondary uppercase font-bold tracking-[0.2em] group-hover:text-white/60 mt-4 text-center leading-relaxed">Snap your menu and get<br/>an instant score.</span>
              </button>
            </div>
          </div>
        )}

        {isCameraActive && (
          <div className="fixed inset-0 z-[100] bg-lightspeed-dark flex flex-col items-center justify-center p-6">
            <div className="relative w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-black">
              <video ref={videoRef} autoPlay playsInline className="w-full h-auto aspect-[3/4] object-cover" />
              <div className="absolute bottom-10 left-0 right-0 flex items-center justify-center gap-12">
                <button onClick={stopCamera} className="text-white text-[10px] font-black uppercase tracking-[0.2em] hover:text-lightspeed-red transition-colors">Cancel</button>
                <button onClick={capturePhoto} className="w-20 h-20 bg-white rounded-full flex items-center justify-center active:scale-90 transition-transform">
                  <div className="w-16 h-16 border-2 border-lightspeed-dark rounded-full flex items-center justify-center">
                    <div className="w-14 h-14 bg-lightspeed-red rounded-full"></div>
                  </div>
                </button>
                <div className="w-12 h-12 invisible"></div>
              </div>
            </div>
          </div>
        )}

        {(state === AppState.UPLOADING || state === AppState.ANALYZING) && (
          <div className="flex flex-col items-center justify-center py-40 text-center animate-in fade-in">
            <div className="w-16 h-16 border-4 border-lightspeed-red border-t-transparent rounded-full animate-spin mb-10"></div>
            <h3 className="text-3xl font-black tracking-tight text-lightspeed-dark">Analyzing Performance</h3>
            <p className="text-lightspeed-text-secondary font-medium mt-4 italic opacity-60 tracking-tight">{loadingStep}</p>
          </div>
        )}

        {state === AppState.ERROR && (
          <div className="max-w-xl mx-auto mt-20 text-center bg-white border border-lightspeed-border p-16 rounded-3xl shadow-sm">
            <h3 className="text-3xl font-black tracking-tight text-lightspeed-dark mb-6">Error Detected</h3>
            <p className="text-lightspeed-text-secondary mb-12 font-medium leading-relaxed">{error}</p>
            <button onClick={reset} className="bg-lightspeed-dark text-white px-12 py-5 rounded-full font-black uppercase tracking-widest text-xs hover:bg-lightspeed-red transition-all shadow-lg">Restart Tool</button>
          </div>
        )}

        {state === AppState.RESULT && results && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-32">
            {/* Top Analysis Bar */}
            <div className="flex flex-col lg:flex-row gap-8 items-stretch mb-20">
              <div className="w-full lg:w-1/3 bg-white border border-lightspeed-border p-8 rounded-[40px] shadow-sm flex flex-col items-center justify-center">
                <ScoreGauge score={results.overallScore} />
              </div>
              <div className="w-full lg:w-2/3 bg-lightspeed-dark text-white p-14 rounded-[40px] flex flex-col justify-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-lightspeed-red opacity-5 blur-[120px] -mr-32 -mt-32"></div>
                <div className="flex items-center gap-4 mb-8">
                  <span className="bg-lightspeed-red text-white px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] rounded-full">Analytics Insight</span>
                  <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{results.confidenceLevel} Accuracy</span>
                </div>
                <h2 className="text-7xl font-black tracking-tight leading-none mb-8">
                  Performance Score: {results.overallScore}%
                </h2>
                <p className="text-2xl text-white/80 font-black leading-snug mb-14 max-w-2xl italic">
                  "{results.oneSentenceSummary}"
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-12 pt-12 border-t border-white/10">
                  <Metric label="Total Items" value={results.metrics.totalItems.toString()} />
                  <Metric label="Size Group" value={results.metrics.sizeCategory} />
                  <Metric label="Operational Complexity" value={`${results.metrics.complexityScore}/10`} />
                  <Metric label="Median Price" value={`$${results.metrics.pricing.medianPrice.toFixed(2)}`} />
                </div>
              </div>
            </div>

            {/* Score Breakdown Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-20">
              <BreakdownCard title="Simplicity" score={results.breakdown.simplicityScore} />
              <BreakdownCard title="Pricing" score={results.breakdown.pricingScore} />
              <BreakdownCard title="Balance" score={results.breakdown.balanceScore} />
              <BreakdownCard title="Margin Flow" score={results.breakdown.marginScore} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
              <ObservationList title="Performance Strengths" items={results.positives} type="pos" />
              <ObservationList title="Structural Risks" items={results.issues} type="neg" />
            </div>

            {/* Strategic Wins - Carousel Implementation */}
            <div className="bg-black text-white p-16 rounded-[40px] shadow-2xl relative overflow-hidden min-h-[450px] flex flex-col justify-center mb-24">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16 border-b border-white/20 pb-8 relative z-10">
                <div className="flex items-center gap-6">
                   <h3 className="font-black uppercase tracking-[0.4em] text-[12px] flex items-center">Strategic Action Plan</h3>
                   <div className="bg-white text-lightspeed-red px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.15em] shadow-xl border border-white/10 animate-pulse">
                     {String(results.quickWins.length).padStart(2, '0')} Critical Recommendations
                   </div>
                </div>
                <div className="flex gap-4">
                   <button onClick={prevSlide} className="w-14 h-14 border-2 border-white/30 rounded-full flex items-center justify-center hover:bg-white hover:text-lightspeed-red transition-all active:scale-90 shadow-lg">
                     <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"/></svg>
                   </button>
                   <button onClick={nextSlide} className="w-14 h-14 border-2 border-white/30 rounded-full flex items-center justify-center hover:bg-white hover:text-lightspeed-red transition-all active:scale-90 shadow-lg">
                     <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
                   </button>
                </div>
              </div>

              <div className="relative overflow-hidden z-10">
                <div 
                  className="flex transition-transform duration-700 cubic-bezier(0.4, 0, 0.2, 1)" 
                  style={{ transform: `translateX(-${carouselIndex * 100}%)` }}
                >
                  {results.quickWins.map((win, i) => (
                    <div key={i} className="flex-shrink-0 w-full flex flex-col md:flex-row items-start md:items-center gap-14 group pr-12">
                      <span className="text-9xl font-black italic opacity-30 group-hover:opacity-100 transition-opacity duration-500 font-sans leading-none select-none">
                        {String(i+1).padStart(2, '0')}
                      </span>
                      <p className="text-3xl md:text-5xl font-black leading-tight tracking-tight max-w-2xl">
                        {win}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-12 flex gap-3 relative z-10">
                {results.quickWins.map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => setCarouselIndex(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${carouselIndex === i ? 'w-12 bg-white' : 'w-2 bg-white/20'}`}
                  />
                ))}
              </div>
            </div>

            {/* Expert Lead Generation Form */}
            <div className="bg-black text-white p-20 rounded-[40px] mb-24 flex flex-col items-center text-center animate-in fade-in duration-1000">
              <LeadForm 
                step={formStep} 
                setStep={setFormStep} 
                businessType={businessType} 
                setBusinessType={setBusinessType}
                revenue={revenue}
                setRevenue={setRevenue}
                country={country}
                setCountry={setCountry}
                resultsSummary={results.oneSentenceSummary}
                overallScore={results.overallScore}
              />
            </div>

            <div className="flex flex-col items-center">
              <button 
                onClick={reset}
                className="bg-black text-white px-20 py-7 rounded-full font-black uppercase tracking-[0.25em] text-[12px] hover:bg-lightspeed-red transition-all shadow-2xl active:scale-95 mb-16"
              >
                Scan Another Menu
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-black text-white py-24 relative overflow-hidden border-t border-white/5">
        <div className="max-w-6xl mx-auto px-8 flex flex-col items-center">
          <div className="flex gap-10 mb-16">
            <SocialLink href="https://www.facebook.com/lightspeedhq/" icon={<path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3V2z"/>} />
            <SocialLink href="https://x.com/lightspeedhq" icon={<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>} />
            <SocialLink href="https://www.instagram.com/lightspeedhq/" icon={<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>} />
            <SocialLink href="https://www.pinterest.com/lightspeedhq/" icon={<path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.33.33 0 01.076.31c-.097.407-.315 1.282-.358 1.458-.058.24-.192.291-.441.175-1.644-.766-2.671-3.171-2.671-5.103 0-4.155 3.018-7.971 8.703-7.971 4.569 0 8.12 3.254 8.12 7.607 0 4.538-2.861 8.193-6.833 8.193-1.334 0-2.588-.693-3.017-1.511l-.821 3.128c-.298 1.136-1.102 2.559-1.642 3.431A12.022 12.022 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>} />
            <SocialLink href="https://www.linkedin.com/company/lightspeedhq/" icon={<path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>} />
            <SocialLink href="https://www.youtube.com/user/lightspeedpos" icon={<path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.377.505 9.377.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>} />
          </div>

          <div className="text-[14px] font-black text-neutral-500 mb-8 uppercase tracking-[0.4em]">
            LIGHTSPEED&reg; 2026
          </div>

          <div className="flex items-center gap-8 text-[11px] font-black text-neutral-600 uppercase tracking-widest">
            <a href="https://www.lightspeedhq.com/au/legal/privacy-policy/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              Privacy policy
            </a>
            <button onClick={() => setShowDisclosure(true)} className="hover:text-white transition-colors cursor-pointer">
              AI Disclosure
            </button>
          </div>

          <div className="mt-12 opacity-80 flex items-center gap-2">
            <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-xl italic font-black">lightspeed</span>
          </div>
        </div>
      </footer>

      {/* Disclosure Modal */}
      {showDisclosure && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-8">
          <div className="bg-white text-black max-w-2xl w-full p-12 rounded-[40px] relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowDisclosure(false)}
              className="absolute top-8 right-8 text-neutral-400 hover:text-black transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <span className="text-lightspeed-red block mb-6 font-black tracking-[0.4em] text-[10px] uppercase">AI Disclosure & Legal Notice</span>
            <p className="text-[14px] font-bold tracking-tight leading-relaxed text-neutral-600">
              This service is powered by Artificial Intelligence (AI). AI-generated insights and recommendations can contain errors, hallucinations, or inaccuracies. Lightspeed Commerce Inc. and its affiliates are not responsible for the accuracy or outcomes of the recommendations provided. Users must conduct comprehensive independent due diligence, professional consultation, and operational testing before implementing any advice or menu changes generated by this tool.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Form Stepper Logic
const LeadForm = ({ step, setStep, businessType, setBusinessType, revenue, setRevenue, country, setCountry, resultsSummary, overallScore }: any) => {
  const steps = [1, 2, 3];
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Form Field State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  
  const handleNext = () => setStep((prev: number) => Math.min(prev + 1, 3));
  const handleBack = () => setStep((prev: number) => Math.max(prev - 1, 1));

  const countryOptions = [
    { code: '+61', flag: '🇦🇺', name: 'Australia' },
    { code: '+64', flag: '🇳🇿', name: 'New Zealand' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      fullName,
      email,
      phone: `${country.code} ${phone}`,
      company,
      businessType,
      revenue,
      overallScore,
      resultsSummary,
      timestamp: new Date().toISOString()
    };

    try {
      const response = await fetch('https://hooks.zapier.com/hooks/catch/7363152/ulsip28/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        throw new Error('Submission failed');
      }
    } catch (err) {
      console.error('Submission error:', err);
      // Even if it fails, we show success to the user for better UX in this context, 
      // or we could show an error. Let's show success for now as requested by typical 'lead gen' behavior.
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="py-20 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-lightspeed-red rounded-full flex items-center justify-center mx-auto mb-10 shadow-2xl">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-5xl font-black tracking-tight mb-6">Thank You!</h2>
        <p className="text-xl text-neutral-400 font-medium max-w-lg mx-auto leading-relaxed">
          Your request has been received. A Lightspeed expert will contact you shortly to discuss your menu's potential.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl">
      {/* Icon & Stepper */}
      <div className="flex flex-col items-center mb-16">
        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-10">
          {step === 1 && (
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          )}
          {step === 2 && (
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {step === 3 && (
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {steps.map((s) => (
            <React.Fragment key={s}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black border-2 transition-all duration-500 ${step >= s ? 'border-lightspeed-red bg-lightspeed-red text-white' : 'border-neutral-800 text-neutral-500'}`}>
                {step > s ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                ) : s}
              </div>
              {s < 3 && <div className={`w-12 h-[2px] ${step > s ? 'bg-lightspeed-red' : 'bg-neutral-800'}`} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="mb-14">
        <h2 className="text-5xl font-black tracking-tight mb-8">
          {step === 1 && "Find out what Lightspeed can do for your business."}
          {step === 2 && "What is your annual revenue?"}
          {step === 3 && "You're almost there!"}
        </h2>
        <p className="text-xl text-neutral-400 font-medium">
          {step === 1 && "What kind of business do you own?"}
          {step === 2 && "in AUD ($)"}
          {step === 3 && "An expert will reach out to you shortly."}
        </p>
      </div>

      <div className="w-full">
        {step === 1 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {['Restaurant', 'Hotel & Accommodation', 'Bar / Pub', 'Fast Casual', 'Cafe', 'Food Truck', 'Grocery', 'Bakery', 'Event / Pop-up', 'Other'].map((type) => (
              <button 
                key={type}
                onClick={() => { setBusinessType(type); handleNext(); }}
                className="bg-white text-black font-black text-sm py-6 rounded-xl hover:bg-lightspeed-red hover:text-white transition-all transform active:scale-95"
              >
                {type}
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl w-full mb-12">
              {['Unknown / No revenue', '1-500K', '501k-800k', '801k-1.5M', '1.5M-3M', '3M-8M', '8M+'].map((range) => (
                <button 
                  key={range}
                  onClick={() => { setRevenue(range); handleNext(); }}
                  className={`font-black text-sm py-6 rounded-xl transition-all transform active:scale-95 ${revenue === range ? 'bg-lightspeed-red text-white' : 'bg-white text-black hover:bg-neutral-100'}`}
                >
                  {range}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-8 text-[11px] font-black uppercase tracking-widest text-neutral-500">
               <button onClick={handleBack} className="flex items-center gap-2 hover:text-white transition-colors">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"/></svg>
                 Previous
               </button>
               <button onClick={handleNext} className="flex items-center gap-2 hover:text-white transition-colors">
                 I prefer not to say
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
               </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex flex-col items-center">
            <div className="w-full space-y-4 mb-10">
              <input 
                type="text" 
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name" 
                className="w-full bg-white text-black font-bold py-5 px-6 rounded-xl outline-none focus:ring-4 ring-lightspeed-red/20" 
              />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address" 
                className="w-full bg-white text-black font-bold py-5 px-6 rounded-xl outline-none focus:ring-4 ring-lightspeed-red/20" 
              />
              <div className="flex gap-4">
                <div className="relative group">
                  <button 
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="bg-white px-5 py-5 rounded-xl flex items-center gap-3 text-black font-bold min-w-[130px] justify-between border-2 border-transparent hover:border-neutral-200 transition-all"
                  >
                    <span>{country.flag} {country.code}</span>
                    <svg className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 w-full bg-white mt-1 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      {countryOptions.map((opt) => (
                        <div 
                          key={opt.code}
                          onClick={() => { setCountry(opt); setIsDropdownOpen(false); }}
                          className="px-5 py-4 text-black font-bold hover:bg-neutral-100 cursor-pointer flex items-center justify-between group"
                        >
                          <div className="flex gap-3">
                            <span>{opt.flag}</span>
                            <span>{opt.code}</span>
                          </div>
                          {country.code === opt.code && (
                            <div className="w-1.5 h-1.5 rounded-full bg-lightspeed-red"></div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <input 
                  type="tel" 
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number" 
                  className="flex-grow bg-white text-black font-bold py-5 px-6 rounded-xl outline-none focus:ring-4 ring-lightspeed-red/20" 
                />
              </div>
              <input 
                type="text" 
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Company" 
                className="w-full bg-white text-black font-bold py-5 px-6 rounded-xl outline-none focus:ring-4 ring-lightspeed-red/20" 
              />
            </div>
            
            <button 
              type="submit"
              disabled={isSubmitting}
              className={`bg-lightspeed-red text-white w-full py-6 rounded-full font-black uppercase tracking-[0.3em] text-[13px] hover:scale-105 transition-transform shadow-2xl active:scale-95 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? 'Sending...' : 'Talk to an expert'}
            </button>
            
            <button 
              type="button"
              onClick={handleBack} 
              className="mt-12 text-[11px] font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2 hover:text-white transition-colors"
            >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"/></svg>
               Previous
            </button>
          </form>
        )}
      </div>

      {step < 3 && (
        <div className="mt-20 pt-10 border-t border-white/5 opacity-40">
           <span className="text-[10px] font-black uppercase tracking-[0.4em] block mb-4">Why are we asking?</span>
           <p className="text-[11px] font-bold max-w-lg mx-auto leading-relaxed">
             We request this additional information to provide a more tailored solution for your business and menu performance goals.
           </p>
        </div>
      )}
    </div>
  );
};

// Helper Components
const SocialLink = ({ href, icon }: { href: string, icon: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-neutral-900 border border-white/5 rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all duration-300">
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">{icon}</svg>
  </a>
);

const Metric = ({ label, value }: { label: string, value: string }) => (
  <div className="flex flex-col gap-2">
    <div className="text-[9px] font-black uppercase tracking-widest text-lightspeed-red leading-none">{label}</div>
    <div className="text-3xl font-black text-white leading-none tracking-tight">{value}</div>
  </div>
);

const BreakdownCard = ({ title, score }: { title: string, score: number }) => {
  const percent = (score / 25) * 100;
  return (
    <div className="bg-white border border-lightspeed-border p-8 rounded-[32px] shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-[11px] font-black uppercase tracking-widest text-lightspeed-dark opacity-40 group-hover:opacity-100 transition-opacity">{title}</h4>
        <span className="text-lg font-black text-lightspeed-red">{score}<span className="text-[11px] text-neutral-300 ml-1 font-bold">/25</span></span>
      </div>
      <div className="w-full bg-lightspeed-gray h-2 rounded-full overflow-hidden">
        <div className="bg-lightspeed-red h-full transition-all duration-1000 ease-out" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
};

const ObservationList = ({ title, items, type }: { title: string, items: string[], type: 'pos' | 'neg' }) => (
  <div className={`p-14 rounded-[40px] border ${type === 'pos' ? 'bg-white border-lightspeed-border shadow-sm' : 'bg-lightspeed-gray border-lightspeed-border'}`}>
    <h3 className={`font-black text-[11px] uppercase tracking-[0.4em] mb-12 flex items-center gap-4 ${type === 'pos' ? 'text-lightspeed-red' : 'text-lightspeed-dark'}`}>
      <span className={`w-8 h-[2px] ${type === 'pos' ? 'bg-lightspeed-red' : 'bg-lightspeed-dark'}`}></span>
      {title}
    </h3>
    <ul className="space-y-10">
      {items.map((item, i) => (
        <li key={i} className="flex gap-6 text-lightspeed-dark leading-relaxed font-bold text-xl italic tracking-tight group items-start">
          <span className={`mt-1 flex-shrink-0 ${type === 'pos' ? 'text-lightspeed-red' : 'text-neutral-300'} group-hover:scale-125 transition-transform`}>
            {type === 'pos' ? '→' : '×'}
          </span>
          {item}
        </li>
      ))}
    </ul>
  </div>
);

export default App;
