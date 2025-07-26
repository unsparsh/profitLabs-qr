import React from "react";
import { Link } from "react-router-dom";

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center text-sm max-md:px-4 py-20 bg-white min-h-screen">
      <p className="md:text-xl text-gray-500 max-w-lg text-center mb-2">
        Jai Shree Mahakal
      </p>

      <h1 className="text-6xl md:text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 drop-shadow-2xl">
        404 Not Found
      </h1>

      <div className="h-px w-80 rounded bg-gradient-to-r from-gray-400 to-gray-800 my-5 md:my-7"></div>

      <p className="md:text-xl text-gray-500 max-w-lg text-center">
        The page you are looking for does not exist or has been moved.
      </p>

      <Link
        to="/"
        className="group flex items-center gap-1 bg-gray-900 hover:bg-black px-7 py-2.5 text-white rounded-full mt-10 font-medium active:scale-95 transition-all"
      >
        Back to Home
        <svg
          className="group-hover:translate-x-0.5 transition"
          width="22"
          height="22"
          viewBox="0 0 22 22"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.583 11h12.833m0 0L11 4.584M17.416 11 11 17.417"
            stroke="#fff"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
    </div>
  );
};

export default NotFound;
