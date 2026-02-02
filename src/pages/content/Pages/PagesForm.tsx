import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { FiUpload, FiTrash2, FiLoader } from 'react-icons/fi';
import { pagesAPI } from '../../../services/api';
import { uploadFile, deleteFile } from '../../../services/uploadService';
import FormField from '../../../components/common/FormField';

interface Page {
  _id: string;
  title: { en?: string };
  slug: string;
  content: { en?: string };
  featuredImage?: {
    url: string;
    publicId: string;
    alt: string;
  };
  template?: string;
  status: string;
}

const pageSchema = z.object({
  titleEn: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  contentEn: z.string().min(1, 'Content is required'),
  imageAlt: z.string().optional(),
  template: z.enum(['default', 'about', 'history', 'geography', 'custom']).optional(),
  status: z.enum(['draft', 'published', 'archived']),
});

type PageFormData = z.infer<typeof pageSchema>;

interface PagesFormProps {
  page?: Page | null;
  onSuccess: () => void;
}

export default function PagesForm({ page, onSuccess }: PagesFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!page;

  const [uploadedImage, setUploadedImage] = useState<{ url: string; key: string } | null>(
    page?.featuredImage ? { url: page.featuredImage.url, key: page.featuredImage.publicId } : null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(page?.featuredImage?.url || null);

  const { register, handleSubmit, formState: { errors } } = useForm<PageFormData>({
    resolver: zodResolver(pageSchema),
    defaultValues: {
      titleEn: page?.title?.en || '',
      slug: page?.slug || '',
      contentEn: page?.content?.en || '',
      imageAlt: page?.featuredImage?.alt || '',
      template: page?.template as any || 'default',
      status: page?.status as any || 'draft',
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      if (uploadedImage?.key && uploadedImage.key !== page?.featuredImage?.publicId) {
        await deleteFile(uploadedImage.key);
      }

      const result = await uploadFile(file, 'pages');
      setUploadedImage({ url: result.url, key: result.key });
      setImagePreview(result.url);
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Image upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageRemove = async () => {
    if (uploadedImage?.key && uploadedImage.key !== page?.featuredImage?.publicId) {
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
    mutationFn: (data: any) => pagesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      toast.success('Page created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create page');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => pagesAPI.update(page!._id, data),
    onSuccess: async () => {
      if (page?.featuredImage?.publicId && uploadedImage?.key &&
          page.featuredImage.publicId !== uploadedImage.key) {
        try {
          await deleteFile(page.featuredImage.publicId);
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      toast.success('Page updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update page');
    },
  });

  const onSubmit = (data: PageFormData) => {
    const payload = {
      title: { en: data.titleEn },
      slug: data.slug,
      content: { en: data.contentEn },
      featuredImage: uploadedImage ? {
        url: uploadedImage.url,
        publicId: uploadedImage.key,
        alt: data.imageAlt || data.titleEn,
      } : undefined,
      template: data.template || 'default',
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
      {/* Image Upload Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Featured Image
        </label>

        {imagePreview && (
          <div className="mb-4 relative">
            <img
              src={imagePreview}
              alt="Page preview"
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

        <div className="mt-4">
          <label htmlFor="imageAlt" className="block text-sm font-medium text-gray-700 mb-1">
            Image Alt Text
          </label>
          <input
            id="imageAlt"
            type="text"
            {...register('imageAlt')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]"
            placeholder="Descriptive text for accessibility"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="Title" name="titleEn" register={register} error={errors.titleEn} required />
        <FormField label="Slug" name="slug" register={register} error={errors.slug} required />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
          <select {...register('template')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]">
            <option value="default">Default</option>
            <option value="about">About</option>
            <option value="history">History</option>
            <option value="geography">Geography</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status <span className="text-red-500">*</span></label>
          <select {...register('status')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Content <span className="text-red-500">*</span></label>
          <textarea rows={8} {...register('contentEn')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]" />
          {errors.contentEn && <p className="mt-1 text-sm text-red-600">{errors.contentEn.message}</p>}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t">
        <button type="button" onClick={onSuccess} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
        <button type="submit" disabled={createMutation.isPending || updateMutation.isPending || isUploading} className="px-6 py-2 bg-[#006838] text-white rounded-lg hover:bg-[#004d28] transition-colors disabled:opacity-50">
          {createMutation.isPending || updateMutation.isPending ? 'Saving...' : isEditing ? 'Update Page' : 'Create Page'}
        </button>
      </div>
    </form>
  );
}
