
import React, { useState } from 'react';
import ConfirmationModal from './ConfirmationModal';
import { toast } from '@/hooks/use-toast';

interface ReferralRequest {
    id: string;
    name: string;
    email: string;
    targetCompany: string;
    jobId: string;
    currentCompany?: string;
    resumeUrl?: string;
    status?: 'pending' | 'referred' | 'rejected'; // Kept for candidate view, not used directly by referrer action
    paymentStatus?: string; // To ensure only paid requests are handled if needed
    viewCount?: number;
}

interface ReferralRequestTileProps {
    request: ReferralRequest;
    onViewAction?: (requestId: string) => Promise<void>; // Renamed from onRefer for clarity
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
            const response = await fetch('/api/send-otp', { // Reusing send-otp as a generic email sender
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
                // Optionally, inform the referrer that the notification failed, but let them proceed
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
            window.open(request.resumeUrl, '_blank'); // Open resume
            await sendResumeViewedNotification(); // Send notification to candidate
        }
        if (onViewAction) {
            try {
                await onViewAction(request.id); // Call the action passed from parent (e.g., to increment viewCount)
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
        // This function is relevant for candidate view only, as referrer view no longer shows "referred" status directly.
        switch (status) {
            case 'referred': return 'text-green-500';
            case 'rejected': return 'text-red-500';
            case 'pending':
            default: return 'text-yellow-500'; // Or any color for pending
        }
    }

    return (
        <>
            {/* Confirmation Modal for referrer view */}
            {viewMode === 'referrer' && (
                <ConfirmationModal
                    show={showConfirmationModal}
                    message="You are about to view this candidate's resume. Proceed?"
                    onConfirm={handleConfirmViewAction}
                    onCancel={() => setShowConfirmationModal(false)}
                />
            )}

            {/* Main Tile */}
            <div
                className={`border border-border rounded-lg p-4 shadow-lg transition-all duration-300 bg-card hover:shadow-xl hover:border-primary cursor-pointer 
                    ${isExpanded ? "h-auto" : "h-[100px] overflow-hidden"}`}
                onClick={toggleExpanded}
            >
                <h3 className="font-semibold text-lg mb-1 text-primary">
                    {request.name} {/* Candidate's name is always primary */}
                </h3>
                {/* Collapsed view content */}
                {!isExpanded && (
                     <p className="text-sm text-muted-foreground truncate">
                        {viewMode === 'candidate' 
                            ? `Status: ${request.status ? request.status.charAt(0).toUpperCase() + request.status.slice(1) : 'Pending'}` 
                            : `Viewed by ${request.viewCount || 0} referrer(s)`}
                    </p>
                )}

                {/* Expanded view content */}
                {isExpanded && (
                    <div className="mt-2 space-y-1 text-sm text-card-foreground">
                        <p><strong>Email:</strong> {request.email}</p>
                        <p><strong>Target Company:</strong> {request.targetCompany}</p>
                        <p><strong>Job ID:</strong> {request.jobId}</p>
                        {/* Current company shown for candidate view, hidden for referrer view */}
                        {viewMode !== 'referrer' && request.currentCompany && <p><strong>Current Company:</strong> {request.currentCompany}</p>}
                        
                        {/* Candidate view specific items */}
                        {viewMode === 'candidate' && request.resumeUrl && (
                             <p><strong>Resume:</strong> <a href={request.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline" onClick={(e) => e.stopPropagation()}>View Resume</a></p>
                        )}
                        
                        {viewMode === 'candidate' && (
                            <p><strong>Status:</strong> <span className={`font-medium ${getStatusColor(request.status)}`}>
                                {request.status ? request.status.charAt(0).toUpperCase() + request.status.slice(1) : 'Pending'}
                            </span></p>
                        )}

                        {/* Referrer view specific items */}
                        {viewMode === 'referrer' && (
                            <div className="mt-3 space-y-2">
                                {request.resumeUrl ? (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent tile collapse/expand
                                            if (onViewAction) {
                                                setShowConfirmationModal(true); // Show modal before action
                                            }
                                        }}
                                        disabled={!onViewAction || !request.resumeUrl} // Disable if no action or no resume
                                        className="text-accent-foreground bg-accent hover:bg-accent/80 px-3 py-1 rounded text-xs font-medium transition-colors duration-300 disabled:opacity-50"
                                    >
                                        View Resume & Notify Candidate
                                    </button>
                                ) : (
                                    <p className="text-muted-foreground text-xs">No resume submitted by candidate.</p>
                                )}
                                <p className="text-xs text-muted-foreground">Viewed by {request.viewCount || 0} referrer(s).</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default ReferralRequestTile;
