"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/loading";
import { User, Mail, Building2, Shield, BookOpen, ClipboardList, Repeat, TrendingUp, Image as ImageIcon } from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  institution?: string;
  role: string;
  verified: boolean;
  bio?: string;
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
}

interface Contribution {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  status?: string;
  success?: boolean;
}

interface UserProfileData {
  user: UserProfile;
  contributions: {
    notebooks: Contribution[];
    protocols: Contribution[];
    replications: Contribution[];
  };
  stats: {
    notebookCount: number;
    protocolCount: number;
    replicationCount: number;
    successRate: number;
  };
  isOwnProfile: boolean;
}

export default function UserProfilePage() {
  const params = useParams();
  const userId = params?.id as string;
  const [data, setData] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/user/${userId}`);
        if (res.ok) {
          const userData = await res.json();
          setData(userData);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <LoadingSpinner size="sm" />
          <p className="text-gray-600 mt-4">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-red-600">User not found</p>
        </div>
      </div>
    );
  }

  const { user, contributions, stats, isOwnProfile } = data;

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "reviewer":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center border-4 border-gray-200">
                  <ImageIcon className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
                {user.verified && (
                  <Badge variant="success" className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Verified
                  </Badge>
                )}
                <Badge className={getRoleBadgeColor(user.role)}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </Badge>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                {user.institution && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>{user.institution}</span>
                  </div>
                )}
                {user.bio && (
                  <p className="text-gray-700 mt-3 whitespace-pre-wrap">{user.bio}</p>
                )}
              </div>
            </div>
            {isOwnProfile && (
              <Link href="/profile">
                <button className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50">
                  Edit Profile
                </button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notebooks</CardTitle>
            <BookOpen className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.notebookCount}</div>
            <p className="text-xs text-gray-500">Total notebooks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Protocols</CardTitle>
            <ClipboardList className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.protocolCount}</div>
            <p className="text-xs text-gray-500">Total protocols</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Replications</CardTitle>
            <Repeat className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.replicationCount}</div>
            <p className="text-xs text-gray-500">Total replications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <p className="text-xs text-gray-500">Replication success</p>
          </CardContent>
        </Card>
      </div>

      {/* Contributions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notebooks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Recent Notebooks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contributions.notebooks.length === 0 ? (
              <p className="text-sm text-gray-500">No notebooks yet</p>
            ) : (
              <div className="space-y-2">
                {contributions.notebooks.map((nb) => (
                  <Link
                    key={nb.id}
                    href={`/notebook/${nb.id}`}
                    className="block p-2 rounded hover:bg-gray-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900">{nb.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(nb.updatedAt).toLocaleDateString()}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Protocols */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Recent Protocols
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contributions.protocols.length === 0 ? (
              <p className="text-sm text-gray-500">No protocols yet</p>
            ) : (
              <div className="space-y-2">
                {contributions.protocols.map((p) => (
                  <Link
                    key={p.id}
                    href={`/protocols/${p.id}`}
                    className="block p-2 rounded hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{p.title}</p>
                      {p.status && (
                        <Badge variant={p.status === "published" ? "default" : "secondary"} className="text-xs">
                          {p.status}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(p.updatedAt).toLocaleDateString()}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Replications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="h-5 w-5" />
              Recent Replications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contributions.replications.length === 0 ? (
              <p className="text-sm text-gray-500">No replications yet</p>
            ) : (
              <div className="space-y-2">
                {contributions.replications.map((r) => (
                  <Link
                    key={r.id}
                    href={`/replications/${r.id}`}
                    className="block p-2 rounded hover:bg-gray-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900">{r.protocolTitle}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {r.success !== undefined && (
                        <Badge
                          variant={r.success ? "success" : "warning"}
                          className="text-xs"
                        >
                          {r.success ? "Success" : "Failed"}
                        </Badge>
                      )}
                      <p className="text-xs text-gray-500">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

