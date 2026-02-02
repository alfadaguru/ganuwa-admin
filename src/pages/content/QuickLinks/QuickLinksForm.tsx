import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { quickLinksAPI } from '../../../services/api';
import FormField from '../../../components/common/FormField';

interface QuickLink {
  _id: string;
  title: { en?: string; ha?: string; ar?: string };
  description?: { en?: string; ha?: string; ar?: string };
  url: string;
  category?: string;
  openInNewTab: boolean;
  displayOrder: number;
  isActive: boolean;
}

const quickLinkSchema = z.object({
  titleEn: z.string().min(1, 'English title is required'),
  titleHa: z.string().optional(),
  titleAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  descriptionHa: z.string().optional(),
  descriptionAr: z.string().optional(),
  url: z.string().url('Invalid URL').min(1, 'URL is required'),
  category: z.enum(['service', 'information', 'emergency', 'resource', 'external']).optional(),
  openInNewTab: z.boolean(),
  displayOrder: z.number().min(0),
  isActive: z.boolean(),
});

type QuickLinkFormData = z.infer<typeof quickLinkSchema>;

interface QuickLinksFormProps {
  quickLink?: QuickLink | null;
  onSuccess: () => void;
}

export default function QuickLinksForm({ quickLink, onSuccess }: QuickLinksFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!quickLink;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuickLinkFormData>({
    resolver: zodResolver(quickLinkSchema),
    defaultValues: {
      titleEn: quickLink?.title?.en || '',
      titleHa: quickLink?.title?.ha || '',
      titleAr: quickLink?.title?.ar || '',
      descriptionEn: quickLink?.description?.en || '',
      descriptionHa: quickLink?.description?.ha || '',
      descriptionAr: quickLink?.description?.ar || '',
      url: quickLink?.url || '',
      category: quickLink?.category as any || 'service',
      openInNewTab: quickLink?.openInNewTab ?? false,
      displayOrder: quickLink?.displayOrder || 0,
      isActive: quickLink?.isActive ?? true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => quickLinksAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-links'] });
      toast.success('Quick link created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create quick link');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => quickLinksAPI.update(quickLink!._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-links'] });
      toast.success('Quick link updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update quick link');
    },
  });

  const onSubmit = (data: QuickLinkFormData) => {
    const payload = {
      title: {
        en: data.titleEn,
        ha: data.titleHa || undefined,
        ar: data.titleAr || undefined,
      },
      description: (data.descriptionEn || data.descriptionHa || data.descriptionAr) ? {
        en: data.descriptionEn || undefined,
        ha: data.descriptionHa || undefined,
        ar: data.descriptionAr || undefined,
      } : undefined,
      url: data.url,
      category: data.category || undefined,
      openInNewTab: data.openInNewTab,
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
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Title (Multilingual)</h3>
        <FormField
          label="English"
          name="titleEn"
          register={register}
          error={errors.titleEn}
          required
          placeholder="Title in English"
        />
        <FormField
          label="Hausa"
          name="titleHa"
          register={register}
          error={errors.titleHa}
          placeholder="Title in Hausa"
        />
        <FormField
          label="Arabic"
          name="titleAr"
          register={register}
          error={errors.titleAr}
          placeholder="Title in Arabic"
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Description (Optional)</h3>
        <FormField
          label="English"
          name="descriptionEn"
          register={register}
          error={errors.descriptionEn}
          placeholder="Description in English"
        />
        <FormField
          label="Hausa"
          name="descriptionHa"
          register={register}
          error={errors.descriptionHa}
          placeholder="Description in Hausa"
        />
        <FormField
          label="Arabic"
          name="descriptionAr"
          register={register}
          error={errors.descriptionAr}
          placeholder="Description in Arabic"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <FormField
            label="URL"
            name="url"
            type="url"
            register={register}
            error={errors.url}
            required
            placeholder="https://example.com"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="category"
            {...register('category')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]"
          >
            <option value="service">Service</option>
            <option value="information">Information</option>
            <option value="emergency">Emergency</option>
            <option value="resource">Resource</option>
            <option value="external">External</option>
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
      </div>

      <div className="space-y-3">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            {...register('openInNewTab')}
            className="w-4 h-4 text-[#006838] border-gray-300 rounded focus:ring-[#006838]"
          />
          <span className="text-sm font-medium text-gray-700">Open in new tab</span>
        </label>

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            {...register('isActive')}
            className="w-4 h-4 text-[#006838] border-gray-300 rounded focus:ring-[#006838]"
          />
          <span className="text-sm font-medium text-gray-700">Active</span>
        </label>
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
          disabled={createMutation.isPending || updateMutation.isPending}
          className="px-6 py-2 bg-[#006838] text-white rounded-lg hover:bg-[#004d28] transition-colors disabled:opacity-50"
        >
          {createMutation.isPending || updateMutation.isPending
            ? 'Saving...'
            : isEditing
            ? 'Update Quick Link'
            : 'Create Quick Link'}
        </button>
      </div>
    </form>
  );
}
