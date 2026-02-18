import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { FiUpload, FiTrash2, FiLoader } from 'react-icons/fi';
import { usersAPI } from '../../../services/api';
import { uploadFile, deleteFile } from '../../../services/uploadService';
import FormField from '../../../components/common/FormField';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'super_admin' | 'admin' | 'editor' | 'author' | 'viewer';
  department?: string;
  phoneNumber?: string;
  profileImage?: string;
  profileImagePublicId?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

const userSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
  role: z.enum(['super_admin', 'admin', 'editor', 'author', 'viewer']),
  department: z.string().optional(),
  phoneNumber: z.string().optional(),
  isActive: z.boolean(),
}).refine(() => {
  // Password is required for new users (when not editing)
  // This will be handled separately in the component
  return true;
}, {
  message: 'Password is required for new users',
  path: ['password'],
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  user?: User | null;
  onSuccess: () => void;
}

export default function UserForm({ user, onSuccess }: UserFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!user;

  // State for file upload and preview
  const [uploadedImage, setUploadedImage] = useState<{ url: string; key: string } | null>(
    user?.profileImage ? { url: user.profileImage, key: user.profileImagePublicId || '' } : null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(user?.profileImage || null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      password: '',
      role: user?.role || 'viewer',
      department: user?.department || '',
      phoneNumber: user?.phoneNumber || '',
      isActive: user?.isActive ?? true,
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
      if (uploadedImage?.key && uploadedImage.key !== user?.profileImagePublicId) {
        await deleteFile(uploadedImage.key);
      }

      // Upload new image
      const result = await uploadFile(file, 'users');
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
    if (uploadedImage?.key && uploadedImage.key !== user?.profileImagePublicId) {
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
    mutationFn: (data: any) => usersAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create user');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => usersAPI.update(user!._id, data),
    onSuccess: async () => {
      // Delete old image if it was replaced
      if (
        user?.profileImagePublicId &&
        uploadedImage?.key &&
        user.profileImagePublicId !== uploadedImage.key
      ) {
        try {
          await deleteFile(user.profileImagePublicId);
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update user');
    },
  });

  const onSubmit = (data: UserFormData) => {
    // Validate password for new users
    if (!isEditing && !data.password) {
      toast.error('Password is required for new users');
      return;
    }

    const payload: any = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      role: data.role,
      department: data.department || undefined,
      phoneNumber: data.phoneNumber || undefined,
      profileImage: uploadedImage?.url || user?.profileImage || undefined,
      profileImagePublicId: uploadedImage?.key || user?.profileImagePublicId || undefined,
      isActive: data.isActive,
    };

    // Only include password if provided
    if (data.password) {
      payload.password = data.password;
    }

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
          Profile Image
        </label>

        {/* Image Preview */}
        {imagePreview && (
          <div className="mb-4 relative">
            <img
              src={imagePreview}
              alt="Profile preview"
              className="w-48 h-48 object-cover rounded-full border border-gray-300 mx-auto"
            />
            <button
              type="button"
              onClick={handleImageRemove}
              className="absolute top-3 right-1/3 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors shadow-lg"
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
          label="First Name"
          name="firstName"
          register={register}
          error={errors.firstName}
          required
        />

        <FormField
          label="Last Name"
          name="lastName"
          register={register}
          error={errors.lastName}
          required
        />

        <FormField
          label="Email"
          name="email"
          type="email"
          register={register}
          error={errors.email}
          required
          className="md:col-span-2"
        />

        <FormField
          label={isEditing ? 'Password (leave blank to keep current)' : 'Password'}
          name="password"
          type="password"
          register={register}
          error={errors.password}
          required={!isEditing}
          className="md:col-span-2"
          placeholder={isEditing ? 'Leave blank to keep current password' : 'Minimum 8 characters'}
        />

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Role <span className="text-red-500">*</span>
          </label>
          <select
            id="role"
            {...register('role')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]"
          >
            <option value="viewer">Viewer - Can only view content</option>
            <option value="author">Author - Can create and edit own content</option>
            <option value="editor">Editor - Can edit all content</option>
            <option value="admin">Admin - Full access except user management</option>
            <option value="super_admin">Super Admin - Full system access</option>
          </select>
          {errors.role && (
            <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
          )}
        </div>

        <FormField
          label="Department"
          name="department"
          register={register}
          error={errors.department}
          placeholder="e.g., Information Technology"
        />

        <FormField
          label="Phone Number"
          name="phoneNumber"
          type="tel"
          register={register}
          error={errors.phoneNumber}
          placeholder="+234 XXX XXX XXXX"
        />

        <div className="md:col-span-1">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register('isActive')}
              className="w-4 h-4 text-[#006838] border-gray-300 rounded focus:ring-[#006838]"
            />
            <span className="text-sm font-medium text-gray-700">Active User</span>
          </label>
          <p className="mt-1 text-xs text-gray-500">
            Inactive users cannot log in to the system
          </p>
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
            <span>{isEditing ? 'Update User' : 'Create User'}</span>
          )}
        </button>
      </div>
    </form>
  );
}