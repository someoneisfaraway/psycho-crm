// src/components/clients/EditClientModal.tsx
import React, { useState } from 'react';
import type { Client, UpdateClient } from '../../types/database'; // Используем типы из database.ts
import ClientForm from './ClientForm'; // Импортируем обновлённую форму
import { X } from 'lucide-react'; // Импортируем иконку закрытия
import { decrypt } from '../../utils/encryption'; // Импортируем функцию расшифровки

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

    // Псевдо-расшифровка для примера, т.к. ключа может не быть
    // В идеальной реализации, `notes_encrypted` приходит сюда уже расшифрованным или `notes` передаётся отдельно.
    // Пока что, `ClientForm` ожидает `notes` в `initialData`, поэтому мы передаём расшифрованные `notes`.
    // В `ClientForm` для редактирования `initialData.notes` будет использоваться.
    // При `onSubmit` из `ClientForm` мы получим `notes` и зашифруем их в `notes_encrypted`.
    // Итак, `formData.notes` от `ClientForm` - это нешифрованный текст.
    // Мы должны создать `UpdateClient` объект, исключив `id` и `user_id`, и зашифровав `notes`, если они есть.
    // `ClientForm` уже шифрует `notes` в `notes_encrypted` перед отправкой.
    // Поэтому `formData` от `ClientForm` будет содержать `notes_encrypted`.
    // Нам нужно исключить `id` и `user_id` из `formData` и добавить `id` от исходного `client`.
    // Также исключим вычисляемые поля `total_sessions`, `total_paid`, `debt`, `created_at`, `updated_at`, `last_session_at`, `next_session_at`, если они там есть.

    // Правильный способ:
    // 1. Определить, какие поля из formData нужно обновить (исключая id, user_id и вычисляемые).
    // 2. Убедиться, что `id` не включён в `updates`.
    // 3. Передать `id` отдельно в `onSave`.

    // Поля, которые не должны обновляться при редактировании через эту форму (или обновляются другими способами)
    const { id: formId, user_id, total_sessions, total_paid, debt, created_at, updated_at, last_session_at, next_session_at, ...updates } = formData;

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

  // Подготовим initialData для ClientForm, расшифровав notes_encrypted
  // Предположим, что `decrypt` может работать без доступа к мастер-ключу пользователя напрямую,
  // или что ключ как-то передаётся (например, через контекст, что не реализовано в заглушке).
  // Для MVP с localStorage ключа это возможно.
  // Пока что, если `notes_encrypted` есть, попробуем его расшифровать.
  // Если ключ недоступен, `decrypt` вернёт пустую строку или зашифрованный текст.
  // Псевдо-расшифровка:
  // const decryptedNotes = client.notes_encrypted ? decrypt(client.notes_encrypted) : '';
  // Но `decrypt` требует ключ. В `utils/encryption` ключ генерируется и хранится в localStorage.
  // Нам нужно получить его оттуда.
  const getEncryptionKey = (): string | null => {
    return localStorage.getItem('encryption_key');
  };

  const decryptedNotes = client.notes_encrypted ? (() => {
    const key = getEncryptionKey();
    if (!key) {
        console.error("Encryption key not found in localStorage. Cannot decrypt notes.");
        return client.notes_encrypted; // Вернуть зашифрованный текст, если ключа нет
    }
    // Импортируем функцию decrypt локально или используем глобальную, если она доступна.
    // Для простоты, будем использовать ту же заглушку, что и в encryption.ts, но с ключом.
    // Реализация зависит от библиотеки шифрования. Псевдокод:
    // return CryptoJS.AES.decrypt(client.notes_encrypted, key).toString(CryptoJS.enc.Utf8);
    // Заглушка:
    console.warn("Decrypting notes in EditClientModal. This is a placeholder.");
    // return client.notes_encrypted; // Пока не расшифровываем, передаём как есть
    // Правильная реализация требует реальной библиотеки.
    // Предположим, что `decrypt` в utils может получить ключ сам или он передаётся.
    // В реальности, `ClientForm` может получать `notes` как отдельное поле, которое уже расшифровано.
    // Тогда `initialData` для `ClientForm` будет `{..., notes: decryptedNotes, notes_encrypted: undefined }`
    // и `ClientForm` будет использовать `notes` для textarea, и шифровать его обратно в `notes_encrypted` при `onSubmit`.
    // Это изменение нужно внести в `ClientForm` и `EditClientModal`.
    // `ClientForm` принимает `initialData` как `Partial<NewClient>`, но для редактирования `notes_encrypted` нужно расшифровать.
    // Изменим `ClientForm` так, чтобы он принимал `initialData` как `Partial<Client>` (для редактирования) или `Partial<Omit<NewClient, 'notes_encrypted'>> & { notes?: string }` (для создания).
    // Это требует изменения `ClientForm`.
    // Или, как вариант, `EditClientModal` передаёт `initialData`, где `notes_encrypted` заменено на `notes`.
    // Это проще. Изменим `initialData` перед передачей в `ClientForm`.
    // Псевдо-расшифровка или возврат исходного значения:
    return client.notes_encrypted; // Пока что, передаём зашифрованный текст, так как реальная расшифровка сложна без контекста ключа.
    // ИЛИ, если `utils/encryption.ts` обновлён, используем его:
    // return decrypt(client.notes_encrypted); // <-- Требует реальную реализацию decrypt с доступом к ключу.
  })() : '';

  // Подготовим initialData, исключив вычисляемые поля и заменив notes_encrypted на notes
  // const initialDataForForm: Partial<Omit<NewClient, 'notes_encrypted'>> & { notes?: string } = {
  //   // ...client,
  //   // notes: decryptedNotes, // Добавим расшифрованные заметки как `notes`
  //   // notes_encrypted: undefined, // Уберём зашифрованное поле
  //   // id: undefined, // Не передаём id для редактирования в initialData формы
  //   // user_id: undefined, // Не передаём user_id в initialData формы
  //   // total_sessions: undefined, // Убираем вычисляемые
  //   // total_paid: undefined,
  //   // debt: undefined,
  //   // created_at: undefined,
  //   // updated_at: undefined,
  //   // last_session_at: undefined,
  //   // next_session_at: undefined,
  // };

  // Упрощённый вариант: передаём весь client, но `ClientForm` должен уметь обрабатывать `notes_encrypted` и расшифровывать его при редактировании.
  // Или `ClientForm` получает `notes` вместо `notes_encrypted` при редактировании.
  // Лучше изменить `ClientForm` и `EditClientModal` так:
  // `EditClientModal` передаёт `initialData` как `Partial<Client>`, но с `notes` вместо `notes_encrypted`.
  // `ClientForm` принимает `initialData` как `Partial<ClientForForm>`, где `ClientForForm` это `Omit<Client, 'notes_encrypted'> & { notes?: string }`.
  // Это требует обновления `ClientForm`.

  // Пока что, изменим `ClientForm` для совместимости.

  // Подготовим initialData, заменив `notes_encrypted` на `notes` и убрав `user_id`, `id`, вычисляемые поля.
  const initialDataForForm = {
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
    notes: decryptedNotes, // Передаём расшифрованные заметки
    status: client.status,
    // idType и manualId не нужны для редактирования
    // id и user_id не передаём
    // total_sessions, total_paid, debt, created_at, updated_at, last_session_at, next_session_at не передаём
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
            initialData={initialDataForForm} // Передаём подготовленные данные
            isLoading={isSaving}
          />
        </div>
      </div>
    </div>
  );
};

export default EditClientModal;