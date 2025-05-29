
import React, { useState } from 'react';
import ConfirmationModal from './ConfirmationModal';
import { toast } from '@/hooks/use-toast';

interface ReferralRequest {
    id: string;
    name: string;
    email: string;
    targetCompany: string;
    jobId: string;
    resumeUrl?: string;
    status?: 'pending' | 'referred' | 'rejected'; // Status is still relevant for candidate view
    viewCount?: number; // Added viewCount
}

interface ReferralRequestTileProps {
    request: ReferralRequest;
    onViewAction?: (requestId: string) => Promise<void>; // Renamed from onRefer
    viewMode?: 'referrer' | 'candidate';
}

const ReferralRequestTile: React.FC<ReferralRequestTileProps> = ({ request, onViewAction, viewMode = 'referrer' }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    const sendResumeViewedNotification = async () => {
        try {
            const response = await fetch('/api/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: request.email,
                    subject: `Your Referral Request for ${request.jobId} has been viewed!`,
                    htmlBody: `Hello ${request.name},<br><br>Good news! A referrer has viewed your resume for the Job ID: ${request.jobId} at ${request.targetCompany}.<br><br>Best regards,<br>The ReferralBridge Team`,
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                console.error("Failed to send resume viewed notification:", errorData.error || 'Unknown error');
            } else {
                console.log(`Resume viewed notification sent to ${request.email}`);
            }
        } catch (error) {
            console.error("Error sending resume viewed notification:", error);
        }
    };

    const handleConfirmViewAction = async () => {
        setShowConfirmationModal(false);
        if (request.resumeUrl) {
            window.open(request.resumeUrl, '_blank');
            await sendResumeViewedNotification();
        }
        if (onViewAction) {
            try {
                await onViewAction(request.id);
            } catch (error) {
                console.error("Error during onViewAction call:", error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to process view action.",
                });
            }
        }
    };
    
    const getStatusColor = (status?: string) => {
        // This function remains as candidates still see their status
        switch (status) {
            case 'referred': return 'text-green-500';
            case 'rejected': return 'text-red-500';
            case 'pending':
            default: return 'text-yellow-500';
        }
    }

    return (
        <>
            {viewMode === 'referrer' && (
                <ConfirmationModal
                    show={showConfirmationModal}
                    message="You are about to view this candidate's resume. This will notify the candidate and increment the view count. Proceed?"
                    onConfirm={handleConfirmViewAction}
                    onCancel={() => setShowConfirmationModal(false)}
                />
            )}

            <div
                className={`border border-border rounded-lg p-4 shadow-lg transition-all duration-300 bg-card hover:shadow-xl hover:border-primary cursor-pointer 
                    ${isExpanded ? "h-auto" : "h-[100px] overflow-hidden"}`}
                onClick={toggleExpanded}
            >
                <h3 className="font-semibold text-lg mb-1 text-primary">
                    {request.name}
                </h3>
                {!isExpanded && (
                     <p className="text-sm text-muted-foreground truncate">
                        {viewMode === 'candidate' 
                            ? `Status: ${request.status ? request.status.charAt(0).toUpperCase() + request.status.slice(1) : 'Pending'}` 
                            : `Viewed by ${request.viewCount || 0} referrer(s)`}
                    </p>
                )}

                {isExpanded && (
                    <div className="mt-2 space-y-1 text-sm text-card-foreground">
                        <p><strong>Email:</strong> {request.email}</p>
                        <p><strong>Company:</strong> {request.targetCompany}</p>
                        <p><strong>Job ID:</strong> {request.jobId}</p>
                        
                        {viewMode === 'candidate' && request.resumeUrl && (
                             <p><strong>Resume:</strong> <a href={request.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline" onClick={(e) => e.stopPropagation()}>View Resume</a></p>
                        )}
                        
                        {viewMode === 'candidate' && (
                            <p><strong>Status:</strong> <span className={`font-medium ${getStatusColor(request.status)}`}>
                                {request.status ? request.status.charAt(0).toUpperCase() + request.status.slice(1) : 'Pending'}
                            </span></p>
                        )}

                        {viewMode === 'referrer' && (
                            <div className="mt-3 space-y-2">
                                {request.resumeUrl ? (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation(); 
                                            if (onViewAction) setShowConfirmationModal(true);
                                        }}
                                        disabled={!onViewAction || !request.resumeUrl}
                                        className="text-accent-foreground bg-accent hover:bg-accent/80 px-3 py-1 rounded text-xs font-medium transition-colors duration-300 disabled:opacity-50"
                                    >
                                        View Resume & Notify Candidate
                                    </button>
                                ) : (
                                    <p className="text-muted-foreground text-xs">No resume submitted by candidate.</p>
                                )}
                                <p className="text-xs text-muted-foreground">Viewed by {request.viewCount || 0} referrer(s).</p>
                                {/* Removed "This candidate has been marked as referred." */}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default ReferralRequestTile;
