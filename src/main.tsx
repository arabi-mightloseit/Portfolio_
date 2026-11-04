import {StrictMode, useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {startPreloader} from './preloader';

// Takes over the full-screen loader from index.html and starts fetching every image and font straight away,
// in parallel with React's first render. (See src/preloader.ts.)
const preloader = startPreloader();

// Tells the preloader the app is in the DOM, so it can wait for the app's images / fonts / layout to settle
// before lifting the curtain. Idempotent, so React StrictMode's double effect in dev is harmless.
function Boot() {
  useEffect(() => {
    preloader.appMounted();
  }, []);
  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Boot />
  </StrictMode>,
);
