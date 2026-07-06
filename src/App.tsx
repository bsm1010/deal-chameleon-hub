import { BrowserRouter, Routes, Route } from "react-router-dom";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <h1 className="text-4xl font-bold text-gray-900">
                Menuly coming soon
              </h1>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
