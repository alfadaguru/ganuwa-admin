import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { FiUpload, FiTrash2, FiLoader } from 'react-icons/fi';
import { mdasAPI } from '../../../services/api';
import { uploadFile, deleteFile } from '../../../services/uploadService';
import FormField from '../../../components/common/FormField';

interface MDA {
  _id: string;
  name: { en: string };
  acronym?: string;
  type: 'ministry' | 'department' | 'agency';
  description?: { en?: string };
  logo?: {
    url: string;
    publicId: string;
    alt: string;
  };
  head?: {name?: string; title?: string; email?: string; phone?: string };
  contactInfo?: { email?: string; phone?: string; address?: string; website?: string };
  displayOrder: number;
  isActive: boolean;
}

const mdaSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  acronym: z.string().optional(),
  type: z.enum(['ministry', 'department', 'agency']),
  description: z.string().optional(),
  logoAlt: z.string().optional(),
  headName: z.string().optional(),
  headTitle: z.string().optional(),
  headEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  headPhone: z.string().optional(),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  contactAddress: z.string().optional(),
  contactWebsite: z.string().url('Invalid URL').optional().or(z.literal('')),
  displayOrder: z.number().min(0),
  isActive: z.boolean(),
});

type MDAFormData = z.infer<typeof mdaSchema>;

interface MDAFormProps {
  mda?: MDA | null;
  onSuccess: () => void;
}

