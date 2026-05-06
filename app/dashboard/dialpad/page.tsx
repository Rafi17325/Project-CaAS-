import DialPad from '@/components/voip/DialPad';

export default function DialPadPage() {
  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900">Dial Pad</h1>
        <p className="text-gray-400 mt-1">Masukkan nomor tujuan dan mulai panggilan VoIP</p>
      </div>
      <DialPad />
    </div>
  );
}
