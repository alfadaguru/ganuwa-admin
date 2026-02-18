import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';
import DataTable from '../../../components/common/DataTable';
import Modal from '../../../components/common/Modal';
import { servicesAPI } from '../../../services/api';
import ServiceForm from './ServicesForm';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface Service {
  _id: string;
  name: { en: string; ha?: string; ar?: string };
  description: { en: string; ha?: string; ar?: string };
  icon?: string;
  category: 'online_application' | 'license' | 'permit' | 'tax' | 'land' | 'health' | 'education' | 'business' | 'other';
  applicationUrl?: string;
  processingTime?: string;
  fee?: string;
  contactPerson?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  status: 'active' | 'inactive' | 'coming_soon';
  displayOrder: number;
}

export default function ServicesList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Service | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['services', page, search],
    queryFn: async () => {
      const response = await servicesAPI.getAll({ page, limit: 10, search });
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => servicesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Service deleted successfully');
      setDeleteConfirm(null);
    },
    onError: () => {
      toast.error('Failed to delete service');
    },
  });

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      coming_soon: 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      online_application: 'bg-purple-100 text-purple-800',
      license: 'bg-blue-100 text-blue-800',
      permit: 'bg-cyan-100 text-cyan-800',
      tax: 'bg-red-100 text-red-800',
      land: 'bg-green-100 text-green-800',
      health: 'bg-pink-100 text-pink-800',
      education: 'bg-indigo-100 text-indigo-800',
      business: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const columns: Column<Service>[] = [
    {
      key: 'name',
      label: 'Service Name',
      sortable: true,
      render: (item) => (
        <div>
          <p className="font-medium text-gray-900">{item.name.en}</p>
          <p className="text-sm text-gray-500 line-clamp-1">{item.description.en}</p>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (item) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getCategoryBadgeColor(item.category)}`}>
          {item.category.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'fee',
      label: 'Fee',
      render: (item) => item.fee || 'Free',
    },
    {
      key: 'processingTime',
      label: 'Processing Time',
      render: (item) => item.processingTime || '-',
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (item) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusBadgeColor(item.status)}`}
        >
          {item.status.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'displayOrder',
      label: 'Order',
      sortable: true,
      render: (item) => item.displayOrder,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services Management</h1>
          <p className="text-gray-600 mt-1">Manage government services and applications</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-[#006838] text-white rounded-lg hover:bg-[#004d28] transition-colors"
        >
          <FiPlus className="mr-2" />
          Add Service
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search services..."
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
          setSelectedService(item);
          setIsModalOpen(true);
        }}
        onDelete={setDeleteConfirm}
        pagination={data?.pagination}
        onPageChange={setPage}
        loading={isLoading}
        emptyMessage="No services found"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedService(null);
        }}
        title={selectedService ? 'Edit Service' : 'Add Service'}
        size="xl"
      >
        <ServiceForm
          service={selectedService}
          onSuccess={() => {
            setIsModalOpen(false);
            setSelectedService(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Service"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{deleteConfirm?.name.en}</strong>? This action cannot be undone.
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