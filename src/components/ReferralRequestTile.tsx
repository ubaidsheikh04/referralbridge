
import React, { useState } from 'react';
import ConfirmationModal from './ConfirmationModal'; // Assuming this path is correct

// Define the shape of a referral request prop more strictly
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
    onRefer: (requestId: string) => Promise<void>; // Ensure onRefer is expected
}

const ReferralRequestTile: React.FC<ReferralRequestTileProps> = ({ request, onRefer }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    // Initialize isReferred based on the request's status prop
    const [isReferred, setIsReferred] = useState(request.status === 'referred');
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);

    const toggleExpanded = () => {
        // Don't allow expanding/collapsing if already referred
        if (!isReferred) {
            setIsExpanded(!isExpanded);
        }
    };

    const handleConfirmRefer = async () => {
        setShowConfirmationModal(false); // Close modal first
        if (request.resumeUrl) {
            window.open(request.resumeUrl, '_blank'); // Open resume link
        }
        try {
            await onRefer(request.id); // Call the passed onRefer function
            setIsReferred(true); // Update local state after successful referral
        } catch (error) {
            // Error handling is done in the parent component (DashboardPage) via toast
            console.error("Error during onRefer call:", error);
        }
    };


    return (
        <>
            {/* Custom Confirmation Modal */}
            <ConfirmationModal
                show={showConfirmationModal}
                message="Are you willing to refer this candidate? *Note - Proceeding will mark this candidate as referred and open their resume."
                onConfirm={handleConfirmRefer}
                onCancel={() => setShowConfirmationModal(false)}
            />

            {/* Referral Request Tile Content */}
            <div
                className={`border border-border rounded-lg p-4 shadow-lg transition-all duration-300 cursor-pointer ${
                    isReferred ? "opacity-60 bg-card cursor-not-allowed" : "bg-card hover:shadow-xl hover:border-primary"
                } ${isExpanded ? "h-auto" : "h-[100px] overflow-hidden"}`}
                onClick={toggleExpanded} // Use onClick to toggle expansion
            >
                 <h3 className={`font-semibold text-lg mb-1 ${isReferred ? "text-muted-foreground" : "text-primary"}`}>
                    {request.name}
                </h3>
                 {!isExpanded && !isReferred && (
                     <p className="text-sm text-muted-foreground truncate">Click to view details...</p>
                 )}

                {isExpanded && (
                    <div className="mt-2 space-y-1 text-sm text-card-foreground">
                        <p>
                            <strong>Email:</strong> {request.email}
                        </p>
                        <p>
                            <strong>Company:</strong> {request.targetCompany}
                        </p>
                        <p>
                            <strong>Job ID:</strong> {request.jobId}
                        </p>
                        {request.resumeUrl && (
                            <div className="mt-3">
                                {isReferred ? (
                                    <span className="text-green-500 font-medium">Candidate Referred</span>
                                ) : (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation(); // Prevent the card's toggleExpanded from firing
                                        setShowConfirmationModal(true);
                                      }}
                                      className="text-accent-foreground bg-accent hover:bg-accent/80 px-3 py-1 rounded text-xs font-medium transition-colors duration-300"
                                    >
                                      View Resume & Refer
                                    </button>
                                )}
                            </div>
                        )}
                         {!request.resumeUrl && !isReferred && (
                            <p className="text-muted-foreground text-xs mt-2">No resume available.</p>
                         )}
                    </div>
                )}
                {/* Optional: Show referred status even when collapsed */}
                {isReferred && !isExpanded && (
                     <p className="text-sm text-green-500 font-medium mt-2">Referred</p>
                )}
            </div>
        </>
    );
};

export default ReferralRequestTile;

