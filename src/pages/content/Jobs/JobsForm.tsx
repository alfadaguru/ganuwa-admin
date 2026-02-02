import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { jobsAPI, mdasAPI } from '../../../services/api';
import FormField from '../../../components/common/FormField';

interface Job {
  _id: string;
  title: { en?: string; ha?: string; ar?: string };
  description: { en?: string; ha?: string; ar?: string };
  department: string;
  mda?: string;
  location: string;
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship';
  salaryRange: { min: number; max: number; currency: string };
  requirements: { en?: string; ha?: string; ar?: string };
  responsibilities: { en?: string; ha?: string; ar?: string };
  applicationDeadline: string;
  vacancies: number;
  contactEmail: string;
  status: 'open' | 'closed' | 'filled';
}

const jobSchema = z.object({
  titleEn: z.string().min(1, 'Title (English) is required'),
  titleHa: z.string().optional(),
  titleAr: z.string().optional(),
  descriptionEn: z.string().min(1, 'Description (English) is required'),
  descriptionHa: z.string().optional(),
  descriptionAr: z.string().optional(),
  department: z.string().min(1, 'Department is required'),
  mda: z.string().optional(),
  location: z.string().min(1, 'Location is required'),
  jobType: z.enum(['full-time', 'part-time', 'contract', 'internship']),
  salaryMin: z.number().min(0, 'Minimum salary must be positive'),
  salaryMax: z.number().min(0, 'Maximum salary must be positive'),
  currency: z.enum(['NGN', 'USD']),
  requirementsEn: z.string().optional(),
  requirementsHa: z.string().optional(),
  requirementsAr: z.string().optional(),
  responsibilitiesEn: z.string().optional(),
  responsibilitiesHa: z.string().optional(),
  responsibilitiesAr: z.string().optional(),
  applicationDeadline: z.string().min(1, 'Application deadline is required'),
  vacancies: z.number().min(1, 'At least 1 vacancy is required'),
  contactEmail: z.string().email('Invalid email address'),
  status: z.enum(['open', 'closed', 'filled']),
});

type JobFormData = z.infer<typeof jobSchema>;

interface JobsFormProps {
  job?: Job | null;
  onSuccess: () => void;
}

