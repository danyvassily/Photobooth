'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  Trash2,
  Download,
  Share2,
  Calendar,
  Layers,
  HardDrive,
  AlertTriangle,
  ZoomIn,
} from 'lucide-react';
import { StoredPrint } from '@/types';
import { buildPrintFilename } from '@/lib/export/filename';
import {
  clearAllPrints,
  deletePrint,
  getAllPrints,
  getStorageQuota,
  StorageQuotaInfo,
} from '@/lib/storage';

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrintToReedit?: (print: StoredPrint) => void;
}

export function GalleryModal({
  isOpen,
  onClose,
  onSelectPrintToReedit,
}: GalleryModalProps) {
  const [prints, setPrints] = useState<StoredPrint[]>([]);
  const [selectedPrint, setSelectedPrint] = useState<StoredPrint | null>(null);
  const [quota, setQuota] = useState<StorageQuotaInfo | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [selectedPrintUrl, setSelectedPrintUrl] = useState<string | null>(null);

  const loadGallery = async () => {
    const list = await getAllPrints();
    setPrints(list);
    const q = await getStorageQuota();
    setQuota(q);
  };

  useEffect(() => {
    if (isOpen) {
      loadGallery();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!selectedPrint) {
      setSelectedPrintUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedPrint.jpegBlob);
    setSelectedPrintUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedPrint]);

  if (!isOpen) return null;

  const handleDeleteSingle = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deletePrint(id);
    if (selectedPrint?.id === id) setSelectedPrint(null);
    await loadGallery();
  };

  const handleClearAll = async () => {
    await clearAllPrints();
    setShowClearConfirm(false);
    setSelectedPrint(null);
    await loadGallery();
  };

  const handleDownload = (print: StoredPrint, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const objectUrl = URL.createObjectURL(print.jpegBlob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = buildPrintFilename(new Date(print.createdAt));
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  };

  const handleSelectForReedit = (print: StoredPrint) => {
    onSelectPrintToReedit?.(print);
    setSelectedPrint(null);
    onClose();
  };

  const handleShare = async (print: StoredPrint, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (navigator.share && navigator.canShare) {
      try {
        const file = new File([print.jpegBlob], buildPrintFilename(new Date(print.createdAt)), {
          type: 'image/jpeg',
        });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Mon tirage Photobooth',
          });
          return;
        }
      } catch {
        // Fallback
      }
    }
    handleDownload(print);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-espresso/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl h-[88vh] bg-leather-deep border border-line rounded-2xl flex flex-col shadow-2xl overflow-hidden pb-safe">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-line">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-paper">Galerie Locale Photobooth</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-leather-soft text-xs font-semibold text-paper">
              {prints.length} {prints.length > 1 ? 'tirages' : 'tirage'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {prints.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-950/40 border border-red-900/40 transition"
              >
                Tout effacer
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-leather-soft text-sand hover:text-paper transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {prints.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-leather flex items-center justify-center text-sand mb-4">
                <Layers className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-paper mb-1">Aucun tirage pour le moment</h3>
              <p className="text-xs text-sand max-w-sm">
                Prenez vos 4 photos dans la cabine pour créer et sauvegarder vos premiers tirages en haute résolution !
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {prints.map((print) => {
                const date = new Date(print.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
                return (
                  <div
                    key={print.id}
                    onClick={() => setSelectedPrint(print)}
                    className="group relative rounded-xl overflow-hidden border border-line bg-leather cursor-pointer hover:border-brass/50 hover:shadow-xl transition-all"
                  >
                    <div className="aspect-[1/2] w-full overflow-hidden bg-espresso flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={print.thumbnailUrl}
                        alt="Tirage sauvegardé"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Metadata & Quick actions */}
                    <div className="p-3 bg-leather/90 backdrop-blur-sm border-t border-line flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-paper capitalize truncate max-w-[100px]">
                          {print.themeId}
                        </div>
                        <div className="text-[10px] text-sand">{date}</div>
                      </div>

                      <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleDownload(print, e)}
                          title="Télécharger"
                          className="p-1.5 rounded-lg hover:bg-leather-soft text-paper hover:text-paper"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteSingle(print.id, e)}
                          title="Supprimer"
                          className="p-1.5 rounded-lg hover:bg-red-950/60 text-sand hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with Storage Quota */}
        {quota && (
          <div className="px-6 py-3 border-t border-line/80 bg-leather/40 flex items-center justify-between text-xs text-sand">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-sand" />
              <span>Stockage local IndexedDB : {(quota.usageBytes / (1024 * 1024)).toFixed(1)} Mo utilisés</span>
            </div>
            <span>Confidentialité totale : 0 octet envoyé vers un serveur</span>
          </div>
        )}

        {/* Zoom & Detail Modal */}
        {selectedPrint && (
          <div className="absolute inset-0 z-20 bg-leather-deep/95 backdrop-blur-md flex flex-col p-4 sm:p-6 animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-line">
              <div>
                <h3 className="font-bold text-paper text-base capitalize">{selectedPrint.themeId}</h3>
                <div className="text-xs text-sand">
                  {new Date(selectedPrint.createdAt).toLocaleString('fr-FR')}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {onSelectPrintToReedit && (
                  <button
                    onClick={() => handleSelectForReedit(selectedPrint)}
                    className="px-3 py-2 rounded-xl bg-leather-soft hover:bg-leather-soft text-paper text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <ZoomIn className="w-4 h-4 text-brass" />
                    <span>Ré-éditer</span>
                  </button>
                )}
                <button
                  onClick={() => handleDownload(selectedPrint)}
                  className="px-4 py-2 rounded-xl bg-brass hover:bg-brass text-ink text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger JPEG</span>
                </button>
                <button
                  onClick={() => handleShare(selectedPrint)}
                  className="p-2 rounded-xl bg-leather-soft hover:bg-leather-soft text-paper transition"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedPrint(null)}
                  className="p-2 rounded-xl hover:bg-leather-soft text-sand hover:text-paper transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedPrintUrl ?? selectedPrint.thumbnailUrl}
                alt="Aperçu grand format"
                className="max-h-full max-w-full object-contain rounded-xl shadow-2xl border border-line"
              />
            </div>
          </div>
        )}

        {/* Clear All Confirmation Modal */}
        {showClearConfirm && (
          <div className="absolute inset-0 z-30 bg-espresso/80 flex items-center justify-center p-4">
            <div className="bg-leather border border-line p-6 rounded-2xl max-w-sm text-center">
              <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <h4 className="font-bold text-paper text-base mb-1">Effacer tous les tirages ?</h4>
              <p className="text-xs text-sand mb-5">
                Cette action supprimera définitivement tous vos tirages locaux de cet appareil.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-leather-soft hover:bg-leather-soft text-xs font-semibold text-paper transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-semibold text-paper transition"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
