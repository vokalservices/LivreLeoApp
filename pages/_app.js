import '../styles/globals.css';
import { LangProvider } from '../lib/LangContext';
import Script from 'next/script';

function MyApp({ Component, pageProps }) {
  return (
    <LangProvider>
      <Script
        id="fb-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1320626546685214');
            fbq('track', 'PageView');
          `,
        }}
      />
      <Component {...pageProps} />
    </LangProvider>
  );
}

export default MyApp;
