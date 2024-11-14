import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import VideoPlayerMain from "./components/VideoPlayerMain";
import Form from "./components/Form";
import SideBar from "./components/SideBar";
export default function App() {
  return (
    <Router>
      <Routes>
        {/*user side */}
        <Route path="/" element={<SideBar />}>
          <Route index element={<Form />} />
          <Route path="/videoPlayer" element={<VideoPlayerMain />} />
        </Route>
      </Routes>

    </Router>
  );
}
