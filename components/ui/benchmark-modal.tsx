'use client';

import React, { useState } from 'react';
import { X, Cpu, Play, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { BenchmarkResult, isWasmActive, runBenchmark } from '@/lib/image-processing';

interface BenchmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BenchmarkModal({ isOpen, onClose }: BenchmarkModalProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const wasmReady = isWasmActive();

  if (!isOpen) return null;

  const handleRunBenchmarks = async () => {
    setIsRunning(true);
    setResults([]);

    try {
      const hd = await runBenchmark(1280, 720, 5);
      const fhd = await runBenchmark(1920, 1080, 5);
      const strip4k = await runBenchmark(1200, 3600, 5);
      setResults([hd, fhd, strip4k]);
    } catch (err) {
      console.error('Benchmark execution error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-leather-deep border border-line rounded-2xl flex flex-col shadow-2xl overflow-hidden pb-safe">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-line">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brass/10 border border-brass/20 flex items-center justify-center text-brass">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-paper">Benchmarks Rust/WASM vs JavaScript</h3>
              <p className="text-[11px] text-sand">Mesures de performance réelles sur cet appareil</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-leather-soft text-sand hover:text-paper transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Status Badge */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            wasmReady
              ? 'bg-espresso/30 border-brass-dark/40 text-brass-light'
              : 'bg-espresso/30 border-brass-dark/40 text-brass-light'
          }`}>
            <div className="flex items-center gap-3">
              {wasmReady ? (
                <CheckCircle2 className="w-5 h-5 text-brass-light" />
              ) : (
                <AlertCircle className="w-5 h-5 text-brass-light" />
              )}
              <div>
                <div className="font-bold text-xs">
                  {wasmReady ? 'Module Rust / WebAssembly actif' : 'Moteur JavaScript / Canvas 2D actif (Fallback)'}
                </div>
                <div className="text-[11px] opacity-80">
                  {wasmReady
                    ? 'Compilation native wasm32 chargée en mémoire'
                    : '100% fonctionnel avec fallback garanti sur tous les navigateurs'}
                </div>
              </div>
            </div>
          </div>

          {/* Results Table */}
          {results.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-sand uppercase tracking-wider">
                Résultats mesurés (5 passes)
              </h4>
              <div className="space-y-2">
                {results.map((r, i) => {
                  const label = i === 0 ? 'HD 720p' : i === 1 ? 'Full HD 1080p' : 'Tirage 4K (1200×3600)';
                  return (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-leather border border-line flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-paper">{label}</div>
                        <div className="text-[10px] text-sand">
                          {r.width} × {r.height} px ({((r.width * r.height) / 1e6).toFixed(1)} MP)
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-paper">
                          JS : <strong className="text-paper font-mono">{r.jsTimeMs.toFixed(1)} ms</strong>
                        </div>
                        {r.wasmAvailable && (
                          <div className="text-brass-light">
                            WASM : <strong className="font-mono">{r.wasmTimeMs.toFixed(1)} ms</strong> ({r.speedup.toFixed(1)}x)
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <button
            onClick={handleRunBenchmarks}
            disabled={isRunning}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-brass-light to-brass-dark hover:opacity-95 text-ink font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-brass/20 transition active:scale-95 disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Calcul en cours...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Lancer le test de performance</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