export default function JobsForm({ job, onSuccess }: JobsFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!job;
  const [activeTab, setActiveTab] = useState<'en' | 'ha' | 'ar'>('en');

  const { data: mdasData } = useQuery({
    queryKey: ['mdas'],
    queryFn: async () => {
      const response = await mdasAPI.getAll({ limit: 100 });
      return response.data;
    },
  });

  const { register, handleSubmit, formState: { errors } } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      titleEn: job?.title?.en || '',
      titleHa: job?.title?.ha || '',
      titleAr: job?.title?.ar || '',
      descriptionEn: job?.description?.en || '',
      descriptionHa: job?.description?.ha || '',
      descriptionAr: job?.description?.ar || '',
      department: job?.department || '',
      mda: job?.mda || '',
      location: job?.location || '',
      jobType: job?.jobType || 'full-time',
      salaryMin: job?.salaryRange?.min || 0,
      salaryMax: job?.salaryRange?.max || 0,
      currency: job?.salaryRange?.currency as any || 'NGN',
      requirementsEn: job?.requirements?.en || '',
      requirementsHa: job?.requirements?.ha || '',
      requirementsAr: job?.requirements?.ar || '',
      responsibilitiesEn: job?.responsibilities?.en || '',
      responsibilitiesHa: job?.responsibilities?.ha || '',
      responsibilitiesAr: job?.responsibilities?.ar || '',
      applicationDeadline: job?.applicationDeadline ? new Date(job.applicationDeadline).toISOString().slice(0, 10) : '',
      vacancies: job?.vacancies || 1,
      contactEmail: job?.contactEmail || '',
      status: job?.status || 'open',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => jobsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create job');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => jobsAPI.update(job!._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update job');
    },
  });

  const onSubmit = (data: JobFormData) => {
    const payload = {
      title: {
        en: data.titleEn,
        ha: data.titleHa || undefined,
        ar: data.titleAr || undefined,
      },
      description: {
        en: data.descriptionEn,
        ha: data.descriptionHa || undefined,
        ar: data.descriptionAr || undefined,
      },
      department: data.department,
      mda: data.mda || undefined,
      location: data.location,
      jobType: data.jobType,
      salaryRange: {
        min: Number(data.salaryMin),
        max: Number(data.salaryMax),
        currency: data.currency,
      },
      requirements: {
        en: data.requirementsEn || undefined,
        ha: data.requirementsHa || undefined,
        ar: data.requirementsAr || undefined,
      },
      responsibilities: {
        en: data.responsibilitiesEn || undefined,
        ha: data.responsibilitiesHa || undefined,
        ar: data.responsibilitiesAr || undefined,
      },
      applicationDeadline: new Date(data.applicationDeadline).toISOString(),
      vacancies: Number(data.vacancies),
      contactEmail: data.contactEmail,
      status: data.status,
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Language Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'en', label: 'English' },
            { key: 'ha', label: 'Hausa' },
            { key: 'ar', label: 'Arabic' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-[#006838] text-[#006838]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Multilingual Fields */}
      <div className="space-y-4">
        {activeTab === 'en' && (
          <>
            <FormField label="Job Title (English)" name="titleEn" register={register} error={errors.titleEn} required />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (English) <span className="text-red-500">*</span>
              </label>
              <textarea rows={4} {...register('descriptionEn')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]" />
              {errors.descriptionEn && <p className="mt-1 text-sm text-red-600">{errors.descriptionEn.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Requirements (English)</label>
              <textarea rows={3} {...register('requirementsEn')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]" placeholder="Enter requirements, one per line" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Responsibilities (English)</label>
              <textarea rows={3} {...register('responsibilitiesEn')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]" placeholder="Enter responsibilities, one per line" />
            </div>
          </>
        )}

        {activeTab === 'ha' && (
          <>
            <FormField label="Job Title (Hausa)" name="titleHa" register={register} error={errors.titleHa} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (Hausa)</label>
              <textarea rows={4} {...register('descriptionHa')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Requirements (Hausa)</label>
              <textarea rows={3} {...register('requirementsHa')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Responsibilities (Hausa)</label>
              <textarea rows={3} {...register('responsibilitiesHa')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]" />
            </div>
          </>
        )}

        {activeTab === 'ar' && (
          <>
            <FormField label="Job Title (Arabic)" name="titleAr" register={register} error={errors.titleAr} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (Arabic)</label>
              <textarea rows={4} {...register('descriptionAr')} dir="rtl" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Requirements (Arabic)</label>
              <textarea rows={3} {...register('requirementsAr')} dir="rtl" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Responsibilities (Arabic)</label>
              <textarea rows={3} {...register('responsibilitiesAr')} dir="rtl" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]" />
            </div>
          </>
        )}
      </div>

      {/* Job Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="Department" name="department" register={register} error={errors.department} required />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">MDA (Optional)</label>
          <select {...register('mda')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]">
            <option value="">Select MDA</option>
            {mdasData?.data?.map((mda: any) => (
              <option key={mda._id} value={mda._id}>{mda.name.en}</option>
            ))}
          </select>
        </div>

        <FormField label="Location" name="location" register={register} error={errors.location} required />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Job Type <span className="text-red-500">*</span>
          </label>
          <select {...register('jobType')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]">
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
          </select>
        </div>
      </div>

      {/* Salary Range */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Salary Range</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField label="Minimum" name="salaryMin" type="number" register={register} error={errors.salaryMin} required />
          <FormField label="Maximum" name="salaryMax" type="number" register={register} error={errors.salaryMax} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency <span className="text-red-500">*</span>
            </label>
            <select {...register('currency')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]">
              <option value="NGN">NGN</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
      </div>

      {/* Other Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="Application Deadline" name="applicationDeadline" type="date" register={register} error={errors.applicationDeadline} required />
        <FormField label="Number of Vacancies" name="vacancies" type="number" register={register} error={errors.vacancies} required />
        <FormField label="Contact Email" name="contactEmail" type="email" register={register} error={errors.contactEmail} required />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status <span className="text-red-500">*</span>
          </label>
          <select {...register('status')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]">
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="filled">Filled</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t">
        <button type="button" onClick={onSuccess} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
        <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-6 py-2 bg-[#006838] text-white rounded-lg hover:bg-[#004d28] transition-colors disabled:opacity-50">
          {createMutation.isPending || updateMutation.isPending ? 'Saving...' : isEditing ? 'Update Job' : 'Create Job'}
        </button>
      </div>
    </form>
  );
}