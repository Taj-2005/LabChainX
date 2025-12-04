import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Repeat, CheckCircle, Clock } from "lucide-react";

export default function ReplicationsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Replications</h1>
        <p className="text-gray-600 mt-1">Track experiment replications and verifications</p>
      </div>

      {/* Replications List */}
      <div className="space-y-4">
        {[
          {
            id: 1,
            protocol: "Cell Culture Protocol",
            replicator: "Dr. Jane Smith - MIT",
            status: "Verified",
            date: "2024-01-15",
          },
          {
            id: 2,
            protocol: "PCR Amplification",
            replicator: "Dr. John Doe - Stanford",
            status: "Pending",
            date: "2024-01-20",
          },
          {
            id: 3,
            protocol: "Protein Extraction",
            replicator: "Dr. Alice Johnson - Harvard",
            status: "Verified",
            date: "2024-01-18",
          },
        ].map((replication) => (
          <Card key={replication.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Repeat className="h-5 w-5 text-blue-600" />
                  <div>
                    <CardTitle>{replication.protocol}</CardTitle>
                    <CardDescription>{replication.replicator}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {replication.status === "Verified" ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-700">Verified</span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-5 w-5 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-700">Pending</span>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Started: {replication.date} • Verification network enabled
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

