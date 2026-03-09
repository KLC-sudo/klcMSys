import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PaymentFormData, PaymentMethod, ServiceType, Client, Payment, Currency, ProspectDataStore, PaymentDataStore } from '../types';
import { formatCurrency, getDefaultCurrency, getCurrencySymbol, getAllCurrencies, getCurrencyName } from '../utils/currency';
import { formatDateForInput, getTodayDate } from '../utils/dateUtils';
import Modal from './shared/Modal';
import CreatorAutocomplete from './shared/CreatorAutocomplete';

interface PaymentFormProps {
  onSubmit: (payment: PaymentFormData) => void;
  onCancel: () => void;
  initialData?: Payment;
  isEditing?: boolean;
  clients: Client[];
  dataStore: ProspectDataStore & PaymentDataStore;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ onSubmit, onCancel, initialData, isEditing = false, clients, dataStore }) => {

  const initialFormState: PaymentFormData = {
    payerName: '',
    clientId: '',
    paymentDate: getTodayDate(),
    amount: 0,
    currency: Currency.UGX,
    service: ServiceType.LanguageTraining,
    paymentMethod: PaymentMethod.Cash,
    notes: '',
    recordedBy: '',
  };

  const [formData, setFormData] = useState<PaymentFormData>(initialFormState);
  const [outstandingBalance, setOutstandingBalance] = useState(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Searchable client dropdown state
  const [clientSearch, setClientSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients;
    const q = clientSearch.toLowerCase();
    return clients.filter(c => c.name.toLowerCase().includes(q) || c.type?.toLowerCase().includes(q));
  }, [clients, clientSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isEditing && initialData) {
      const selectedClient = clients.find(c => c.id === initialData.clientId);
      setFormData({
        payerName: initialData.payerName,
        clientId: initialData.clientId,
        paymentDate: formatDateForInput(initialData.paymentDate),
        amount: initialData.amount,
        currency: initialData.currency,
        service: initialData.service,
        paymentMethod: initialData.paymentMethod,
        notes: initialData.notes || '',
        recordedBy: (initialData as any).recordedBy || '',
      });
      if (selectedClient) setClientSearch(selectedClient.name);
    } else {
      setFormData(initialFormState);
      setClientSearch('');
    }
  }, [initialData, isEditing]);

  // Balance calculation
  useEffect(() => {
    const calculateBalance = async () => {
      if (!formData.clientId) { setOutstandingBalance(0); return; }
      setIsLoadingBalance(true);
      const selectedClient = clients.find(c => c.id === formData.clientId);
      if (!selectedClient) { setOutstandingBalance(0); setIsLoadingBalance(false); return; }
      try {
        const clientPayments = await dataStore.getPaymentsForClient(formData.clientId);
        let totalPaid = clientPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        if (isEditing && initialData && initialData.clientId === formData.clientId) {
          totalPaid -= (Number(initialData.amount) || 0);
        }
        setOutstandingBalance((Number(selectedClient.totalFee) || 0) - totalPaid);
      } catch (err) {
        console.error("Failed to fetch payments for balance calculation", err);
        setOutstandingBalance(0);
      } finally {
        setIsLoadingBalance(false);
      }
    };
    calculateBalance();
  }, [formData.clientId, clients, dataStore, isEditing, initialData]);

  const handleClientSelect = (client: Client) => {
    setFormData(prev => ({
      ...prev,
      clientId: client.id,
      payerName: client.name,
      service: client.service ?? ServiceType.LanguageTraining,
      amount: 0,
    }));
    setClientSearch(client.name);
    setIsDropdownOpen(false);
  };

  const handleClientSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClientSearch(e.target.value);
    setIsDropdownOpen(true);
    // Clear client if search is cleared
    if (!e.target.value) {
      setFormData(prev => ({ ...prev, clientId: '', payerName: '', amount: 0 }));
    } else if (formData.clientId) {
      // If user edited after selection, unlink the clientId
      const current = clients.find(c => c.id === formData.clientId);
      if (current && current.name !== e.target.value) {
        setFormData(prev => ({ ...prev, clientId: '', payerName: '', amount: 0 }));
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.clientId || formData.amount <= 0) {
      alert("Please select a client and enter a valid payment amount.");
      return;
    }
    const amount = Number(formData.amount) || 0;
    const remainingBalance = outstandingBalance - amount;
    onSubmit({ ...formData, amount, balance: remainingBalance, balanceCurrency: formData.currency });
  };

  const newBalance = outstandingBalance - (Number(formData.amount) || 0);
  const selectedClient = clients.find(c => c.id === formData.clientId);

  return (
    <Modal isOpen={true} onClose={onCancel} title={isEditing ? 'Edit Payment' : 'Record New Payment'}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Searchable Client Dropdown */}
          <div>
            <label htmlFor="clientSearch" className="block text-sm font-medium text-slate-600 mb-1">Client</label>
            <div className="relative" ref={dropdownRef}>
              <div className="relative">
                {/* Search icon */}
                <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                </span>
                <input
                  ref={inputRef}
                  id="clientSearch"
                  type="text"
                  autoComplete="off"
                  value={clientSearch}
                  onChange={handleClientSearchChange}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder="Search client by name..."
                  className="w-full pl-9 pr-9 py-2 border border-slate-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm"
                />
                {/* Selected badge OR chevron */}
                {selectedClient ? (
                  <button
                    type="button"
                    onClick={() => { setClientSearch(''); setFormData(prev => ({ ...prev, clientId: '', payerName: '', amount: 0 })); inputRef.current?.focus(); }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition-colors"
                    title="Clear selection"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                ) : (
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                )}
              </div>

              {/* Selected client pill */}
              {selectedClient && (
                <div className="mt-1.5 flex items-center gap-2 px-2.5 py-1 bg-sky-50 border border-sky-200 rounded-md text-xs">
                  <span className="text-sky-700 font-semibold truncate">{selectedClient.name}</span>
                  <span className="text-sky-500 shrink-0">· {selectedClient.type}</span>
                </div>
              )}

              {/* Dropdown list */}
              {isDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">
                  {filteredClients.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-slate-400 text-center">No clients found</div>
                  ) : (
                    <ul className="max-h-52 overflow-y-auto divide-y divide-slate-100">
                      {filteredClients.map(client => (
                        <li key={client.id}>
                          <button
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); handleClientSelect(client); }}
                            className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-2 hover:bg-sky-50 transition-colors group ${formData.clientId === client.id ? 'bg-sky-50' : ''}`}
                          >
                            <span className="font-medium text-slate-700 group-hover:text-sky-700 truncate">{client.name}</span>
                            <span className="text-xs text-slate-400 shrink-0 px-1.5 py-0.5 bg-slate-100 rounded-full group-hover:bg-sky-100 group-hover:text-sky-600">{client.type}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="payerName" className="block text-sm font-medium text-slate-600 mb-1">Payer Name</label>
            <input
              type="text" id="payerName" name="payerName"
              value={formData.payerName}
              readOnly
              className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-md shadow-sm cursor-not-allowed"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-slate-600 mb-1">Amount Paid</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-500 font-medium">
                {getCurrencySymbol(formData.currency)}
              </span>
              <input
                type="number" id="amount" name="amount"
                value={formData.amount}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full pl-16 pr-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                required
                disabled={!formData.clientId}
              />
            </div>
          </div>
          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-slate-600 mb-1">Currency</label>
            <input
              type="text"
              value="UGX - Ugandan Shilling"
              readOnly
              className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-md shadow-sm cursor-not-allowed text-slate-700"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="paymentDate" className="block text-sm font-medium text-slate-600 mb-1">Date of Payment</label>
            <input
              type="date" id="paymentDate" name="paymentDate"
              value={formData.paymentDate}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
              required
            />
          </div>
          <div>
            <label htmlFor="paymentMethod" className="block text-sm font-medium text-slate-600 mb-1">Payment Method</label>
            <select id="paymentMethod" name="paymentMethod" value={formData.paymentMethod} onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary bg-white">
              {Object.values(PaymentMethod).map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="service" className="block text-sm font-medium text-slate-600 mb-1">Service</label>
          <select id="service" name="service" value={formData.service} onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary bg-white">
            {Object.values(ServiceType).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <CreatorAutocomplete
            value={formData.recordedBy || ''}
            onChange={(value) => setFormData({ ...formData, recordedBy: value })}
            label="Recorded By"
            placeholder="Enter name..."
            required
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-slate-600 mb-1">Notes (Optional)</label>
          <textarea
            id="notes" name="notes"
            value={formData.notes || ''}
            onChange={handleChange}
            rows={2}
            placeholder="e.g., Part-payment for translation services"
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
          />
        </div>

        <div className="flex justify-end items-center space-x-4 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onCancel}
            className="font-semibold text-slate-600 hover:text-slate-800 transition-colors px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-brand-primary text-white font-bold py-2 px-6 rounded-lg shadow-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all duration-200"
          >
            {isEditing ? 'Save Changes' : 'Record Payment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default PaymentForm;
