
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
    status?: 'pending' | 'referred' | 'rejected';
}

interface ReferralRequestTileProps {
    request: ReferralRequest;
    onRefer?: (requestId: string) => Promise<void>;
    viewMode?: 'referrer' | 'candidate';
}

const ReferralRequestTile: React.FC<ReferralRequestTileProps> = ({ request, onRefer, viewMode = 'referrer' }) => {
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

    const handleConfirmRefer = async () => {
        setShowConfirmationModal(false);
        if (request.resumeUrl) {
            window.open(request.resumeUrl, '_blank');
            await sendResumeViewedNotification();
        }
        if (onRefer) {
            try {
                await onRefer(request.id);
                // Visual update will now primarily come from prop changes when parent re-fetches
            } catch (error) {
                console.error("Error during onRefer call:", error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to mark as referred.",
                });
            }
        }
    };
    
    const getStatusColor = (status?: string) => {
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
                    message="Are you willing to refer this candidate? Note: Proceeding will mark this candidate as referred, open their resume, and notify the candidate their resume has been viewed."
                    onConfirm={handleConfirmRefer}
                    onCancel={() => setShowConfirmationModal(false)}
                />
            )}

            <div
                className={`border border-border rounded-lg p-4 shadow-lg transition-all duration-300 bg-card hover:shadow-xl hover:border-primary cursor-pointer 
                    ${isExpanded ? "h-auto" : "h-[100px] overflow-hidden"}`}
                onClick={toggleExpanded}
            >
                <h3 className={`font-semibold text-lg mb-1 ${viewMode === 'referrer' && request.status === 'referred' ? "text-muted-foreground" : "text-primary"}`}>
                    {request.name}
                </h3>
                {!isExpanded && (
                     <p className="text-sm text-muted-foreground truncate">
                        {viewMode === 'referrer' && request.status === 'referred' ? `Status: Referred` : 
                         (viewMode === 'candidate' ? `Status: ${request.status ? request.status.charAt(0).toUpperCase() + request.status.slice(1) : 'Pending'}` : 'Click to view details...')}
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
                                        if (onRefer) setShowConfirmationModal(true);
                                        }}
                                        disabled={!onRefer || !request.resumeUrl}
                                        className="text-accent-foreground bg-accent hover:bg-accent/80 px-3 py-1 rounded text-xs font-medium transition-colors duration-300 disabled:opacity-50"
                                    >
                                        View Resume & Refer
                                    </button>
                                ) : (
                                    <p className="text-muted-foreground text-xs">No resume submitted by candidate.</p>
                                )}
                                {request.status === 'referred' && (
                                    <p className={`text-xs font-medium ${getStatusColor('referred')}`}>This candidate has been marked as referred.</p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default ReferralRequestTile;
