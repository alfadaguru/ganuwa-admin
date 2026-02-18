import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { servicesAPI } from '../../../services/api';
import FormField from '../../../components/common/FormField';

interface Service {
  _id: string;
  name: { en: string; ha?: string; ar?: string };
  description: { en: string; ha?: string; ar?: string };
  icon?: string;
  category: 'online_application' | 'license' | 'permit' | 'tax' | 'land' | 'health' | 'education' | 'business' | 'other';
  applicationUrl?: string;
  processingTime?: string;
  fee?: string;
  contactPerson?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  status: 'active' | 'inactive' | 'coming_soon';
  displayOrder: number;
}

const serviceSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  description: z.string().min(1, 'Description is required'),
  icon: z.string().optional(),
  category: z.enum(['online_application', 'license', 'permit', 'tax', 'land', 'health', 'education', 'business', 'other']),
  applicationUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  processingTime: z.string().optional(),
  fee: z.string().optional(),
  contactPersonName: z.string().optional(),
  contactPersonEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  contactPersonPhone: z.string().optional(),
  status: z.enum(['active', 'inactive', 'coming_soon']),
  displayOrder: z.number().min(0),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

interface ServiceFormProps {
  service?: Service | null;
  onSuccess: () => void;
}

export default function ServiceForm({ service, onSuccess }: ServiceFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!service;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: service?.name.en || '',
      description: service?.description.en || '',
      icon: service?.icon || '',
      category: service?.category || 'other',
      applicationUrl: service?.applicationUrl || '',
      processingTime: service?.processingTime || '',
      fee: service?.fee || '',
      contactPersonName: service?.contactPerson?.name || '',
      contactPersonEmail: service?.contactPerson?.email || '',
      contactPersonPhone: service?.contactPerson?.phone || '',
      status: service?.status || 'active',
      displayOrder: service?.displayOrder || 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => servicesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Service created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create service');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => servicesAPI.update(service!._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Service updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update service');
    },
  });

  const onSubmit = (data: ServiceFormData) => {
    const payload = {
      name: { en: data.name },
      description: { en: data.description },
      icon: data.icon || undefined,
      category: data.category,
      applicationUrl: data.applicationUrl || undefined,
      processingTime: data.processingTime || undefined,
      fee: data.fee || undefined,
      contactPerson: (data.contactPersonName || data.contactPersonEmail || data.contactPersonPhone) ? {
        name: data.contactPersonName || undefined,
        email: data.contactPersonEmail || undefined,
        phone: data.contactPersonPhone || undefined,
      } : undefined,
      status: data.status,
      displayOrder: Number(data.displayOrder),
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
          label="Service Name"
          name="name"
          register={register}
          error={errors.name}
          required
          className="md:col-span-2"
          placeholder="e.g., Birth Certificate Application"
        />

        <div className="md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            rows={4}
            {...register('description')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]"
            placeholder="Detailed description of the service..."
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
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
            <option value="online_application">Online Application</option>
            <option value="license">License</option>
            <option value="permit">Permit</option>
            <option value="tax">Tax</option>
            <option value="land">Land</option>
            <option value="health">Health</option>
            <option value="education">Education</option>
            <option value="business">Business</option>
            <option value="other">Other</option>
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
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="coming_soon">Coming Soon</option>
          </select>
        </div>

        <FormField
          label="Icon (Font Awesome class)"
          name="icon"
          register={register}
          error={errors.icon}
          placeholder="e.g., fa-file-alt"
        />

        <FormField
          label="Display Order"
          name="displayOrder"
          type="number"
          register={register}
          error={errors.displayOrder}
          required
          placeholder="0"
        />

        <FormField
          label="Application URL"
          name="applicationUrl"
          type="url"
          register={register}
          error={errors.applicationUrl}
          className="md:col-span-2"
          placeholder="https://example.com/apply"
        />

        <FormField
          label="Processing Time"
          name="processingTime"
          register={register}
          error={errors.processingTime}
          placeholder="e.g., 5-7 business days"
        />

        <FormField
          label="Fee"
          name="fee"
          register={register}
          error={errors.fee}
          placeholder="e.g., ₦5,000 or Free"
        />

        <div className="md:col-span-2 pt-4 border-t">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Person (Optional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              label="Name"
              name="contactPersonName"
              register={register}
              error={errors.contactPersonName}
              placeholder="Contact person name"
            />

            <FormField
              label="Email"
              name="contactPersonEmail"
              type="email"
              register={register}
              error={errors.contactPersonEmail}
              placeholder="contact@kanostate.gov.ng"
            />

            <FormField
              label="Phone"
              name="contactPersonPhone"
              type="tel"
              register={register}
              error={errors.contactPersonPhone}
              placeholder="+234 XXX XXX XXXX"
            />
          </div>
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
          disabled={createMutation.isPending || updateMutation.isPending}
          className="px-6 py-2 bg-[#006838] text-white rounded-lg hover:bg-[#004d28] transition-colors disabled:opacity-50"
        >
          {createMutation.isPending || updateMutation.isPending
            ? 'Saving...'
            : isEditing
            ? 'Update Service'
            : 'Create Service'}
        </button>
      </div>
    </form>
  );
}