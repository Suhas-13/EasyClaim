import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Box,
} from "@mui/material";
import { Status } from "./Graph";

export interface Claim {
  id: number;
  name: string;
  description: string;
  documentFiles: string[];
  status: Status;
  submissionDate: Date;
}

export const CreditCompanyUi = ({
  claims,
  setClaimStatus,
}: {
  claims: Claim[];
  setClaimStatus: (id: number, status: Status) => void;
}) => {
  return (
    <div className="min-h-3">
      <Typography variant="h4" component="h1" gutterBottom>
        {`${claims.length} claim(s) found`}
      </Typography>
      {claims.map((claim) => (
        <Card key={claim.id} variant="outlined" sx={{ marginBottom: 2 }}>
          <CardContent>
            <Typography variant="h5" component="h2">
              {claim.name}
            </Typography>
            <Typography color="textSecondary">{claim.description}</Typography>
            <Typography variant="body2" component="p">
              Status: {claim.status}
            </Typography>
            <Typography variant="body2" component="p">
              Submission Date: {claim.submissionDate.toDateString()}
            </Typography>
            <Box mt={2}>
              <Typography variant="h6" component="h3">
                Documents:
              </Typography>
              <List>
                {claim.documentFiles.map((file, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={file} />
                  </ListItem>
                ))}
              </List>
            </Box>
            <Box mt={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setClaimStatus(claim.id, Status.ClaimApproved)}
                sx={{ marginRight: 1 }}
              >
                Approve
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => setClaimStatus(claim.id, Status.ClaimRejected)}
              >
                Reject
              </Button>
            </Box>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
