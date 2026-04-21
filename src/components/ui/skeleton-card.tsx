export const SkeletonCard = () => {
  return (
    <div className="rounded-2xl overflow-hidden bg-card border border-border">
      {/* Image Skeleton */}
      <div className="aspect-[4/3] skeleton-premium" />

      {/* Content Skeleton */}
      <div className="p-5 space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <div className="h-5 w-3/4 skeleton-premium rounded" />
          <div className="h-4 w-1/2 skeleton-premium rounded" />
        </div>

        {/* Info Row */}
        <div className="flex justify-between">
          <div className="h-4 w-20 skeleton-premium rounded" />
          <div className="h-4 w-24 skeleton-premium rounded" />
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="h-2 w-full skeleton-premium rounded-full" />
          <div className="flex justify-between">
            <div className="h-3 w-28 skeleton-premium rounded" />
            <div className="h-3 w-12 skeleton-premium rounded" />
          </div>
        </div>

        {/* Button */}
        <div className="flex gap-3 pt-2">
          <div className="h-10 flex-1 skeleton-premium rounded-lg" />
          <div className="h-10 w-10 skeleton-premium rounded-lg" />
        </div>
      </div>
    </div>
  );
};
