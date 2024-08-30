// app/polling/layout.tsx
import React from "react";

const PublicFeedbackLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-800 text-white p-4">
        <h1 className="text-3xl font-bold">Public Feedback</h1>
      </header>
      <main className="flex-grow">{children}</main>
      <footer className="bg-gray-800 text-white p-4 text-center"></footer>
    </div>
  );
};

export default PublicFeedbackLayout;
