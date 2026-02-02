import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { contactsAPI } from '../../../services/api';

interface Contact {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  category?: string;
  status: string;
  response?: string;
}

interface ContactsFormProps {
  contact?: Contact | null;
  onSuccess: () => void;
}

export default function ContactsForm({ contact, onSuccess }: ContactsFormProps) {
  const queryClient = useQueryClient();

  const respondMutation = useMutation({
    mutationFn: (response: string) => contactsAPI.respond(contact!._id, response),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Response sent successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to send response');
    },
  });

  const handleRespond = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const response = formData.get('response') as string;
    if (response) {
      respondMutation.mutate(response);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-gray-700">Name</p>
          <p className="text-gray-900">{contact?.name}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">Email</p>
          <p className="text-gray-900">{contact?.email}</p>
        </div>
        {contact?.phone && (
          <div>
            <p className="text-sm font-medium text-gray-700">Phone</p>
            <p className="text-gray-900">{contact.phone}</p>
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-gray-700">Category</p>
          <p className="text-gray-900 capitalize">{contact?.category || 'general'}</p>
        </div>
        <div className="md:col-span-2">
          <p className="text-sm font-medium text-gray-700">Subject</p>
          <p className="text-gray-900">{contact?.subject}</p>
        </div>
        <div className="md:col-span-2">
          <p className="text-sm font-medium text-gray-700">Message</p>
          <p className="text-gray-900">{contact?.message}</p>
        </div>
      </div>

      {contact?.response && (
        <div className="border-t pt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Previous Response</p>
          <p className="text-gray-900 bg-gray-50 p-3 rounded">{contact.response}</p>
        </div>
      )}

      {contact && contact.status !== 'responded' && (
        <form onSubmit={handleRespond} className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Send Response</label>
          <textarea name="response" rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]" placeholder="Type your response..." />
          <div className="flex justify-end space-x-3 mt-4">
            <button type="button" onClick={onSuccess} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Close</button>
            <button type="submit" disabled={respondMutation.isPending} className="px-6 py-2 bg-[#006838] text-white rounded-lg hover:bg-[#004d28] disabled:opacity-50">
              {respondMutation.isPending ? 'Sending...' : 'Send Response'}
            </button>
          </div>
        </form>
      )}

      {contact?.status === 'responded' && (
        <div className="flex justify-end">
          <button type="button" onClick={onSuccess} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Close</button>
        </div>
      )}
    </div>
  );
}