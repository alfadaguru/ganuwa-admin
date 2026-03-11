import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';
import DataTable from '../../../components/common/DataTable';
import Modal from '../../../components/common/Modal';
import { budgetDocumentsAPI } from '../../../services/api';
import BudgetDocumentsForm from './BudgetDocumentsForm';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface BudgetDocument {
  _id: string;
  title: { en?: string; ha?: string; ar?: string };
  description: { en?: string; ha?: string; ar?: string };
  category?: string;
  tags?: string[];
  year?: number;
  fileUrl?: string;
  publishDate?: string;
  status: 'draft' | 'published' | 'archived';
  isFeatured?: boolean;
  fileSize?: number;
  downloads?: number;
}

export default function BudgetDocumentsList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<BudgetDocument | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<BudgetDocument | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['budgetDocuments', page, search],
    queryFn: async () => {
      const response = await budgetDocumentsAPI.getAll({ page, limit: 10, search });
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => budgetDocumentsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgetDocuments'] });
      toast.success('Budget document deleted successfully');
      setDeleteConfirm(null);
    },
    onError: () => {
      toast.error('Failed to delete budget document');
    },
  });

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const columns: Column<BudgetDocument>[] = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (item) => (
        <div>
          <p className="font-medium text-gray-900">{item.title.en}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {(item.tags || []).slice(0, 3).map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 bg-green-50 text-green-700 text-xs rounded">
                {tag}
              </span>
            ))}
            {(item.tags || []).length > 3 && (
              <span className="text-xs text-gray-400">+{(item.tags || []).length - 3} more</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'fileSize',
      label: 'File Size',
      render: (item) => formatFileSize(item.fileSize),
    },
    {
      key: 'downloads',
      label: 'Downloads',
      render: (item) => (item.downloads || 0).toLocaleString(),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          item.status === 'published'
            ? 'bg-green-100 text-green-800'
            : item.status === 'draft'
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budget Documents</h1>
          <p className="text-gray-600 mt-1">Manage budget documents and financial reports</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-[#006838] text-white rounded-lg hover:bg-[#004d28] transition-colors"
        >
          <FiPlus className="mr-2" />
          Add Budget Document
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search budget documents..."
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
          setSelectedDocument(item);
          setIsModalOpen(true);
        }}
        onDelete={setDeleteConfirm}
        pagination={data?.pagination}
        onPageChange={setPage}
        loading={isLoading}
        emptyMessage="No budget documents found"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDocument(null);
        }}
        title={selectedDocument ? 'Edit Budget Document' : 'Add Budget Document'}
        size="xl"
      >
        <BudgetDocumentsForm
          document={selectedDocument}
          onSuccess={() => {
            setIsModalOpen(false);
            setSelectedDocument(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Budget Document"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{deleteConfirm?.title.en}</strong>? This action cannot be undone.
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