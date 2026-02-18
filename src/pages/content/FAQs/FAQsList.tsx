import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';
import DataTable from '../../../components/common/DataTable';
import Modal from '../../../components/common/Modal';
import { faqsAPI } from '../../../services/api';
import FAQsForm from './FAQsForm';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface FAQ {
  _id: string;
  question: { en?: string };
  answer: { en?: string };
  category?: string;
  displayOrder: number;
  isActive: boolean;
  views?: number;
}

export default function FAQsList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<FAQ | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['faqs', page, search],
    queryFn: async () => {
      const response = await faqsAPI.getAll({ page, limit: 10, search });
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => faqsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      toast.success('FAQ deleted successfully');
      setDeleteConfirm(null);
    },
    onError: () => {
      toast.error('Failed to delete FAQ');
    },
  });

  const columns: Column<FAQ>[] = [
    {
      key: 'question',
      label: 'Question',
      sortable: true,
      render: (item) => (
        <div>
          <p className="font-medium text-gray-900">{item.question?.en || 'N/A'}</p>
          {item.category && <p className="text-sm text-gray-500 capitalize">{item.category}</p>}
        </div>
      ),
    },
    {
      key: 'views',
      label: 'Views',
      render: (item) => (item.views || 0).toLocaleString(),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (item) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {item.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'displayOrder',
      label: 'Order',
      render: (item) => item.displayOrder || 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">FAQs</h1>
          <p className="text-gray-600 mt-1">Manage frequently asked questions</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-[#006838] text-white rounded-lg hover:bg-[#004d28] transition-colors"
        >
          <FiPlus className="mr-2" />
          Add FAQ
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search FAQs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        onEdit={(item) => {
          setSelectedFAQ(item);
          setIsModalOpen(true);
        }}
        onDelete={setDeleteConfirm}
        pagination={data?.pagination}
        onPageChange={setPage}
        loading={isLoading}
        emptyMessage="No FAQs found"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedFAQ(null);
        }}
        title={selectedFAQ ? 'Edit FAQ' : 'Add FAQ'}
        size="xl"
      >
        <FAQsForm
          faq={selectedFAQ}
          onSuccess={() => {
            setIsModalOpen(false);
            setSelectedFAQ(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete FAQ"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{deleteConfirm?.question.en}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm._id)}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
