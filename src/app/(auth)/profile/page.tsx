'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImageUpload } from '@/components/ui/image-upload';
import { updateProfile } from 'firebase/auth';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [photoURL, setPhotoURL] = useState('');

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
      setPhotoURL(user.photoURL || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await updateProfile(user, {
        displayName: displayName || null,
        photoURL: photoURL || null,
      });
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Loading...</h2>
          <p className="text-muted-foreground">Please wait while we load your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your personal information and profile picture.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* Profile Picture Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={photoURL} alt={displayName || 'Profile'} />
                    <AvatarFallback className="text-lg">
                      {displayName ? getInitials(displayName) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Label className="text-sm font-medium">Current Profile Picture</Label>
                    <p className="text-sm text-muted-foreground">
                      {photoURL ? 'Profile picture is set' : 'No profile picture set'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Upload New Profile Picture
                  </Label>
                  <ImageUpload
                    value={photoURL}
                    onChange={setPhotoURL}
                    onRemove={() => setPhotoURL('')}
                    disabled={loading}
                    maxSizeMB={2}
                    acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Upload a new profile picture or enter a URL. Images will be optimized automatically.
                  </p>
                </div>
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                />
                <p className="text-sm text-muted-foreground">
                  This is the name that will be displayed to other users.
                </p>
              </div>

              {/* Email (Read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">
                  Email address cannot be changed. Contact support if you need to update it.
                </p>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Updating...' : 'Update Profile'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              View your account details and statistics.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Account Created</Label>
                <p className="text-sm text-muted-foreground">
                  {user.metadata.creationTime 
                    ? new Date(user.metadata.creationTime).toLocaleDateString()
                    : 'Unknown'
                  }
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Last Sign In</Label>
                <p className="text-sm text-muted-foreground">
                  {user.metadata.lastSignInTime 
                    ? new Date(user.metadata.lastSignInTime).toLocaleDateString()
                    : 'Unknown'
                  }
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">User ID</Label>
                <p className="text-sm text-muted-foreground font-mono">
                  {user.uid}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Email Verified</Label>
                <p className="text-sm text-muted-foreground">
                  {user.emailVerified ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone Card */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible and destructive actions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Delete Account</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <Button variant="destructive" disabled>
                  Delete Account (Coming Soon)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 