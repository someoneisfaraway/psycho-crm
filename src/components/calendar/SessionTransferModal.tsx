import React, { useEffect, useState } from 'react';
import { parseISO, addMinutes } from 'date-fns';
import type { Session } from '../../types/database';
import { Button } from '../ui/Button';
import { X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { sessionsApi } from '../../api/sessions';

interface SessionTransferModalProps {
  session: Session;
  isOpen: boolean;
  onClose: () => void;
  onTransfer: (newDateTime: Date) => void;
}

const toLocalDateTimeInputValue = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
};

const SessionTransferModal: React.FC<SessionTransferModalProps> = ({ session, isOpen, onClose, onTransfer }) => {
  const [dateTime, setDateTime] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const { user } = useAuth();

  useEffect(() => {
    if (!isOpen) return;
    const current = parseISO(session.scheduled_at);
    setDateTime(toLocalDateTimeInputValue(current));
    setError('');
    setSubmitting(false);
  }, [isOpen, session.scheduled_at]);

  if (!isOpen) return null;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      if (!dateTime) {
        setError('Выберите дату и время');
        setSubmitting(false);
        return;
      }
      const newDate = new Date(dateTime);
      if (isNaN(newDate.getTime())) {
        setError('Некорректная дата');
        setSubmitting(false);
        return;
      }
      if (user?.id) {
        const dayStr = `${newDate.getFullYear()}-${String(newDate.getMonth()+1).padStart(2,'0')}-${String(newDate.getDate()).padStart(2,'0')}`;
        const sessions = await sessionsApi.getForDate(user.id, dayStr);
        const candidates = (sessions as any[]).filter(s => s.status !== 'cancelled' && s.id !== session.id);
        const sorted = candidates.sort((a,b)=> new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
        const before = sorted.filter(s => new Date(s.scheduled_at).getTime() <= newDate.getTime());
        const prev = before.length ? before[before.length - 1] : null;
        const prevEnd = prev ? addMinutes(new Date(prev.scheduled_at), prev.duration || 50) : null;
        if (prevEnd && newDate.getTime() <= prevEnd.getTime()) {
          setError('Это время уже занято!');
          setSubmitting(false);
          return;
        }
        const next = sorted.find(s => new Date(s.scheduled_at).getTime() >= newDate.getTime());
        const newEnd = addMinutes(newDate, session.duration || 50);
        if (next && newEnd.getTime() > new Date(next.scheduled_at).getTime()) {
          setError('Это время уже занято!');
          setSubmitting(false);
          return;
        }
      }
      await Promise.resolve(onTransfer(newDate));
      setSubmitting(false);
    } catch (e: any) {
      setError(e?.message || 'Не удалось перенести сессию');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-overlay flex items-center justify-center p-4 z-50">
      <div className="bg-bg-primary rounded-lg shadow-xl w-full max-w-lg">
        <div className="p-6 text-text-primary">
          <div className="flex justify-between items-center mb-4">
            <h2 className="modal-title">Перенос сессии</h2>
            <button onClick={onClose} className="modal-close-btn" aria-label="Закрыть модальное окно">
              <X className="h-6 w-6" />
            </button>
          </div>
          <form className="space-y-4" onSubmit={handleConfirm}>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Новая дата и время</label>
              <input
                type="datetime-local"
              className="input w-full"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                required
              />
            </div>

          {error && (
            <div className="mb-2 card bg-status-error-bg border-status-error-border text-status-error-text">{error}</div>
          )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={onClose}>Отмена</Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? 'Перенос...' : 'Перенести'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SessionTransferModal;
