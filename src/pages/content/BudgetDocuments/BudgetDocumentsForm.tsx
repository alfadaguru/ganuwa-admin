import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { FiUpload, FiTrash2, FiLoader } from 'react-icons/fi';
import { budgetDocumentsAPI } from '../../../services/api';
import { uploadFile, deleteFile } from '../../../services/uploadService';
import FormField from '../../../components/common/FormField';

interface BudgetDocument {
  _id: string;
  title: { en?: string; ha?: string; ar?: string };
  description: { en?: string; ha?: string; ar?: string };
  category?: string;
  tags?: string[];
  year?: number;
  fileUrl?: string;
  publishDate?: string;
  status: 'draft' | 'published' | 'archived';
  isFeatured: boolean;
}

const ALL_TAGS = [
  'Audit',
  'Budget',
  'Business',
  'Education',
  'Finance & Economy',
  'Health',
  'Infrastructure',
  'Judiciary',
  'Laws',
  'LGAs',
  'OCDS',
  'Procurement',
  'Public',
  'Reports',
  'Roads & Transport',
];

const budgetDocumentSchema = z.object({
  titleEn: z.string().min(1, 'Title (English) is required'),
  titleHa: z.string().optional(),
  titleAr: z.string().optional(),
  descriptionEn: z.string().min(1, 'Description (English) is required'),
  descriptionHa: z.string().optional(),
  descriptionAr: z.string().optional(),
  tags: z.array(z.string()).min(1, 'At least one tag is required'),
  year: z.number().min(2000).max(2100).optional(),
  publishDate: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']),
  isFeatured: z.boolean(),
});

type BudgetDocumentFormData = z.infer<typeof budgetDocumentSchema>;

interface BudgetDocumentsFormProps {
  document?: BudgetDocument | null;
  onSuccess: () => void;
}

