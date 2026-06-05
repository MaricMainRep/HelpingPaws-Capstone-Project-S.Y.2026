"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieLabelRenderProps,
} from "recharts";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAnalytics, exportAnalyticsPDF, exportAnalyticsCSV } from "@/hooks/useAPI";
import {
  Calendar,
  PawPrint,
  Users,
  CalendarCheck,
  Video,
  TrendingUp,
  FileDown,
} from "lucide-react";

const COLORS = ["#3a7d6c", "#57aa95", "#7bc4b5", "#a8ded5", "#d4f1eb"];

type DatePreset = "today" | "7d" | "30d" | "90d" | "all" | "custom";

export default function AnalyticsPage() {
  const [preset, setPreset] = useState<DatePreset>("30d");
  const [customRange, setCustomRange] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const dateRange = useMemo(() => {
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    switch (preset) {
      case "today":
        return {
          startDate: formatDate(today),
          endDate: formatDate(today),
        };
      case "7d": {
        const start = new Date(today);
        start.setDate(start.getDate() - 7);
        return {
          startDate: formatDate(start),
          endDate: formatDate(today),
        };
      }
      case "30d": {
        const start = new Date(today);
        start.setDate(start.getDate() - 30);
        return {
          startDate: formatDate(start),
          endDate: formatDate(today),
        };
      }
      case "90d": {
        const start = new Date(today);
        start.setDate(start.getDate() - 90);
        return {
          startDate: formatDate(start),
          endDate: formatDate(today),
        };
      }
      case "all":
        return { startDate: undefined, endDate: undefined };
      case "custom":
        return customRange
          ? { startDate: customRange.start, endDate: customRange.end }
          : { startDate: undefined, endDate: undefined };
      default:
        return { startDate: undefined, endDate: undefined };
    }
  }, [preset, customRange]);

  const { analytics, isLoading } = useAnalytics(
    dateRange.startDate,
    dateRange.endDate,
  );

  const handleExportPDF = async () => {
    if (!analytics) return;
    setIsExporting(true);
    try {
      await exportAnalyticsPDF(analytics, dateRange.startDate, dateRange.endDate);
    } catch (error) {
      console.error('Failed to export PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      await exportAnalyticsCSV(dateRange.startDate, dateRange.endDate);
    } catch (error) {
      console.error('Failed to export CSV:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const statCards = [
    {
      title: "Total Pets",
      value: analytics?.overview?.totalPets || 0,
      icon: PawPrint,
      color: "bg-[#3a7d6c]",
    },
    {
      title: "Total Appointments",
      value: analytics?.overview?.totalAppointments || 0,
      icon: Calendar,
      color: "bg-[#57aa95]",
    },
    {
      title: "Today's Appointments",
      value: analytics?.overview?.todayAppointments || 0,
      icon: CalendarCheck,
      color: "bg-[#7bc4b5]",
    },
    {
      title: "Active Staff",
      value: analytics?.overview?.activeStaff || 0,
      icon: Users,
      color: "bg-[#a8ded5]",
    },
    {
      title: "Pets Under Monitoring",
      value: analytics?.overview?.petsMonitoring || 0,
      icon: Video,
      color: "bg-[#d4f1eb]",
    },
  ];

  return (
    <Sidebar>
      <PageHeader 
        title="Analytics Dashboard" 
        description="View clinic performance and statistics" 
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2">
          {(["today", "7d", "30d", "90d", "all"] as DatePreset[]).map((p) => (
            <Button
              key={p}
              variant={preset === p ? "default" : "outline"}
              onClick={() => setPreset(p)}
              className={preset === p ? "bg-[#3a7d6c] hover:bg-[#2d6355]" : ""}
            >
              {p === "today"
                ? "Today"
                : p === "7d"
                  ? "7 Days"
                  : p === "30d"
                    ? "30 Days"
                    : p === "90d"
                      ? "90 Days"
                      : "All Time"}
            </Button>
          ))}
          <Button
            variant={preset === "custom" ? "default" : "outline"}
            onClick={() => setPreset("custom")}
            className={
              preset === "custom" ? "bg-[#3a7d6c] hover:bg-[#2d6355]" : ""
            }
          >
            Custom
          </Button>
          {preset === "custom" && (
            <div className="flex gap-2">
              <input
                type="date"
                value={customRange?.start || ""}
                onChange={(e) =>
                  setCustomRange((prev) => ({
                    ...prev!,
                    start: e.target.value,
                  }))
                }
                className="rounded border border-gray-300 px-3 py-2 text-sm"
              />
              <span className="self-center text-muted-foreground">to</span>
              <input
                type="date"
                value={customRange?.end || ""}
                onChange={(e) =>
                  setCustomRange((prev) => ({ ...prev!, end: e.target.value }))
                }
                className="rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportPDF}
              disabled={isExporting || isLoading || !analytics}
              className="flex items-center gap-2"
            >
              <FileDown className="h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Export PDF'}
            </Button>
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={isExporting}
              className="flex items-center gap-2"
            >
              <FileDown className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`rounded-lg p-3 ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold">
                  {isLoading ? "..." : stat.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#3a7d6c]" />
              Appointment Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                Loading...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics?.charts?.appointmentsTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    }
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                    }}
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString()
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#3a7d6c"
                    strokeWidth={2}
                    name="Total"
                  />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="#57aa95"
                    strokeWidth={2}
                    name="Completed"
                  />
                  <Line
                    type="monotone"
                    dataKey="pending"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    name="Pending"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appointments by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                Loading...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics?.charts?.appointmentsByStatus || []}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(props: PieLabelRenderProps) => {
                      const name = props.name || "";
                      const percent = props.percent || 0;
                      return `${name} (${(percent * 100).toFixed(0)}%)`;
                    }}
                  >
                    {(analytics?.charts?.appointmentsByStatus || []).map(
                      (entry: { status: string }, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ),
                    )}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pets by Species</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                Loading...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.charts?.petsBySpecies || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="species" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                    }}
                  />
                  <Bar dataKey="count" fill="#3a7d6c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Staff Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                Loading...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={analytics?.charts?.staffPerformance || []}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="totalAppointments"
                    fill="#3a7d6c"
                    name="Total Appointments"
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar
                    dataKey="completedAppointments"
                    fill="#57aa95"
                    name="Completed"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Room Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                Loading...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics?.charts?.roomsUtilization || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                    }}
                  />
                  <Bar
                    dataKey="activePets"
                    fill="#3a7d6c"
                    name="Active Pets"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </Sidebar>
  );
}
