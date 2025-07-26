import React from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 py-12 text-center">
      {/* Logo at the top */}
      <img
        src="/logo.png"
        alt="Profit Labs Logo"
        className="w-32 mb-8"
      />

      {/* 404 Heading */}
      <h1 className="text-8xl font-extrabold text-black drop-shadow-md mb-4">404</h1>

      {/* Subheading */}
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">Page Not Found</h2>

      {/* Description */}
      <p className="text-gray-600 mb-6">
        Sorry, the page you're looking for doesn't exist or has been moved.
      </p>

      {/* CTA Button */}
      <Link to="/">
        <Button className="px-6 py-3 text-white bg-indigo-600 hover:bg-indigo-700 rounded-md text-lg">
          Back to Home
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;
