import React, { useState } from 'react'
import Navbar from './components/layout/Navbar.jsx';
import Sidebar from './components/layout/Sidebar.jsx';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import routes from "./routes/index.jsx";
import './index.css';


const App = () => {
  return (
    <Router>
      <div className="flex h-screen w-full">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-auto">
            <Routes>
              {routes.map((route) => (
                <Route
                  key={route.path}
                  path={route.path}
                  element={route.element}
                />
              ))}
            </Routes>
          </main>
        </div>
      </div>
    </ Router>
  );
};

export default App;
