
import React, { useState } from 'react';
import ConfirmationModal from './ConfirmationModal';

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
    const [isReferred, setIsReferred] = useState(request.status === 'referred');
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);

    const toggleExpanded = () => {
        // Allow expanding/collapsing regardless of status or viewMode for consistent UX
        setIsExpanded(!isExpanded);
    };

    const handleConfirmRefer = async () => {
        setShowConfirmationModal(false);
        if (request.resumeUrl) {
            window.open(request.resumeUrl, '_blank');
        }
        if (onRefer) {
            try {
                await onRefer(request.id);
                setIsReferred(true);
            } catch (error) {
                console.error("Error during onRefer call:", error);
                // Error handling (toast) is typically done in the parent component
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
                    message="Are you willing to refer this candidate? *Note - Proceeding will mark this candidate as referred and open their resume."
                    onConfirm={handleConfirmRefer}
                    onCancel={() => setShowConfirmationModal(false)}
                />
            )}

            <div
                className={`border border-border rounded-lg p-4 shadow-lg transition-all duration-300 cursor-pointer 
                    ${viewMode === 'referrer' && isReferred ? "opacity-60 bg-card cursor-not-allowed" : "bg-card hover:shadow-xl hover:border-primary"} 
                    ${isExpanded ? "h-auto" : "h-[100px] overflow-hidden"}`}
                onClick={toggleExpanded}
            >
                <h3 className={`font-semibold text-lg mb-1 ${viewMode === 'referrer' && isReferred ? "text-muted-foreground" : "text-primary"}`}>
                    {request.name}
                </h3>
                {!isExpanded && (
                    <p className="text-sm text-muted-foreground truncate">
                        {viewMode === 'referrer' && isReferred ? `Status: Referred` : 'Click to view details...'}
                         {viewMode === 'candidate' && `Status: ${request.status ? request.status.charAt(0).toUpperCase() + request.status.slice(1) : 'Pending'}`}
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

                        {viewMode === 'referrer' && request.resumeUrl && (
                            <div className="mt-3">
                                {isReferred ? (
                                    <span className={`font-medium ${getStatusColor('referred')}`}>Candidate Referred</span>
                                ) : (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (onRefer) setShowConfirmationModal(true);
                                      }}
                                      disabled={!onRefer}
                                      className="text-accent-foreground bg-accent hover:bg-accent/80 px-3 py-1 rounded text-xs font-medium transition-colors duration-300 disabled:opacity-50"
                                    >
                                      View Resume & Refer
                                    </button>
                                )}
                            </div>
                        )}
                        {viewMode === 'referrer' && !request.resumeUrl && !isReferred && (
                            <p className="text-muted-foreground text-xs mt-2">No resume submitted by candidate.</p>
                        )}
                    </div>
                )}
                {viewMode === 'referrer' && isReferred && !isExpanded && (
                     <p className={`text-sm font-medium mt-2 ${getStatusColor('referred')}`}>Referred</p>
                )}
            </div>
        </>
    );
};

export default ReferralRequestTile;
