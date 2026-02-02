import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';
import DataTable from '../../../components/common/DataTable';
import Modal from '../../../components/common/Modal';
import { leadersAPI } from '../../../services/api';
import LeaderForm from './LeadersForm';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface Leader {
  _id: string;
  name: string;
  title: {
    en: string;
    ha?: string;
    ar?: string;
  };
  subtitle?: {
    en?: string;
    ha?: string;
    ar?: string;
  };
  position: 'governor' | 'deputy_governor' | 'commissioner' | 'permanent_secretary' | 'director' | 'special_adviser' | 'other';
  ministry?: string;
  department?: string;
  profileImage: {
    url: string;
    publicId?: string;
    alt?: string;
  };
  email?: string;
  phoneNumber?: string;
  displayOrder: number;
  isActive: boolean;
  appointmentDate?: string;
  createdAt: string;
  updatedAt: string;
}

export default function LeadersList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLeader, setSelectedLeader] = useState<Leader | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Leader | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['leaders', page, search],
    queryFn: async () => {
      const response = await leadersAPI.getAll({ page, limit: 10, search });
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => leadersAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaders'] });
      toast.success('Leader deleted successfully');
      setDeleteConfirm(null);
    },
    onError: () => {
      toast.error('Failed to delete leader');
    },
  });

  const getPositionBadgeColor = (position: string) => {
    const colors: Record<string, string> = {
      governor: 'bg-purple-100 text-purple-800',
      deputy_governor: 'bg-indigo-100 text-indigo-800',
      commissioner: 'bg-blue-100 text-blue-800',
      permanent_secretary: 'bg-green-100 text-green-800',
      director: 'bg-yellow-100 text-yellow-800',
      special_adviser: 'bg-pink-100 text-pink-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[position] || 'bg-gray-100 text-gray-800';
  };

  const columns: Column<Leader>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (item) => (
        <div className="flex items-center space-x-3">
          <img
            src={item.profileImage.url || '/placeholder-avatar.png'}
            alt={item.name}
            className="w-10 h-10 rounded-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-avatar.png';
            }}
          />
          <div>
            <p className="font-medium text-gray-900">{item.name}</p>
            <p className="text-sm text-gray-500">{item.title.en}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'position',
      label: 'Position',
      sortable: true,
      render: (item) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getPositionBadgeColor(item.position)}`}>
          {item.position.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'ministry',
      label: 'Ministry/Dept',
      render: (item) => item.ministry || item.department || '-',
    },
    {
      key: 'displayOrder',
      label: 'Order',
      sortable: true,
      render: (item) => item.displayOrder,
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      render: (item) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}
        >
          {item.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leaders Management</h1>
          <p className="text-gray-600 mt-1">Manage government leaders and officials</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-[#006838] text-white rounded-lg hover:bg-[#004d28] transition-colors"
        >
          <FiPlus className="mr-2" />
          Add Leader
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search leaders..."
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
          setSelectedLeader(item);
          setIsModalOpen(true);
        }}
        onDelete={setDeleteConfirm}
        pagination={data?.pagination}
        onPageChange={setPage}
        loading={isLoading}
        emptyMessage="No leaders found"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLeader(null);
        }}
        title={selectedLeader ? 'Edit Leader' : 'Add Leader'}
        size="xl"
      >
        <LeaderForm
          leader={selectedLeader}
          onSuccess={() => {
            setIsModalOpen(false);
            setSelectedLeader(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Leader"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? This action cannot be undone.
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
