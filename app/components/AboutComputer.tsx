import Image from 'next/image';

export default function AboutComputer() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-start gap-6">
        <div className="relative w-16 h-16">
          <Image
            src="/about-computer.png"
            alt="ryOS Logo"
            width={64}
            height={64}
            className="pixelated"
          />
        </div>
        <div className="space-y-2">
          <div className="text-sm">
            <p>Built-in Memory: 21MB</p>
            <p>Virtual Memory: Off</p>
            <p>Largest Unused Block: 17.8MB</p>
          </div>
          <p className="text-xs text-gray-600">© Peiqing Ye. 1998-2025</p>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-black/20">
        <div className="flex items-center gap-2">
          <div className="text-sm font-bold">System</div>
          <div className="flex-1 h-4 bg-gray-200 rounded">
            <div className="h-full w-[35%] bg-gray-600 rounded" />
          </div>
          <div className="text-sm">8.5 MB</div>
        </div>
      </div>
    </div>
  );
} 