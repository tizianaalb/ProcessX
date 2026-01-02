import React, { useState, useEffect } from 'react';
import { FileCheck, Clock, CheckCircle, XCircle, AlertTriangle, MessageSquare, User, Send } from 'lucide-react';
import { reviewApi, ProcessReview } from '../lib/api';
import { Button } from './ui/button';

interface ReviewPanelProps {
  processId: string;
  onReviewSubmitted?: () => void;
}

export const ReviewPanel: React.FC<ReviewPanelProps> = ({ processId, onReviewSubmitted }) => {
  const [reviews, setReviews] = useState<ProcessReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [processId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await reviewApi.getProcessReviews(processId);
      setReviews(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReview = async () => {
    try {
      setSubmitting(true);
      await reviewApi.createReview({
        processId,
        comments: comments || undefined,
      });
      setShowRequestForm(false);
      setComments('');
      fetchReviews();
      onReviewSubmitted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateReview = async (
    reviewId: string,
    status: 'approved' | 'rejected' | 'changes_requested',
    decision?: string
  ) => {
    try {
      setSubmitting(true);
      await reviewApi.updateReview(reviewId, { status, decision });
      fetchReviews();
      onReviewSubmitted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update review');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'changes_requested':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending Review';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'changes_requested':
        return 'Changes Requested';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'changes_requested':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatUserName = (user?: { firstName: string | null; lastName: string | null; email: string } | null) => {
    if (!user) return 'Unknown';
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return name || user.email;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const pendingReview = reviews.find((r) => r.status === 'pending');
  const pastReviews = reviews.filter((r) => r.status !== 'pending');

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-32 mb-4" />
        <div className="space-y-3">
          <div className="h-16 bg-gray-200 rounded" />
          <div className="h-16 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-800">Review & Approval</h3>
          </div>
          {!pendingReview && !showRequestForm && (
            <Button
              size="sm"
              onClick={() => setShowRequestForm(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Request Review
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="p-4">
        {/* Request Review Form */}
        {showRequestForm && (
          <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h4 className="font-medium text-purple-800 mb-3">Request Process Review</h4>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add any comments or context for the reviewer..."
              className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
              rows={3}
            />
            <div className="flex justify-end gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowRequestForm(false);
                  setComments('');
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleRequestReview}
                disabled={submitting}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </div>
        )}

        {/* Pending Review */}
        {pendingReview && (
          <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-yellow-800">Review Pending</span>
              </div>
              <span className="text-xs text-yellow-600">
                Requested {formatDate(pendingReview.requestedAt)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-yellow-700 mb-3">
              <User className="w-4 h-4" />
              <span>Requested by {formatUserName(pendingReview.requester)}</span>
            </div>

            {pendingReview.comments && (
              <div className="flex items-start gap-2 text-sm text-yellow-700 mb-3">
                <MessageSquare className="w-4 h-4 mt-0.5" />
                <span>{pendingReview.comments}</span>
              </div>
            )}

            {/* Review Actions */}
            <div className="flex flex-wrap gap-2 pt-3 border-t border-yellow-200">
              <Button
                size="sm"
                onClick={() => handleUpdateReview(pendingReview.id, 'approved')}
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleUpdateReview(pendingReview.id, 'changes_requested', 'Please make the requested changes.')}
                disabled={submitting}
                className="border-orange-500 text-orange-600 hover:bg-orange-50"
              >
                <AlertTriangle className="w-4 h-4 mr-1" />
                Request Changes
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleUpdateReview(pendingReview.id, 'rejected', 'Does not meet requirements.')}
                disabled={submitting}
                className="border-red-500 text-red-600 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reject
              </Button>
            </div>
          </div>
        )}

        {/* No Reviews */}
        {reviews.length === 0 && !showRequestForm && (
          <div className="text-center py-8 text-gray-500">
            <FileCheck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No reviews yet</p>
            <p className="text-xs mt-1">Request a review to get approval from team members</p>
          </div>
        )}

        {/* Review History */}
        {pastReviews.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Review History</h4>
            <div className="space-y-3">
              {pastReviews.map((review) => (
                <div
                  key={review.id}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(review.status)}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(review.status)}`}>
                        {getStatusLabel(review.status)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {review.reviewedAt ? formatDate(review.reviewedAt) : formatDate(review.requestedAt)}
                    </span>
                  </div>

                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">Requested by:</span>
                      <span>{formatUserName(review.requester)}</span>
                    </div>
                    {review.reviewer && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Reviewed by:</span>
                        <span>{formatUserName(review.reviewer)}</span>
                      </div>
                    )}
                    {review.decision && (
                      <div className="flex items-start gap-1 mt-2">
                        <MessageSquare className="w-3 h-3 mt-0.5 text-gray-400" />
                        <span className="text-gray-600">{review.decision}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewPanel;
