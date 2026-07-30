import { Card } from '@/components/ui/Card';

export default function OfflinePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-[18px] py-[18px]">
      <h1 className="text-[24px] leading-tight font-extrabold tracking-[-0.03em] text-ink">
        You&rsquo;re offline
      </h1>
      <Card className="px-[15px] py-[13px]">
        <p className="text-center text-[15px] leading-[1.45] font-medium text-ink-2">
          Live captions need a connection. Phrase packs, SOS and saved phrases will be available
          offline once M4 lands.
        </p>
      </Card>
    </main>
  );
}
