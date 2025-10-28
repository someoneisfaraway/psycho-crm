import React, { useState } from 'react';
import type { Client, NewClient, UpdateClient } from '../../types/database';
import { Button } from '../ui/Button';
import { Calendar, Mail, Phone, User } from 'lucide-react';

interface ClientFormProps {
  initialData?: Partial<Client>;
  onSubmit: (data: NewClient | UpdateClient) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ClientForm: React.FC<ClientFormProps> = ({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}) => {
  const [formData, setFormData] = useState<Partial<Client>>(initialData || {
    client_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    birth_date: '',
    gender: '',
    notes: '',
    encrypted_notes: '',
    status: 'active',
  });
  
  const [encryptionKey, setEncryptionKey] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare the client data for submission
    const clientData: NewClient | UpdateClient = {
      ...formData,
      encrypted_notes: formData.encrypted_notes || undefined,
    } as NewClient | UpdateClient;
    
    onSubmit(clientData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="client_id">
            Client ID
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="client_id"
              name="client_id"
              type="text"
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm leading-5 bg-white placeholder-gray-500 text-gray-900 sm:text-sm"
              placeholder="CLI001"
              value={formData.client_id || ''}
              onChange={handleChange}
              disabled={!!initialData} // Disable editing of client ID if editing existing client
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            name="status"
            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 text-gray-900 sm:text-sm"
            value={formData.status || 'active'}
            onChange={handleChange}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="first_name">
            First Name *
          </label>
          <input
            id="first_name"
            name="first_name"
            type="text"
            required
            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 text-gray-900 sm:text-sm"
            placeholder="John"
            value={formData.first_name || ''}
            onChange={handleChange}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="last_name">
            Last Name *
          </label>
          <input
            id="last_name"
            name="last_name"
            type="text"
            required
            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 text-gray-900 sm:text-sm"
            placeholder="Doe"
            value={formData.last_name || ''}
            onChange={handleChange}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
            Email
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm leading-5 bg-white placeholder-gray-500 text-gray-900 sm:text-sm"
              placeholder="john.doe@example.com"
              value={formData.email || ''}
              onChange={handleChange}
            />
          </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="phone">
            Phone
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="phone"
              name="phone"
              type="tel"
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm leading-5 bg-white placeholder-gray-500 text-gray-900 sm:text-sm"
              placeholder="+1 (555) 123-4567"
              value={formData.phone || ''}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="birth_date">
            Birth Date
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="birth_date"
              name="birth_date"
              type="date"
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm leading-5 bg-white placeholder-gray-500 text-gray-900 sm:text-sm"
              value={formData.birth_date || ''}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="gender">
            Gender
          </label>
          <select
            id="gender"
            name="gender"
            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 text-gray-900 sm:text-sm"
            value={formData.gender || ''}
            onChange={handleChange}
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="notes">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="focus:ring-indigo-500 focus:border-indigo-500 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 text-gray-900 sm:text-sm"
          placeholder="General notes about the client"
          value={formData.notes || ''}
          onChange={handleChange}
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="encryption_key">
          Encryption Key (for sensitive notes)
        </label>
        <input
          id="encryption_key"
          type="password"
          className="focus:ring-indigo-500 focus:border-indigo-500 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 text-gray-900 sm:text-sm"
          value={encryptionKey}
          onChange={(e) => setEncryptionKey(e.target.value)}
          placeholder="Enter encryption key"
        />
        <p className="mt-1 text-sm text-gray-500">
          This key will be used to encrypt sensitive notes. Keep it safe and don't share it.
        </p>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="encrypted_notes">
          Sensitive Notes (Encrypted)
        </label>
        <textarea
          id="encrypted_notes"
          name="encrypted_notes"
          rows={3}
          className="focus:ring-indigo-500 focus:border-indigo-500 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 text-gray-900 sm:text-sm"
          placeholder="Enter sensitive information that will be encrypted"
          value={formData.encrypted_notes || ''}
          onChange={handleChange}
        />
      </div>
      
      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={isLoading}
        >
          {initialData ? 'Update Client' : 'Create Client'}
        </Button>
      </div>
    </form>
  );
};

export default ClientForm;