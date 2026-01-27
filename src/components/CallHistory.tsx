import { useState } from 'react';
import { Phone, Trash2, Plus } from 'lucide-react';
import type { Call, CallResult } from '../types';
import { CALL_RESULT_LABELS } from '../types';
import { formatDateTime } from '../lib/utils';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';

interface CallHistoryProps {
  calls: Call[];
  onAddCall: (call: Omit<Call, 'id' | 'propertyId'>) => Promise<void>;
  onDeleteCall: (callId: string) => Promise<void>;
}

export function CallHistory({ calls, onAddCall, onDeleteCall }: CallHistoryProps) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 16),
    duration: 0,
    result: 'no_answer' as CallResult,
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onAddCall({
        date: new Date(formData.date),
        duration: Number(formData.duration),
        result: formData.result,
        notes: formData.notes,
      });
      setShowForm(false);
      setFormData({
        date: new Date().toISOString().slice(0, 16),
        duration: 0,
        result: 'no_answer',
        notes: '',
      });
    } finally {
      setLoading(false);
    }
  };

  const resultOptions = Object.entries(CALL_RESULT_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Phone size={18} />
          Historial de llamadas
        </h3>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus size={16} className="mr-1" />
            Añadir
          </Button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Fecha y hora"
              type="datetime-local"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
            <Input
              label="Duración (min)"
              type="number"
              value={formData.duration || ''}
              onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
            />
          </div>
          <Select
            label="Resultado"
            value={formData.result}
            onChange={(e) => setFormData({ ...formData, result: e.target.value as CallResult })}
            options={resultOptions}
          />
          <Input
            label="Notas"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Detalles de la llamada..."
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {calls.length === 0 ? (
        <p className="text-gray-500 text-sm">No hay llamadas registradas</p>
      ) : (
        <div className="space-y-3">
          {calls.map((call) => (
            <div
              key={call.id}
              className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <div className="text-sm font-medium">
                  {CALL_RESULT_LABELS[call.result]}
                </div>
                <div className="text-xs text-gray-500">
                  {formatDateTime(call.date)}
                  {call.duration > 0 && ` · ${call.duration} min`}
                </div>
                {call.notes && (
                  <p className="text-sm text-gray-600 mt-1">{call.notes}</p>
                )}
              </div>
              <button
                onClick={() => onDeleteCall(call.id)}
                className="p-1 text-gray-400 hover:text-red-500"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
