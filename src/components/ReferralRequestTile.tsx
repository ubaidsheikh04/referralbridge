import React, { useState } from 'react';

interface ReferralRequestTileProps {
    request: {
        id: string;
        name: string;
        email: string;
        targetCompany: string;
        jobId: string;
        resumeUrl?: string;
    };
}

const ReferralRequestTile: React.FC<ReferralRequestTileProps> = ({ request }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div 
            className={`border rounded-lg p-4 shadow-md bg-black ${isExpanded ? "bg-gray-100 text-black" : "text-white"} ${
                isExpanded ? "bg-gray-100" : ""
        } ${!isExpanded ? "h-[100px]" : ""}`}
        onClick={toggleExpanded}
      >
         <p>
          {request.name}
            </p>
        {isExpanded && (
          <div className='text-white'>
            <p>
          {request.name}
            </p>
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
              <p>
                <strong>Resume:</strong>{" "}
                <a
                  href={request.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  View Resume
                </a>
              </p>
            )}
          </div>
        )}
      </div>
    );
};

export default ReferralRequestTile;