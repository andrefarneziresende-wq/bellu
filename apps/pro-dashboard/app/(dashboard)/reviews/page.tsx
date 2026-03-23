'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Star, Loader2, MessageSquare } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { useTranslation } from '@/lib/i18n';

interface Review {
  id: string;
  rating: number;
  comment?: string;
  photoUrl?: string;
  responseText?: string;
  respondedAt?: string;
  createdAt: string;
  user?: { name: string; avatar?: string };
  booking?: { service?: { name: string } };
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondOpen, setRespondOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [responseError, setResponseError] = useState<string | undefined>();
  const toast = useToast();
  const { t, locale } = useTranslation();

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: { reviews: Review[]; pagination: { total: number; page: number; perPage: number; totalPages: number } } }>('/api/reviews');
      setReviews(res.data?.reviews || []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const distribution = [5, 4, 3, 2, 1].map((n) => ({
    stars: n,
    count: reviews.filter((r) => r.rating === n).length,
    pct: reviews.length > 0 ? (reviews.filter((r) => r.rating === n).length / reviews.length) * 100 : 0,
  }));

  const handleRespond = async () => {
    if (!selectedReview) return;
    if (!responseText.trim()) {
      setResponseError(t('validation.required'));
      return;
    }
    if (responseText.trim().length < 5) {
      setResponseError(t('validation.minLength', { min: '5' }));
      return;
    }
    setResponseError(undefined);
    setSubmitting(true);
    try {
      await apiFetch(`/api/reviews/${selectedReview.id}/respond`, {
        method: 'PATCH',
        body: JSON.stringify({ responseText }),
      });
      toast.success(t('proDashboard.reviews.sendResponse'));
      setRespondOpen(false);
      fetchReviews();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const Stars = ({ rating }: { rating: number }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`h-4 w-4 ${n <= rating ? 'fill-brand-gold text-brand-gold' : 'text-gray-300'}`} />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">{t('proDashboard.reviews.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('proDashboard.reviews.distribution')}</p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-6 p-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-brand-text">{avgRating}</p>
              <Stars rating={Math.round(parseFloat(avgRating))} />
              <p className="mt-1 text-xs text-muted-foreground">{t('proDashboard.reviews.totalReviews')}</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {distribution.map((d) => (
                <div key={d.stars} className="flex items-center gap-2 text-sm">
                  <span className="w-3">{d.stars}</span>
                  <Star className="h-3 w-3 fill-brand-gold text-brand-gold" />
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-brand-gold" style={{ width: `${d.pct}%` }} />
                  </div>
                  <span className="w-6 text-right text-xs text-muted-foreground">{d.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <MessageSquare className="h-12 w-12" />
            <p className="mt-4 text-sm">{t('proDashboard.reviews.noReviews')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-rose/10 text-sm font-bold text-brand-rose">
                      {review.user?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-medium">{review.user?.name || t('proDashboard.agenda.client')}</p>
                      <Stars rating={review.rating} />
                      {review.booking?.service && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{review.booking.service.name}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString(locale)}
                  </span>
                </div>

                {review.comment && <p className="mt-3 text-sm">{review.comment}</p>}
                {review.photoUrl && (
                  <img src={review.photoUrl} alt="" className="mt-3 h-32 w-32 rounded-lg object-cover" />
                )}

                {review.responseText ? (
                  <div className="mt-3 rounded-lg bg-muted p-3">
                    <p className="text-xs font-medium text-muted-foreground">{t('proDashboard.reviews.respond')}:</p>
                    <p className="mt-1 text-sm">{review.responseText}</p>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      setSelectedReview(review);
                      setResponseText('');
                      setResponseError(undefined);
                      setRespondOpen(true);
                    }}
                  >
                    {t('proDashboard.reviews.respond')}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={respondOpen} onOpenChange={setRespondOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('proDashboard.reviews.respond')}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            {selectedReview && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="font-medium">{selectedReview.user?.name}</p>
                <Stars rating={selectedReview.rating} />
                {selectedReview.comment && <p className="mt-1">{selectedReview.comment}</p>}
              </div>
            )}
            <div className="space-y-2">
              <Textarea
                value={responseText}
                onChange={(e) => { setResponseText(e.target.value); if (responseError) setResponseError(undefined); }}
                placeholder={t('proDashboard.reviews.responsePlaceholder')}
                rows={3}
                className={responseError ? 'border-brand-error' : ''}
              />
              {responseError && <p className="text-xs text-brand-error">{responseError}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRespondOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleRespond} disabled={submitting || !responseText.trim()}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('proDashboard.reviews.sendResponse')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