export default function MDAForm({ mda, onSuccess }: MDAFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!mda;

  const [uploadedLogo, setUploadedLogo] = useState<{ url: string; key: string } | null>(
    mda?.logo ? { url: mda.logo.url, key: mda.logo.publicId } : null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(mda?.logo?.url || null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MDAFormData>({
    resolver: zodResolver(mdaSchema),
    defaultValues: {
      name: mda?.name.en || '',
      acronym: mda?.acronym || '',
      type: mda?.type || 'ministry',
      description: mda?.description?.en || '',
      logoAlt: mda?.logo?.alt || '',
      headName: mda?.head?.name || '',
      headTitle: mda?.head?.title || '',
      headEmail: mda?.head?.email || '',
      headPhone: mda?.head?.phone || '',
      contactEmail: mda?.contactInfo?.email || '',
      contactPhone: mda?.contactInfo?.phone || '',
      contactAddress: mda?.contactInfo?.address || '',
      contactWebsite: mda?.contactInfo?.website || '',
      displayOrder: mda?.displayOrder || 0,
      isActive: mda?.isActive ?? true,
    },
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    try {
      setIsUploading(true);

      if (uploadedLogo?.key && uploadedLogo.key !== mda?.logo?.publicId) {
        await deleteFile(uploadedLogo.key);
      }

      const result = await uploadFile(file, 'mdas');
      setUploadedLogo({ url: result.url, key: result.key });
      setLogoPreview(result.url);
      toast.success('Logo uploaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Logo upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogoRemove = async () => {
    if (uploadedLogo?.key && uploadedLogo.key !== mda?.logo?.publicId) {
      try {
        await deleteFile(uploadedLogo.key);
      } catch (error) {
        console.error('Error deleting logo:', error);
      }
    }
    setLogoPreview(null);
    setUploadedLogo(null);
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => mdasAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mdas'] });
      toast.success('MDA created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create MDA');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => mdasAPI.update(mda!._id, data),
    onSuccess: async () => {
      if (mda?.logo?.publicId && uploadedLogo?.key &&
          mda.logo.publicId !== uploadedLogo.key) {
        try {
          await deleteFile(mda.logo.publicId);
        } catch (error) {
          console.error('Error deleting old logo:', error);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['mdas'] });
      toast.success('MDA updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update MDA');
    },
  });

  const onSubmit = (data: MDAFormData) => {
    const payload = {
      name: { en: data.name },
      acronym: data.acronym || undefined,
      type: data.type,
      description: data.description ? { en: data.description } : undefined,
      logo: uploadedLogo ? {
        url: uploadedLogo.url,
        publicId: uploadedLogo.key,
        alt: data.logoAlt || data.name,
      } : undefined,
      head: (data.headName || data.headTitle || data.headEmail || data.headPhone) ? {
        name: data.headName || undefined,
        title: data.headTitle || undefined,
        email: data.headEmail || undefined,
        phone: data.headPhone || undefined,
      } : undefined,
      contactInfo: (data.contactEmail || data.contactPhone || data.contactAddress || data.contactWebsite) ? {
        email: data.contactEmail || undefined,
        phone: data.contactPhone || undefined,
        address: data.contactAddress || undefined,
        website: data.contactWebsite || undefined,
      } : undefined,
      displayOrder: Number(data.displayOrder),
      isActive: data.isActive,
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Logo Upload Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          MDA Logo
        </label>

        {logoPreview && (
          <div className="mb-4 relative">
            <img
              src={logoPreview}
              alt="Logo preview"
              className="w-full h-64 object-cover rounded-lg border border-gray-300"
            />
            <button
              type="button"
              onClick={handleLogoRemove}
              className="absolute top-3 right-3 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors shadow-lg"
              disabled={isUploading}
            >
              <FiTrash2 className="w-5 h-5" />
            </button>
          </div>
        )}

        {!logoPreview && (
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FiUpload className="w-12 h-12 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">PNG, JPG, WEBP (MAX. 10MB)</p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
                disabled={isUploading}
              />
            </label>
          </div>
        )}

        {isUploading && (
          <div className="mt-3 flex items-center justify-center text-sm text-blue-600">
            <FiLoader className="animate-spin mr-2 w-5 h-5" />
            Uploading logo...
          </div>
        )}

        <div className="mt-4">
          <label htmlFor="logoAlt" className="block text-sm font-medium text-gray-700 mb-1">
            Logo Alt Text
          </label>
          <input
            id="logoAlt"
            type="text"
            {...register('logoAlt')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]"
            placeholder="Descriptive text for accessibility"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Name"
          name="name"
          register={register}
          error={errors.name}
          required
          placeholder="e.g., Ministry of Education"
        />

        <FormField
          label="Acronym"
          name="acronym"
          register={register}
          error={errors.acronym}
          placeholder="e.g., MOE"
        />

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Type <span className="text-red-500">*</span>
          </label>
          <select
            id="type"
            {...register('type')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]"
          >
            <option value="ministry">Ministry</option>
            <option value="department">Department</option>
            <option value="agency">Agency</option>
          </select>
        </div>

        <FormField
          label="Display Order"
          name="displayOrder"
          type="number"
          register={register}
          error={errors.displayOrder}
          required
          placeholder="0"
        />

        <div className="md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            {...register('description')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]"
            placeholder="Brief description..."
          />
        </div>

        <div className="md:col-span-2 pt-4 border-t">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Head of MDA (Optional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Name"
              name="headName"
              register={register}
              error={errors.headName}
              placeholder="Full name"
            />

            <FormField
              label="Title"
              name="headTitle"
              register={register}
              error={errors.headTitle}
              placeholder="e.g., Commissioner"
            />

            <FormField
              label="Email"
              name="headEmail"
              type="email"
              register={register}
              error={errors.headEmail}
              placeholder="email@kanostate.gov.ng"
            />

            <FormField
              label="Phone"
              name="headPhone"
              type="tel"
              register={register}
              error={errors.headPhone}
              placeholder="+234 XXX XXX XXXX"
            />
          </div>
        </div>

        <div className="md:col-span-2 pt-4 border-t">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information (Optional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Email"
              name="contactEmail"
              type="email"
              register={register}
              error={errors.contactEmail}
              placeholder="contact@kanostate.gov.ng"
            />

            <FormField
              label="Phone"
              name="contactPhone"
              type="tel"
              register={register}
              error={errors.contactPhone}
              placeholder="+234 XXX XXX XXXX"
            />

            <FormField
              label="Address"
              name="contactAddress"
              register={register}
              error={errors.contactAddress}
              placeholder="Physical address"
            />

            <FormField
              label="Website"
              name="contactWebsite"
              type="url"
              register={register}
              error={errors.contactWebsite}
              placeholder="https://example.com"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register('isActive')}
              className="w-4 h-4 text-[#006838] border-gray-300 rounded focus:ring-[#006838]"
            />
            <span className="text-sm font-medium text-gray-700">Active</span>
          </label>
        </div>
      </div>

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
          disabled={createMutation.isPending || updateMutation.isPending || isUploading}
          className="px-6 py-2 bg-[#006838] text-white rounded-lg hover:bg-[#004d28] transition-colors disabled:opacity-50"
        >
          {createMutation.isPending || updateMutation.isPending
            ? 'Saving...'
            : isEditing
            ? 'Update MDA'
            : 'Create MDA'}
        </button>
      </div>
    </form>
  );
}
