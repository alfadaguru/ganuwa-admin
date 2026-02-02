import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';
import DataTable from '../../../components/common/DataTable';
import Modal from '../../../components/common/Modal';
import { projectsAPI } from '../../../services/api';
import ProjectForm from './ProjectsForm';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface Project {
  _id: string;
  name: {
    en: string;
    ha?: string;
    ar?: string;
  };
  slug: string;
  description: {
    en: string;
    ha?: string;
    ar?: string;
  };
  featuredImage?: {
    url?: string;
    publicId?: string;
    alt?: string;
  };
  category: string;
  status: 'planning' | 'ongoing' | 'completed' | 'suspended';
  budget?: number;
  currency: string;
  contractor?: string;
  location?: {
    lga?: string;
    address?: string;
  };
  startDate?: string;
  expectedCompletionDate?: string;
  completionDate?: string;
  progress: number;
  ministry?: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ProjectsList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Project | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['projects', page, search],
    queryFn: async () => {
      const response = await projectsAPI.getAll({ page, limit: 10, search });
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted successfully');
      setDeleteConfirm(null);
    },
    onError: () => {
      toast.error('Failed to delete project');
    },
  });

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      planning: 'bg-gray-100 text-gray-800',
      ongoing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      infrastructure: 'bg-purple-100 text-purple-800',
      health: 'bg-pink-100 text-pink-800',
      education: 'bg-indigo-100 text-indigo-800',
      agriculture: 'bg-green-100 text-green-800',
      water: 'bg-cyan-100 text-cyan-800',
      energy: 'bg-yellow-100 text-yellow-800',
      housing: 'bg-orange-100 text-orange-800',
      transportation: 'bg-blue-100 text-blue-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const formatBudget = (amount?: number, currency: string = 'NGN') => {
    if (!amount) return '-';
    const formatter = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    });
    return formatter.format(amount);
  };

  const columns: Column<Project>[] = [
    {
      key: 'name',
      label: 'Project Name',
      sortable: true,
      render: (item) => (
        <div>
          <p className="font-medium text-gray-900">{item.name.en}</p>
          {item.location?.lga && <p className="text-sm text-gray-500">📍 {item.location.lga}</p>}
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (item) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getCategoryBadgeColor(item.category)}`}>
          {item.category}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (item) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusBadgeColor(item.status)}`}
        >
          {item.status}
        </span>
      ),
    },
    {
      key: 'progress',
      label: 'Progress',
      sortable: true,
      render: (item) => (
        <div className="flex items-center space-x-2">
          <div className="w-20 bg-gray-200 rounded-full h-2">
            <div
              className="bg-[#006838] h-2 rounded-full"
              style={{ width: `${item.progress}%` }}
            ></div>
          </div>
          <span className="text-sm text-gray-600">{item.progress}%</span>
        </div>
      ),
    },
    {
      key: 'budget',
      label: 'Budget',
      render: (item) => formatBudget(item.budget, item.currency),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects Management</h1>
          <p className="text-gray-600 mt-1">Manage government projects and initiatives</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-[#006838] text-white rounded-lg hover:bg-[#004d28] transition-colors"
        >
          <FiPlus className="mr-2" />
          Add Project
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
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
          setSelectedProject(item);
          setIsModalOpen(true);
        }}
        onDelete={setDeleteConfirm}
        pagination={data?.pagination}
        onPageChange={setPage}
        loading={isLoading}
        emptyMessage="No projects found"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProject(null);
        }}
        title={selectedProject ? 'Edit Project' : 'Add Project'}
        size="xl"
      >
        <ProjectForm
          project={selectedProject}
          onSuccess={() => {
            setIsModalOpen(false);
            setSelectedProject(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Project"
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