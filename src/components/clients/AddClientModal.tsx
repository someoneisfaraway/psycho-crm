// src/components/clients/AddClientModal.tsx
import React, { useState } from 'react';
import type { NewClient } from '../../types/database'; // Используем тип из database.ts
import ClientForm from './ClientForm'; // Импортируем обновлённую форму
import { X } from 'lucide-react'; // Импортируем иконку закрытия

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (client: NewClient) => void; // Тип onAdd теперь NewClient
  userId: string;
}

const AddClientModal: React.FC<AddClientModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  userId
}) => {
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleAdd = async (data: NewClient) => { // Принимаем NewClient
    try {
      setIsSaving(true);
      // Данные из формы уже соответствуют типу NewClient (с учетом id, user_id)
      // и подготовлены для отправки в API
      onAdd(data);
      onClose(); // Закрываем модалку после успешного добавления
    } catch (error) {
      console.error('Error adding client:', error);
      // В реальном приложении показали бы пользователю сообщение об ошибке
      alert('Error adding client: ' + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Новый клиент</h2> {/* Обновлен заголовок */}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
              aria-label="Закрыть модальное окно" // Добавим aria-label для доступности
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Передаём userId в ClientForm, так как он обязателен для создания */}
          <ClientForm
            onSubmit={handleAdd}
            onCancel={onClose}
            userId={userId} // <-- Передаём userId
            isLoading={isSaving}
            // initialData не передаём при создании, ClientForm сам сбросит состояние
          />
        </div>
      </div>
    </div>
  );
};

export default AddClientModal;