import { HashRouter, Route, Routes } from "react-router-dom";

import { AppShell } from "./components/AppShell";
import { LearnPage } from "./pages/LearnPage";
import { PlayPage } from "./pages/PlayPage";
import { ReplaysPage } from "./pages/ReplaysPage";

export default function App() {
  return (
    <HashRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<PlayPage />} />
          <Route path="/replays" element={<ReplaysPage />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="*" element={<PlayPage />} />
        </Routes>
      </AppShell>
    </HashRouter>
  );
}
