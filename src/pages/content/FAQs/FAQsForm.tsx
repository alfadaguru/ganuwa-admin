import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { faqsAPI } from '../../../services/api';
import FormField from '../../../components/common/FormField';

interface FAQ {
  _id: string;
  question: { en?: string };
  answer: { en?: string };
  category?: string;
  displayOrder: number;
  isActive: boolean;
}

const faqSchema = z.object({
  questionEn: z.string().min(1, 'Question is required'),
  answerEn: z.string().min(1, 'Answer is required'),
  category: z.enum(['general', 'services', 'tax', 'education', 'health', 'business', 'legal']).optional(),
  displayOrder: z.number().min(0),
  isActive: z.boolean(),
});

type FAQFormData = z.infer<typeof faqSchema>;

interface FAQsFormProps {
  faq?: FAQ | null;
  onSuccess: () => void;
}

export default function FAQsForm({ faq, onSuccess }: FAQsFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!faq;

  const { register, handleSubmit, formState: { errors } } = useForm<FAQFormData>({
    resolver: zodResolver(faqSchema),
    defaultValues: {
      questionEn: faq?.question?.en || '',
      answerEn: faq?.answer?.en || '',
      category: faq?.category as any || 'general',
      displayOrder: faq?.displayOrder || 0,
      isActive: faq?.isActive ?? true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => faqsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      toast.success('FAQ created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create FAQ');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => faqsAPI.update(faq!._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      toast.success('FAQ updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update FAQ');
    },
  });

  const onSubmit = (data: FAQFormData) => {
    const payload = {
      question: { en: data.questionEn },
      answer: { en: data.answerEn },
      category: data.category || undefined,
      displayOrder: Number(data.displayOrder),
      isActive: data.isActive,
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <FormField label="Question" name="questionEn" register={register} error={errors.questionEn} required />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Answer <span className="text-red-500">*</span></label>
          <textarea rows={5} {...register('answerEn')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]" />
          {errors.answerEn && <p className="mt-1 text-sm text-red-600">{errors.answerEn.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select {...register('category')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006838]">
              <option value="general">General</option>
              <option value="services">Services</option>
              <option value="tax">Tax</option>
              <option value="education">Education</option>
              <option value="health">Health</option>
              <option value="business">Business</option>
              <option value="legal">Legal</option>
            </select>
          </div>

          <FormField label="Display Order" name="displayOrder" type="number" register={register} error={errors.displayOrder} required />
        </div>

        <label className="flex items-center space-x-2">
          <input type="checkbox" {...register('isActive')} className="w-4 h-4 text-[#006838] border-gray-300 rounded focus:ring-[#006838]" />
          <span className="text-sm font-medium text-gray-700">Active</span>
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t">
        <button type="button" onClick={onSuccess} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
        <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-6 py-2 bg-[#006838] text-white rounded-lg hover:bg-[#004d28] disabled:opacity-50">
          {createMutation.isPending || updateMutation.isPending ? 'Saving...' : isEditing ? 'Update FAQ' : 'Create FAQ'}
        </button>
      </div>
    </form>
  );
}
