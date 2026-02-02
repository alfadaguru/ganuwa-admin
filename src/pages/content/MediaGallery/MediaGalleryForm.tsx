import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { FiUpload, FiTrash2, FiLoader } from 'react-icons/fi';
import { mediaAPI } from '../../../services/api';
import { uploadFile, deleteFile } from '../../../services/uploadService';
import FormField from '../../../components/common/FormField';

interface MediaGallery {
  _id: string;
  title: { en?: string; ha?: string; ar?: string };
  description?: { en?: string; ha?: string; ar?: string };
  type: string;
  category?: string;
  mediaUrl?: string;
  mediaPublicId?: string;
  location?: string;
  photographer?: string;
  eventDate?: string;
  featured: boolean;
}

const mediaSchema = z.object({
  titleEn: z.string().min(1, 'English title is required'),
  titleHa: z.string().optional(),
  titleAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  descriptionHa: z.string().optional(),
  descriptionAr: z.string().optional(),
  type: z.enum(['image', 'video', 'album']),
  category: z.enum(['event', 'project', 'government', 'infrastructure', 'culture', 'general']).optional(),
  location: z.string().optional(),
  photographer: z.string().optional(),
  eventDate: z.string().optional(),
  featured: z.boolean(),
});

type MediaFormData = z.infer<typeof mediaSchema>;

interface MediaGalleryFormProps {
  media?: MediaGallery | null;
  onSuccess: () => void;
}

export default function MediaGalleryForm({ media, onSuccess }: MediaGalleryFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!media;

  // State for file upload and preview
  const [uploadedMedia, setUploadedMedia] = useState<{ url: string; key: string } | null>(
    media?.mediaUrl ? { url: media.mediaUrl, key: media.mediaPublicId || '' } : null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(media?.mediaUrl || null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<MediaFormData>({
    resolver: zodResolver(mediaSchema),
    defaultValues: {
      titleEn: media?.title?.en || '',
      titleHa: media?.title?.ha || '',
      titleAr: media?.title?.ar || '',
      descriptionEn: media?.description?.en || '',
      descriptionHa: media?.description?.ha || '',
      descriptionAr: media?.description?.ar || '',
      type: media?.type as any || 'image',
      category: media?.category as any || 'general',
      location: media?.location || '',
      photographer: media?.photographer || '',
      eventDate: media?.eventDate || '',
      featured: media?.featured ?? false,
    },
  });

  const mediaType = watch('type');

  // Handle media upload
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type based on media type
    if (mediaType === 'image' && !file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (mediaType === 'video' && !file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }

    // Validate file size (10MB for images, 50MB for videos)
    const maxSize = mediaType === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File size must be less than ${mediaType === 'video' ? '50MB' : '10MB'}`);
      return;
    }

    try {
      setIsUploading(true);

      // Delete old media if replacing
      if (uploadedMedia?.key && uploadedMedia.key !== media?.mediaPublicId) {
        await deleteFile(uploadedMedia.key);
      }

      // Upload new media
      const result = await uploadFile(file, 'media');
      setUploadedMedia({ url: result.url, key: result.key });
      setMediaPreview(result.url);

      toast.success('Media uploaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Media upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle media removal
  const handleMediaRemove = async () => {
    if (uploadedMedia?.key && uploadedMedia.key !== media?.mediaPublicId) {
      try {
        await deleteFile(uploadedMedia.key);
      } catch (error) {
        console.error('Error deleting media:', error);
      }
    }
    setMediaPreview(null);
    setUploadedMedia(null);
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => mediaAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      toast.success('Media created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create media');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => mediaAPI.update(media!._id, data),
    onSuccess: async () => {
      // Delete old media if it was replaced
      if (
        media?.mediaPublicId &&
        uploadedMedia?.key &&
        media.mediaPublicId !== uploadedMedia.key
      ) {
        try {
          await deleteFile(media.mediaPublicId);
        } catch (error) {
          console.error('Error deleting old media:', error);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['media'] });
      toast.success('Media updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update media');
    },
  });

  const onSubmit = (data: MediaFormData) => {
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
      type: data.type,
      category: data.category || undefined,
      mediaUrl: uploadedMedia?.url || media?.mediaUrl || undefined,
      mediaPublicId: uploadedMedia?.key || media?.mediaPublicId || undefined,
      location: data.location || undefined,
      photographer: data.photographer || undefined,
      eventDate: data.eventDate || undefined,
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
        <h3 className="text-lg font-medium text-gray-900">Description (Multilingual)</h3>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Type <span className="text-red-500">*</span>
          </label>
          <select
            id="type"
            {...register('type')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]"
          >
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="album">Album</option>
          </select>
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
            <option value="event">Event</option>
            <option value="project">Project</option>
            <option value="government">Government</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="culture">Culture</option>
            <option value="general">General</option>
          </select>
        </div>

        <FormField
          label="Location"
          name="location"
          register={register}
          error={errors.location}
          placeholder="e.g., Kano City"
        />

        <FormField
          label="Photographer"
          name="photographer"
          register={register}
          error={errors.photographer}
          placeholder="Photographer name"
        />

        <FormField
          label="Event Date"
          name="eventDate"
          type="date"
          register={register}
          error={errors.eventDate}
        />

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register('featured')}
              className="w-4 h-4 text-[#006838] border-gray-300 rounded focus:ring-[#006838]"
            />
            <span className="text-sm font-medium text-gray-700">Featured</span>
          </label>
        </div>
      </div>

      {/* Media Upload Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {mediaType === 'video' ? 'Video File' : 'Media File'}
        </label>

        {/* Media Preview */}
        {mediaPreview && (
          <div className="mb-4 relative">
            {mediaType === 'video' ? (
              <video
                src={mediaPreview}
                controls
                className="w-full h-64 object-cover rounded-lg border border-gray-300"
              />
            ) : (
              <img
                src={mediaPreview}
                alt="Media preview"
                className="w-full h-64 object-cover rounded-lg border border-gray-300"
              />
            )}
            <button
              type="button"
              onClick={handleMediaRemove}
              className="absolute top-3 right-3 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors shadow-lg"
              disabled={isUploading}
            >
              <FiTrash2 className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* File Upload Input */}
        {!mediaPreview && (
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FiUpload className="w-12 h-12 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  {mediaType === 'video'
                    ? 'MP4, MOV, AVI (MAX. 50MB)'
                    : 'PNG, JPG, WEBP (MAX. 10MB)'}
                </p>
              </div>
              <input
                type="file"
                accept={mediaType === 'video' ? 'video/*' : 'image/*'}
                onChange={handleMediaUpload}
                className="hidden"
                disabled={isUploading}
              />
            </label>
          </div>
        )}

        {isUploading && (
          <div className="mt-3 flex items-center justify-center text-sm text-blue-600">
            <FiLoader className="animate-spin mr-2 w-5 h-5" />
            Uploading media...
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
            <span>{isEditing ? 'Update Media' : 'Create Media'}</span>
          )}
        </button>
      </div>
    </form>
  );
}