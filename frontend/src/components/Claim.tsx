import { useParams, Link } from "react-router-dom";
import { Status } from "./Graph";

export const Claim = () => {
  const { id } = useParams<{ id: string }>();
  // TODO: Fetch claim from DB
  const claim = {
    id: 1,
    name: "Claim 1",
    description: "Description for claim 1",
    documentFiles: ["file1.pdf", "file2.pdf"],
    status: Status.ClaimSubmitted,
    submissionDate: new Date("2023-01-01"),
  };

  if (!claim) {
    return <div>Claim not found</div>;
  }

  return (
    <div className="min-h-screen w-full p-4">
      <h1 className="text-4xl font-bold mb-6">{claim.name}</h1>
      <p className="text-gray-600 mb-4">{claim.description}</p>
      <p className="text-gray-800 mb-2">
        <strong>Status:</strong> {claim.status}
      </p>
      <p className="text-gray-800 mb-4">
        <strong>Submission Date:</strong> {claim.submissionDate.toDateString()}
      </p>
      <div className="mb-4">
        <h3 className="text-xl font-semibold mb-2">Documents:</h3>
        <ul className="list-disc list-inside">
          {claim.documentFiles.map((file, index) => (
            <li key={index} className="text-gray-700">
              {file}
              <div className="mt-2">
                <textarea
                  className="w-full p-2 border rounded"
                  placeholder="Add your comments here..."
                ></textarea>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <Link to="/creditCompany" className="text-blue-500 hover:underline">
        Back to main
      </Link>
    </div>
  );
};
