import React, { useState, useEffect } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  Heart, 
  MessageCircle, 
  Bookmark, 
  Share2, 
  Music, 
  Sparkles, 
  Copy, 
  Check, 
  ChevronRight, 
  ChevronLeft,
  Video,
  Mic,
  Camera,
  Layers,
  Wand2,
  Volume2
} from 'lucide-react';
import { ContentIdea, BusinessContentProfile } from '../../types';

interface VideoSimulationModalProps {
  idea: ContentIdea;
  profile: BusinessContentProfile;
  onClose: () => void;
  onCreateTask?: (idea: ContentIdea) => void;
}

export const VideoSimulationModal: React.FC<VideoSimulationModalProps> = ({
  idea,
  profile,
  onClose,
  onCreateTask,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [taskCreated, setTaskCreated] = useState<boolean>(false);
  const [liked, setLiked] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState<number>(() => Math.floor(Math.random() * 8000 + 12000));
  const [bookmarked, setBookmarked] = useState<boolean>(false);
  const [showComments, setShowComments] = useState<boolean>(false);

  const steps = idea.scriptSteps && idea.scriptSteps.length > 0 ? idea.scriptSteps : [
    {
      timeRange: '0s - 3s',
      stepTitle: 'Gancho Viral',
      description: idea.hookVisualAction,
      spokenText: idea.hookSpoken,
      visualCue: idea.hookVisualAction,
      screenCaption: idea.hookOnScreen,
    }
  ];

  const currentStep = steps[currentStepIndex] || steps[0];

  // Auto-advance simulation timer
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1) % steps.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [isPlaying, steps.length]);

  const handleCopyFullScript = () => {
    const fullText = `TITULO: ${idea.title}\nFORMATO: ${idea.archetypeLabel} (${idea.platform.toUpperCase()})\nSCORE VIRAL: ${idea.viralScore}/100\n\nGANCHO HABLADO:\n"${idea.hookSpoken}"\n\nTEXTO EN PANTALLA:\n${idea.hookOnScreen}\n\nACCIÓN VISUAL:\n${idea.hookVisualAction}\n\nGUIÓN DETALLADO:\n${steps.map((s, idx) => `Paso ${idx + 1} [${s.timeRange} - ${s.stepTitle}]:\n- Decir: "${s.spokenText}"\n- Visual: ${s.visualCue}\n- Texto: ${s.screenCaption}`).join('\n\n')}\n\nAUDIO RECOMENDADO:\n${idea.soundTrend.name} (${idea.soundTrend.exampleSearch})\n\nPIE DE FOTO:\n${idea.caption}\n\nHASHTAGS:\n${idea.hashtags.join(' ')}`;
    
    navigator.clipboard.writeText(fullText);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleToggleLike = () => {
    if (liked) {
      setLiked(false);
      setLikesCount((prev) => prev - 1);
    } else {
      setLiked(true);
      setLikesCount((prev) => prev + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-sm shrink-0 border border-rose-500/30">
              <Video className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-white font-bold text-sm truncate flex items-center gap-2">
                <span>Simulador de Video en Tendencia (9:16)</span>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {idea.platform.toUpperCase()}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  Score: {idea.viralScore}/100
                </span>
              </h3>
              <p className="text-xs text-slate-400 truncate">
                {idea.title} • {profile.businessName || 'Negocio'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyFullScript}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Copiar guión formateado"
            >
              {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedScript ? 'Copiado' : 'Copiar Guión'}</span>
            </button>

            {onCreateTask && (
              <button
                type="button"
                onClick={() => {
                  onCreateTask(idea);
                  setTaskCreated(true);
                  setTimeout(() => setTaskCreated(false), 3000);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm ${
                  taskCreated
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                {taskCreated ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{taskCreated ? 'Tarea creada' : 'Crear Tarea en CRM'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar simulador"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Split view (Phone Simulator + Teleprompter / Technical Sheet) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto p-4 md:p-6 gap-6 bg-slate-950/60 items-center justify-center">
          
          {/* LEFT: Smartphone 9:16 Vertical Video Screen */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            
            {/* Phone Outer Chassis */}
            <div className="w-[300px] sm:w-[320px] h-[580px] bg-slate-900 rounded-[42px] p-3 shadow-2xl border-[4px] border-slate-700/80 relative flex flex-col ring-1 ring-white/10">
              
              {/* Speaker / Camera Notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-950 rounded-full z-30 flex items-center justify-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-800 ring-1 ring-slate-700" />
                <div className="w-10 h-1 bg-slate-800 rounded-full" />
              </div>

              {/* Phone Inner Display (9:16 Screen) */}
              <div className="w-full h-full rounded-[32px] overflow-hidden relative flex flex-col justify-between bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 select-none border border-slate-800">
                
                {/* Background Dynamic Visual Effect (Simulating Live Video Canvas) */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                  <div className="absolute -top-16 -left-16 w-56 h-56 bg-rose-600/20 rounded-full blur-3xl animate-pulse" />
                  <div className="absolute -bottom-16 -right-16 w-60 h-60 bg-blue-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
                  
                  {/* Subtle Grid / Studio Lighting Simulation */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-black/60" />

                  {/* Dynamic Silhouette or Framing Badge */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-15">
                    <div className="w-44 h-44 rounded-full border border-dashed border-white/30 flex items-center justify-center">
                      <Camera className="w-12 h-12 text-white/40" />
                    </div>
                  </div>
                </div>

                {/* Top Status & Social Nav Header */}
                <div className="relative z-20 pt-5 px-4 flex items-center justify-between text-white/90 text-xs font-semibold drop-shadow">
                  <span className="text-[11px] font-mono tracking-wider opacity-80">9:41</span>
                  <div className="flex items-center gap-4 text-xs font-bold">
                    <span className="opacity-60 cursor-pointer hover:opacity-100">Siguiendo</span>
                    <span className="border-b-2 border-white pb-0.5 font-black text-white">Para ti</span>
                  </div>
                  <span className="w-4" />
                </div>

                {/* Screen Center: Dynamic CapCut-style Subtitles & Script Cue */}
                <div className="relative z-20 px-4 my-auto flex flex-col items-center justify-center text-center">
                  
                  {/* Visual Cue Pill */}
                  <div className="mb-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] text-amber-300 font-medium flex items-center gap-1.5 shadow-lg">
                    <Wand2 className="w-3 h-3 text-amber-400" />
                    <span className="truncate max-w-[200px]">{currentStep.visualCue}</span>
                  </div>

                  {/* Viral Big On-Screen Caption (CapCut Yellow/White Highlight) */}
                  <div className="bg-black/75 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-yellow-400/40 shadow-2xl max-w-[260px] animate-in zoom-in-95 duration-200">
                    <p className="text-yellow-400 font-black text-sm sm:text-base uppercase tracking-tight leading-snug drop-shadow-md">
                      {currentStep.screenCaption || idea.hookOnScreen}
                    </p>
                  </div>

                  {/* Spoken Text (What the Creator Says) */}
                  <div className="mt-3 p-2 bg-slate-950/70 rounded-lg max-w-[250px] border border-white/5">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-cyan-300 font-bold uppercase tracking-wider mb-0.5">
                      <Mic className="w-2.5 h-2.5" />
                      <span>Decir a cámara:</span>
                    </div>
                    <p className="text-xs text-white/95 italic leading-snug">
                      "{currentStep.spokenText}"
                    </p>
                  </div>
                </div>

                {/* Bottom Overlay: Social UI (Author, Bio, Audio Ticker, Right Icons) */}
                <div className="relative z-20 p-3 flex items-end justify-between gap-2">
                  
                  {/* Left Info: Author Handle & Caption */}
                  <div className="flex-1 min-w-0 pr-2 text-white">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-5 h-5 rounded-full bg-blue-600 font-black text-[10px] flex items-center justify-center text-white ring-1 ring-white/50">
                        {profile.businessName.charAt(0).toUpperCase() || 'N'}
                      </div>
                      <span className="font-bold text-xs leading-none drop-shadow">
                        @{profile.businessName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'minegocio'}
                      </span>
                      <button className="px-1.5 py-0.5 bg-rose-600 text-[9px] font-black rounded-full uppercase tracking-wider text-white hover:bg-rose-500">
                        Seguir
                      </button>
                    </div>

                    <p className="text-[10px] text-white/90 line-clamp-2 leading-tight drop-shadow">
                      {idea.caption}
                    </p>

                    {/* Audio Ticker */}
                    <div className="flex items-center gap-1.5 mt-1.5 text-[9px] text-white/80 font-mono">
                      <Music className="w-3 h-3 text-cyan-300 animate-spin" style={{ animationDuration: '4s' }} />
                      <span className="truncate max-w-[150px]">
                        {idea.soundTrend.name}
                      </span>
                    </div>
                  </div>

                  {/* Right Social Actions (Like, Comment, Save, Share, Audio Disc) */}
                  <div className="flex flex-col items-center gap-3 shrink-0 text-white">
                    
                    {/* Like */}
                    <button 
                      onClick={handleToggleLike}
                      className="flex flex-col items-center group cursor-pointer"
                    >
                      <div className={`p-2 rounded-full transition-transform active:scale-125 ${liked ? 'text-rose-500' : 'text-white/90 hover:text-rose-400'}`}>
                        <Heart className={`w-5 h-5 ${liked ? 'fill-rose-500' : ''}`} />
                      </div>
                      <span className="text-[9px] font-bold drop-shadow">{likesCount.toLocaleString()}</span>
                    </button>

                    {/* Comments */}
                    <button 
                      onClick={() => setShowComments(!showComments)}
                      className="flex flex-col items-center group cursor-pointer"
                    >
                      <div className="p-2 rounded-full text-white/90 hover:text-cyan-400 transition-colors">
                        <MessageCircle className="w-5 h-5" />
                      </div>
                      <span className="text-[9px] font-bold drop-shadow">482</span>
                    </button>

                    {/* Bookmark */}
                    <button 
                      onClick={() => setBookmarked(!bookmarked)}
                      className="flex flex-col items-center group cursor-pointer"
                    >
                      <div className={`p-2 rounded-full transition-colors ${bookmarked ? 'text-amber-400' : 'text-white/90 hover:text-amber-300'}`}>
                        <Bookmark className={`w-5 h-5 ${bookmarked ? 'fill-amber-400' : ''}`} />
                      </div>
                      <span className="text-[9px] font-bold drop-shadow">12.4K</span>
                    </button>

                    {/* Share */}
                    <button 
                      onClick={handleCopyFullScript}
                      className="flex flex-col items-center group cursor-pointer"
                    >
                      <div className="p-2 rounded-full text-white/90 hover:text-emerald-400 transition-colors">
                        <Share2 className="w-5 h-5" />
                      </div>
                      <span className="text-[9px] font-bold drop-shadow">3.2K</span>
                    </button>

                    {/* Vinyl Audio Disc Rotating */}
                    <div className="w-7 h-7 rounded-full bg-slate-900 border-2 border-white/80 flex items-center justify-center p-0.5 mt-1 animate-spin" style={{ animationDuration: '3s' }}>
                      <div className="w-full h-full rounded-full bg-gradient-to-tr from-cyan-400 to-rose-500 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-black" />
                      </div>
                    </div>

                  </div>
                </div>

                {/* Bottom Scrubbable Timeline Indicator */}
                <div className="relative z-20 px-2 pb-1.5">
                  <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden flex gap-0.5">
                    {steps.map((_, i) => (
                      <div
                        key={i}
                        className={`h-full flex-1 transition-all ${
                          i === currentStepIndex
                            ? 'bg-yellow-400'
                            : i < currentStepIndex
                            ? 'bg-white'
                            : 'bg-white/20'
                        }`}
                      />
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Playback Controls Below Phone */}
            <div className="mt-4 flex items-center gap-3 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setCurrentStepIndex((prev) => (prev > 0 ? prev - 1 : steps.length - 1))}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Paso anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Pausar' : 'Reproducir'}</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStepIndex((prev) => (prev + 1) % steps.length)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Siguiente paso"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="h-4 w-px bg-slate-800" />

              <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                Paso {currentStepIndex + 1} de {steps.length} ({currentStep.timeRange})
              </span>
            </div>
          </div>

          {/* RIGHT: Teleprompter & Technical Recording Specs Sheet */}
          <div className="lg:col-span-7 flex flex-col space-y-4 max-h-[580px] overflow-y-auto pr-1">
            
            {/* Quick Guiding Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Formato de Tendencia Seleccionado
                </span>
                <span className="text-xs font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                  {idea.archetypeLabel}
                </span>
              </div>
              <h4 className="text-white font-bold text-base leading-tight mb-1">
                {idea.title}
              </h4>
              <p className="text-xs text-slate-400">
                {idea.conceptSummary}
              </p>
            </div>

            {/* Step by Step Teleprompter List */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Mic className="w-3.5 h-3.5 text-cyan-400" />
                  Guión Teleprónpter para Grabar
                </h5>
                <span className="text-[10px] text-slate-400">
                  Haz clic en un paso para saltar a él en la simulación
                </span>
              </div>

              <div className="space-y-2.5">
                {steps.map((step, idx) => {
                  const isCurrent = idx === currentStepIndex;
                  return (
                    <div
                      key={idx}
                      onClick={() => setCurrentStepIndex(idx)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-blue-600/15 border-blue-500/50 text-white'
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
                            isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="font-bold text-xs text-slate-200">
                            {step.stepTitle}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">
                          {step.timeRange}
                        </span>
                      </div>

                      {/* Text to say */}
                      <p className="text-xs text-slate-200 pl-7 italic">
                        "{step.spokenText}"
                      </p>

                      {/* On-screen text & visual cue */}
                      <div className="pl-7 mt-1.5 flex flex-wrap gap-2 text-[10px]">
                        <span className="text-yellow-400 font-bold bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/20">
                          Texto: {step.screenCaption}
                        </span>
                        <span className="text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                          🎬 {step.visualCue}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Audio & Sound Trend Information */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">
                <Volume2 className="w-3.5 h-3.5" />
                <span>Audio Viral Sugerido</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white text-sm">{idea.soundTrend.name}</span>
                  <span className="text-[10px] text-cyan-300 font-semibold uppercase bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                    {idea.soundTrend.vibe}
                  </span>
                </div>
                <p className="text-slate-400 text-xs mt-1">
                  <strong className="text-slate-300">Cómo buscarlo en TikTok / Reels:</strong> {idea.soundTrend.exampleSearch}
                </p>
              </div>
            </div>

            {/* Technical Recording Specs */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
                <Layers className="w-3.5 h-3.5" />
                <span>Consejos Técnicos de Grabación</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {idea.recordingTips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
