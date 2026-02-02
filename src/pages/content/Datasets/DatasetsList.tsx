import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';
import DataTable from '../../../components/common/DataTable';
import Modal from '../../../components/common/Modal';
import { datasetsAPI } from '../../../services/api';
import DatasetsForm from './DatasetsForm';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface Dataset {
  _id: string;
  title: { en: string };
  category: string;
  formats: Array<{ type: string; url: string; size?: number }>;
  downloads: number;
  views: number;
  updatedAt: string;
  status: 'draft' | 'published' | 'archived';
}

export default function DatasetsList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Dataset | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['datasets', page, search],
    queryFn: async () => {
      const response = await datasetsAPI.getAll({ page, limit: 10, search });
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => datasetsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
      toast.success('Dataset deleted successfully');
      setDeleteConfirm(null);
    },
    onError: () => {
      toast.error('Failed to delete dataset');
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const columns: Column<Dataset>[] = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (item) => (
        <div>
          <p className="font-medium text-gray-900">{item.title.en}</p>
          <p className="text-sm text-gray-500 capitalize">{item.category}</p>
        </div>
      ),
    },
    {
      key: 'formats',
      label: 'Formats',
      render: (item) => (
        <div className="flex flex-wrap gap-1">
          {item.formats.slice(0, 3).map((format, idx) => (
            <span key={idx} className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800 uppercase">
              {format.type}
            </span>
          ))}
          {item.formats.length > 3 && (
            <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-600">
              +{item.formats.length - 3}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'downloads',
      label: 'Downloads',
      render: (item) => item.downloads.toLocaleString(),
    },
    {
      key: 'views',
      label: 'Views',
      render: (item) => item.views.toLocaleString(),
    },
    {
      key: 'lastUpdated',
      label: 'Last Updated',
      render: (item) => formatDate(item.updatedAt),
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
          <h1 className="text-2xl font-bold text-gray-900">Open Data Datasets</h1>
          <p className="text-gray-600 mt-1">Manage public datasets and open data</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-[#006838] text-white rounded-lg hover:bg-[#004d28] transition-colors"
        >
          <FiPlus className="mr-2" />
          Add Dataset
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search datasets..."
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
          setSelectedDataset(item);
          setIsModalOpen(true);
        }}
        onDelete={setDeleteConfirm}
        pagination={data?.pagination}
        onPageChange={setPage}
        loading={isLoading}
        emptyMessage="No datasets found"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDataset(null);
        }}
        title={selectedDataset ? 'Edit Dataset' : 'Add Dataset'}
        size="xl"
      >
        <DatasetsForm
          dataset={selectedDataset}
          onSuccess={() => {
            setIsModalOpen(false);
            setSelectedDataset(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Dataset"
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