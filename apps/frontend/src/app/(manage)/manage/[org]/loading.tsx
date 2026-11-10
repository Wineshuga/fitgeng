import { Spinner } from '@/components/ui/Spinner';

export default function ManageLoading() {
  return (
    <div className="flex justify-center py-16 text-brand-600">
      <Spinner size="lg" />
    </div>
  );
}
