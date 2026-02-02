import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';
import DataTable from '../../../components/common/DataTable';
import Modal from '../../../components/common/Modal';
import { heroBannersAPI } from '../../../services/api';
import { deleteFile } from '../../../services/uploadService';
import HeroBannerForm from './HeroBannerForm';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface HeroBanner {
  _id: string;
  title: {
    en: string;
    ha: string;
    ar: string;
  };
  subtitle?: {
    en: string;
    ha: string;
    ar: string;
  };
  description?: {
    en: string;
    ha: string;
    ar: string;
  };
  image: {
    url: string;
    publicId: string;
    alt: string;
  };
  ctaButton?: {
    text: {
      en: string;
      ha: string;
      ar: string;
    };
    url: string;
    openInNewTab: boolean;
  };
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function HeroBannersList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HeroBanner | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<HeroBanner | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['hero-banners', page, search],
    queryFn: async () => {
      const response = await heroBannersAPI.getAll({ page, limit: 10, search });
      return response.data; // Axios response.data contains the API response
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (banner: HeroBanner) => {
      // First delete the banner from database
      await heroBannersAPI.delete(banner._id);
      // Then delete the image from S3
      if (banner.image.publicId) {
        try {
          await deleteFile(banner.image.publicId);
        } catch (error) {
          console.error('Error deleting image from S3:', error);
          // Continue even if S3 deletion fails
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-banners'] });
      toast.success('Hero banner deleted successfully');
      setDeleteConfirm(null);
    },
  });

  const columns: Column<HeroBanner>[] = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (item) => (
        <div>
          <p className="font-medium text-gray-900">{item.title.en}</p>
          {item.subtitle && <p className="text-sm text-gray-500">{item.subtitle.en}</p>}
        </div>
      ),
    },
    {
      key: 'displayOrder',
      label: 'Order',
      sortable: true,
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
          <h1 className="text-2xl font-bold text-gray-900">Hero Banners</h1>
          <p className="text-gray-600 mt-1">Manage homepage hero banners</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-[#006838] text-white rounded-lg hover:bg-[#004d28] transition-colors"
        >
          <FiPlus className="mr-2" />
          Add Banner
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search banners..."
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
          setSelectedItem(item);
          setIsModalOpen(true);
        }}
        onDelete={setDeleteConfirm}
        pagination={data?.pagination}
        onPageChange={setPage}
        loading={isLoading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedItem(null);
        }}
        title={selectedItem ? 'Edit Hero Banner' : 'Create Hero Banner'}
        size="lg"
      >
        <HeroBannerForm
          banner={selectedItem}
          onSuccess={() => {
            setIsModalOpen(false);
            setSelectedItem(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Hero Banner"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete "{deleteConfirm?.title.en}"?
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)}
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
