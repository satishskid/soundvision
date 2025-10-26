import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { APP_LOGO, APP_TITLE } from "@/const";
import { useLocation } from "wouter";
import { Eye, Ear, Calendar, Download, ArrowLeft, TrendingUp, AlertCircle } from "lucide-react";
import { useEffect } from "react";

export default function Results() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated) {
    return null;
  }

  // Mock data - will be replaced with real API calls
  const visionHistory = [
    {
      id: '1',
      date: new Date('2024-01-15'),
      type: 'Vision Screening',
      status: 'pass',
      acuity: '20/20',
      notes: 'Normal visual acuity, no concerns detected',
    },
    {
      id: '2',
      date: new Date('2024-01-10'),
      type: 'Vision Screening',
      status: 'refer',
      acuity: '20/40',
      notes: 'Reduced visual acuity in left eye, recommend professional evaluation',
    },
  ];

  const hearingHistory = [
    {
      id: '1',
      date: new Date('2024-01-15'),
      type: 'Hearing Screening',
      status: 'pass',
      threshold: '20 dB HL',
      notes: 'Normal hearing thresholds across all frequencies',
    },
  ];

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; label: string }> = {
      pass: { color: 'bg-green-100 text-green-800', label: 'Pass' },
      refer: { color: 'bg-orange-100 text-orange-800', label: 'Refer' },
      inconclusive: { color: 'bg-gray-100 text-gray-800', label: 'Inconclusive' },
    };
    const { color, label } = config[status] || config.inconclusive;
    return <Badge className={color}>{label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-white/80 backdrop-blur-sm">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            {APP_LOGO && <img src={APP_LOGO} alt="Logo" className="h-8 w-8" />}
            <h1 className="text-xl font-bold text-primary">{APP_TITLE}</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setLocation('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </header>

      <main className="container py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">Screening Results & History</h2>
          <p className="text-muted-foreground">
            View your past screening results and track changes over time
          </p>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Screenings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">2 vision, 1 hearing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Vision Test</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Jan 15</div>
              <p className="text-xs text-muted-foreground">Result: Pass</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Hearing Test</CardTitle>
              <Ear className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Jan 15</div>
              <p className="text-xs text-muted-foreground">Result: Pass</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for History */}
        <Tabs defaultValue="vision" className="space-y-4">
          <TabsList>
            <TabsTrigger value="vision">Vision History</TabsTrigger>
            <TabsTrigger value="hearing">Hearing History</TabsTrigger>
            <TabsTrigger value="all">All Results</TabsTrigger>
          </TabsList>

          <TabsContent value="vision" className="space-y-4">
            {visionHistory.map((record) => (
              <Card key={record.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Eye className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{record.type}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Calendar className="h-3 w-3" />
                          {record.date.toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(record.status)}
                      <Button size="sm" variant="outline">
                        <Download className="mr-1 h-4 w-4" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Visual Acuity</p>
                        <p className="text-lg font-semibold">{record.acuity}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Assessment</p>
                        <p className="text-lg font-semibold">{getStatusBadge(record.status)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm">{record.notes}</p>
                    </div>
                    {record.status === 'refer' && (
                      <div className="flex items-start gap-2 rounded-lg bg-orange-50 p-3 border border-orange-200">
                        <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-orange-900">Referral Recommended</p>
                          <p className="text-orange-700">
                            Please schedule an appointment with an eye care professional for a comprehensive evaluation.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="hearing" className="space-y-4">
            {hearingHistory.map((record) => (
              <Card key={record.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Ear className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{record.type}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Calendar className="h-3 w-3" />
                          {record.date.toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(record.status)}
                      <Button size="sm" variant="outline">
                        <Download className="mr-1 h-4 w-4" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Average Threshold</p>
                        <p className="text-lg font-semibold">{record.threshold}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Assessment</p>
                        <p className="text-lg font-semibold">{getStatusBadge(record.status)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm">{record.notes}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Combined view of all screening results will be displayed here.
            </p>
          </TabsContent>
        </Tabs>

        {/* Empty State */}
        {visionHistory.length === 0 && hearingHistory.length === 0 && (
          <Card className="mt-8">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="mb-4 inline-flex rounded-full bg-muted p-3">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">No Screening History</h3>
              <p className="mb-6 text-muted-foreground">
                You haven't completed any screenings yet. Start your first screening to see results here.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => setLocation('/vision-screening')}>
                  <Eye className="mr-2 h-4 w-4" />
                  Vision Screening
                </Button>
                <Button onClick={() => setLocation('/hearing-screening')} variant="outline">
                  <Ear className="mr-2 h-4 w-4" />
                  Hearing Screening
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
