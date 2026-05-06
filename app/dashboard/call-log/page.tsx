import CallLogTable from '@/components/voip/CallLogTable';

export default function CallLogPage() {
  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900">Call Log</h1>
        <p className="text-gray-400 mt-1">Riwayat semua panggilan VoIP kamu</p>
      </div>
      <CallLogTable />
    </div>
  );
}
