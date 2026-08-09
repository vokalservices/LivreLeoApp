import '../styles/globals.css';
import { LangProvider } from '../lib/LangContext';

function MyApp({ Component, pageProps }) {
  return (
    <LangProvider>
      <Component {...pageProps} />
    </LangProvider>
  );
}

export default MyApp;
