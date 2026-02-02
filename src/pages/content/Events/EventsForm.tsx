import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { FiUpload, FiTrash2, FiLoader } from 'react-icons/fi';
import { eventsAPI } from '../../../services/api';
import { uploadFile, deleteFile } from '../../../services/uploadService';
import FormField from '../../../components/common/FormField';

interface Event {
  _id: string;
  title: {
    en: string;
  };
  description?: {
    en?: string;
  };
  featuredImage?: {
    url: string;
    publicId: string;
    alt: string;
  };
  category: string;
  eventDate: string;
  startTime?: string;
  endTime?: string;
  venue?: {
    name?: string;
    address?: string;
  };
  organizer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  registrationRequired: boolean;
  registrationUrl?: string;
  capacity?: number;
  status: string;
  featured: boolean;
}

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  imageAlt: z.string().optional(),
  category: z.enum(['government', 'public', 'community', 'cultural', 'sports', 'education', 'health']),
  eventDate: z.string().min(1, 'Event date is required'),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  venueName: z.string().optional(),
  venueAddress: z.string().optional(),
  organizerName: z.string().optional(),
  organizerEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  organizerPhone: z.string().optional(),
  registrationRequired: z.boolean(),
  registrationUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  capacity: z.number().min(1).optional().or(z.literal('')),
  status: z.enum(['upcoming', 'ongoing', 'completed', 'cancelled']),
  featured: z.boolean(),
});

type EventFormData = z.infer<typeof eventSchema>;

interface EventFormProps {
  event?: Event | null;
  onSuccess: () => void;
}

export default function EventForm({ event, onSuccess }: EventFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!event;

  const [uploadedImage, setUploadedImage] = useState<{ url: string; key: string } | null>(
    event?.featuredImage ? { url: event.featuredImage.url, key: event.featuredImage.publicId } : null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(event?.featuredImage?.url || null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: event?.title.en || '',
      description: event?.description?.en || '',
      imageAlt: event?.featuredImage?.alt || '',
      category: event?.category || 'government',
      eventDate: event?.eventDate ? event.eventDate.split('T')[0] : '',
      startTime: event?.startTime || '',
      endTime: event?.endTime || '',
      venueName: event?.venue?.name || '',
      venueAddress: event?.venue?.address || '',
      organizerName: event?.organizer?.name || '',
      organizerEmail: event?.organizer?.email || '',
      organizerPhone: event?.organizer?.phone || '',
      registrationRequired: event?.registrationRequired || false,
      registrationUrl: event?.registrationUrl || '',
      capacity: event?.capacity || ('' as any),
      status: event?.status || 'upcoming',
      featured: event?.featured || false,
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

      if (uploadedImage?.key && uploadedImage.key !== event?.featuredImage?.publicId) {
        await deleteFile(uploadedImage.key);
      }

      const result = await uploadFile(file, 'events');
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
    if (uploadedImage?.key && uploadedImage.key !== event?.featuredImage?.publicId) {
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
    mutationFn: (data: any) => eventsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create event');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => eventsAPI.update(event!._id, data),
    onSuccess: async () => {
      if (event?.featuredImage?.publicId && uploadedImage?.key &&
          event.featuredImage.publicId !== uploadedImage.key) {
        try {
          await deleteFile(event.featuredImage.publicId);
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update event');
    },
  });

  const onSubmit = (data: EventFormData) => {
    const payload = {
      title: { en: data.title },
      description: data.description ? { en: data.description } : undefined,
      featuredImage: uploadedImage ? {
        url: uploadedImage.url,
        publicId: uploadedImage.key,
        alt: data.imageAlt || data.title,
      } : undefined,
      category: data.category,
      eventDate: data.eventDate,
      startTime: data.startTime || undefined,
      endTime: data.endTime || undefined,
      venue: {
        name: data.venueName || undefined,
        address: data.venueAddress || undefined,
      },
      organizer: {
        name: data.organizerName || undefined,
        email: data.organizerEmail || undefined,
        phone: data.organizerPhone || undefined,
      },
      registrationRequired: data.registrationRequired,
      registrationUrl: data.registrationUrl || undefined,
      capacity: data.capacity ? Number(data.capacity) : undefined,
      status: data.status,
      featured: data.featured,
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const registrationRequired = watch('registrationRequired');

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
              alt="Event preview"
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
        <FormField
          label="Event Title"
          name="title"
          register={register}
          error={errors.title}
          required
          className="md:col-span-2"
        />

        <div className="md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            {...register('description')}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838] ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Provide a detailed description of the event..."
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
            <option value="government">Government</option>
            <option value="public">Public</option>
            <option value="community">Community</option>
            <option value="cultural">Cultural</option>
            <option value="sports">Sports</option>
            <option value="education">Education</option>
            <option value="health">Health</option>
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
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <FormField
          label="Event Date"
          name="eventDate"
          type="date"
          register={register}
          error={errors.eventDate}
          required
        />

        <FormField
          label="Start Time"
          name="startTime"
          type="time"
          register={register}
          error={errors.startTime}
        />

        <FormField
          label="End Time"
          name="endTime"
          type="time"
          register={register}
          error={errors.endTime}
        />

        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Venue Information</h3>
        </div>

        <FormField
          label="Venue Name"
          name="venueName"
          register={register}
          error={errors.venueName}
          placeholder="e.g., Government House"
        />

        <FormField
          label="Venue Address"
          name="venueAddress"
          register={register}
          error={errors.venueAddress}
          placeholder="Full address"
          className="md:col-span-2"
        />

        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Organizer Information</h3>
        </div>

        <FormField
          label="Organizer Name"
          name="organizerName"
          register={register}
          error={errors.organizerName}
          placeholder="Person or organization"
        />

        <FormField
          label="Organizer Email"
          name="organizerEmail"
          type="email"
          register={register}
          error={errors.organizerEmail}
          placeholder="contact@example.com"
        />

        <FormField
          label="Organizer Phone"
          name="organizerPhone"
          type="tel"
          register={register}
          error={errors.organizerPhone}
          placeholder="+234 XXX XXX XXXX"
        />

        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Registration & Capacity</h3>
        </div>

        <div className="md:col-span-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register('registrationRequired')}
              className="w-4 h-4 text-[#006838] border-gray-300 rounded focus:ring-[#006838]"
            />
            <span className="text-sm font-medium text-gray-700">Registration Required</span>
          </label>
        </div>

        {registrationRequired && (
          <FormField
            label="Registration URL"
            name="registrationUrl"
            type="url"
            register={register}
            error={errors.registrationUrl}
            placeholder="https://registration.example.com"
            className="md:col-span-2"
          />
        )}

        <FormField
          label="Capacity"
          name="capacity"
          type="number"
          register={register}
          error={errors.capacity}
          placeholder="Maximum number of attendees"
        />

        <div className="md:col-span-1">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register('featured')}
              className="w-4 h-4 text-[#006838] border-gray-300 rounded focus:ring-[#006838]"
            />
            <span className="text-sm font-medium text-gray-700">Featured Event</span>
          </label>
          <p className="mt-1 text-xs text-gray-500">
            Featured events appear prominently on the website
          </p>
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
          disabled={createMutation.isPending || updateMutation.isPending || isUploading}
          className="px-6 py-2 bg-[#006838] text-white rounded-lg hover:bg-[#004d28] transition-colors disabled:opacity-50"
        >
          {createMutation.isPending || updateMutation.isPending
            ? 'Saving...'
            : isEditing
            ? 'Update Event'
            : 'Create Event'}
        </button>
      </div>
    </form>
  );
}
