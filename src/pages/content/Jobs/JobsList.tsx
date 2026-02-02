import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';
import DataTable from '../../../components/common/DataTable';
import Modal from '../../../components/common/Modal';
import { jobsAPI } from '../../../services/api';
import JobsForm from './JobsForm';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface Job {
  _id: string;
  title: { en: string };
  department: string;
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship';
  location: string;
  vacancies: number;
  applicationDeadline: string;
  status: 'open' | 'closed' | 'filled';
  applicationsCount?: number;
}

export default function JobsList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Job | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', page, search],
    queryFn: async () => {
      const response = await jobsAPI.getAll({ page, limit: 10, search });
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => jobsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job deleted successfully');
      setDeleteConfirm(null);
    },
    onError: () => {
      toast.error('Failed to delete job');
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const columns: Column<Job>[] = [
    {
      key: 'title',
      label: 'Job Title',
      sortable: true,
      render: (item) => (
        <div>
          <p className="font-medium text-gray-900">{item.title.en}</p>
          <p className="text-sm text-gray-500">{item.department}</p>
        </div>
      ),
    },
    {
      key: 'jobType',
      label: 'Type',
      render: (item) => (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 capitalize">
          {item.jobType.replace('-', ' ')}
        </span>
      ),
    },
    {
      key: 'location',
      label: 'Location',
      render: (item) => item.location,
    },
    {
      key: 'vacancies',
      label: 'Vacancies',
      render: (item) => item.vacancies,
    },
    {
      key: 'deadline',
      label: 'Deadline',
      render: (item) => formatDate(item.applicationDeadline),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          item.status === 'open'
            ? 'bg-green-100 text-green-800'
            : item.status === 'closed'
            ? 'bg-gray-100 text-gray-800'
            : 'bg-purple-100 text-purple-800'
        }`}>
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </span>
      ),
    },
    {
      key: 'applications',
      label: 'Applications',
      render: (item) => item.applicationsCount || 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jobs & Careers</h1>
          <p className="text-gray-600 mt-1">Manage job openings and career opportunities</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-[#006838] text-white rounded-lg hover:bg-[#004d28] transition-colors"
        >
          <FiPlus className="mr-2" />
          Add Job
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search jobs..."
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
          setSelectedJob(item);
          setIsModalOpen(true);
        }}
        onDelete={setDeleteConfirm}
        pagination={data?.pagination}
        onPageChange={setPage}
        loading={isLoading}
        emptyMessage="No jobs found"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedJob(null);
        }}
        title={selectedJob ? 'Edit Job' : 'Add Job'}
        size="xl"
      >
        <JobsForm
          job={selectedJob}
          onSuccess={() => {
            setIsModalOpen(false);
            setSelectedJob(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Job"
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