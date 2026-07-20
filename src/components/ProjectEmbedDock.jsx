import { useCallback, useEffect, useRef, useState } from 'react';
import { useSettingsContext } from '../app/context/SettingsContext';
import {
  createEmbedThemeMessage,
  resolveProjectEmbedUrl,
} from '../lib/projectEmbed';
import { trackProjectLaunch } from '../lib/trackEvent';

const IFRAME_SANDBOX = 'allow-scripts allow-same-origin';

function EmbedLoadingSkeleton({ title }) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/95 backdrop-blur-md z-10 border border-accent-500/20 overflow-hidden"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(var(--rgb-accent-400), 0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(var(--rgb-accent-400), 0.3) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent-500/20 to-transparent -translate-x-full animate-[skeleton-sweep_2s_infinite_linear]" />
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <div className="w-16 h-16 border border-accent-500/30 bg-black/40 mb-5 flex items-center justify-center shadow-[0_0_20px_rgba(var(--rgb-accent-400),0.2)]">
          <div className="w-3 h-3 bg-accent-400 animate-pulse" />
        </div>
        <div className="font-mono text-accent-400 text-xs sm:text-sm tracking-[0.25em] uppercase animate-pulse mb-3">
          INITIALIZING_MISSION...
        </div>
        <p className="font-mono text-gray-500 text-[10px] sm:text-xs tracking-widest uppercase max-w-xs truncate">
          {title}
        </p>
        <div className="w-40 sm:w-48 h-1 bg-black/50 overflow-hidden border border-accent-500/20 mt-4">
          <div className="h-full bg-accent-500/50 w-full animate-[skeleton-sweep_1.5s_infinite_linear]" />
        </div>
      </div>
    </div>
  );
}

function SandboxedEmbedFrame({ embedUrl, title, onReady }) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      {isLoading && <EmbedLoadingSkeleton title={title} />}
      <iframe
        src={embedUrl}
        title={`${title} preview`}
        className="absolute inset-0 w-full h-full border-0 bg-black"
        sandbox={IFRAME_SANDBOX}
        referrerPolicy="no-referrer"
        loading="lazy"
        onLoad={(event) => {
          setIsLoading(false);
          onReady(event.currentTarget);
        }}
      />
    </>
  );
}

export default function ProjectEmbedDock({ project, onClosePreview }) {
  const { theme } = useSettingsContext();
  const iframeRef = useRef(null);

  const embedUrl = resolveProjectEmbedUrl(project);
  const embedHostLabel = embedUrl
    ? (() => {
        try {
          return new URL(embedUrl).host;
        } catch {
          return 'unknown';
        }
      })()
    : '';

  const postThemeToEmbed = useCallback((iframe = iframeRef.current) => {
    if (!iframe?.contentWindow || !embedUrl) return;

    const origin = (() => {
      try {
        return new URL(embedUrl).origin;
      } catch {
        return '*';
      }
    })();

    iframe.contentWindow.postMessage(createEmbedThemeMessage(theme), origin);
  }, [embedUrl, theme]);

  const handleEmbedReady = useCallback((iframe) => {
    iframeRef.current = iframe;
    postThemeToEmbed(iframe);
  }, [postThemeToEmbed]);

  useEffect(() => {
    postThemeToEmbed();
  }, [postThemeToEmbed]);

  if (!embedUrl) return null;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Parent chrome — always above iframe; escape hatch lives here, not in child */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 px-4 py-3 border-b border-accent-500/20 bg-black/60 backdrop-blur-md shrink-0 relative z-20">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-lg shrink-0" aria-hidden="true">{project.icon}</span>
          <div className="min-w-0">
            <p className="font-mono text-[10px] text-accent-500 uppercase tracking-[0.2em]">Mission Preview</p>
            <p className="text-sm sm:text-base font-bold text-white truncate">{project.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClosePreview}
            className="px-3 py-2 text-xs font-mono uppercase tracking-wider text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
          >
            Briefing
          </button>
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackProjectLaunch(project.id, 'embed_dock')}
            className="px-3 py-2 text-xs font-mono uppercase tracking-wider text-accent-200 bg-accent-500/15 hover:bg-accent-500/25 border border-accent-400/40 hover:border-accent-300 rounded-lg transition-all flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
          >
            Open External
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      <div className="relative flex-1 min-h-[280px] sm:min-h-[360px] md:min-h-[420px] bg-black isolate">
        <SandboxedEmbedFrame
          key={embedUrl}
          embedUrl={embedUrl}
          title={project.title}
          onReady={handleEmbedReady}
        />
      </div>

      <p className="px-4 py-2 text-[10px] font-mono text-gray-600 uppercase tracking-wider border-t border-white/5 shrink-0 relative z-20 bg-black/40">
        Sandboxed preview · top navigation blocked · {embedHostLabel}
      </p>
    </div>
  );
}
