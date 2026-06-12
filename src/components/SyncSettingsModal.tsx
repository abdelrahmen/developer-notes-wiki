/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Language, SyncConfig, SyncProvider, SyncStatus } from '../types';
import { createRemote, saveSyncConfigAndApply, syncNow, testConnection } from '../lib/sync/syncManager';
import { X, Cloud, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface SyncSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  syncStatus: SyncStatus;
  syncError?: string;
  lastSyncedAt?: string | null;
  initialConfig: SyncConfig;
  onSaveConfig: (config: SyncConfig) => void;
}

export default function SyncSettingsModal({
  isOpen,
  onClose,
  language,
  syncStatus,
  syncError,
  lastSyncedAt,
  initialConfig,
  onSaveConfig,
}: SyncSettingsModalProps) {
  const isAr = language === 'ar';
  const [config, setConfig] = useState<SyncConfig>(initialConfig);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [testOk, setTestOk] = useState<boolean | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setConfig(initialConfig);
      setTestMessage(null);
      setTestOk(null);
      setActionError(null);
    }
  }, [isOpen, initialConfig]);

  if (!isOpen) return null;

  const setProvider = (provider: SyncProvider) => {
    setConfig((prev) => ({ ...prev, provider }));
    setTestMessage(null);
    setTestOk(null);
    setActionError(null);
  };

  const handleTest = async () => {
    setIsBusy(true);
    setActionError(null);
    const result = await testConnection(config);
    setTestOk(result.ok);
    setTestMessage(result.message);
    setIsBusy(false);
  };

  const handleCreateRemote = async () => {
    setIsBusy(true);
    setActionError(null);
    try {
      const remoteId = await createRemote(config);
      const nextConfig: SyncConfig = {
        ...config,
        jsonbin: config.provider === 'jsonbin' ? { ...config.jsonbin, binId: remoteId } : config.jsonbin,
        gist: config.provider === 'gist' ? { ...config.gist, gistId: remoteId } : config.gist,
      };
      setConfig(nextConfig);
      onSaveConfig(nextConfig);
      setTestOk(true);
      setTestMessage(isAr ? 'تم إنشاء التخزين البعيد بنجاح' : 'Remote storage created successfully');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to create remote storage');
    } finally {
      setIsBusy(false);
    }
  };

  const handleSyncNow = async () => {
    setIsBusy(true);
    setActionError(null);
    try {
      onSaveConfig(config);
      await syncNow();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Sync failed');
    } finally {
      setIsBusy(false);
    }
  };

  const handleSave = () => {
    onSaveConfig(config);
    saveSyncConfigAndApply(config);
    onClose();
  };

  const hasRemoteId =
    config.provider === 'jsonbin'
      ? Boolean(config.jsonbin.binId.trim())
      : config.provider === 'gist'
        ? Boolean(config.gist.gistId.trim())
        : false;

  const statusLabel = () => {
    if (syncStatus === 'syncing' || isBusy) {
      return isAr ? 'جاري المزامنة...' : 'Syncing...';
    }
    if (syncStatus === 'error') {
      return syncError || (isAr ? 'فشلت المزامنة' : 'Sync failed');
    }
    if (syncStatus === 'synced' && lastSyncedAt) {
      const time = new Date(lastSyncedAt).toLocaleString(isAr ? 'ar' : 'en');
      return isAr ? `آخر مزامنة: ${time}` : `Last synced: ${time}`;
    }
    if (config.provider === 'none') {
      return isAr ? 'المزامنة معطلة' : 'Sync disabled';
    }
    return isAr ? 'جاهز للمزامنة' : 'Ready to sync';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[#202020] border border-[#2F2F2F] rounded-lg max-w-lg w-full shadow-2xl z-50 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-[#2F2F2F] sticky top-0 bg-[#202020] z-10">
          <div className="flex items-center gap-2">
            <Cloud size={18} className="text-[#9B9B9B]" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              {isAr ? 'إعدادات المزامنة السحابية' : 'Cloud Sync Settings'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#2F2F2F] rounded text-[#9B9B9B] hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#9B9B9B]">
              {isAr ? 'مزود المزامنة' : 'Sync Provider'}
            </label>
            <div className="grid grid-cols-1 gap-2">
              {([
                ['none', isAr ? 'بدون مزامنة' : 'None'],
                ['gist', 'GitHub Gist'],
                ['jsonbin', 'JSONBin.io'],
              ] as const).map(([value, label]) => (
                <label
                  key={value}
                  className={`flex items-center gap-2 px-3 py-2 rounded border cursor-pointer transition-colors ${
                    config.provider === value
                      ? 'border-[#3E7B5D] bg-[#3E7B5D]/10 text-white'
                      : 'border-[#2F2F2F] bg-[#252525] text-[#9B9B9B] hover:border-[#373737]'
                  }`}
                >
                  <input
                    type="radio"
                    name="sync-provider"
                    checked={config.provider === value}
                    onChange={() => setProvider(value)}
                    className="accent-[#3E7B5D]"
                  />
                  <span className="text-xs font-semibold">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {config.provider === 'jsonbin' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9B9B9B] mb-1.5">
                  {isAr ? 'مفتاح JSONBin الرئيسي' : 'JSONBin Master Key'}
                </label>
                <input
                  type="password"
                  value={config.jsonbin.apiKey}
                  onChange={(e) => setConfig((prev) => ({
                    ...prev,
                    jsonbin: { ...prev.jsonbin, apiKey: e.target.value },
                  }))}
                  placeholder={isAr ? 'الصق مفتاح API' : 'Paste your Master Key'}
                  className="w-full bg-[#252525] border border-[#2F2F2F] rounded px-3 py-2 text-xs text-white placeholder-[#9B9B9B] focus:border-[#373737]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9B9B9B] mb-1.5">
                  {isAr ? 'معرف الحاوية أو الرابط' : 'Bin ID or URL'}
                </label>
                <input
                  type="text"
                  value={config.jsonbin.binId}
                  onChange={(e) => setConfig((prev) => ({
                    ...prev,
                    jsonbin: { ...prev.jsonbin, binId: e.target.value },
                  }))}
                  placeholder="abc123... or https://jsonbin.io/..."
                  className="w-full bg-[#252525] border border-[#2F2F2F] rounded px-3 py-2 text-xs text-white placeholder-[#9B9B9B] focus:border-[#373737]"
                />
              </div>
            </div>
          )}

          {config.provider === 'gist' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9B9B9B] mb-1.5">
                  {isAr ? 'رمز GitHub الشخصي' : 'GitHub Personal Access Token'}
                </label>
                <input
                  type="password"
                  value={config.gist.token}
                  onChange={(e) => setConfig((prev) => ({
                    ...prev,
                    gist: { ...prev.gist, token: e.target.value },
                  }))}
                  placeholder={isAr ? 'الصق رمز الوصول' : 'Paste your token'}
                  className="w-full bg-[#252525] border border-[#2F2F2F] rounded px-3 py-2 text-xs text-white placeholder-[#9B9B9B] focus:border-[#373737]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9B9B9B] mb-1.5">
                  {isAr ? 'رابط Gist أو المعرف' : 'Gist URL or ID'}
                </label>
                <input
                  type="text"
                  value={config.gist.gistId}
                  onChange={(e) => setConfig((prev) => ({
                    ...prev,
                    gist: { ...prev.gist, gistId: e.target.value },
                  }))}
                  placeholder="https://gist.github.com/user/abc123"
                  className="w-full bg-[#252525] border border-[#2F2F2F] rounded px-3 py-2 text-xs text-white placeholder-[#9B9B9B] focus:border-[#373737]"
                />
              </div>
            </div>
          )}

          {config.provider !== 'none' && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleTest}
                disabled={isBusy}
                className="px-3 py-1.5 bg-[#252525] hover:bg-[#2F2F2F] border border-[#2F2F2F] text-[#E3E3E3] rounded text-xs font-semibold disabled:opacity-50"
              >
                {isAr ? 'اختبار الاتصال' : 'Test Connection'}
              </button>
              {!hasRemoteId && (
                <button
                  type="button"
                  onClick={handleCreateRemote}
                  disabled={isBusy}
                  className="px-3 py-1.5 bg-[#252525] hover:bg-[#2F2F2F] border border-[#2F2F2F] text-[#E3E3E3] rounded text-xs font-semibold disabled:opacity-50"
                >
                  {isAr ? 'إنشاء تخزين بعيد' : 'Create Remote'}
                </button>
              )}
              <button
                type="button"
                onClick={handleSyncNow}
                disabled={isBusy || !hasRemoteId}
                className="px-3 py-1.5 bg-[#252525] hover:bg-[#2F2F2F] border border-[#2F2F2F] text-[#E3E3E3] rounded text-xs font-semibold disabled:opacity-50 flex items-center gap-1"
              >
                <RefreshCw size={12} />
                {isAr ? 'مزامنة الآن' : 'Sync Now'}
              </button>
            </div>
          )}

          <div className="rounded border border-[#2F2F2F] bg-[#1C1C1C] px-3 py-2 text-xs text-[#9B9B9B] flex items-start gap-2">
            {syncStatus === 'syncing' || isBusy ? (
              <Loader2 size={14} className="text-amber-400 animate-spin shrink-0 mt-0.5" />
            ) : syncStatus === 'error' || actionError ? (
              <AlertCircle size={14} className="text-rose-400 shrink-0 mt-0.5" />
            ) : testOk === true || syncStatus === 'synced' ? (
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <Cloud size={14} className="text-[#9B9B9B] shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p>{statusLabel()}</p>
              {testMessage && (
                <p className={testOk ? 'text-emerald-400' : 'text-rose-400'}>{testMessage}</p>
              )}
              {actionError && <p className="text-rose-400">{actionError}</p>}
            </div>
          </div>

          <p className="text-[10px] text-[#9B9B9B] leading-relaxed">
            {isAr
              ? 'يتم حفظ المفاتيح محلياً في متصفحك. النسخة الأحدث تفوز عند المزامنة بين الأجهزة.'
              : 'Keys are stored locally in your browser. The newer copy wins when syncing across devices.'}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-[#2F2F2F]">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-[#252525] hover:bg-[#2F2F2F] border border-[#2F2F2F] text-[#9B9B9B] hover:text-[#E3E3E3] rounded text-xs font-semibold"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-3 py-1.5 bg-[#3E7B5D] hover:bg-[#468969] text-white rounded text-xs font-semibold"
          >
            {isAr ? 'حفظ' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
