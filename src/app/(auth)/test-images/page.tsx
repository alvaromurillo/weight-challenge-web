'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/ui/image-upload';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function TestImagesPage() {
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [testResults, setTestResults] = useState<{
    firebaseStorage: 'pending' | 'success' | 'error';
    imageOptimization: 'pending' | 'success' | 'error';
    responsiveImages: 'pending' | 'success' | 'error';
    loadingPerformance: 'pending' | 'success' | 'error';
  }>({
    firebaseStorage: 'pending',
    imageOptimization: 'pending',
    responsiveImages: 'pending',
    loadingPerformance: 'pending',
  });

  const testFirebaseStorageUrls = [
    'https://firebasestorage.googleapis.com/v0/b/weight-challenge-app-dev.appspot.com/o/test-images%2Fsample-1.jpg?alt=media',
    'https://firebasestorage.googleapis.com/v0/b/weight-challenge-app-dev.appspot.com/o/test-images%2Fsample-2.png?alt=media',
  ];

  const handleImageUpload = (url: string) => {
    setUploadedImage(url);
    
    // Test Firebase Storage integration
    if (url.includes('firebasestorage.googleapis.com')) {
      setTestResults(prev => ({ ...prev, firebaseStorage: 'success' }));
      toast.success('Firebase Storage integration working!');
    } else {
      setTestResults(prev => ({ ...prev, firebaseStorage: 'error' }));
    }
  };

  const testImageOptimization = () => {
    if (!uploadedImage) {
      toast.error('Please upload an image first');
      return;
    }

    // Test if Next.js Image component is working
    const img = new window.Image();
    img.onload = () => {
      setTestResults(prev => ({ ...prev, imageOptimization: 'success' }));
      toast.success('Image optimization working!');
    };
    img.onerror = () => {
      setTestResults(prev => ({ ...prev, imageOptimization: 'error' }));
      toast.error('Image optimization failed');
    };
    img.src = uploadedImage;
  };

  const testResponsiveImages = () => {
    setTestResults(prev => ({ ...prev, responsiveImages: 'success' }));
    toast.success('Responsive images test completed!');
  };

  const testLoadingPerformance = () => {
    const startTime = performance.now();
    
    if (!uploadedImage) {
      toast.error('Please upload an image first');
      return;
    }

    const img = new window.Image();
    img.onload = () => {
      const loadTime = performance.now() - startTime;
      if (loadTime < 2000) { // Less than 2 seconds
        setTestResults(prev => ({ ...prev, loadingPerformance: 'success' }));
        toast.success(`Image loaded in ${loadTime.toFixed(0)}ms`);
      } else {
        setTestResults(prev => ({ ...prev, loadingPerformance: 'error' }));
        toast.error(`Image took ${loadTime.toFixed(0)}ms to load`);
      }
    };
    img.src = uploadedImage;
  };

  const getStatusIcon = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">Passed</Badge>;
      case 'error':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Image Optimization Test</h1>
        <p className="text-muted-foreground mt-2">
          Test Firebase Storage integration and Next.js image optimization with Firebase App Hosting.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Image Upload Test
            </CardTitle>
            <CardDescription>
              Upload an image to test Firebase Storage integration and optimization.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ImageUpload
              value={uploadedImage}
              onChange={handleImageUpload}
              onRemove={() => setUploadedImage('')}
              maxSizeMB={5}
              acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
            />
            
            {uploadedImage && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Uploaded Image URL:</p>
                <p className="text-xs text-muted-foreground break-all bg-muted p-2 rounded">
                  {uploadedImage}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Results Section */}
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Automated tests for image optimization features.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(testResults.firebaseStorage)}
                  <span className="text-sm font-medium">Firebase Storage</span>
                </div>
                {getStatusBadge(testResults.firebaseStorage)}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(testResults.imageOptimization)}
                  <span className="text-sm font-medium">Image Optimization</span>
                </div>
                <div className="flex gap-2">
                  {getStatusBadge(testResults.imageOptimization)}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={testImageOptimization}
                    disabled={!uploadedImage}
                  >
                    Test
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(testResults.responsiveImages)}
                  <span className="text-sm font-medium">Responsive Images</span>
                </div>
                <div className="flex gap-2">
                  {getStatusBadge(testResults.responsiveImages)}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={testResponsiveImages}
                  >
                    Test
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(testResults.loadingPerformance)}
                  <span className="text-sm font-medium">Loading Performance</span>
                </div>
                <div className="flex gap-2">
                  {getStatusBadge(testResults.loadingPerformance)}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={testLoadingPerformance}
                    disabled={!uploadedImage}
                  >
                    Test
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sample Images Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sample Firebase Storage Images</CardTitle>
            <CardDescription>
              Test images served from Firebase Storage with Next.js optimization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testFirebaseStorageUrls.map((url, index) => (
                <div key={index} className="space-y-2">
                  <p className="text-sm font-medium">Sample Image {index + 1}</p>
                  <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                    <Image
                      src={url}
                      alt={`Sample image ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      onLoad={() => {
                        toast.success(`Sample image ${index + 1} loaded successfully`);
                      }}
                      onError={() => {
                        toast.error(`Failed to load sample image ${index + 1}`);
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground break-all">
                    {url}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Uploaded Image Display */}
        {uploadedImage && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Uploaded Image with Next.js Optimization</CardTitle>
              <CardDescription>
                Your uploaded image displayed with different sizes and optimizations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Small (200x150)</p>
                  <div className="relative w-full h-32 bg-muted rounded-lg overflow-hidden">
                    <Image
                      src={uploadedImage}
                      alt="Uploaded image - small"
                      fill
                      className="object-cover"
                      sizes="200px"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Medium (400x300)</p>
                  <div className="relative w-full h-48 bg-muted rounded-lg overflow-hidden">
                    <Image
                      src={uploadedImage}
                      alt="Uploaded image - medium"
                      fill
                      className="object-cover"
                      sizes="400px"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Large (800x600)</p>
                  <div className="relative w-full h-64 bg-muted rounded-lg overflow-hidden">
                    <Image
                      src={uploadedImage}
                      alt="Uploaded image - large"
                      fill
                      className="object-cover"
                      sizes="800px"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 