import { Link } from "react-router-dom";

function FacebookIcon(props) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" {...props}>
        <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
      </svg>
    );
  }
  
  function InstagramIcon(props) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" {...props}>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37Z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    );
  }
  
  export default function Footer() {
    return (
      <footer className="border-t border-motolink-blue-light mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-display font-semibold text-motolink-blue-dark text-sm">
            Motolink
          </p>
  
          <div className="flex items-center gap-4">
            <Link to="/tracking-privacy" className="text-motolink-slate hover:text-motolink-blue text-sm">
              Tracking notice
            </Link>
            <a
              href="https://www.facebook.com/share/1VQEdx97cD/?mibextid=wwXIfr"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Motolink on Facebook"
              className="text-motolink-slate hover:text-motolink-blue transition-colors"
            >
              <FacebookIcon />
            </a>
            <a
              href="https://www.instagram.com/motolink.eg?igsh=MTJwbXh5amFvenh3Ng=="
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Motolink on Instagram"
              className="text-motolink-slate hover:text-motolink-blue transition-colors"
            >
              <InstagramIcon />
            </a>
          </div>
        </div>
      </footer>
    );
  }
