import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { FiUpload, FiTrash2, FiLoader } from 'react-icons/fi';
import { newsAPI } from '../../../services/api';
import { uploadFile, deleteFile } from '../../../services/uploadService';
import FormField from '../../../components/common/FormField';

interface News {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: 'general' | 'politics' | 'economy' | 'education' | 'health' | 'infrastructure';
  tags: string[];
  featuredImage: string;
  author: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const newsSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  excerpt: z.string().min(1, 'Excerpt is required'),
  content: z.string().min(1, 'Content is required'),
  category: z.enum(['general', 'politics', 'economy', 'education', 'health', 'infrastructure']),
  tags: z.string(),
  featuredImage: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  author: z.string().min(1, 'Author is required'),
  status: z.enum(['draft', 'published', 'archived']),
  publishedAt: z.string().optional(),
});

type NewsFormData = z.infer<typeof newsSchema>;

interface NewsFormProps {
  news?: News | null;
  onSuccess: () => void;
}

export default function NewsForm({ news, onSuccess }: NewsFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!news;

  // State for file upload and preview
  const [uploadedImage, setUploadedImage] = useState<{ url: string; key: string } | null>(
    news?.featuredImage ? { url: news.featuredImage, key: news.featuredImage } : null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(news?.featuredImage || null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<NewsFormData>({
    resolver: zodResolver(newsSchema),
    defaultValues: {
      title: news?.title || '',
      slug: news?.slug || '',
      excerpt: news?.excerpt || '',
      content: news?.content || '',
      category: news?.category || 'general',
      tags: news?.tags?.join(', ') || '',
      featuredImage: news?.featuredImage || '',
      author: news?.author || '',
      status: news?.status || 'draft',
      publishedAt: news?.publishedAt || '',
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
      if (uploadedImage?.key && uploadedImage.key !== news?.featuredImage) {
        await deleteFile(uploadedImage.key);
      }

      // Upload new image
      const result = await uploadFile(file, 'news');
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
    if (uploadedImage?.key && uploadedImage.key !== news?.featuredImage) {
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
    mutationFn: (data: any) => newsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
      toast.success('News created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create news');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => newsAPI.update(news!._id, data),
    onSuccess: async () => {
      // Delete old image if it was replaced
      if (
        news?.featuredImage &&
        uploadedImage?.key &&
        news.featuredImage !== uploadedImage.key
      ) {
        try {
          await deleteFile(news.featuredImage);
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['news'] });
      toast.success('News updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update news');
    },
  });

  const onSubmit = (data: NewsFormData) => {
    const payload = {
      ...data,
      featuredImage: uploadedImage?.url || data.featuredImage || '',
      tags: data.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  // Auto-generate slug from title
  const title = watch('title');
  useEffect(() => {
    if (!isEditing && title) {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setValue('slug', slug);
    }
  }, [title, isEditing, setValue]);

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

        <FormField
          label="Slug"
          name="slug"
          register={register}
          error={errors.slug}
          required
          className="md:col-span-2"
        />

        <div className="md:col-span-2">
          <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-1">
            Excerpt <span className="text-red-500">*</span>
          </label>
          <textarea
            id="excerpt"
            rows={3}
            {...register('excerpt')}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838] ${
              errors.excerpt ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.excerpt && (
            <p className="mt-1 text-sm text-red-600">{errors.excerpt.message}</p>
          )}
        </div>

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
            <option value="general">General</option>
            <option value="politics">Politics</option>
            <option value="economy">Economy</option>
            <option value="education">Education</option>
            <option value="health">Health</option>
            <option value="infrastructure">Infrastructure</option>
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
          label="Tags (comma separated)"
          name="tags"
          register={register}
          error={errors.tags}
          placeholder="politics, government, kano"
          className="md:col-span-2"
        />

        <FormField
          label="Author"
          name="author"
          register={register}
          error={errors.author}
          required
        />

        <FormField
          label="Published Date"
          name="publishedAt"
          type="datetime-local"
          register={register}
          error={errors.publishedAt}
        />
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
              alt="Featured image preview"
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
            ? 'Update News'
            : 'Create News'}
        </button>
      </div>
    </form>
  );
}