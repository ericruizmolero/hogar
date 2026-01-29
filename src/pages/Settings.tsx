import { useState, useEffect, useCallback } from 'react';
import { Save, RotateCcw, Plus, X, Users, PiggyBank, Search, ImageUp } from 'lucide-react';
import { useRequirements } from '../hooks/useRequirements';
import { useFinancialProfile } from '../hooks/useFinancialProfile';
import { useProperties } from '../hooks/useProperties';
import { useAuth } from '../context/AuthContext';
import { uploadPropertyPhotos } from '../lib/storage';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function Settings() {
  const { requirements, loading: loadingReq, updateRequirements, resetRequirements } = useRequirements();
  const { profile, loading: loadingFin, updateProfile, resetProfile } = useFinancialProfile();

  const [form, setForm] = useState(requirements);
  const [finForm, setFinForm] = useState(profile);
  const [newZone, setNewZone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'requirements' | 'financial'>('financial');

  // Migration state
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
        const firebaseUrls = await uploadPropertyPhotos(
          prop.photos || [],
          prop.id,
          user.uid,
        );
        const migratedCount = firebaseUrls.filter(u => u.includes('firebasestorage') || u.includes('googleapis.com')).length;
        totalPhotos += migratedCount;

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

  useEffect(() => {
    setForm(requirements);
  }, [requirements]);

  useEffect(() => {
    setFinForm(profile);
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    if (activeTab === 'requirements') {
      await updateRequirements(form);
    } else {
      await updateProfile(finForm);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = async () => {
    if (activeTab === 'requirements') {
      if (confirm('¿Restaurar los requisitos por defecto?')) {
        await resetRequirements();
      }
    } else {
      if (confirm('¿Restaurar el perfil financiero por defecto?')) {
        await resetProfile();
      }
    }
  };

  const addZone = () => {
    if (newZone.trim() && !form.preferredZones.includes(newZone.trim().toLowerCase())) {
      setForm({
        ...form,
        preferredZones: [...form.preferredZones, newZone.trim().toLowerCase()],
      });
      setNewZone('');
    }
  };

  const removeZone = (zone: string) => {
    setForm({
      ...form,
      preferredZones: form.preferredZones.filter(z => z !== zone),
    });
  };

  const toggleOrientation = (orientation: string) => {
    const lower = orientation.toLowerCase();
    if (form.preferredOrientations.includes(lower)) {
      setForm({
        ...form,
        preferredOrientations: form.preferredOrientations.filter(o => o !== lower),
      });
    } else {
      setForm({
        ...form,
        preferredOrientations: [...form.preferredOrientations, lower],
      });
    }
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(n) + '€';

  if (loadingReq || loadingFin) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="text-[var(--color-text-secondary)]">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 animate-in">
      <h1
        className="text-2xl font-medium text-[var(--color-text)] mb-6"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        Configuración
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('financial')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'financial'
              ? 'bg-[var(--color-accent)] text-white'
              : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
          }`}
        >
          <PiggyBank size={16} />
          Perfil financiero
        </button>
        <button
          onClick={() => setActiveTab('requirements')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'requirements'
              ? 'bg-[var(--color-accent)] text-white'
              : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
          }`}
        >
          <Search size={16} />
          Requisitos de búsqueda
        </button>
      </div>

      {/* PERFIL FINANCIERO */}
      {activeTab === 'financial' && (
        <div className="space-y-8">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Estos datos se usan en la calculadora de hipoteca de todos los inmuebles.
          </p>

          {/* Ahorros */}
          <section>
            <h2 className="text-sm font-medium text-[var(--color-text-secondary)] mb-4 uppercase tracking-wide flex items-center gap-2">
              <PiggyBank size={16} />
              Ahorros de cada persona
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-[var(--color-text-secondary)] mb-2 block">Persona 1</label>
                <input
                  type="number"
                  value={finForm.savings1}
                  onChange={(e) => setFinForm({ ...finForm, savings1: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 text-lg bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>
              <div>
                <label className="text-sm text-[var(--color-text-secondary)] mb-2 block">Persona 2</label>
                <input
                  type="number"
                  value={finForm.savings2}
                  onChange={(e) => setFinForm({ ...finForm, savings2: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 text-lg bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>
            </div>
            <div className="mt-2 text-sm text-[var(--color-text-tertiary)]">
              Total ahorros: <span className="text-[var(--color-text)] font-medium">{formatCurrency(finForm.savings1 + finForm.savings2)}</span>
            </div>
          </section>

          {/* Ingresos */}
          <section>
            <h2 className="text-sm font-medium text-[var(--color-text-secondary)] mb-4 uppercase tracking-wide flex items-center gap-2">
              <Users size={16} />
              Ingresos netos mensuales
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-[var(--color-text-secondary)] mb-2 block">Persona 1</label>
                <input
                  type="number"
                  value={finForm.income1}
                  onChange={(e) => setFinForm({ ...finForm, income1: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 text-lg bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>
              <div>
                <label className="text-sm text-[var(--color-text-secondary)] mb-2 block">Persona 2</label>
                <input
                  type="number"
                  value={finForm.income2}
                  onChange={(e) => setFinForm({ ...finForm, income2: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 text-lg bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>
            </div>
            <div className="mt-2 text-sm text-[var(--color-text-tertiary)]">
              Total ingresos: <span className="text-[var(--color-text)] font-medium">{formatCurrency(finForm.income1 + finForm.income2)}/mes</span>
            </div>
          </section>

          {/* Gastos mensuales */}
          <section>
            <h2 className="text-sm font-medium text-[var(--color-text-secondary)] mb-4 uppercase tracking-wide">
              Gastos mensuales estimados de vivienda
            </h2>
            <p className="text-xs text-[var(--color-text-tertiary)] mb-3">
              Comunidad + IBI + seguros (sin contar la hipoteca)
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={finForm.monthlyExpenses}
                onChange={(e) => setFinForm({ ...finForm, monthlyExpenses: parseInt(e.target.value) || 0 })}
                className="w-32 px-4 py-3 text-lg bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-accent)]"
              />
              <span className="text-[var(--color-text-secondary)]">€/mes</span>
            </div>
          </section>

          {/* Resumen */}
          <section className="p-4 bg-[var(--color-bg-secondary)] rounded-lg">
            <h3 className="font-medium text-[var(--color-text)] mb-3">Resumen</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-[var(--color-text-tertiary)]">Ahorros totales</div>
                <div className="font-medium text-[var(--color-text)]">{formatCurrency(finForm.savings1 + finForm.savings2)}</div>
              </div>
              <div>
                <div className="text-[var(--color-text-tertiary)]">Ingresos totales</div>
                <div className="font-medium text-[var(--color-text)]">{formatCurrency(finForm.income1 + finForm.income2)}/mes</div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* REQUISITOS DE BÚSQUEDA */}
      {activeTab === 'requirements' && (
        <div className="space-y-8">
          {/* Requisitos críticos */}
          <section>
            <h2 className="text-sm font-medium text-[var(--color-text-secondary)] mb-4 uppercase tracking-wide">
              Requisitos mínimos (críticos)
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="M² útiles mínimos"
                type="number"
                value={form.minUsableM2}
                onChange={(e) => setForm({ ...form, minUsableM2: parseInt(e.target.value) || 0 })}
              />
              <Input
                label="M² construidos mínimos"
                type="number"
                value={form.minBuiltM2}
                onChange={(e) => setForm({ ...form, minBuiltM2: parseInt(e.target.value) || 0 })}
              />
              <Input
                label="Baños mínimos"
                type="number"
                value={form.minBathrooms}
                onChange={(e) => setForm({ ...form, minBathrooms: parseInt(e.target.value) || 0 })}
              />
              <Input
                label="Habitaciones mínimas"
                type="number"
                value={form.minRooms}
                onChange={(e) => setForm({ ...form, minRooms: parseInt(e.target.value) || 0 })}
              />
              <Input
                label="Precio máximo (sin reforma)"
                type="number"
                value={form.maxPrice}
                onChange={(e) => setForm({ ...form, maxPrice: parseInt(e.target.value) || 0 })}
              />
              <Input
                label="Precio máximo (con reforma)"
                type="number"
                value={form.maxPriceRenovation}
                onChange={(e) => setForm({ ...form, maxPriceRenovation: parseInt(e.target.value) || 0 })}
              />
            </div>
          </section>

          {/* Preferencias */}
          <section>
            <h2 className="text-sm font-medium text-[var(--color-text-secondary)] mb-4 uppercase tracking-wide">
              Preferencias
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Input
                label="Planta mínima"
                type="number"
                value={form.minFloor}
                onChange={(e) => setForm({ ...form, minFloor: parseInt(e.target.value) || 0 })}
              />
              <Input
                label="Año construcción mínimo"
                type="number"
                value={form.minYear}
                onChange={(e) => setForm({ ...form, minYear: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.requireElevator}
                  onChange={(e) => setForm({ ...form, requireElevator: e.target.checked })}
                />
                <span className="text-sm text-[var(--color-text)]">
                  Ascensor obligatorio (si no, solo preferencia)
                </span>
              </label>
            </div>
          </section>

          {/* Zonas preferidas */}
          <section>
            <h2 className="text-sm font-medium text-[var(--color-text-secondary)] mb-4 uppercase tracking-wide">
              Zonas preferidas
            </h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {form.preferredZones.map((zone) => (
                <span
                  key={zone}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-[var(--color-bg-secondary)] text-[var(--color-text)] rounded-full text-sm"
                >
                  {zone}
                  <button
                    onClick={() => removeZone(zone)}
                    className="text-[var(--color-text-tertiary)] hover:text-[var(--color-discarded-text)]"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newZone}
                onChange={(e) => setNewZone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addZone()}
                placeholder="Añadir zona..."
                className="flex-1 px-3 py-2 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-accent)]"
              />
              <Button size="sm" variant="secondary" onClick={addZone}>
                <Plus size={16} />
              </Button>
            </div>
          </section>

          {/* Orientaciones */}
          <section>
            <h2 className="text-sm font-medium text-[var(--color-text-secondary)] mb-4 uppercase tracking-wide">
              Orientaciones preferidas
            </h2>
            <div className="flex flex-wrap gap-2">
              {['Norte', 'Sur', 'Este', 'Oeste', 'Noreste', 'Noroeste', 'Sureste', 'Suroeste'].map((orientation) => (
                <button
                  key={orientation}
                  onClick={() => toggleOrientation(orientation)}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-all ${
                    form.preferredOrientations.includes(orientation.toLowerCase())
                      ? 'bg-[var(--color-visited)] text-[var(--color-visited-text)] border-[var(--color-visited)]'
                      : 'bg-transparent text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                  }`}
                >
                  {orientation}
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Acciones */}
      <div className="flex items-center gap-3 pt-6 mt-6 border-t border-[var(--color-border)]">
        <Button onClick={handleSave} disabled={saving}>
          <Save size={16} className="mr-2" />
          {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar cambios'}
        </Button>
        <Button variant="secondary" onClick={handleReset}>
          <RotateCcw size={16} className="mr-2" />
          Restaurar
        </Button>
      </div>

      {/* Migración de fotos */}
      <div className="pt-6 mt-6 border-t border-[var(--color-border)]">
        <h2 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3 uppercase tracking-wide flex items-center gap-2">
          <ImageUp size={16} />
          Migrar fotos a Firebase Storage
        </h2>
        <p className="text-sm text-[var(--color-text-tertiary)] mb-4">
          Sube las fotos externas a Firebase Storage para que carguen mucho más rápido.
        </p>

        {needsMigration.length === 0 && !migrateDone ? (
          <p className="text-sm text-[var(--color-text-secondary)]">
            Todas las fotos ya están en Firebase Storage.
          </p>
        ) : migrateDone ? (
          <p className="text-sm text-green-600">
            Migración completada. {migrateProgress.photos} fotos subidas de {migrateProgress.total} propiedades.
          </p>
        ) : (
          <>
            <p className="text-sm text-[var(--color-text)] mb-3">
              {needsMigration.length} {needsMigration.length === 1 ? 'propiedad tiene' : 'propiedades tienen'} fotos externas pendientes de migrar.
            </p>
            {migrating && (
              <div className="mb-3">
                <div className="w-full bg-[var(--color-bg-secondary)] rounded-full h-2 mb-2">
                  <div
                    className="bg-[var(--color-accent)] h-2 rounded-full transition-all"
                    style={{ width: `${(migrateProgress.current / migrateProgress.total) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-[var(--color-text-tertiary)]">
                  Propiedad {migrateProgress.current} de {migrateProgress.total} ({migrateProgress.photos} fotos subidas)
                </p>
              </div>
            )}
            <Button onClick={migratePhotos} disabled={migrating}>
              <ImageUp size={16} className="mr-2" />
              {migrating ? 'Migrando...' : 'Migrar fotos'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
