import { startTeslaOAuth } from '../../utils/tesla';

interface TeslaConnectProps {
  onConnecting?: () => void;
}

export default function TeslaConnect({ onConnecting }: TeslaConnectProps) {
  const handleConnect = () => {
    onConnecting?.();
    startTeslaOAuth();
  };

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Tesla car silhouette */}
      <div className="relative w-48 h-48 flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-red-500/10 to-transparent rounded-full blur-3xl" />
        <svg
          viewBox="0 0 100 60"
          className="w-40 h-24 text-white/80"
          fill="currentColor"
        >
          <path d="M15 45 Q15 35 25 30 L35 20 Q45 15 50 15 Q55 15 65 20 L75 30 Q85 35 85 45 L85 48 Q85 50 83 50 L75 50 Q73 50 73 48 Q73 43 70 43 Q67 43 67 48 Q67 50 65 50 L35 50 Q33 50 33 48 Q33 43 30 43 Q27 43 27 48 Q27 50 25 50 L17 50 Q15 50 15 48 Z" />
          <path d="M30 28 L38 22 Q45 18 50 18 Q55 18 62 22 L70 28 Q60 26 50 26 Q40 26 30 28 Z" opacity="0.3" />
        </svg>
      </div>

      {/* Heading */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
          SF Street Cleaning
        </h1>
        <p className="text-lg text-zinc-400 max-w-md">
          Connect your Tesla to see when street cleaning happens where you're parked.
          Never get a ticket again.
        </p>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg w-full text-center">
        {[
          { step: '1', label: 'Connect your Tesla' },
          { step: '2', label: 'We read your GPS' },
          { step: '3', label: 'See cleaning times' },
        ].map(({ step, label }) => (
          <div key={step} className="flex flex-col items-center gap-2 p-3">
            <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold text-white">
              {step}
            </span>
            <span className="text-sm text-zinc-400">{label}</span>
          </div>
        ))}
      </div>

      {/* Connect button */}
      <button
        onClick={handleConnect}
        className="px-8 py-3.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-red-600/25 active:scale-[0.98] text-lg cursor-pointer"
      >
        Connect Tesla
      </button>

      <p className="text-xs text-zinc-600 max-w-sm text-center">
        We only read your car's location. No data is stored. Works exclusively in San Francisco.
      </p>
    </div>
  );
}
