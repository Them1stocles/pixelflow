'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Facebook, Music, BarChart3, Plus } from 'lucide-react';

export default function PixelsPage() {
  const [showForm, setShowForm] = useState(false);
  const [platform, setPlatform] = useState('');

  const platformIcons = {
    facebook: Facebook,
    tiktok: Music,
    google_analytics: BarChart3,
  };

  // Mock existing pixels
  const pixels = [
    {
      id: '1',
      platform: 'facebook',
      pixelId: '123456789',
      isActive: true,
      conversionApiEnabled: true,
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // In real app, call API
    alert('Pixel configuration saved!');
    setShowForm(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pixel Configuration</h1>
          <p className="text-gray-600 mt-1">
            Configure your tracking pixels for Facebook, TikTok, and Google Analytics
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Pixel
        </Button>
      </div>

      {showForm && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Add New Pixel</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="platform">Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="google_analytics">Google Analytics 4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="pixelId">Pixel ID</Label>
              <Input
                id="pixelId"
                placeholder="Enter your pixel ID"
                required
              />
            </div>

            <div>
              <Label htmlFor="accessToken">Access Token / API Secret</Label>
              <Input
                id="accessToken"
                type="password"
                placeholder="Enter access token"
              />
              <p className="text-xs text-gray-500 mt-1">
                Required for Conversions API / Server-side tracking
              </p>
            </div>

            <div>
              <Label htmlFor="testEventCode">Test Event Code (Optional)</Label>
              <Input
                id="testEventCode"
                placeholder="Enter test event code"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit">Save Configuration</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Existing Pixels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pixels.map((pixel) => {
          const Icon = platformIcons[pixel.platform as keyof typeof platformIcons];
          return (
            <Card key={pixel.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold capitalize">{pixel.platform}</h3>
                    <p className="text-sm text-gray-600">{pixel.pixelId}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  pixel.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {pixel.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Conversions API</span>
                  <span className={pixel.conversionApiEnabled ? 'text-green-600' : 'text-gray-400'}>
                    {pixel.conversionApiEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Delete
                </Button>
              </div>
            </Card>
          );
        })}

        {pixels.length === 0 && !showForm && (
          <Card className="p-12 text-center col-span-full">
            <p className="text-gray-500">No pixels configured yet</p>
            <Button onClick={() => setShowForm(true)} className="mt-4">
              Add Your First Pixel
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
