import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface ServiceStatus {
  name: string;
  status: "operational" | "degraded" | "outage" | "loading";
}

interface ServiceStatusTabsProps {
  services: ServiceStatus[];
  isLoading?: boolean;
}

const statusVariantMap = {
  operational: "success",
  degraded: "warning",
  outage: "destructive",
  loading: "default",
} as const;

export function ServiceStatusTabs({ services, isLoading }: ServiceStatusTabsProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <Tabs defaultValue={services[0]?.name.toLowerCase() ?? ""}>
      <TabsList>
        {services.map((service) => (
          <TabsTrigger key={service.name} value={service.name.toLowerCase()}>
            {service.name}
          </TabsTrigger>
        ))}
      </TabsList>
      {services.map((service) => (
        <TabsContent key={`${service.name}-content`} value={service.name.toLowerCase()}>
          <div className="flex items-center space-x-2">
            <p>{service.name} Status:</p>
            <Badge variant={statusVariantMap[service.status]}>
              {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
            </Badge>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
