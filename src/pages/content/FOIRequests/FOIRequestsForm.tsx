import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { FiUpload, FiX, FiLoader } from 'react-icons/fi';
import { foiRequestsAPI, usersAPI } from '../../../services/api';
import { uploadFile, deleteFile } from '../../../services/uploadService';

interface FOIRequest {
  _id: string;
  requestNumber: string;
  requesterName: string;
  requesterEmail: string;
  subject: string;
  description: string;
  requestType: 'information' | 'document' | 'data' | 'other';
  status: 'pending' | 'in-review' | 'approved' | 'rejected' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  assignedTo?: string | { _id: string; name: string };
  responseText?: string;
  responseDocuments?: Array<{ url: string; name: string }>;
  internalNotes?: string;
}

const foiRequestSchema = z.object({
  status: z.enum(['pending', 'in-review', 'approved', 'rejected', 'completed']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assignedTo: z.string().optional(),
  responseText: z.string().optional(),
  internalNotes: z.string().optional(),
});

type FOIRequestFormData = z.infer<typeof foiRequestSchema>;

interface FOIRequestsFormProps {
  request?: FOIRequest | null;
  onSuccess: () => void;
}

export default function FOIRequestsForm({ request, onSuccess }: FOIRequestsFormProps) {
  const queryClient = useQueryClient();

  const [uploadedDocuments, setUploadedDocuments] = useState<Array<{ url: string; name: string; key: string }>>(
    request?.responseDocuments?.map(doc => ({ ...doc, key: doc.url })) || []
  );
  const [isUploading, setIsUploading] = useState(false);

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await usersAPI.getAll({ limit: 100 });
      return response.data;
    },
  });

  const { register, handleSubmit, watch } = useForm<FOIRequestFormData>({
    resolver: zodResolver(foiRequestSchema),
    defaultValues: {
      status: request?.status || 'pending',
      priority: request?.priority || 'medium',
      assignedTo: typeof request?.assignedTo === 'object' ? request?.assignedTo?._id : request?.assignedTo || '',
      responseText: request?.responseText || '',
      internalNotes: request?.internalNotes || '',
    },
  });

  const currentStatus = watch('status');

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a PDF, Excel, or Word document');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }

    try {
      setIsUploading(true);
      const result = await uploadFile(file, 'foi-responses');
      setUploadedDocuments([...uploadedDocuments, { url: result.url, name: file.name, key: result.key }]);
      toast.success('Document uploaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Document upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDocumentRemove = async (index: number) => {
    const doc = uploadedDocuments[index];
    if (doc.key && !request?.responseDocuments?.find(d => d.url === doc.url)) {
      try {
        await deleteFile(doc.key);
      } catch (error) {
        console.error('Error deleting document:', error);
      }
    }
    setUploadedDocuments(uploadedDocuments.filter((_, i) => i !== index));
  };

  const updateMutation = useMutation({
    mutationFn: (data: any) => foiRequestsAPI.update(request!._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foiRequests'] });
      toast.success('FOI request updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update FOI request');
    },
  });

  const onSubmit = (data: FOIRequestFormData) => {
    const payload = {
      status: data.status,
      priority: data.priority,
      assignedTo: data.assignedTo || undefined,
      responseText: data.responseText || undefined,
      responseDocuments: uploadedDocuments.map(({ url, name }) => ({ url, name })),
      internalNotes: data.internalNotes || undefined,
    };

    updateMutation.mutate(payload);
  };

  if (!request) {
    return (
      <div className="text-center py-8 text-gray-500">
        No request selected
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Request Details (Read-only) */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Request Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Request Number</p>
            <p className="font-medium text-gray-900">{request.requestNumber}</p>
          </div>
          <div>
            <p className="text-gray-600">Requester Name</p>
            <p className="font-medium text-gray-900">{request.requesterName}</p>
          </div>
          <div>
            <p className="text-gray-600">Requester Email</p>
            <p className="font-medium text-gray-900">{request.requesterEmail}</p>
          </div>
          <div>
            <p className="text-gray-600">Request Type</p>
            <p className="font-medium text-gray-900 capitalize">{request.requestType}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-gray-600 mb-1">Subject</p>
            <p className="font-medium text-gray-900">{request.subject}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-gray-600 mb-1">Description</p>
            <p className="text-gray-900">{request.description}</p>
          </div>
        </div>
      </div>

      {/* Update Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              {...register('status')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]"
            >
              <option value="pending">Pending</option>
              <option value="in-review">In Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority <span className="text-red-500">*</span>
            </label>
            <select
              {...register('priority')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assign To
          </label>
          <select
            {...register('assignedTo')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]"
          >
            <option value="">Unassigned</option>
            {usersData?.data?.map((user: any) => (
              <option key={user._id} value={user._id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
        </div>

        {/* Response Text (visible when approved/completed) */}
        {(currentStatus === 'approved' || currentStatus === 'completed') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Response Text
            </label>
            <textarea
              rows={5}
              {...register('responseText')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]"
              placeholder="Enter response to the requester..."
            />
          </div>
        )}

        {/* Response Documents Upload */}
        {(currentStatus === 'approved' || currentStatus === 'completed') && (
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Response Documents
            </label>

            {uploadedDocuments.length > 0 && (
              <div className="mb-4 space-y-2">
                {uploadedDocuments.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-300">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDocumentRemove(index)}
                      className="ml-3 text-red-600 hover:text-red-800"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col items-center justify-center">
                  <FiUpload className="w-8 h-8 mb-1 text-gray-400" />
                  <p className="text-xs text-gray-500">Click to upload response documents</p>
                </div>
                <input
                  type="file"
                  accept=".pdf,.xls,.xlsx,.doc,.docx"
                  onChange={handleDocumentUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </div>

            {isUploading && (
              <div className="mt-3 flex items-center justify-center text-sm text-blue-600">
                <FiLoader className="animate-spin mr-2 w-5 h-5" />
                Uploading document...
              </div>
            )}
          </div>
        )}

        {/* Internal Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Internal Notes
          </label>
          <textarea
            rows={4}
            {...register('internalNotes')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]"
            placeholder="Add internal notes (not visible to requester)..."
          />
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
            disabled={updateMutation.isPending}
            className="px-6 py-2 bg-[#006838] text-white rounded-lg hover:bg-[#004d28] transition-colors disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Updating...' : 'Update Request'}
          </button>
        </div>
      </form>
    </div>
  );
}
