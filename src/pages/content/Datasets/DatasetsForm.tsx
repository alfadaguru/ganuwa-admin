import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { FiX, FiPlus } from 'react-icons/fi';
import { datasetsAPI, mdasAPI } from '../../../services/api';
import FormField from '../../../components/common/FormField';

interface Dataset {
  _id: string;
  title: { en?: string; ha?: string; ar?: string };
  description: { en?: string; ha?: string; ar?: string };
  category: string;
  formats: Array<{ type: string; url: string; size?: number }>;
  tags: string[];
  license: string;
  updateFrequency: string;
  contactPerson: { name: string; email: string };
  mda?: string;
  apiEndpoint?: string;
  status: 'draft' | 'published' | 'archived';
}

const datasetSchema = z.object({
  titleEn: z.string().min(1, 'Title (English) is required'),
  titleHa: z.string().optional(),
  titleAr: z.string().optional(),
  descriptionEn: z.string().min(1, 'Description (English) is required'),
  descriptionHa: z.string().optional(),
  descriptionAr: z.string().optional(),
  category: z.enum(['demographics', 'economy', 'health', 'education', 'infrastructure', 'environment', 'governance', 'agriculture']),
  tags: z.string(),
  license: z.string().min(1, 'License is required'),
  updateFrequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'annually', 'as-needed']),
  contactName: z.string().min(1, 'Contact name is required'),
  contactEmail: z.string().email('Invalid email address'),
  mda: z.string().optional(),
  apiEndpoint: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  status: z.enum(['draft', 'published', 'archived']),
});

type DatasetFormData = z.infer<typeof datasetSchema>;

interface DatasetsFormProps {
  dataset?: Dataset | null;
  onSuccess: () => void;
}

interface DataFormat {
  type: string;
  url: string;
  size?: number;
}

