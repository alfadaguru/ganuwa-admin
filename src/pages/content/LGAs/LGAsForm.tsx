import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { lgasAPI } from '../../../services/api';
import FormField from '../../../components/common/FormField';

interface LGA {
  _id: string;
  name: string;
  capital?: string;
  population?: number;
  area?: number;
  description?: { en?: string; ha?: string; ar?: string };
  coordinates?: { latitude?: number; longitude?: number };
  chairman?: { name?: string; image?: string; email?: string; phone?: string };
  contactInfo?: { email?: string; phone?: string; address?: string };
  displayOrder: number;
}

const lgaSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  capital: z.string().optional(),
  population: z.number().min(0).optional(),
  area: z.number().min(0).optional(),
  descriptionEn: z.string().optional(),
  descriptionHa: z.string().optional(),
  descriptionAr: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  chairmanName: z.string().optional(),
  chairmanEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  chairmanPhone: z.string().optional(),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  contactAddress: z.string().optional(),
  displayOrder: z.number().min(0),
});

type LGAFormData = z.infer<typeof lgaSchema>;

interface LGAFormProps {
  lga?: LGA | null;
  onSuccess: () => void;
}

export default function LGAsForm({ lga, onSuccess }: LGAFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!lga;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LGAFormData>({
    resolver: zodResolver(lgaSchema),
    defaultValues: {
      name: lga?.name || '',
      capital: lga?.capital || '',
      population: lga?.population || undefined,
      area: lga?.area || undefined,
      descriptionEn: lga?.description?.en || '',
      descriptionHa: lga?.description?.ha || '',
      descriptionAr: lga?.description?.ar || '',
      latitude: lga?.coordinates?.latitude || undefined,
      longitude: lga?.coordinates?.longitude || undefined,
      chairmanName: lga?.chairman?.name || '',
      chairmanEmail: lga?.chairman?.email || '',
      chairmanPhone: lga?.chairman?.phone || '',
      contactEmail: lga?.contactInfo?.email || '',
      contactPhone: lga?.contactInfo?.phone || '',
      contactAddress: lga?.contactInfo?.address || '',
      displayOrder: lga?.displayOrder || 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => lgasAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lgas'] });
      toast.success('LGA created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create LGA');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => lgasAPI.update(lga!._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lgas'] });
      toast.success('LGA updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update LGA');
    },
  });

  const onSubmit = (data: LGAFormData) => {
    const payload = {
      name: data.name,
      capital: data.capital || undefined,
      population: data.population || undefined,
      area: data.area || undefined,
      description: (data.descriptionEn || data.descriptionHa || data.descriptionAr) ? {
        en: data.descriptionEn || undefined,
        ha: data.descriptionHa || undefined,
        ar: data.descriptionAr || undefined,
      } : undefined,
      coordinates: (data.latitude || data.longitude) ? {
        latitude: data.latitude || undefined,
        longitude: data.longitude || undefined,
      } : undefined,
      chairman: (data.chairmanName || data.chairmanEmail || data.chairmanPhone) ? {
        name: data.chairmanName || undefined,
        email: data.chairmanEmail || undefined,
        phone: data.chairmanPhone || undefined,
      } : undefined,
      contactInfo: (data.contactEmail || data.contactPhone || data.contactAddress) ? {
        email: data.contactEmail || undefined,
        phone: data.contactPhone || undefined,
        address: data.contactAddress || undefined,
      } : undefined,
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
          label="Name"
          name="name"
          register={register}
          error={errors.name}
          required
          placeholder="e.g., Kano Municipal"
        />

        <FormField
          label="Capital"
          name="capital"
          register={register}
          error={errors.capital}
          placeholder="e.g., Kano"
        />

        <FormField
          label="Population"
          name="population"
          type="number"
          register={register}
          error={errors.population}
          placeholder="0"
        />

        <FormField
          label="Area (sq km)"
          name="area"
          type="number"
          register={register}
          error={errors.area}
          placeholder="0"
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
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Description (Multilingual)</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="descriptionEn" className="block text-sm font-medium text-gray-700 mb-1">
              English
            </label>
            <textarea
              id="descriptionEn"
              rows={3}
              {...register('descriptionEn')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]"
              placeholder="Description in English"
            />
          </div>

          <div>
            <label htmlFor="descriptionHa" className="block text-sm font-medium text-gray-700 mb-1">
              Hausa
            </label>
            <textarea
              id="descriptionHa"
              rows={3}
              {...register('descriptionHa')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]"
              placeholder="Description in Hausa"
            />
          </div>

          <div>
            <label htmlFor="descriptionAr" className="block text-sm font-medium text-gray-700 mb-1">
              Arabic
            </label>
            <textarea
              id="descriptionAr"
              rows={3}
              {...register('descriptionAr')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]"
              placeholder="Description in Arabic"
            />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Coordinates (Optional)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Latitude"
            name="latitude"
            type="number"
            step="any"
            register={register}
            error={errors.latitude}
            placeholder="e.g., 12.0022"
          />

          <FormField
            label="Longitude"
            name="longitude"
            type="number"
            step="any"
            register={register}
            error={errors.longitude}
            placeholder="e.g., 8.5919"
          />
        </div>
      </div>

      <div className="pt-4 border-t">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Chairman Information (Optional)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Name"
            name="chairmanName"
            register={register}
            error={errors.chairmanName}
            placeholder="Full name"
          />

          <FormField
            label="Email"
            name="chairmanEmail"
            type="email"
            register={register}
            error={errors.chairmanEmail}
            placeholder="email@kanostate.gov.ng"
          />

          <FormField
            label="Phone"
            name="chairmanPhone"
            type="tel"
            register={register}
            error={errors.chairmanPhone}
            placeholder="+234 XXX XXX XXXX"
          />
        </div>
      </div>

      <div className="pt-4 border-t">
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

          <div className="md:col-span-2">
            <FormField
              label="Address"
              name="contactAddress"
              register={register}
              error={errors.contactAddress}
              placeholder="Physical address"
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
            ? 'Update LGA'
            : 'Create LGA'}
        </button>
      </div>
    </form>
  );
}
