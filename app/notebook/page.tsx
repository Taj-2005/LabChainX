import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen } from "lucide-react";

export default function NotebookPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lab Notebook</h1>
          <p className="text-gray-600 mt-1">Your collaborative research notebooks</p>
        </div>
        <Link href="/notebook/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Notebook
          </Button>
        </Link>
      </div>

      {/* Notebooks Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Link key={i} href={`/notebook/${i}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <CardTitle>Experiment #{i}</CardTitle>
                </div>
                <CardDescription>Last updated 2 days ago</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 line-clamp-2">
                  Research notes and observations from the latest experimental run...
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

