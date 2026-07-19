import { Skeleton } from "@/components/ui/skeleton";

export default function ApplicationLoading() {
  return <div className="space-y-6"><Skeleton className="h-20 w-full" /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28 w-full" />)}</div><Skeleton className="h-[420px] w-full" /></div>;
}

