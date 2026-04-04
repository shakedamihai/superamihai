import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { SpaceProvider } from "./contexts/SpaceContext"; // הנתיב לקובץ הקונטקסט החדש

createRoot(document.getElementById("root")!).render(
  <SpaceProvider>
    <App />
  </SpaceProvider>
);
