import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { pressReleasesAPI } from '../../../services/api';
import FormField from '../../../components/common/FormField';

interface PressRelease {
  _id: string;
  title: {
    en: string;
  };
  content: {
    en: string;
  };
  category: string;
  releaseDate: string;
  contactPerson?: {
    name?: string;
    title?: string;
    email?: string;
    phone?: string;
  };
  status: string;
}

const pressReleaseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  category: z.enum(['government', 'development', 'policy', 'statement', 'clarification']),
  releaseDate: z.string().min(1, 'Release date is required'),
  contactName: z.string().optional(),
  contactTitle: z.string().optional(),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']),
});

type PressReleaseFormData = z.infer<typeof pressReleaseSchema>;

interface PressReleaseFormProps {
  pressRelease?: PressRelease | null;
  onSuccess: () => void;
}

export default function PressReleaseForm({ pressRelease, onSuccess }: PressReleaseFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!pressRelease;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PressReleaseFormData>({
    resolver: zodResolver(pressReleaseSchema),
    defaultValues: {
      title: pressRelease?.title.en || '',
      content: pressRelease?.content.en || '',
      category: pressRelease?.category || 'government',
      releaseDate: pressRelease?.releaseDate ? pressRelease.releaseDate.split('T')[0] : '',
      contactName: pressRelease?.contactPerson?.name || '',
      contactTitle: pressRelease?.contactPerson?.title || '',
      contactEmail: pressRelease?.contactPerson?.email || '',
      contactPhone: pressRelease?.contactPerson?.phone || '',
      status: pressRelease?.status || 'draft',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => pressReleasesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['press-releases'] });
      toast.success('Press release created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create press release');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => pressReleasesAPI.update(pressRelease!._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['press-releases'] });
      toast.success('Press release updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update press release');
    },
  });

  const onSubmit = (data: PressReleaseFormData) => {
    const payload = {
      title: { en: data.title },
      content: { en: data.content },
      category: data.category,
      releaseDate: data.releaseDate,
      contactPerson: {
        name: data.contactName || undefined,
        title: data.contactTitle || undefined,
        email: data.contactEmail || undefined,
        phone: data.contactPhone || undefined,
      },
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Title"
          name="title"
          register={register}
          error={errors.title}
          required
          className="md:col-span-2"
        />

        <div className="md:col-span-2">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Content <span className="text-red-500">*</span>
          </label>
          <textarea
            id="content"
            rows={10}
            {...register('content')}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838] ${
              errors.content ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Full press release content..."
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            {...register('category')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]"
          >
            <option value="government">Government</option>
            <option value="development">Development</option>
            <option value="policy">Policy</option>
            <option value="statement">Statement</option>
            <option value="clarification">Clarification</option>
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status <span className="text-red-500">*</span>
          </label>
          <select
            id="status"
            {...register('status')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <FormField
          label="Release Date"
          name="releaseDate"
          type="date"
          register={register}
          error={errors.releaseDate}
          required
          className="md:col-span-2"
        />

        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Person</h3>
        </div>

        <FormField
          label="Name"
          name="contactName"
          register={register}
          error={errors.contactName}
          placeholder="Contact person name"
        />

        <FormField
          label="Title"
          name="contactTitle"
          register={register}
          error={errors.contactTitle}
          placeholder="e.g., Press Secretary"
        />

        <FormField
          label="Email"
          name="contactEmail"
          type="email"
          register={register}
          error={errors.contactEmail}
          placeholder="contact@example.com"
        />

        <FormField
          label="Phone"
          name="contactPhone"
          type="tel"
          register={register}
          error={errors.contactPhone}
          placeholder="+234 XXX XXX XXXX"
        />
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
            ? 'Update Press Release'
            : 'Create Press Release'}
        </button>
      </div>
    </form>
  );
}
