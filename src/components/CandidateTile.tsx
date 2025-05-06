
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


export interface ReferralRequest {
  candidateName: string;
  additionalInfo: string;
  candidateEmail: string;
  referrerName: string;
  jobTitle: string;
  resumeLink: string;
}
 interface CandidateTileProps {
  referralRequest: ReferralRequest;
}

export function CandidateTile({ referralRequest }: CandidateTileProps) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{referralRequest.candidateName}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          <div className="flex items-center">
            <span className="font-medium">Candidate Email:</span>{" "}
            {referralRequest.candidateEmail}
          </div>
          <div className="flex items-center">
            <span className="font-medium">Referred By:</span>{" "}
            {referralRequest.referrerName}
          </div>
          <div className="flex items-center">
            <span className="font-medium">Job Title:</span>{" "}
            {referralRequest.jobTitle}
          </div>
          <div className="flex items-center">
            <span className="font-medium">Resume Link:</span>{" "}
            {referralRequest.resumeLink}
          </div>
          <div className="flex items-center">
            <span className="font-medium">Additional Info:</span>{" "}
            {referralRequest.additionalInfo}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}