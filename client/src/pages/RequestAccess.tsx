import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { APP_LOGO, APP_TITLE } from "@/const";
import { useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle, ArrowLeft } from "lucide-react";

export default function RequestAccess() {
  const [, setLocation] = useLocation();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    tier: 'trial',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement API call to submit access request
    console.log('Access request:', formData);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mb-4 inline-flex rounded-full bg-green-100 p-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="mb-2 text-2xl font-bold">Request Submitted!</h2>
            <p className="mb-6 text-foreground/70">
              Thank you for your interest. We'll review your request and send you an email with further instructions.
            </p>
            <Button onClick={() => setLocation('/')}>
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-white/80 backdrop-blur-sm">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            {APP_LOGO && <img src={APP_LOGO} alt="Logo" className="h-8 w-8" />}
            <h1 className="text-xl font-bold text-primary">{APP_TITLE}</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setLocation('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </header>

      <main className="container py-12 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Request Access</CardTitle>
            <CardDescription>
              Fill out the form below to request access to Health Screener PWA. We'll review your request and get back to you shortly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  We'll use this email to notify you about your access request.
                </p>
              </div>

              {/* Subscription Tier */}
              <div className="space-y-3">
                <Label>Select Subscription Tier *</Label>
                <RadioGroup
                  value={formData.tier}
                  onValueChange={(value) => setFormData({ ...formData, tier: value })}
                >
                  <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                    <RadioGroupItem value="trial" id="trial" />
                    <div className="flex-1">
                      <Label htmlFor="trial" className="font-medium cursor-pointer">
                        Trial (3 Days Free)
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Full access to all screening features for 3 days
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                    <RadioGroupItem value="monthly" id="monthly" />
                    <div className="flex-1">
                      <Label htmlFor="monthly" className="font-medium cursor-pointer">
                        Monthly ($9.99/month)
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Unlimited screenings, billed monthly
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                    <RadioGroupItem value="yearly" id="yearly" />
                    <div className="flex-1">
                      <Label htmlFor="yearly" className="font-medium cursor-pointer">
                        Yearly ($99/year)
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Save 17% with annual billing
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Additional Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Information (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Tell us about your intended use case or any questions you have..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                />
              </div>

              {/* Disclaimer */}
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm text-foreground/70">
                  <strong>Important:</strong> Health Screener PWA is for preliminary screening purposes only and does not provide medical diagnosis. 
                  By requesting access, you acknowledge that results should be followed up with professional healthcare evaluation.
                </p>
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full" size="lg">
                Submit Request
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info Section */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">What's Included</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Vision screening (photoscreening + visual acuity)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Hearing screening (pure tone + speech-in-noise)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Detailed results and history tracking</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Secure data storage and privacy protection</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Review Process</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-foreground/70">
              <p>
                <strong>1. Submit Request:</strong> Fill out the form above
              </p>
              <p>
                <strong>2. Review:</strong> Our team reviews your request (typically within 24-48 hours)
              </p>
              <p>
                <strong>3. Approval:</strong> You'll receive an email with login instructions
              </p>
              <p>
                <strong>4. Start Screening:</strong> Begin using the platform immediately
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
