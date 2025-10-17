'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Facebook, Music, BarChart3, Plus, Loader2 } from 'lucide-react';

interface Pixel {
  id: string;
  platform: string;
  pixelId: string;
  isActive: boolean;
  conversionApiEnabled: boolean;
  accessToken: string | null;
  testEventCode: string | null;
}

export default function PixelsPage() {
  const [showForm, setShowForm] = useState(false);
  const [platform, setPlatform] = useState('');
  const [pixelId, setPixelId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [testEventCode, setTestEventCode] = useState('');
  const [conversionApiEnabled, setConversionApiEnabled] = useState(false);
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingPixel, setEditingPixel] = useState<Pixel | null>(null);

  const platformIcons = {
    facebook: Facebook,
    tiktok: Music,
    google_analytics: BarChart3,
  };

  // Fetch pixels on mount
  useEffect(() => {
    fetchPixels();
  }, []);

  const fetchPixels = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pixels');
      const result = await response.json();

      if (result.success) {
        setPixels(result.data);
      } else {
        console.error('Failed to fetch pixels:', result.error);
      }
    } catch (error) {
      console.error('Error fetching pixels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!platform || !pixelId) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      const url = editingPixel ? `/api/pixels/${editingPixel.id}` : '/api/pixels';
      const method = editingPixel ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          pixelId,
          accessToken: accessToken || undefined,
          testEventCode: testEventCode || undefined,
          conversionApiEnabled,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(editingPixel ? 'Pixel updated successfully!' : 'Pixel created successfully!');
        setShowForm(false);
        resetForm();
        fetchPixels();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving pixel:', error);
      alert('Failed to save pixel configuration');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (pixel: Pixel) => {
    setEditingPixel(pixel);
    setPlatform(pixel.platform);
    setPixelId(pixel.pixelId);
    setAccessToken(''); // Don't pre-fill for security
    setTestEventCode(pixel.testEventCode || '');
    setConversionApiEnabled(pixel.conversionApiEnabled);
    setShowForm(true);
  };

  const handleDelete = async (pixelId: string) => {
    if (!confirm('Are you sure you want to delete this pixel configuration?')) {
      return;
    }

    try {
      const response = await fetch(`/api/pixels/${pixelId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        alert('Pixel deleted successfully!');
        fetchPixels();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting pixel:', error);
      alert('Failed to delete pixel configuration');
    }
  };

  const resetForm = () => {
    setEditingPixel(null);
    setPlatform('');
    setPixelId('');
    setAccessToken('');
    setTestEventCode('');
    setConversionApiEnabled(false);
  };

  const handleCancel = () => {
    setShowForm(false);
    resetForm();
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
          <h2 className="text-xl font-semibold mb-4">
            {editingPixel ? 'Edit Pixel' : 'Add New Pixel'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="platform">Platform</Label>
              <Select value={platform} onValueChange={setPlatform} disabled={!!editingPixel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="google_analytics">Google Analytics 4</SelectItem>
                </SelectContent>
              </Select>
              {editingPixel && (
                <p className="text-xs text-gray-500 mt-1">
                  Platform cannot be changed after creation
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="pixelId">Pixel ID</Label>
              <Input
                id="pixelId"
                placeholder="Enter your pixel ID"
                value={pixelId}
                onChange={(e) => setPixelId(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="accessToken">Access Token / API Secret</Label>
              <Input
                id="accessToken"
                type="password"
                placeholder={editingPixel ? 'Leave blank to keep existing' : 'Enter access token'}
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
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
                value={testEventCode}
                onChange={(e) => setTestEventCode(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="conversionApiEnabled"
                checked={conversionApiEnabled}
                onChange={(e) => setConversionApiEnabled(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="conversionApiEnabled" className="cursor-pointer">
                Enable Conversions API
              </Label>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Configuration'
                )}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel} disabled={submitting}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Existing Pixels */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pixels.map((pixel) => {
            const Icon = platformIcons[pixel.platform as keyof typeof platformIcons];
            return (
              <Card key={pixel.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      {Icon ? (
                        <Icon className="w-5 h-5 text-blue-600" />
                      ) : (
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold capitalize">
                        {pixel.platform.replace('_', ' ')}
                      </h3>
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(pixel)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(pixel.id)}
                  >
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
      )}
    </div>
  );
}
