import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { FiUpload, FiTrash2, FiLoader } from 'react-icons/fi';
import { heroBannersAPI } from '../../../services/api';
import { uploadFile, deleteFile } from '../../../services/uploadService';
import FormField from '../../../components/common/FormField';

// Multilingual interface matching backend structure
interface HeroBanner {
  _id: string;
  title: {
    en: string;
    ha: string;
    ar: string;
  };
  subtitle?: {
    en: string;
    ha: string;
    ar: string;
  };
  description?: {
    en: string;
    ha: string;
    ar: string;
  };
  image: {
    url: string;
    publicId: string;
    alt: string;
  };
  ctaButton?: {
    text: {
      en: string;
      ha: string;
      ar: string;
    };
    url: string;
    openInNewTab: boolean;
  };
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Validation schema with multilingual support
const schema = z.object({
  title: z.object({
    en: z.string().min(1, 'English title is required'),
    ha: z.string().min(1, 'Hausa title is required'),
    ar: z.string().optional(),
  }),
  subtitle: z.object({
    en: z.string().optional(),
    ha: z.string().optional(),
    ar: z.string().optional(),
  }).optional(),
  description: z.object({
    en: z.string().optional(),
    ha: z.string().optional(),
    ar: z.string().optional(),
  }).optional(),
  imageAlt: z.string().optional(),
  ctaButton: z.object({
    text: z.object({
      en: z.string().optional(),
      ha: z.string().optional(),
      ar: z.string().optional(),
    }),
    url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    openInNewTab: z.boolean(),
  }).optional(),
  displayOrder: z.number().min(0, 'Order must be 0 or greater'),
  isActive: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface HeroBannerFormProps {
  banner?: HeroBanner | null;
  onSuccess: () => void;
}

type Language = 'en' | 'ha' | 'ar';

export default function HeroBannerForm({ banner, onSuccess }: HeroBannerFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!banner;

  // State for file upload and preview
  const [uploadedImage, setUploadedImage] = useState<{ url: string; key: string } | null>(
    banner?.image ? { url: banner.image.url, key: banner.image.publicId } : null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(banner?.image.url || null);
  const [activeLanguageTab, setActiveLanguageTab] = useState<Language>('en');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: {
        en: banner?.title.en || '',
        ha: banner?.title.ha || '',
        ar: banner?.title.ar || '',
      },
      subtitle: {
        en: banner?.subtitle?.en || '',
        ha: banner?.subtitle?.ha || '',
        ar: banner?.subtitle?.ar || '',
      },
      description: {
        en: banner?.description?.en || '',
        ha: banner?.description?.ha || '',
        ar: banner?.description?.ar || '',
      },
      imageAlt: banner?.image.alt || '',
      ctaButton: {
        text: {
          en: banner?.ctaButton?.text.en || '',
          ha: banner?.ctaButton?.text.ha || '',
          ar: banner?.ctaButton?.text.ar || '',
        },
        url: banner?.ctaButton?.url || '',
        openInNewTab: banner?.ctaButton?.openInNewTab ?? true,
      },
      displayOrder: banner?.displayOrder || 0,
      isActive: banner?.isActive ?? true,
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
      if (uploadedImage?.key && uploadedImage.key !== banner?.image.publicId) {
        await deleteFile(uploadedImage.key);
      }

      // Upload new image
      const result = await uploadFile(file, 'hero-banners');
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
    if (uploadedImage?.key && uploadedImage.key !== banner?.image.publicId) {
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
    mutationFn: (data: any) => heroBannersAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-banners'] });
      toast.success('Hero banner created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create hero banner');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => heroBannersAPI.update(banner!._id, data),
    onSuccess: async () => {
      // Delete old image if it was replaced
      if (
        banner?.image.publicId &&
        uploadedImage?.key &&
        banner.image.publicId !== uploadedImage.key
      ) {
        try {
          await deleteFile(banner.image.publicId);
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['hero-banners'] });
      toast.success('Hero banner updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update hero banner');
    },
  });

  const onSubmit = (data: FormData) => {
    if (!uploadedImage && !banner?.image) {
      toast.error('Please upload a banner image');
      return;
    }

    const submitData = {
      title: data.title,
      subtitle: data.subtitle,
      description: data.description,
      image: {
        url: uploadedImage?.url || banner!.image.url,
        publicId: uploadedImage?.key || banner!.image.publicId,
        alt: data.imageAlt || data.title.en,
      },
      ctaButton: data.ctaButton?.url
        ? {
            text: data.ctaButton.text,
            url: data.ctaButton.url,
            openInNewTab: data.ctaButton.openInNewTab,
          }
        : undefined,
      displayOrder: data.displayOrder,
      isActive: data.isActive,
    };

    if (isEditing) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'ha', label: 'Hausa' },
    { code: 'ar', label: 'Arabic' },
  ];

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Image Upload Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Banner Image <span className="text-red-500">*</span>
        </label>

        {/* Image Preview */}
        {imagePreview && (
          <div className="mb-4 relative">
            <img
              src={imagePreview}
              alt="Banner preview"
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

        {/* Image Alt Text */}
        <div className="mt-4">
          <FormField
            label="Image Alt Text"
            name="imageAlt"
            register={register}
            error={errors.imageAlt}
            placeholder="Descriptive text for accessibility"
          />
        </div>
      </div>

      {/* Language Tabs */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex space-x-1 mb-6 border-b border-gray-200">
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setActiveLanguageTab(lang.code)}
              className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
                activeLanguageTab === lang.code
                  ? 'bg-[#006838] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>

        {/* Title Fields */}
        <div className="space-y-4">
          <div>
            <FormField
              label={`Title (${languages.find((l) => l.code === activeLanguageTab)?.label})`}
              name={`title.${activeLanguageTab}`}
              register={register}
              error={errors.title?.[activeLanguageTab]}
              required={activeLanguageTab === 'en' || activeLanguageTab === 'ha'}
            />
          </div>

          {/* Subtitle Fields */}
          <div>
            <FormField
              label={`Subtitle (${languages.find((l) => l.code === activeLanguageTab)?.label})`}
              name={`subtitle.${activeLanguageTab}`}
              register={register}
              error={errors.subtitle?.[activeLanguageTab]}
            />
          </div>

          {/* Description Fields */}
          <div>
            <label
              htmlFor={`description-${activeLanguageTab}`}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description ({languages.find((l) => l.code === activeLanguageTab)?.label})
            </label>
            <textarea
              id={`description-${activeLanguageTab}`}
              rows={4}
              {...register(`description.${activeLanguageTab}`)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]"
            />
            {errors.description?.[activeLanguageTab] && (
              <p className="mt-1 text-sm text-red-600">
                {errors.description[activeLanguageTab]?.message}
              </p>
            )}
          </div>

          {/* CTA Button Text */}
          <div>
            <FormField
              label={`CTA Button Text (${languages.find((l) => l.code === activeLanguageTab)?.label})`}
              name={`ctaButton.text.${activeLanguageTab}`}
              register={register}
              error={errors.ctaButton?.text?.[activeLanguageTab]}
              placeholder="e.g., Learn More"
            />
          </div>
        </div>
      </div>

      {/* CTA Button Settings */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Call-to-Action Button</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Button URL"
            name="ctaButton.url"
            type="url"
            register={register}
            error={errors.ctaButton?.url}
            placeholder="https://example.com"
            className="md:col-span-2"
          />

          <div>
            <label htmlFor="openInNewTab" className="flex items-center space-x-2 cursor-pointer">
              <input
                id="openInNewTab"
                type="checkbox"
                {...register('ctaButton.openInNewTab')}
                className="w-4 h-4 text-[#006838] border-gray-300 rounded focus:ring-[#006838]"
              />
              <span className="text-sm font-medium text-gray-700">Open in new tab</span>
            </label>
          </div>
        </div>
      </div>

      {/* Display Settings */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Display Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div>
            <label htmlFor="isActive" className="flex items-center space-x-2 cursor-pointer">
              <input
                id="isActive"
                type="checkbox"
                {...register('isActive')}
                className="w-4 h-4 text-[#006838] border-gray-300 rounded focus:ring-[#006838]"
              />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
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
            <span>{isEditing ? 'Update Banner' : 'Create Banner'}</span>
          )}
        </button>
      </div>
    </form>
  );
}