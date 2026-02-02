import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { FiUpload, FiTrash2, FiLoader } from 'react-icons/fi';
import { projectsAPI } from '../../../services/api';
import { uploadFile, deleteFile } from '../../../services/uploadService';
import FormField from '../../../components/common/FormField';

interface Project {
  _id: string;
  name: { en: string };
  description: { en: string };
  featuredImage?: { url?: string; publicId?: string };
  category: string;
  status: 'planning' | 'ongoing' | 'completed' | 'suspended';
  budget?: number;
  currency: string;
  contractor?: string;
  location?: { lga?: string; address?: string };
  startDate?: string;
  expectedCompletionDate?: string;
  completionDate?: string;
  progress: number;
  ministry?: string;
  featured: boolean;
}

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.enum(['infrastructure', 'health', 'education', 'agriculture', 'water', 'energy', 'housing', 'transportation']),
  status: z.enum(['planning', 'ongoing', 'completed', 'suspended']),
  budget: z.number().min(0).optional().or(z.nan()),
  contractor: z.string().optional(),
  lga: z.string().optional(),
  address: z.string().optional(),
  startDate: z.string().optional(),
  expectedCompletionDate: z.string().optional(),
  completionDate: z.string().optional(),
  progress: z.number().min(0).max(100),
  ministry: z.string().optional(),
  featured: z.boolean(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  project?: Project | null;
  onSuccess: () => void;
}

export default function ProjectForm({ project, onSuccess }: ProjectFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!project;

  // State for file upload and preview
  const [uploadedImage, setUploadedImage] = useState<{ url: string; key: string } | null>(
    project?.featuredImage?.url ? { url: project.featuredImage.url, key: project.featuredImage.publicId || '' } : null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(project?.featuredImage?.url || null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: project?.name.en || '',
      description: project?.description.en || '',
      category: project?.category as any || 'infrastructure',
      status: project?.status || 'planning',
      budget: project?.budget || undefined,
      contractor: project?.contractor || '',
      lga: project?.location?.lga || '',
      address: project?.location?.address || '',
      startDate: project?.startDate ? project.startDate.split('T')[0] : '',
      expectedCompletionDate: project?.expectedCompletionDate ? project.expectedCompletionDate.split('T')[0] : '',
      completionDate: project?.completionDate ? project.completionDate.split('T')[0] : '',
      progress: project?.progress || 0,
      ministry: project?.ministry || '',
      featured: project?.featured ?? false,
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
      if (uploadedImage?.key && uploadedImage.key !== project?.featuredImage?.publicId) {
        await deleteFile(uploadedImage.key);
      }

      // Upload new image
      const result = await uploadFile(file, 'projects');
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
    if (uploadedImage?.key && uploadedImage.key !== project?.featuredImage?.publicId) {
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
    mutationFn: (data: any) => projectsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create project');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => projectsAPI.update(project!._id, data),
    onSuccess: async () => {
      // Delete old image if it was replaced
      if (
        project?.featuredImage?.publicId &&
        uploadedImage?.key &&
        project.featuredImage.publicId !== uploadedImage.key
      ) {
        try {
          await deleteFile(project.featuredImage.publicId);
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update project');
    },
  });

  const onSubmit = (data: ProjectFormData) => {
    const payload: any = {
      name: { en: data.name },
      description: { en: data.description },
      featuredImage: uploadedImage ? { url: uploadedImage.url, publicId: uploadedImage.key } : undefined,
      category: data.category,
      status: data.status,
      budget: data.budget ? Number(data.budget) : undefined,
      contractor: data.contractor || undefined,
      location: (data.lga || data.address) ? {
        lga: data.lga || undefined,
        address: data.address || undefined,
      } : undefined,
      startDate: data.startDate || undefined,
      expectedCompletionDate: data.expectedCompletionDate || undefined,
      completionDate: data.completionDate || undefined,
      progress: Number(data.progress),
      ministry: data.ministry || undefined,
      featured: data.featured,
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Project Name"
          name="name"
          register={register}
          error={errors.name}
          required
          className="md:col-span-2"
          placeholder="e.g., Kano-Maiduguri Road Reconstruction"
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
            placeholder="Detailed description of the project..."
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
            <option value="infrastructure">Infrastructure</option>
            <option value="health">Health</option>
            <option value="education">Education</option>
            <option value="agriculture">Agriculture</option>
            <option value="water">Water</option>
            <option value="energy">Energy</option>
            <option value="housing">Housing</option>
            <option value="transportation">Transportation</option>
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
            <option value="planning">Planning</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <FormField
          label="Budget (₦)"
          name="budget"
          type="number"
          register={register}
          error={errors.budget}
          placeholder="e.g., 5000000000"
        />

        <div>
          <label htmlFor="progress" className="block text-sm font-medium text-gray-700 mb-1">
            Progress (%) <span className="text-red-500">*</span>
          </label>
          <input
            id="progress"
            type="number"
            {...register('progress', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]"
            placeholder="0-100"
          />
          {errors.progress && (
            <p className="mt-1 text-sm text-red-600">{errors.progress.message}</p>
          )}
        </div>

        <FormField
          label="Contractor"
          name="contractor"
          register={register}
          error={errors.contractor}
          placeholder="e.g., ABC Construction Ltd"
        />

        <FormField
          label="Ministry"
          name="ministry"
          register={register}
          error={errors.ministry}
          placeholder="e.g., Ministry of Works"
        />

        <FormField
          label="LGA"
          name="lga"
          register={register}
          error={errors.lga}
          placeholder="e.g., Kano Municipal"
        />

        <FormField
          label="Address"
          name="address"
          register={register}
          error={errors.address}
          placeholder="Project address/location"
        />

        <FormField
          label="Start Date"
          name="startDate"
          type="date"
          register={register}
          error={errors.startDate}
        />

        <FormField
          label="Expected Completion Date"
          name="expectedCompletionDate"
          type="date"
          register={register}
          error={errors.expectedCompletionDate}
        />

        <FormField
          label="Completion Date"
          name="completionDate"
          type="date"
          register={register}
          error={errors.completionDate}
        />

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register('featured')}
              className="w-4 h-4 text-[#006838] border-gray-300 rounded focus:ring-[#006838]"
            />
            <span className="text-sm font-medium text-gray-700">Featured Project</span>
          </label>
        </div>
      </div>

      {/* Featured Image Upload Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Featured Image
        </label>

        {/* Image Preview */}
        {imagePreview && (
          <div className="mb-4 relative">
            <img
              src={imagePreview}
              alt="Project preview"
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
            <span>{isEditing ? 'Update Project' : 'Create Project'}</span>
          )}
        </button>
      </div>
    </form>
  );
}