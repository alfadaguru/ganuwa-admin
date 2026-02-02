import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiSearch } from 'react-icons/fi';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import DataTable from '../../../components/common/DataTable';
import Modal from '../../../components/common/Modal';
import { eventsAPI } from '../../../services/api';
import EventForm from './EventsForm';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface Event {
  _id: string;
  title: {
    en: string;
    ha?: string;
    ar?: string;
  };
  slug: string;
  description?: {
    en?: string;
    ha?: string;
    ar?: string;
  };
  category: 'government' | 'public' | 'community' | 'cultural' | 'sports' | 'education' | 'health';
  eventDate: string;
  startTime?: string;
  endTime?: string;
  venue?: {
    name?: string;
    address?: string;
    lga?: string;
  };
  organizer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  registrationRequired: boolean;
  registrationUrl?: string;
  capacity?: number;
  attendees: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  featured: boolean;
  featuredImage?: {
    url?: string;
    publicId?: string;
    alt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function EventsList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Event | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['events', page, search],
    queryFn: async () => {
      const response = await eventsAPI.getAll({ page, limit: 10, search });
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => eventsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event deleted successfully');
      setDeleteConfirm(null);
    },
    onError: () => {
      toast.error('Failed to delete event');
    },
  });

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      upcoming: 'bg-blue-100 text-blue-800',
      ongoing: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const columns: Column<Event>[] = [
    {
      key: 'title',
      label: 'Event Title',
      sortable: true,
      render: (item) => (
        <div className="max-w-md">
          <p className="font-medium text-gray-900">{item.title.en}</p>
          {item.venue?.name && (
            <p className="text-sm text-gray-500">📍 {item.venue.name}</p>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (item) => (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 capitalize">
          {item.category}
        </span>
      ),
    },
    {
      key: 'eventDate',
      label: 'Date',
      sortable: true,
      render: (item) => (
        <div>
          <p className="font-medium text-gray-900">{format(new Date(item.eventDate), 'MMM dd, yyyy')}</p>
          {item.startTime && (
            <p className="text-sm text-gray-500">{item.startTime} - {item.endTime || 'TBD'}</p>
          )}
        </div>
      ),
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
      key: 'attendees',
      label: 'Attendance',
      sortable: true,
      render: (item) => (
        <div className="text-sm">
          <p className="font-medium text-gray-900">{item.attendees}</p>
          {item.capacity && (
            <p className="text-gray-500">/ {item.capacity}</p>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events Management</h1>
          <p className="text-gray-600 mt-1">Manage government and public events</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-[#006838] text-white rounded-lg hover:bg-[#004d28] transition-colors"
        >
          <FiPlus className="mr-2" />
          Add Event
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search events..."
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
          setSelectedEvent(item);
          setIsModalOpen(true);
        }}
        onDelete={setDeleteConfirm}
        pagination={data?.pagination}
        onPageChange={setPage}
        loading={isLoading}
        emptyMessage="No events found"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvent(null);
        }}
        title={selectedEvent ? 'Edit Event' : 'Create Event'}
        size="xl"
      >
        <EventForm
          event={selectedEvent}
          onSuccess={() => {
            setIsModalOpen(false);
            setSelectedEvent(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Event"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete event <strong>{deleteConfirm?.title.en}</strong>? This action cannot be undone.
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