export default function BudgetDocumentsForm({ document, onSuccess }: BudgetDocumentsFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!document;
  const [activeTab, setActiveTab] = useState<'en' | 'ha' | 'ar'>('en');

  const [uploadedFile, setUploadedFile] = useState<{ url: string; key: string } | null>(
    document?.fileUrl ? { url: document.fileUrl, key: document.fileUrl } : null
  );
  const [isUploading, setIsUploading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<BudgetDocumentFormData>({
    resolver: zodResolver(budgetDocumentSchema),
    defaultValues: {
      titleEn: document?.title?.en || '',
      titleHa: document?.title?.ha || '',
      titleAr: document?.title?.ar || '',
      descriptionEn: document?.description?.en || '',
      descriptionHa: document?.description?.ha || '',
      descriptionAr: document?.description?.ar || '',
      tags: document?.tags || [],
      year: document?.year || new Date().getFullYear(),
      publishDate: document?.publishDate || '',
      status: document?.status || 'draft',
      isFeatured: document?.isFeatured ?? false,
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
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

    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }

    try {
      setIsUploading(true);

      // Delete old file if replacing
      if (uploadedFile?.key && uploadedFile.key !== document?.fileUrl) {
        await deleteFile(uploadedFile.key);
      }

      // Upload new file
      const result = await uploadFile(file, 'budget-documents');
      setUploadedFile({ url: result.url, key: result.key });

      toast.success('File uploaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'File upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileRemove = async () => {
    if (uploadedFile?.key && uploadedFile.key !== document?.fileUrl) {
      try {
        await deleteFile(uploadedFile.key);
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }
    setUploadedFile(null);
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => budgetDocumentsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgetDocuments'] });
      toast.success('Budget document created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create budget document');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => budgetDocumentsAPI.update(document!._id, data),
    onSuccess: async () => {
      if (
        document?.fileUrl &&
        uploadedFile?.key &&
        document.fileUrl !== uploadedFile.key
      ) {
        try {
          await deleteFile(document.fileUrl);
        } catch (error) {
          console.error('Error deleting old file:', error);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['budgetDocuments'] });
      toast.success('Budget document updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update budget document');
    },
  });

  const onSubmit = (data: BudgetDocumentFormData) => {
    if (!uploadedFile?.url) {
      toast.error('Please upload a document file');
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
      tags: data.tags,
      year: data.year ? Number(data.year) : undefined,
      fileUrl: uploadedFile.url,
      publishDate: data.publishDate || undefined,
      status: data.status,
      isFeatured: data.isFeatured,
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

      {/* Title Fields */}
      <div className="space-y-4">
        {activeTab === 'en' && (
          <>
            <FormField
              label="Title (English)"
              name="titleEn"
              register={register}
              error={errors.titleEn}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (English) <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                {...register('descriptionEn')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]"
              />
              {errors.descriptionEn && (
                <p className="mt-1 text-sm text-red-600">{errors.descriptionEn.message}</p>
              )}
            </div>
          </>
        )}

        {activeTab === 'ha' && (
          <>
            <FormField
              label="Title (Hausa)"
              name="titleHa"
              register={register}
              error={errors.titleHa}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Hausa)
              </label>
              <textarea
                rows={4}
                {...register('descriptionHa')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]"
              />
            </div>
          </>
        )}

        {activeTab === 'ar' && (
          <>
            <FormField
              label="Title (Arabic)"
              name="titleAr"
              register={register}
              error={errors.titleAr}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Arabic)
              </label>
              <textarea
                rows={4}
                {...register('descriptionAr')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]"
                dir="rtl"
              />
            </div>
          </>
        )}
      </div>

      {/* Tags / Categories */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags / Categories <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-3">
          {ALL_TAGS.map((tag) => (
            <label key={tag} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                value={tag}
                {...register('tags')}
                className="w-4 h-4 text-[#006838] border-gray-300 rounded focus:ring-[#006838]"
              />
              <span className="text-sm text-gray-700">{tag}</span>
            </label>
          ))}
        </div>
        {errors.tags && (
          <p className="mt-1 text-sm text-red-600">{errors.tags.message}</p>
        )}
      </div>

      {/* Year */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Year"
          name="year"
          type="number"
          register={register}
          error={errors.year}
        />
      </div>

      {/* File Upload */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Document File <span className="text-red-500">*</span>
        </label>

        {uploadedFile && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-300">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">File uploaded</p>
                <p className="text-xs text-gray-500 break-all">{uploadedFile.url}</p>
              </div>
              <button
                type="button"
                onClick={handleFileRemove}
                className="ml-3 bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors"
                disabled={isUploading}
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {!uploadedFile && (
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FiUpload className="w-10 h-10 mb-2 text-gray-400" />
                <p className="mb-1 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">PDF, Excel, or Word (MAX. 50MB)</p>
              </div>
              <input
                type="file"
                accept=".pdf,.xls,.xlsx,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isUploading}
              />
            </label>
          </div>
        )}

        {isUploading && (
          <div className="mt-3 flex items-center justify-center text-sm text-blue-600">
            <FiLoader className="animate-spin mr-2 w-5 h-5" />
            Uploading file...
          </div>
        )}
      </div>

      {/* Other Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Publish Date"
          name="publishDate"
          type="date"
          register={register}
          error={errors.publishDate}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status <span className="text-red-500">*</span>
          </label>
          <select
            {...register('status')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          {...register('isFeatured')}
          className="w-4 h-4 text-[#006838] border-gray-300 rounded focus:ring-[#006838]"
        />
        <span className="text-sm font-medium text-gray-700">Featured Document</span>
      </label>

      <div className="flex justify-end space-x-3 pt-6 border-t">
        <button
          type="button"
          onClick={onSuccess}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={createMutation.isPending || updateMutation.isPending}
          className="px-6 py-2 bg-[#006838] text-white rounded-lg hover:bg-[#004d28] transition-colors disabled:opacity-50"
        >
          {createMutation.isPending || updateMutation.isPending
            ? 'Saving...'
            : isEditing
            ? 'Update Document'
            : 'Create Document'}
        </button>
      </div>
    </form>
  );
}