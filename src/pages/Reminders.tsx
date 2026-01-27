import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, Trash2, ExternalLink, Plus } from 'lucide-react';
import { useReminders } from '../hooks/useReminders';
import { useProperties } from '../hooks/useProperties';
import { formatDateTime } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';

export function Reminders() {
  const { reminders, loading, addReminder, toggleReminder, deleteReminder } = useReminders();
  const { properties } = useProperties();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    propertyId: '',
    date: '',
    message: '',
  });

  const pendingReminders = reminders.filter((r) => !r.completed);
  const completedReminders = reminders.filter((r) => r.completed);

  const getPropertyAddress = (propertyId: string) => {
    const property = properties.find((p) => p.id === propertyId);
    return property?.address || 'Propiedad eliminada';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addReminder({
      propertyId: formData.propertyId,
      date: new Date(formData.date),
      message: formData.message,
      completed: false,
    });
    setShowForm(false);
    setFormData({ propertyId: '', date: '', message: '' });
  };

  const propertyOptions = [
    { value: '', label: 'Selecciona una propiedad' },
    ...properties.map((p) => ({ value: p.id, label: p.address })),
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando recordatorios...</div>
      </div>
    );
  }

  const ReminderItem = ({ reminder, isPending }: { reminder: typeof reminders[0]; isPending: boolean }) => {
    const isOverdue = isPending && reminder.date < new Date();

    return (
      <div
        className={`flex items-start gap-4 p-4 rounded-lg border ${
          isOverdue ? 'bg-red-50 border-red-200' : 'bg-white'
        }`}
      >
        <button
          onClick={() => toggleReminder(reminder.id, !reminder.completed)}
          className={`mt-1 w-5 h-5 rounded border flex items-center justify-center ${
            reminder.completed
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-gray-300 hover:border-blue-500'
          }`}
        >
          {reminder.completed && <Check size={14} />}
        </button>

        <div className="flex-1 min-w-0">
          <p className={reminder.completed ? 'text-gray-500 line-through' : ''}>
            {reminder.message}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-sm">
            <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}>
              {formatDateTime(reminder.date)}
              {isOverdue && ' (vencido)'}
            </span>
            <Link
              to={`/property/${reminder.propertyId}`}
              className="flex items-center gap-1 text-blue-600 hover:underline"
            >
              <ExternalLink size={12} />
              {getPropertyAddress(reminder.propertyId)}
            </Link>
          </div>
        </div>

        <button
          onClick={() => deleteReminder(reminder.id)}
          className="p-1 text-gray-400 hover:text-red-500"
        >
          <Trash2 size={18} />
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-[85rem] mx-auto px-6 py-8 animate-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell size={24} />
            Recordatorios
          </h1>
          <p className="text-gray-600">
            {pendingReminders.length} pendiente{pendingReminders.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus size={18} className="mr-2" />
          Nuevo recordatorio
        </Button>
      </div>

      {pendingReminders.length === 0 && completedReminders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <Bell size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            No tienes recordatorios
          </h3>
          <p className="text-gray-500">
            Crea un recordatorio desde una propiedad o aquí
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingReminders.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Pendientes</h2>
              <div className="space-y-3">
                {pendingReminders.map((reminder) => (
                  <ReminderItem key={reminder.id} reminder={reminder} isPending />
                ))}
              </div>
            </div>
          )}

          {completedReminders.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 text-gray-500">Completados</h2>
              <div className="space-y-3">
                {completedReminders.map((reminder) => (
                  <ReminderItem key={reminder.id} reminder={reminder} isPending={false} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nuevo recordatorio">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Propiedad"
            value={formData.propertyId}
            onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
            options={propertyOptions}
            required
          />
          <Input
            label="Fecha y hora"
            type="datetime-local"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
          <Input
            label="Mensaje"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Llamar para confirmar visita..."
            required
          />
          <div className="flex gap-3">
            <Button type="submit">Crear recordatorio</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
