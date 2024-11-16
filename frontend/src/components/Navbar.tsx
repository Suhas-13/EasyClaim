import React from "react";
import { Link } from "react-router-dom"; // or use Next.js Link depending on your routing

const Navbar: React.FC = () => {
  return (
    <div className="bg-slate-900 shadow-xl">
      <div className="max-w-6xl mx-auto p-4 flex justify-between items-center">
        {/* Logo or Brand Name */}
        <div className="text-2xl font-semibold bg-gradient-to-r from-indigo-400 to-cyan-400 text-transparent bg-clip-text">
          BrandName
        </div>

        {/* Navbar Links */}
        <div className="flex space-x-6">
          <Link
            to="/home"
            className="text-slate-300 hover:text-emerald-500 transition duration-200"
          >
            Home
          </Link>
          <Link
            to="/policies"
            className="text-slate-300 hover:text-emerald-500 transition duration-200"
          >
            Policies
          </Link>
          <Link
            to="/refundClaimDiscussion"
            className="text-slate-300 hover:text-emerald-500 transition duration-200"
          >
            Claim Overview
          </Link>
          {/* Add more links as necessary */}
        </div>

        {/* Actions (e.g., Button) */}
        <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md transition duration-200">
          Action Button
        </button>
      </div>
    </div>
  );
};

export default Navbar;
