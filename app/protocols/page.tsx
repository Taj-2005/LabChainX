import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ClipboardList } from "lucide-react";

export default function ProtocolsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Protocols</h1>
          <p className="text-gray-600 mt-1">Build and manage your experimental protocols</p>
        </div>
        <Link href="/protocols/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Protocol
          </Button>
        </Link>
      </div>

      {/* Protocols Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { id: 1, name: "Cell Culture Protocol", version: "v2.1", status: "Published" },
          { id: 2, name: "PCR Amplification", version: "v1.0", status: "Draft" },
          { id: 3, name: "Protein Extraction", version: "v3.2", status: "Published" },
        ].map((protocol) => (
          <Link key={protocol.id} href={`/protocols/${protocol.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ClipboardList className="h-5 w-5 text-blue-600" />
                    <CardTitle>{protocol.name}</CardTitle>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                    {protocol.version}
                  </span>
                </div>
                <CardDescription>Status: {protocol.status}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 line-clamp-2">
                  Standardized protocol with detailed steps, reagents, and timing...
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

