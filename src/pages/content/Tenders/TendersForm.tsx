import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { FiUpload, FiLoader, FiX } from 'react-icons/fi';
import { tendersAPI, mdasAPI } from '../../../services/api';
import { uploadFile, deleteFile } from '../../../services/uploadService';
import FormField from '../../../components/common/FormField';

interface Tender {
  _id: string;
  title: { en?: string; ha?: string; ar?: string };
  description: { en?: string; ha?: string; ar?: string };
  category: string;
  tenderNumber: string;
  value: { amount: number; currency: string };
  openingDate: string;
  closingDate: string;
  requirements: { en?: string; ha?: string; ar?: string };
  contactPerson: { name: string; email: string; phone: string };
  documents: Array<{ url: string; name: string }>;
  mda?: string;
  status: 'open' | 'closed' | 'awarded' | 'cancelled';
}

const tenderSchema = z.object({
  titleEn: z.string().min(1, 'Title (English) is required'),
  titleHa: z.string().optional(),
  titleAr: z.string().optional(),
  descriptionEn: z.string().min(1, 'Description (English) is required'),
  descriptionHa: z.string().optional(),
  descriptionAr: z.string().optional(),
  category: z.enum(['goods', 'services', 'works', 'consultancy']),
  tenderNumber: z.string().min(1, 'Tender number is required'),
  amount: z.number().min(0, 'Amount must be positive'),
  currency: z.enum(['NGN', 'USD', 'EUR', 'GBP']),
  openingDate: z.string().min(1, 'Opening date is required'),
  closingDate: z.string().min(1, 'Closing date is required'),
  requirementsEn: z.string().optional(),
  requirementsHa: z.string().optional(),
  requirementsAr: z.string().optional(),
  contactName: z.string().min(1, 'Contact name is required'),
  contactEmail: z.string().email('Invalid email address'),
  contactPhone: z.string().min(1, 'Contact phone is required'),
  mda: z.string().optional(),
  status: z.enum(['open', 'closed', 'awarded', 'cancelled']),
});

type TenderFormData = z.infer<typeof tenderSchema>;

interface TendersFormProps {
  tender?: Tender | null;
  onSuccess: () => void;
}

