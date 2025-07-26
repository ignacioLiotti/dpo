'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createOrganizationAction } from '@/app/actions/organizations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Loader2, Users, Rocket, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface OrganizationSetupFormProps {
  userEmail: string;
}

export function OrganizationSetupForm({ userEmail }: OrganizationSetupFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter an organization name');
      return;
    }

    setIsCreating(true);
    try {
      const result = await createOrganizationAction(formData);
      
      if (result?.data) {
        toast.success('Organization created successfully!');
        
        // Move to success step
        setStep(3);
        
        // Redirect after showing success
        setTimeout(() => {
          router.push('/files');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Failed to create organization:', error);
      toast.error(error?.message || 'Failed to create organization');
    } finally {
      setIsCreating(false);
    }
  };

  if (step === 1) {
    return (
      <Card className="border-2">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Create Your Organization</CardTitle>
          <CardDescription className="text-base">
            Organizations help you collaborate with your team and manage projects together
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="mt-0.5 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Collaborate with your team</h3>
                <p className="text-sm text-muted-foreground">
                  Invite team members and work together on projects
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="mt-0.5 h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Rocket className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">Manage projects efficiently</h3>
                <p className="text-sm text-muted-foreground">
                  Organize your construction projects and documents in one place
                </p>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={() => setStep(2)} 
            className="w-full"
            size="lg"
          >
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 2) {
    return (
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>
            Choose a name for your organization. You can always change this later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name</Label>
                <Input
                  id="name"
                  placeholder="Acme Construction Co."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isCreating}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Tell us a bit about your organization..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={isCreating}
                  rows={3}
                />
              </div>
              
              <Alert>
                <AlertDescription>
                  You'll be the owner of this organization and can invite team members later.
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={isCreating}
                >
                  Back
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Organization'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (step === 3) {
    return (
      <Card className="border-2 border-green-200 bg-green-50/50">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <Rocket className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-green-900">
                Organization Created! 🎉
              </h2>
              <p className="text-green-700 mt-2">
                {formData.name} is ready to go
              </p>
            </div>
            <p className="text-sm text-green-600">
              Redirecting you to your dashboard...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}