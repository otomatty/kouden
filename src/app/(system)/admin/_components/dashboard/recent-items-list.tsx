import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface RecentItem {
  id: string;
  primaryText: string;
  secondaryText?: string;
  timestamp?: string;
}

interface RecentItemsListProps {
  title: string;
  description?: string;
  items: RecentItem[];
  isLoading?: boolean;
  itemLimit?: number;
}

export function RecentItemsList({
  title,
  description,
  items,
  isLoading,
  itemLimit = 5,
}: RecentItemsListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          {description && <Skeleton className="mt-1 h-4 w-1/2" />}
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(itemLimit)].map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {items.length === 0 && !isLoading ? (
          <p className="text-sm text-muted-foreground">データがありません。</p>
        ) : (
          <div className="space-y-4">
            {items.slice(0, itemLimit).map((item) => (
              <div key={item.id} className="grid gap-1">
                <p className="text-sm font-medium leading-none">
                  {item.primaryText}
                </p>
                {item.secondaryText && (
                  <p className="text-xs text-muted-foreground">
                    {item.secondaryText}
                  </p>
                )}
                {item.timestamp && (
                  <p className="text-xs text-muted-foreground">
                    {item.timestamp}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
