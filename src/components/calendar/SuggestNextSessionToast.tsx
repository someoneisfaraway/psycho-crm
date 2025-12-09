import React from 'react';
import { Button } from '../ui/Button';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface SuggestNextSessionToastProps {
  isOpen: boolean;
  clientName: string;
  proposedDate: Date;
  onAccept: () => void;
  onDismiss: () => void;
}

const SuggestNextSessionToast: React.FC<SuggestNextSessionToastProps> = ({ isOpen, clientName, proposedDate, onAccept, onDismiss }) => {
  if (!isOpen) return null;

  const dateLabel = format(proposedDate, 'EEEE, d MMMM yyyy, HH:mm', { locale: ru });

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="card bg-bg-primary border-border-primary shadow-xl p-4 w-[340px]">
        <div className="text-sm text-text-secondary mb-1">Предложение</div>
        <div className="text-text-primary font-medium mb-3">
          Запланировать следующую сессию для «{clientName}» на {dateLabel}?
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onDismiss}>Отмена</Button>
          <Button variant="primary" size="sm" onClick={onAccept}>Запланировать</Button>
        </div>
      </div>
    </div>
  );
};

export default SuggestNextSessionToast;

