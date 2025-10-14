'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function EventsPage() {
  // Mock event data
  const events = [
    {
      id: '1',
      eventName: 'Purchase',
      eventSource: 'webhook',
      value: 49.99,
      currency: 'USD',
      status: 'completed',
      facebookStatus: 'success',
      tiktokStatus: 'success',
      googleStatus: 'success',
      createdAt: new Date('2025-01-15T10:30:00'),
    },
    {
      id: '2',
      eventName: 'PageView',
      eventSource: 'browser',
      status: 'completed',
      facebookStatus: 'success',
      tiktokStatus: null,
      googleStatus: 'success',
      createdAt: new Date('2025-01-15T10:28:00'),
    },
    {
      id: '3',
      eventName: 'AddToCart',
      eventSource: 'browser',
      value: 29.99,
      currency: 'USD',
      status: 'processing',
      facebookStatus: 'pending',
      tiktokStatus: null,
      googleStatus: null,
      createdAt: new Date('2025-01-15T10:25:00'),
    },
  ];

  const getStatusIcon = (status: string | null) => {
    if (status === 'success') {
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    } else if (status === 'failed') {
      return <XCircle className="w-4 h-4 text-red-500" />;
    } else if (status === 'pending') {
      return <Clock className="w-4 h-4 text-yellow-500" />;
    }
    return <span className="w-4 h-4 inline-block bg-gray-200 rounded-full" />;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Events</h1>
        <p className="text-gray-600 mt-1">
          View all tracking events and their delivery status
        </p>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Facebook</TableHead>
              <TableHead className="text-center">TikTok</TableHead>
              <TableHead className="text-center">Google</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium">{event.eventName}</TableCell>
                <TableCell>
                  <Badge variant="outline">{event.eventSource}</Badge>
                </TableCell>
                <TableCell>
                  {event.value ? `$${event.value.toFixed(2)} ${event.currency}` : '-'}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      event.status === 'completed' ? 'default' :
                      event.status === 'failed' ? 'destructive' :
                      'secondary'
                    }
                  >
                    {event.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {getStatusIcon(event.facebookStatus)}
                </TableCell>
                <TableCell className="text-center">
                  {getStatusIcon(event.tiktokStatus)}
                </TableCell>
                <TableCell className="text-center">
                  {getStatusIcon(event.googleStatus)}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {event.createdAt.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {events.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-gray-500">No events tracked yet</p>
        </Card>
      )}
    </div>
  );
}
