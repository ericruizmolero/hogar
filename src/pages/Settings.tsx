import { useState, useEffect, useCallback } from 'react';
import { Save, RotateCcw, Plus, X, ImageUp, Check } from 'lucide-react';
import { useRequirements } from '../hooks/useRequirements';
import { useFinancialProfile } from '../hooks/useFinancialProfile';
import { useProperties } from '../hooks/useProperties';
import { useAuth } from '../context/AuthContext';
import { uploadPropertyPhotos } from '../lib/storage';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button } from '../components/ui/Button';

const inputClass = 'w-full px-3 py-2 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md focus:outline-none focus:border-[var(--color-border-strong)] transition-colors';
const inputLgClass = 'w-full px-3 py-2.5 text-base bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md focus:outline-none focus:border-[var(--color-border-strong)] transition-colors tabular-nums';

export function Settings() {
  const { requirements, loading: loadingReq, updateRequirements, resetRequirements } = useRequirements();
  const { profile, loading: loadingFin, updateProfile, resetProfile } = useFinancialProfile();

  const [form, setForm] = useState(requirements);
  const [finForm, setFinForm] = useState(profile);
  const [newZone, setNewZone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'financial' | 'requirements'>('financial');

  // Migration
  const { properties } = useProperties();
  const { user } = useAuth();
  const [migrating, setMigrating] = useState(false);
  const [migrateProgress, setMigrateProgress] = useState({ current: 0, total: 0, photos: 0 });
  const [migrateDone, setMigrateDone] = useState(false);

  const needsMigration = properties.filter(p =>
    p.photos?.some(url =>
      !url.startsWith('data:') &&
      !url.includes('firebasestorage') &&
      !url.includes('googleapis.com')
    )
  );

  const migratePhotos = useCallback(async () => {
    if (!user || migrating) return;
    setMigrating(true);
    setMigrateDone(false);
    let totalPhotos = 0;
    for (let i = 0; i < needsMigration.length; i++) {
      const prop = needsMigration[i];
      setMigrateProgress({ current: i + 1, total: needsMigration.length, photos: totalPhotos });
      try {
        const firebaseUrls = await uploadPropertyPhotos(prop.photos || [], prop.id, user.uid);
        totalPhotos += firebaseUrls.filter(u => u.includes('firebasestorage') || u.includes('googleapis.com')).length;
        const ref = doc(db, `users/${user.uid}/properties`, prop.id);
        await updateDoc(ref, { photos: firebaseUrls, updatedAt: Timestamp.now() });
      } catch (err) {
        console.error(`Migration failed for property ${prop.id}:`, err);
      }
    }
    setMigrateProgress(prev => ({ ...prev, photos: totalPhotos }));
    setMigrating(false);
    setMigrateDone(true);
  }, [user, migrating, needsMigration]);

  useEffect(() => { setForm(requirements); }, [requirements]);
  useEffect(() => { setFinForm(profile); }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    if (activeTab === 'requirements') await updateRequirements(form);
    else await updateProfile(finForm);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = async () => {
    if (activeTab === 'requirements') {
      if (confirm('Restaurar requisitos por defecto?')) await resetRequirements();
    } else {
      if (confirm('Restaurar perfil financiero por defecto?')) await resetProfile();
    }
  };

  const addZone = () => {
    if (newZone.trim() && !form.preferredZones.includes(newZone.trim().toLowerCase())) {
      setForm({ ...form, preferredZones: [...form.preferredZones, newZone.trim().toLowerCase()] });
      setNewZone('');
    }
  };

  const removeZone = (zone: string) => {
    setForm({ ...form, preferredZones: form.preferredZones.filter(z => z !== zone) });
  };

  const toggleOrientation = (orientation: string) => {
    const lower = orientation.toLowerCase();
    setForm({
      ...form,
      preferredOrientations: form.preferredOrientations.includes(lower)
        ? form.preferredOrientations.filter(o => o !== lower)
        : [...form.preferredOrientations, lower],
    });
  };

  const fmt = (n: number) => new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(n) + ' €';
  const n1 = finForm.name1 || 'Persona 1';
  const n2 = finForm.name2 || 'Persona 2';

  if (loadingReq || loadingFin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--color-text-tertiary)]">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-in">
      <h1
        className="text-2xl sm:text-3xl font-medium text-[var(--color-text)] mb-1"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        Ajustes
      </h1>
      <p className="text-[var(--color-text-secondary)] mb-6">
        Perfil financiero y requisitos de búsqueda
      </p>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[var(--color-bg-secondary)] rounded-lg mb-6">
        {[
          { key: 'financial' as const, label: 'Perfil financiero' },
          { key: 'requirements' as const, label: 'Requisitos' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 px-3 py-2 text-sm rounded-md transition-all ${
              activeTab === key
                ? 'bg-white text-[var(--color-text)] shadow-sm font-medium'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── PERFIL FINANCIERO ── */}
      {activeTab === 'financial' && (
        <div className="space-y-6">
          {/* Nombres */}
          <div className="p-4 rounded-lg border border-[var(--color-border)] space-y-3">
            <div className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide">Nombres</div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={finForm.name1}
                onChange={(e) => setFinForm({ ...finForm, name1: e.target.value })}
                placeholder="Persona 1"
                className={inputClass}
              />
              <input
                type="text"
                value={finForm.name2}
                onChange={(e) => setFinForm({ ...finForm, name2: e.target.value })}
                placeholder="Persona 2"
                className={inputClass}
              />
            </div>
          </div>

          {/* Ahorros */}
          <div className="p-4 rounded-lg border border-[var(--color-border)] space-y-3">
            <div className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide">Ahorros</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[var(--color-text-tertiary)] mb-1 block">{n1}</label>
                <input
                  type="number"
                  value={finForm.savings1}
                  onChange={(e) => setFinForm({ ...finForm, savings1: parseInt(e.target.value) || 0 })}
                  className={inputLgClass}
                />
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-tertiary)] mb-1 block">{n2}</label>
                <input
                  type="number"
                  value={finForm.savings2}
                  onChange={(e) => setFinForm({ ...finForm, savings2: parseInt(e.target.value) || 0 })}
                  className={inputLgClass}
                />
              </div>
            </div>
            <div className="text-xs text-[var(--color-text-tertiary)]">
              Total: <span className="text-[var(--color-text)] font-medium">{fmt(finForm.savings1 + finForm.savings2)}</span>
            </div>
          </div>

          {/* Ingresos */}
          <div className="p-4 rounded-lg border border-[var(--color-border)] space-y-3">
            <div className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide">Ingresos netos mensuales</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[var(--color-text-tertiary)] mb-1 block">{n1}</label>
                <input
                  type="number"
                  value={finForm.income1}
                  onChange={(e) => setFinForm({ ...finForm, income1: parseInt(e.target.value) || 0 })}
                  className={inputLgClass}
                />
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-tertiary)] mb-1 block">{n2}</label>
                <input
                  type="number"
                  value={finForm.income2}
                  onChange={(e) => setFinForm({ ...finForm, income2: parseInt(e.target.value) || 0 })}
                  className={inputLgClass}
                />
              </div>
            </div>
            <div className="text-xs text-[var(--color-text-tertiary)]">
              Total: <span className="text-[var(--color-text)] font-medium">{fmt(finForm.income1 + finForm.income2)}/mes</span>
            </div>
          </div>

          {/* Gastos vivienda */}
          <div className="p-4 rounded-lg border border-[var(--color-border)] space-y-3">
            <div className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide">Gastos mensuales vivienda</div>
            <p className="text-[11px] text-[var(--color-text-tertiary)]">Comunidad + IBI + seguros (sin hipoteca)</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={finForm.monthlyExpenses}
                onChange={(e) => setFinForm({ ...finForm, monthlyExpenses: parseInt(e.target.value) || 0 })}
                className={`w-28 ${inputLgClass}`}
              />
              <span className="text-sm text-[var(--color-text-tertiary)]">€/mes</span>
            </div>
          </div>

          {/* Resumen */}
          <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] text-sm">
            <div className="grid grid-cols-2 gap-y-2">
              <div>
                <div className="text-xs text-[var(--color-text-tertiary)]">{n1}</div>
                <div className="text-[var(--color-text)]">{fmt(finForm.savings1)} / {fmt(finForm.income1)}/mes</div>
              </div>
              <div>
                <div className="text-xs text-[var(--color-text-tertiary)]">{n2}</div>
                <div className="text-[var(--color-text)]">{fmt(finForm.savings2)} / {fmt(finForm.income2)}/mes</div>
              </div>
              <div className="col-span-2 pt-2 border-t border-[var(--color-border)] flex justify-between font-medium text-[var(--color-text)]">
                <span>Total</span>
                <span>{fmt(finForm.savings1 + finForm.savings2)} ahorrados · {fmt(finForm.income1 + finForm.income2)}/mes</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── REQUISITOS ── */}
      {activeTab === 'requirements' && (
        <div className="space-y-6">
          {/* Mínimos */}
          <div className="p-4 rounded-lg border border-[var(--color-border)] space-y-3">
            <div className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide">Requisitos mínimos</div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'M² útiles mín.', key: 'minUsableM2' as const },
                { label: 'M² construidos mín.', key: 'minBuiltM2' as const },
                { label: 'Habitaciones mín.', key: 'minRooms' as const },
                { label: 'Baños mín.', key: 'minBathrooms' as const },
                { label: 'Precio máx. (sin reforma)', key: 'maxPrice' as const },
                { label: 'Precio máx. (con reforma)', key: 'maxPriceRenovation' as const },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="text-xs text-[var(--color-text-tertiary)] mb-1 block">{label}</label>
                  <input
                    type="number"
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: parseInt(e.target.value) || 0 })}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Preferencias */}
          <div className="p-4 rounded-lg border border-[var(--color-border)] space-y-3">
            <div className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide">Preferencias</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[var(--color-text-tertiary)] mb-1 block">Planta mínima</label>
                <input
                  type="number"
                  value={form.minFloor}
                  onChange={(e) => setForm({ ...form, minFloor: parseInt(e.target.value) || 0 })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-tertiary)] mb-1 block">Año construcción mín.</label>
                <input
                  type="number"
                  value={form.minYear}
                  onChange={(e) => setForm({ ...form, minYear: parseInt(e.target.value) || 0 })}
                  className={inputClass}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={form.requireElevator}
                onChange={(e) => setForm({ ...form, requireElevator: e.target.checked })}
              />
              <span className="text-sm text-[var(--color-text)]">Ascensor obligatorio</span>
            </label>
          </div>

          {/* Zonas */}
          <div className="p-4 rounded-lg border border-[var(--color-border)] space-y-3">
            <div className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide">Zonas preferidas</div>
            {form.preferredZones.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.preferredZones.map((zone) => (
                  <span
                    key={zone}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[var(--color-bg-secondary)] text-[var(--color-text)] rounded-md text-xs"
                  >
                    {zone}
                    <button
                      onClick={() => removeZone(zone)}
                      className="text-[var(--color-text-tertiary)] hover:text-[var(--color-discarded-text)]"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={newZone}
                onChange={(e) => setNewZone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addZone()}
                placeholder="Añadir zona..."
                className={`flex-1 ${inputClass}`}
              />
              <button onClick={addZone} className="h-8 px-3 rounded-md bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors">
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Orientaciones */}
          <div className="p-4 rounded-lg border border-[var(--color-border)] space-y-3">
            <div className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide">Orientaciones preferidas</div>
            <div className="flex flex-wrap gap-1.5">
              {['Norte', 'Sur', 'Este', 'Oeste', 'Noreste', 'Noroeste', 'Sureste', 'Suroeste'].map((o) => (
                <button
                  key={o}
                  onClick={() => toggleOrientation(o)}
                  className={`h-8 px-3 text-sm rounded-md border transition-all inline-flex items-center ${
                    form.preferredOrientations.includes(o.toLowerCase())
                      ? 'bg-[var(--color-text)] text-white border-[var(--color-text)]'
                      : 'bg-transparent text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Save / Reset */}
      <div className="flex items-center gap-3 mt-6 pt-6 border-t border-[var(--color-border)]">
        <Button onClick={handleSave} disabled={saving}>
          {saved ? <Check size={14} className="mr-1.5" /> : <Save size={14} className="mr-1.5" />}
          {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar'}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          <RotateCcw size={13} className="mr-1.5" />
          Restaurar
        </Button>
      </div>

      {/* Photo migration */}
      {(needsMigration.length > 0 || migrateDone) && (
        <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
          <div className="p-4 rounded-lg border border-[var(--color-border)] space-y-3">
            <div className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide flex items-center gap-2">
              <ImageUp size={13} />
              Migrar fotos
            </div>
            {migrateDone ? (
              <p className="text-sm text-[var(--color-visited-text)]">
                Migración completada. {migrateProgress.photos} fotos subidas.
              </p>
            ) : (
              <>
                <p className="text-xs text-[var(--color-text-tertiary)]">
                  {needsMigration.length} {needsMigration.length === 1 ? 'propiedad tiene' : 'propiedades tienen'} fotos externas.
                </p>
                {migrating && (
                  <div>
                    <div className="w-full bg-[var(--color-bg-secondary)] rounded-full h-1.5 mb-1.5">
                      <div
                        className="bg-[var(--color-text)] h-1.5 rounded-full transition-all"
                        style={{ width: `${(migrateProgress.current / migrateProgress.total) * 100}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-[var(--color-text-tertiary)]">
                      {migrateProgress.current}/{migrateProgress.total} ({migrateProgress.photos} fotos)
                    </p>
                  </div>
                )}
                <Button size="sm" variant="secondary" onClick={migratePhotos} disabled={migrating}>
                  <ImageUp size={13} className="mr-1.5" />
                  {migrating ? 'Migrando...' : 'Migrar'}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
