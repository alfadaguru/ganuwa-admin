import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiSearch, FiEdit } from 'react-icons/fi';
import { toast } from 'react-toastify';
import DataTable from '../../../components/common/DataTable';
import Modal from '../../../components/common/Modal';
import { foiRequestsAPI } from '../../../services/api';
import FOIRequestsForm from './FOIRequestsForm';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface FOIRequest {
  _id: string;
  requestNumber: string;
  requesterName: string;
  subject: string;
  requestType: 'information' | 'document' | 'data' | 'other';
  status: 'pending' | 'in-review' | 'approved' | 'rejected' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  assignedTo?: { _id: string; name: string };
}

export default function FOIRequestsList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<FOIRequest | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<FOIRequest | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['foiRequests', page, search, statusFilter],
    queryFn: async () => {
      const response = await foiRequestsAPI.getAll({
        page,
        limit: 10,
        search,
        status: statusFilter || undefined,
      });
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => foiRequestsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foiRequests'] });
      toast.success('FOI request deleted successfully');
      setDeleteConfirm(null);
    },
    onError: () => {
      toast.error('Failed to delete FOI request');
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const columns: Column<FOIRequest>[] = [
    {
      key: 'requestNumber',
      label: 'Request #',
      sortable: true,
      render: (item) => (
        <div>
          <p className="font-medium text-gray-900">{item.requestNumber}</p>
          <p className="text-sm text-gray-500">{item.requesterName}</p>
        </div>
      ),
    },
    {
      key: 'subject',
      label: 'Subject',
      render: (item) => (
        <div>
          <p className="font-medium text-gray-900">{item.subject}</p>
          <p className="text-sm text-gray-500 capitalize">{item.requestType}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          item.status === 'completed'
            ? 'bg-green-100 text-green-800'
            : item.status === 'approved'
            ? 'bg-blue-100 text-blue-800'
            : item.status === 'rejected'
            ? 'bg-red-100 text-red-800'
            : item.status === 'in-review'
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {item.status.replace('-', ' ').charAt(0).toUpperCase() + item.status.slice(1)}
        </span>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (item) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          item.priority === 'urgent'
            ? 'bg-red-100 text-red-800'
            : item.priority === 'high'
            ? 'bg-orange-100 text-orange-800'
            : item.priority === 'medium'
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
        </span>
      ),
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      render: (item) => formatDate(item.dueDate),
    },
    {
      key: 'assignedTo',
      label: 'Assigned To',
      render: (item) => item.assignedTo?.name || 'Unassigned',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">FOI Requests</h1>
          <p className="text-gray-600 mt-1">Manage Freedom of Information requests</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search FOI requests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in-review">In Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        onEdit={(item) => {
          setSelectedRequest(item);
          setIsModalOpen(true);
        }}
        onDelete={setDeleteConfirm}
        pagination={data?.pagination}
        onPageChange={setPage}
        loading={isLoading}
        emptyMessage="No FOI requests found"
        editLabel="Process"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRequest(null);
        }}
        title={`Process FOI Request - ${selectedRequest?.requestNumber}`}
        size="xl"
      >
        <FOIRequestsForm
          request={selectedRequest}
          onSuccess={() => {
            setIsModalOpen(false);
            setSelectedRequest(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete FOI Request"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete FOI request <strong>{deleteConfirm?.requestNumber}</strong>? This action cannot be undone.
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