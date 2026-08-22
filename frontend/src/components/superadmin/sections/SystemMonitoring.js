import SectionLayout from "../SectionLayout";
const SECTION = { title: "System Monitoring", icon: "🖥️", description: "Real-time infrastructure health monitoring — CPU, memory, storage, queues, and cron jobs." };
const TABS = [
  { id: "cpu", label: "CPU", href: "/superadmin/monitoring/cpu", icon: "⚙️", description: "CPU usage and server load monitoring.", features: ["Real-time CPU percentage usage", "Per-core utilization graphs", "CPU spike alerts", "Historical load charts"] },
  { id: "ram", label: "RAM", href: "/superadmin/monitoring/ram", icon: "🧠", description: "Memory utilization and leak detection.", features: ["Used vs free memory", "Memory usage trends", "OOM alert configuration", "Process memory breakdown"] },
  { id: "storage", label: "Storage", href: "/superadmin/monitoring/storage", icon: "💽", description: "Disk usage and I/O monitoring.", features: ["Disk usage per volume", "S3 storage usage", "Database size tracking", "Storage growth forecast"] },
  { id: "queue", label: "Queue", href: "/superadmin/monitoring/queue", icon: "📬", description: "Job queue length and processing metrics.", features: ["Queue depth monitoring", "Failed job alerts", "Job processing rate", "Queue worker health"] },
  { id: "cron", label: "Cron Jobs", href: "/superadmin/monitoring/cron", icon: "⏰", description: "Scheduled task status and execution logs.", features: ["All scheduled cron jobs", "Last run time and status", "Failed cron alerts", "Manual trigger option"] },
  { id: "redis", label: "Redis", href: "/superadmin/monitoring/redis", icon: "🔴", description: "Redis cache and session monitoring.", features: ["Redis memory usage", "Cache hit and miss rates", "Connected clients", "Key expiry tracking"] },
  { id: "cache", label: "Cache", href: "/superadmin/monitoring/cache", icon: "⚡", description: "Application cache performance.", features: ["Cache size and hit rate", "Flush specific cache keys", "Per-endpoint cache stats", "Cache invalidation triggers"] },
  { id: "errors", label: "Error Logs", href: "/superadmin/monitoring/errors", icon: "🔴", description: "Application error and exception tracking.", features: ["Real-time error feed", "Error grouping by type", "Stack trace viewer", "Alert on error spike"] },
];
export default function SystemMonitoring() { return <SectionLayout section={SECTION} tabs={TABS} />; }
