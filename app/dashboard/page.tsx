"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, ClipboardList, Repeat, TrendingUp } from "lucide-react";
import { LoadingSpinner } from "@/components/loading";

interface DashboardStats {
  notebooks: number;
  protocols: number;
  draftProtocols: number;
  replications: number;
  pendingVerifications: number;
  successRate: number;
}

interface Activity {
  type: "notebook" | "protocol" | "replication";
  title: string;
  action: string;
  timestamp: string;
  status?: string;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

function getActivityColor(type: string, status?: string): string {
  if (type === "protocol" && status === "published") return "bg-blue-600";
  if (type === "replication" && status === "verified") return "bg-green-600";
  return "bg-yellow-600";
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch stats
        const statsRes = await fetch("/api/dashboard/stats");
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.stats);
        }

        // Fetch activity
        const activityRes = await fetch("/api/dashboard/activity");
        if (activityRes.ok) {
          const activityData = await activityRes.json();
          setActivities(activityData.activities || []);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back to your lab workspace</p>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <LoadingSpinner size="sm" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Notebooks</CardTitle>
              <BookOpen className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.notebooks || 0}</div>
              <p className="text-xs text-gray-500">Total notebooks</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Protocols</CardTitle>
              <ClipboardList className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.protocols || 0}</div>
              <p className="text-xs text-gray-500">
                {stats?.draftProtocols || 0} draft{stats?.draftProtocols !== 1 ? "s" : ""} in progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Replications</CardTitle>
              <Repeat className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.replications || 0}</div>
              <p className="text-xs text-gray-500">
                {stats?.pendingVerifications || 0} pending verification
                {stats?.pendingVerifications !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.successRate || 0}%</div>
              <p className="text-xs text-gray-500">Completed replications</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest lab activities and updates</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <LoadingSpinner size="sm" />
            </div>
          ) : activities.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-4">
              {activities.map((activity, idx) => (
                <div key={idx} className="flex items-center space-x-4">
                  <div
                    className={`h-2 w-2 rounded-full ${getActivityColor(activity.type, activity.status)}`}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {activity.action} {activity.type === "protocol" ? "protocol" : activity.type}{" "}
                      &quot;{activity.title}&quot;
                    </p>
                    <p className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