export default function DatasetsForm({ dataset, onSuccess }: DatasetsFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!dataset;
  const [activeTab, setActiveTab] = useState<'en' | 'ha' | 'ar'>('en');

  const [formats, setFormats] = useState<DataFormat[]>(dataset?.formats || []);
  const [newFormat, setNewFormat] = useState({ type: 'csv', url: '', size: 0 });

  const { data: mdasData } = useQuery({
    queryKey: ['mdas'],
    queryFn: async () => {
      const response = await mdasAPI.getAll({ limit: 100 });
      return response.data;
    },
  });

  const { register, handleSubmit, formState: { errors } } = useForm<DatasetFormData>({
    resolver: zodResolver(datasetSchema),
    defaultValues: {
      titleEn: dataset?.title?.en || '',
      titleHa: dataset?.title?.ha || '',
      titleAr: dataset?.title?.ar || '',
      descriptionEn: dataset?.description?.en || '',
      descriptionHa: dataset?.description?.ha || '',
      descriptionAr: dataset?.description?.ar || '',
      category: dataset?.category as any || 'demographics',
      tags: dataset?.tags?.join(', ') || '',
      license: dataset?.license || 'CC BY 4.0',
      updateFrequency: dataset?.updateFrequency as any || 'monthly',
      contactName: dataset?.contactPerson?.name || '',
      contactEmail: dataset?.contactPerson?.email || '',
      mda: dataset?.mda || '',
      apiEndpoint: dataset?.apiEndpoint || '',
      status: dataset?.status || 'draft',
    },
  });

  const addFormat = () => {
    if (!newFormat.url) {
      toast.error('Please enter a URL for the format');
      return;
    }
    setFormats([...formats, { ...newFormat }]);
    setNewFormat({ type: 'csv', url: '', size: 0 });
  };

  const removeFormat = (index: number) => {
    setFormats(formats.filter((_, i) => i !== index));
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => datasetsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
      toast.success('Dataset created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create dataset');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => datasetsAPI.update(dataset!._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
      toast.success('Dataset updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update dataset');
    },
  });

  const onSubmit = (data: DatasetFormData) => {
    if (formats.length === 0) {
      toast.error('Please add at least one data format');
      return;
    }

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
      formats: formats.map(f => ({
        type: f.type,
        url: f.url,
        size: f.size || undefined,
      })),
      tags: data.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      license: data.license,
      updateFrequency: data.updateFrequency,
      contactPerson: {
        name: data.contactName,
        email: data.contactEmail,
      },
      mda: data.mda || undefined,
      apiEndpoint: data.apiEndpoint || undefined,
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
          </>
        )}

        {activeTab === 'ha' && (
          <>
            <FormField label="Title (Hausa)" name="titleHa" register={register} error={errors.titleHa} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (Hausa)</label>
              <textarea rows={4} {...register('descriptionHa')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]" />
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
          </>
        )}
      </div>

      {/* Category and Tags */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select {...register('category')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]">
            <option value="demographics">Demographics</option>
            <option value="economy">Economy</option>
            <option value="health">Health</option>
            <option value="education">Education</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="environment">Environment</option>
            <option value="governance">Governance</option>
            <option value="agriculture">Agriculture</option>
          </select>
        </div>

        <FormField
          label="Tags (comma separated)"
          name="tags"
          register={register}
          error={errors.tags}
          placeholder="population, census, statistics"
        />
      </div>

      {/* Data Formats */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Data Formats <span className="text-red-500">*</span>
        </label>

        {formats.length > 0 && (
          <div className="mb-4 space-y-2">
            {formats.map((format, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-300">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 uppercase">{format.type}</p>
                  <p className="text-xs text-gray-500 break-all">{format.url}</p>
                  {format.size && format.size > 0 && (
                    <p className="text-xs text-gray-500">Size: {(format.size / 1024).toFixed(2)} KB</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeFormat(index)}
                  className="ml-3 text-red-600 hover:text-red-800"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-3">
            <select
              value={newFormat.type}
              onChange={(e) => setNewFormat({ ...newFormat, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]"
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="xml">XML</option>
              <option value="xlsx">XLSX</option>
              <option value="pdf">PDF</option>
              <option value="api">API</option>
            </select>
          </div>
          <div className="col-span-6">
            <input
              type="url"
              placeholder="URL"
              value={newFormat.url}
              onChange={(e) => setNewFormat({ ...newFormat, url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]"
            />
          </div>
          <div className="col-span-2">
            <input
              type="number"
              placeholder="Size (bytes)"
              value={newFormat.size || ''}
              onChange={(e) => setNewFormat({ ...newFormat, size: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]"
            />
          </div>
          <div className="col-span-1">
            <button
              type="button"
              onClick={addFormat}
              className="w-full px-3 py-2 bg-[#006838] text-white rounded-lg hover:bg-[#004d28] transition-colors"
            >
              <FiPlus className="w-5 h-5 mx-auto" />
            </button>
          </div>
        </div>
      </div>

      {/* License and Update Frequency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="License" name="license" register={register} error={errors.license} required placeholder="e.g., CC BY 4.0, Open Data Commons" />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Update Frequency <span className="text-red-500">*</span>
          </label>
          <select {...register('updateFrequency')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annually">Annually</option>
            <option value="as-needed">As Needed</option>
          </select>
        </div>
      </div>

      {/* Contact Person */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Person</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Name" name="contactName" register={register} error={errors.contactName} required />
          <FormField label="Email" name="contactEmail" type="email" register={register} error={errors.contactEmail} required />
        </div>
      </div>

      {/* MDA and API Endpoint */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">MDA (Optional)</label>
          <select {...register('mda')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]">
            <option value="">Select MDA</option>
            {mdasData?.data?.map((mda: any) => (
              <option key={mda._id} value={mda._id}>{mda.name.en}</option>
            ))}
          </select>
        </div>

        <FormField label="API Endpoint (Optional)" name="apiEndpoint" type="url" register={register} error={errors.apiEndpoint} />
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status <span className="text-red-500">*</span>
        </label>
        <select {...register('status')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]">
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t">
        <button type="button" onClick={onSuccess} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
        <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-6 py-2 bg-[#006838] text-white rounded-lg hover:bg-[#004d28] transition-colors disabled:opacity-50">
          {createMutation.isPending || updateMutation.isPending ? 'Saving...' : isEditing ? 'Update Dataset' : 'Create Dataset'}
        </button>
      </div>
    </form>
  );
}