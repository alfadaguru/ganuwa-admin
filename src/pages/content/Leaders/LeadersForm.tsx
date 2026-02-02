import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { FiUpload, FiTrash2, FiLoader } from 'react-icons/fi';
import { leadersAPI } from '../../../services/api';
import { uploadFile, deleteFile } from '../../../services/uploadService';
import FormField from '../../../components/common/FormField';

interface Leader {
  _id: string;
  name: string;
  title: { en: string };
  subtitle?: { en?: string };
  position: string;
  ministry?: string;
  department?: string;
  profileImage: { url: string; publicId?: string };
  bio?: { en?: string };
  email?: string;
  phoneNumber?: string;
  displayOrder: number;
  isActive: boolean;
  appointmentDate?: string;
}

const leaderSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional(),
  position: z.enum(['governor', 'deputy_governor', 'commissioner', 'permanent_secretary', 'director', 'special_adviser', 'other']),
  ministry: z.string().optional(),
  department: z.string().optional(),
  bio: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phoneNumber: z.string().optional(),
  displayOrder: z.number().min(0),
  isActive: z.boolean(),
  appointmentDate: z.string().optional(),
});

type LeaderFormData = z.infer<typeof leaderSchema>;

interface LeaderFormProps {
  leader?: Leader | null;
  onSuccess: () => void;
}

