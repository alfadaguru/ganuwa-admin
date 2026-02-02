import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import {
  FiFileText,
  FiCalendar,
  FiGrid,
  FiFolder,
  FiMail,
  FiUserPlus,
  FiUsers,
  FiTrendingUp,
} from 'react-icons/fi';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  link: string;
}

function StatCard({ title, value, icon: Icon, color, link }: StatCardProps) {
  return (
    <Link
      to={link}
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await dashboardAPI.getStats();
      return response.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006838]"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total News',
      value: stats?.news || 0,
      icon: FiFileText,
      color: 'bg-blue-500',
      link: '/content/news',
    },
    {
      title: 'Total Events',
      value: stats?.events || 0,
      icon: FiCalendar,
      color: 'bg-purple-500',
      link: '/content/events',
    },
    {
      title: 'Total Services',
      value: stats?.services || 0,
      icon: FiGrid,
      color: 'bg-green-500',
      link: '/content/services',
    },
    {
      title: 'Total Projects',
      value: stats?.projects || 0,
      icon: FiFolder,
      color: 'bg-orange-500',
      link: '/content/projects',
    },
    {
      title: 'Contact Messages',
      value: stats?.contacts || 0,
      icon: FiMail,
      color: 'bg-red-500',
      link: '/content/contacts',
    },
    {
      title: 'Subscribers',
      value: stats?.subscribers || 0,
      icon: FiUserPlus,
      color: 'bg-indigo-500',
      link: '/content/subscribers',
    },
    {
      title: 'System Users',
      value: stats?.users || 0,
      icon: FiUsers,
      color: 'bg-gray-700',
      link: '/content/users',
    },
    {
      title: 'Total Content',
      value: stats?.totalContent || 0,
      icon: FiTrendingUp,
      color: 'bg-[#006838]',
      link: '/dashboard',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-[#006838] to-[#004d28] rounded-lg shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome to Ganuwa CMS</h1>
        <p className="text-green-100">
          Manage your Kano State Government website content efficiently
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/content/news"
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#006838] hover:bg-green-50 transition-colors"
          >
            <FiFileText className="w-8 h-8 text-[#006838] mb-2" />
            <span className="font-medium text-gray-900">Create News</span>
          </Link>
          <Link
            to="/content/events"
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#006838] hover:bg-green-50 transition-colors"
          >
            <FiCalendar className="w-8 h-8 text-[#006838] mb-2" />
            <span className="font-medium text-gray-900">Add Event</span>
          </Link>
          <Link
            to="/content/services"
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#006838] hover:bg-green-50 transition-colors"
          >
            <FiGrid className="w-8 h-8 text-[#006838] mb-2" />
            <span className="font-medium text-gray-900">Add Service</span>
          </Link>
          <Link
            to="/content/contacts"
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#006838] hover:bg-green-50 transition-colors"
          >
            <FiMail className="w-8 h-8 text-[#006838] mb-2" />
            <span className="font-medium text-gray-900">View Messages</span>
          </Link>
        </div>
      </div>

      {/* System Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">System Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">CMS Version:</span>
              <span className="font-semibold text-gray-900">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Backend API:</span>
              <span className="font-semibold text-gray-900">v1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Last Updated:</span>
              <span className="font-semibold text-gray-900">
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Content Overview</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">News Articles</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${Math.min((stats?.news || 0) * 2, 100)}%` }}
                  />
                </div>
                <span className="font-semibold text-gray-900">{stats?.news || 0}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Upcoming Events</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500"
                    style={{ width: `${Math.min((stats?.events || 0) * 2, 100)}%` }}
                  />
                </div>
                <span className="font-semibold text-gray-900">{stats?.events || 0}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Active Services</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${Math.min((stats?.services || 0) * 2, 100)}%` }}
                  />
                </div>
                <span className="font-semibold text-gray-900">{stats?.services || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
