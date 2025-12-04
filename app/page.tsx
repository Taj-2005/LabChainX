import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FlaskConical, Users, Shield, BookOpen } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
        <div className="text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            LabChain
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
            The scientific reproducibility and collaboration platform. Build,
            share, and verify experiments with transparency and trust.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/signup">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="lg">
                View Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <FlaskConical className="h-10 w-10 text-blue-600 mb-4" />
              <CardTitle>Protocol Builder</CardTitle>
              <CardDescription>
                Create structured protocols with drag-and-drop simplicity
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BookOpen className="h-10 w-10 text-blue-600 mb-4" />
              <CardTitle>Lab Notebook</CardTitle>
              <CardDescription>
                Real-time collaborative notebooks with version control
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-blue-600 mb-4" />
              <CardTitle>Collaboration</CardTitle>
              <CardDescription>
                Work together seamlessly with live synchronization
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-blue-600 mb-4" />
              <CardTitle>Verification</CardTitle>
              <CardDescription>
                Cryptographic signing for result integrity
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