export default function LeaderForm({ leader, onSuccess }: LeaderFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!leader;

  // State for file upload and preview
  const [uploadedImage, setUploadedImage] = useState<{ url: string; key: string } | null>(
    leader?.profileImage?.url ? { url: leader.profileImage.url, key: leader.profileImage.publicId || '' } : null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(leader?.profileImage?.url || null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LeaderFormData>({
    resolver: zodResolver(leaderSchema),
    defaultValues: {
      name: leader?.name || '',
      title: leader?.title.en || '',
      subtitle: leader?.subtitle?.en || '',
      position: leader?.position as any || 'other',
      ministry: leader?.ministry || '',
      department: leader?.department || '',
      bio: leader?.bio?.en || '',
      email: leader?.email || '',
      phoneNumber: leader?.phoneNumber || '',
      displayOrder: leader?.displayOrder || 0,
      isActive: leader?.isActive ?? true,
      appointmentDate: leader?.appointmentDate ? leader.appointmentDate.split('T')[0] : '',
    },
  });

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    try {
      setIsUploading(true);

      // Delete old image if replacing
      if (uploadedImage?.key && uploadedImage.key !== leader?.profileImage?.publicId) {
        await deleteFile(uploadedImage.key);
      }

      // Upload new image
      const result = await uploadFile(file, 'leaders');
      setUploadedImage({ url: result.url, key: result.key });
      setImagePreview(result.url);

      toast.success('Image uploaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Image upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle image removal
  const handleImageRemove = async () => {
    if (uploadedImage?.key && uploadedImage.key !== leader?.profileImage?.publicId) {
      try {
        await deleteFile(uploadedImage.key);
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }
    setImagePreview(null);
    setUploadedImage(null);
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => leadersAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaders'] });
      toast.success('Leader created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create leader');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => leadersAPI.update(leader!._id, data),
    onSuccess: async () => {
      // Delete old image if it was replaced
      if (
        leader?.profileImage?.publicId &&
        uploadedImage?.key &&
        leader.profileImage.publicId !== uploadedImage.key
      ) {
        try {
          await deleteFile(leader.profileImage.publicId);
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['leaders'] });
      toast.success('Leader updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update leader');
    },
  });

  const onSubmit = (data: LeaderFormData) => {
    if (!uploadedImage && !leader?.profileImage) {
      toast.error('Please upload a profile image');
      return;
    }

    const payload = {
      name: data.name,
      title: { en: data.title },
      subtitle: data.subtitle ? { en: data.subtitle } : undefined,
      position: data.position,
      ministry: data.ministry || undefined,
      department: data.department || undefined,
      profileImage: {
        url: uploadedImage?.url || leader!.profileImage.url,
        publicId: uploadedImage?.key || leader!.profileImage.publicId || '',
      },
      bio: data.bio ? { en: data.bio } : undefined,
      email: data.email || undefined,
      phoneNumber: data.phoneNumber || undefined,
      displayOrder: Number(data.displayOrder),
      isActive: data.isActive,
      appointmentDate: data.appointmentDate || undefined,
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Profile Image Upload Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Profile Image <span className="text-red-500">*</span>
        </label>

        {/* Image Preview */}
        {imagePreview && (
          <div className="mb-4 relative">
            <img
              src={imagePreview}
              alt="Profile preview"
              className="w-full h-64 object-cover rounded-lg border border-gray-300"
            />
            <button
              type="button"
              onClick={handleImageRemove}
              className="absolute top-3 right-3 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors shadow-lg"
              disabled={isUploading}
            >
              <FiTrash2 className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* File Upload Input */}
        {!imagePreview && (
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
                onChange={handleImageUpload}
                className="hidden"
                disabled={isUploading}
              />
            </label>
          </div>
        )}

        {isUploading && (
          <div className="mt-3 flex items-center justify-center text-sm text-blue-600">
            <FiLoader className="animate-spin mr-2 w-5 h-5" />
            Uploading image...
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Name"
          name="name"
          register={register}
          error={errors.name}
          required
        />

        <FormField
          label="Title"
          name="title"
          register={register}
          error={errors.title}
          required
          placeholder="e.g., Governor of Kano State"
        />

        <FormField
          label="Subtitle"
          name="subtitle"
          register={register}
          error={errors.subtitle}
          placeholder="Optional additional title"
          className="md:col-span-2"
        />

        <div>
          <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
            Position <span className="text-red-500">*</span>
          </label>
          <select
            id="position"
            {...register('position')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]"
          >
            <option value="governor">Governor</option>
            <option value="deputy_governor">Deputy Governor</option>
            <option value="commissioner">Commissioner</option>
            <option value="permanent_secretary">Permanent Secretary</option>
            <option value="director">Director</option>
            <option value="special_adviser">Special Adviser</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="displayOrder" className="block text-sm font-medium text-gray-700 mb-1">
            Display Order <span className="text-red-500">*</span>
          </label>
          <input
            id="displayOrder"
            type="number"
            {...register('displayOrder', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]"
            placeholder="0"
          />
          {errors.displayOrder && (
            <p className="mt-1 text-sm text-red-600">{errors.displayOrder.message}</p>
          )}
        </div>

        <FormField
          label="Ministry"
          name="ministry"
          register={register}
          error={errors.ministry}
          placeholder="e.g., Ministry of Education"
        />

        <FormField
          label="Department"
          name="department"
          register={register}
          error={errors.department}
          placeholder="e.g., Planning Department"
        />

        <div className="md:col-span-2">
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
            Biography
          </label>
          <textarea
            id="bio"
            rows={4}
            {...register('bio')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]"
            placeholder="Brief biography..."
          />
        </div>

        <FormField
          label="Email"
          name="email"
          type="email"
          register={register}
          error={errors.email}
          placeholder="leader@kanostate.gov.ng"
        />

        <FormField
          label="Phone Number"
          name="phoneNumber"
          type="tel"
          register={register}
          error={errors.phoneNumber}
          placeholder="+234 XXX XXX XXXX"
        />

        <FormField
          label="Appointment Date"
          name="appointmentDate"
          type="date"
          register={register}
          error={errors.appointmentDate}
        />

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
          disabled={isSubmitting}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isUploading}
          className="px-6 py-2 bg-[#006838] text-white rounded-lg hover:bg-[#004d28] transition-colors disabled:opacity-50 flex items-center space-x-2"
        >
          {isSubmitting ? (
            <>
              <FiLoader className="animate-spin w-5 h-5" />
              <span>Saving...</span>
            </>
          ) : (
            <span>{isEditing ? 'Update Leader' : 'Create Leader'}</span>
          )}
        </button>
      </div>
    </form>
  );
}