export default function TendersForm({ tender, onSuccess }: TendersFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!tender;
  const [activeTab, setActiveTab] = useState<'en' | 'ha' | 'ar'>('en');

  const [uploadedDocuments, setUploadedDocuments] = useState<Array<{ url: string; name: string; key: string }>>(
    tender?.documents?.map(doc => ({ ...doc, key: doc.url })) || []
  );
  const [isUploading, setIsUploading] = useState(false);

  const { data: mdasData } = useQuery({
    queryKey: ['mdas'],
    queryFn: async () => {
      const response = await mdasAPI.getAll({ limit: 100 });
      return response.data;
    },
  });

  const { register, handleSubmit, formState: { errors } } = useForm<TenderFormData>({
    resolver: zodResolver(tenderSchema),
    defaultValues: {
      titleEn: tender?.title?.en || '',
      titleHa: tender?.title?.ha || '',
      titleAr: tender?.title?.ar || '',
      descriptionEn: tender?.description?.en || '',
      descriptionHa: tender?.description?.ha || '',
      descriptionAr: tender?.description?.ar || '',
      category: tender?.category as any || 'goods',
      tenderNumber: tender?.tenderNumber || '',
      amount: tender?.value?.amount || 0,
      currency: tender?.value?.currency as any || 'NGN',
      openingDate: tender?.openingDate ? new Date(tender.openingDate).toISOString().slice(0, 16) : '',
      closingDate: tender?.closingDate ? new Date(tender.closingDate).toISOString().slice(0, 16) : '',
      requirementsEn: tender?.requirements?.en || '',
      requirementsHa: tender?.requirements?.ha || '',
      requirementsAr: tender?.requirements?.ar || '',
      contactName: tender?.contactPerson?.name || '',
      contactEmail: tender?.contactPerson?.email || '',
      contactPhone: tender?.contactPerson?.phone || '',
      mda: tender?.mda || '',
      status: tender?.status || 'open',
    },
  });

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a PDF, Excel, or Word document');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }

    try {
      setIsUploading(true);
      const result = await uploadFile(file, 'tenders');
      setUploadedDocuments([...uploadedDocuments, { url: result.url, name: file.name, key: result.key }]);
      toast.success('Document uploaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Document upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDocumentRemove = async (index: number) => {
    const doc = uploadedDocuments[index];
    if (doc.key && !tender?.documents?.find(d => d.url === doc.url)) {
      try {
        await deleteFile(doc.key);
      } catch (error) {
        console.error('Error deleting document:', error);
      }
    }
    setUploadedDocuments(uploadedDocuments.filter((_, i) => i !== index));
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => tendersAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
      toast.success('Tender created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create tender');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => tendersAPI.update(tender!._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
      toast.success('Tender updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update tender');
    },
  });

  const onSubmit = (data: TenderFormData) => {
    const payload = {
      title: {
        en: data.titleEn,
        ha: data.titleHa || undefined,
        ar: data.titleAr || undefined,
      },
      description: {
        en: data.descriptionEn,
        ha: data.descriptionHa || undefined,
        ar: data.descriptionAr || undefined,
      },
      category: data.category,
      tenderNumber: data.tenderNumber,
      value: {
        amount: Number(data.amount),
        currency: data.currency,
      },
      openingDate: new Date(data.openingDate).toISOString(),
      closingDate: new Date(data.closingDate).toISOString(),
      requirements: {
        en: data.requirementsEn || undefined,
        ha: data.requirementsHa || undefined,
        ar: data.requirementsAr || undefined,
      },
      contactPerson: {
        name: data.contactName,
        email: data.contactEmail,
        phone: data.contactPhone,
      },
      documents: uploadedDocuments.map(({ url, name }) => ({ url, name })),
      mda: data.mda || undefined,
      status: data.status,
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Language Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'en', label: 'English' },
            { key: 'ha', label: 'Hausa' },
            { key: 'ar', label: 'Arabic' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-[#006838] text-[#006838]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Multilingual Fields */}
      <div className="space-y-4">
        {activeTab === 'en' && (
          <>
            <FormField label="Title (English)" name="titleEn" register={register} error={errors.titleEn} required />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (English) <span className="text-red-500">*</span>
              </label>
              <textarea rows={4} {...register('descriptionEn')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]" />
              {errors.descriptionEn && <p className="mt-1 text-sm text-red-600">{errors.descriptionEn.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Requirements (English)</label>
              <textarea rows={3} {...register('requirementsEn')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]" />
            </div>
          </>
        )}

        {activeTab === 'ha' && (
          <>
            <FormField label="Title (Hausa)" name="titleHa" register={register} error={errors.titleHa} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (Hausa)</label>
              <textarea rows={4} {...register('descriptionHa')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Requirements (Hausa)</label>
              <textarea rows={3} {...register('requirementsHa')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]" />
            </div>
          </>
        )}

        {activeTab === 'ar' && (
          <>
            <FormField label="Title (Arabic)" name="titleAr" register={register} error={errors.titleAr} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (Arabic)</label>
              <textarea rows={4} {...register('descriptionAr')} dir="rtl" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Requirements (Arabic)</label>
              <textarea rows={3} {...register('requirementsAr')} dir="rtl" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]" />
            </div>
          </>
        )}
      </div>

      {/* Tender Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="Tender Number" name="tenderNumber" register={register} error={errors.tenderNumber} required />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select {...register('category')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]">
            <option value="goods">Goods</option>
            <option value="services">Services</option>
            <option value="works">Works</option>
            <option value="consultancy">Consultancy</option>
          </select>
        </div>
      </div>

      {/* Value */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <FormField label="Tender Value" name="amount" type="number" register={register} error={errors.amount} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Currency <span className="text-red-500">*</span>
          </label>
          <select {...register('currency')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]">
            <option value="NGN">NGN</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="Opening Date" name="openingDate" type="datetime-local" register={register} error={errors.openingDate} required />
        <FormField label="Closing Date" name="closingDate" type="datetime-local" register={register} error={errors.closingDate} required />
      </div>

      {/* Contact Person */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Person</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField label="Name" name="contactName" register={register} error={errors.contactName} required />
          <FormField label="Email" name="contactEmail" type="email" register={register} error={errors.contactEmail} required />
          <FormField label="Phone" name="contactPhone" type="tel" register={register} error={errors.contactPhone} required />
        </div>
      </div>

      {/* MDA Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">MDA (Optional)</label>
        <select {...register('mda')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]">
          <option value="">Select MDA</option>
          {mdasData?.data?.map((mda: any) => (
            <option key={mda._id} value={mda._id}>{mda.name.en}</option>
          ))}
        </select>
      </div>

      {/* Document Upload */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-3">Tender Documents</label>

        {uploadedDocuments.length > 0 && (
          <div className="mb-4 space-y-2">
            {uploadedDocuments.map((doc, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-300">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDocumentRemove(index)}
                  className="ml-3 text-red-600 hover:text-red-800"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="flex flex-col items-center justify-center">
              <FiUpload className="w-8 h-8 mb-1 text-gray-400" />
              <p className="text-xs text-gray-500">Click to upload documents</p>
            </div>
            <input type="file" accept=".pdf,.xls,.xlsx,.doc,.docx" onChange={handleDocumentUpload} className="hidden" disabled={isUploading} />
          </label>
        </div>

        {isUploading && (
          <div className="mt-3 flex items-center justify-center text-sm text-blue-600">
            <FiLoader className="animate-spin mr-2 w-5 h-5" />
            Uploading document...
          </div>
        )}
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status <span className="text-red-500">*</span>
        </label>
        <select {...register('status')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]">
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="awarded">Awarded</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t">
        <button type="button" onClick={onSuccess} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
        <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-6 py-2 bg-[#006838] text-white rounded-lg hover:bg-[#004d28] transition-colors disabled:opacity-50">
          {createMutation.isPending || updateMutation.isPending ? 'Saving...' : isEditing ? 'Update Tender' : 'Create Tender'}
        </button>
      </div>
    </form>
  );
}