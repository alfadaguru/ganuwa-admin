import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiSearch } from 'react-icons/fi';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import DataTable from '../../../components/common/DataTable';
import Modal from '../../../components/common/Modal';
import { pressReleasesAPI } from '../../../services/api';
import PressReleaseForm from './PressReleasesForm';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface PressRelease {
  _id: string;
  title: {
    en: string;
    ha?: string;
    ar?: string;
  };
  slug: string;
  content: {
    en: string;
    ha?: string;
    ar?: string;
  };
  category: 'government' | 'development' | 'policy' | 'statement' | 'clarification';
  releaseDate: string;
  contactPerson?: {
    name?: string;
    title?: string;
    email?: string;
    phone?: string;
  };
  attachments?: Array<{
    fileName?: string;
    url?: string;
    fileType?: string;
  }>;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export default function PressReleasesList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPressRelease, setSelectedPressRelease] = useState<PressRelease | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<PressRelease | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['press-releases', page, search],
    queryFn: async () => {
      const response = await pressReleasesAPI.getAll({ page, limit: 10, search });
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => pressReleasesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['press-releases'] });
      toast.success('Press release deleted successfully');
      setDeleteConfirm(null);
    },
    onError: () => {
      toast.error('Failed to delete press release');
    },
  });

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-yellow-100 text-yellow-800',
      published: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const columns: Column<PressRelease>[] = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (item) => (
        <div className="max-w-md">
          <p className="font-medium text-gray-900">{item.title.en}</p>
          {item.contactPerson?.name && (
            <p className="text-sm text-gray-500">Contact: {item.contactPerson.name}</p>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (item) => (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800 capitalize">
          {item.category}
        </span>
      ),
    },
    {
      key: 'releaseDate',
      label: 'Release Date',
      sortable: true,
      render: (item) => format(new Date(item.releaseDate), 'MMM dd, yyyy'),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (item) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusBadgeColor(item.status)}`}>
          {item.status}
        </span>
      ),
    },
    {
      key: 'attachments',
      label: 'Attachments',
      render: (item) => (
        <span className="text-sm text-gray-600">
          {item.attachments?.length || 0} file(s)
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Press Releases Management</h1>
          <p className="text-gray-600 mt-1">Manage official press releases and statements</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-[#006838] text-white rounded-lg hover:bg-[#004d28] transition-colors"
        >
          <FiPlus className="mr-2" />
          Add Press Release
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search press releases..."
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
          setSelectedPressRelease(item);
          setIsModalOpen(true);
        }}
        onDelete={setDeleteConfirm}
        pagination={data?.pagination}
        onPageChange={setPage}
        loading={isLoading}
        emptyMessage="No press releases found"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPressRelease(null);
        }}
        title={selectedPressRelease ? 'Edit Press Release' : 'Create Press Release'}
        size="xl"
      >
        <PressReleaseForm
          pressRelease={selectedPressRelease}
          onSuccess={() => {
            setIsModalOpen(false);
            setSelectedPressRelease(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Press Release"
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
