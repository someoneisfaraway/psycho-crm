// src/components/clients/EditClientModal.tsx
import React, { useState } from 'react';
import type { Client, UpdateClient } from '../../types/database'; // Используем типы из database.ts
import ClientForm from './ClientForm'; // Импортируем обновлённую форму
import { X } from 'lucide-react'; // Импортируем иконку закрытия
// import { decrypt } from '../../utils/encryption'; // Импортируем функцию расшифровки - теперь не нужно

interface EditClientModalProps {
  client: Client; // Передаётся клиент для редактирования
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: UpdateClient & { id: string }) => void; // Тип onSave теперь UpdateClient с id
}

const EditClientModal: React.FC<EditClientModalProps> = ({
  client,
  isOpen,
  onClose,
  onSave,
}) => {
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleSave = async (formData: any) => { // Пока используем any, т.к. ClientForm отправляет NewClient
    // formData приходит из ClientForm, он соответствует структуре NewClient
    // Но для редактирования нам нужен UpdateClient & { id: string }
    // Нужно аккуратно извлечь обновляемые поля, исключив id и user_id

    // Поля, которые не должны обновляться при редактировании через эту форму (или обновляются другими способами)
    const { id: formId, total_sessions, total_paid, debt, created_at, updated_at, last_session_at, next_session_at, ...updates } = formData;

    // Проверим, что id в URL параметрах совпадает с id в formData (для безопасности на бэкенде, но на фронте тоже проверим)
    if (formId && formId !== client.id) {
      console.error("ID from form doesn't match client ID for editing.");
      alert("Ошибка: Несоответствие ID клиента.");
      return;
    }

    // `updates` теперь содержит только поля, которые нужно обновить, и `notes_encrypted` уже зашифровано.
    // `client.id` передаётся отдельно.
    const updatePayload: UpdateClient & { id: string } = {
      ...updates,
      id: client.id, // Убедимся, что id обновляемого клиента передаётся правильно
    };

    try {
      setIsSaving(true);
      onSave(updatePayload); // Передаём id клиента отдельно
      onClose(); // Закрываем модалку после успешного сохранения
    } catch (error) {
      console.error('Error updating client:', error);
      // В реальном приложении показали бы пользователю сообщение об ошибке
      alert('Error updating client: ' + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  // Подготовим initialData для ClientForm, передав зашифрованные заметки отдельно
  // const initialDataForForm = {
  //   name: client.name,
  //   age: client.age,
  //   location: client.location,
  //   source: client.source,
  //   type: client.type,
  //   phone: client.phone,
  //   email: client.email,
  //   telegram: client.telegram,
  //   session_price: client.session_price,
  //   payment_type: client.payment_type,
  //   need_receipt: client.need_receipt,
  //   format: client.format,
  //   meeting_link: client.meeting_link,
  //   notes: decryptedNotes, // Передаём расшифрованные заметки
  //   status: client.status,
  //   // idType и manualId не нужны для редактирования
  //   // id и user_id не передаём
  //   // total_sessions, total_paid, debt, created_at, updated_at, last_session_at, next_session_at не передаём
  // };

  return (
    <div className="fixed inset-0 bg-overlay flex items-center justify-center p-4 z-50">
      <div className="bg-bg-primary rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Редактировать клиента: {client.name}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
              aria-label="Закрыть модальное окно"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Передаём подготовленные initialData и userId (который не используется при редактировании) */}
          <ClientForm
            onSubmit={handleSave}
            onCancel={onClose}
            userId="" // userId не используется при редактировании
            // Передаём зашифрованные заметки отдельно
            initialEncryptedNotes={client.notes_encrypted || undefined}
            initialData={{ // Передаём остальные данные, исключая notes_encrypted
              name: client.name,
              age: client.age,
              location: client.location,
              source: client.source,
              type: client.type,
              phone: client.phone,
              email: client.email,
              telegram: client.telegram,
              session_price: client.session_price,
              payment_type: client.payment_type,
              need_receipt: client.need_receipt,
              format: client.format,
              meeting_link: client.meeting_link,
              // notes: decryptedNotes, // Больше не передаём расшифрованные notes напрямую
              status: client.status,
              id: client.id, // Передаём id для проверки isEditing
              // idType и manualId не нужны для редактирования
              // id и user_id не передаём в форме
              // total_sessions, total_paid, debt, created_at, updated_at, last_session_at, next_session_at не передаём
            }}
            isLoading={isSaving}
          />
        </div>
      </div>
    </div>
  );
};

export default EditClientModal;
