import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { WishlistProvider } from "@/context/WishlistContext";
import Header from "@/components/Header.jsx";
import Footer from "@/components/Footer.jsx";
import PageTransition from "@/components/PageTransition.jsx";
import { Montserrat, Playfair_Display, Noto_Sans_Devanagari } from "next/font/google";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: ["400", "600", "700", "800", "900"],
});

const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["latin", "devanagari"],
  variable: "--font-devanagari",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});
export const metadata = {
  title: "The Pep Shop | Peptides for a Stronger Tomorrow",
  description:
    "The Pep Shop - premium research peptides for laboratory and investigational use.",
  icons: { icon: "/images/tps-icon.png" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${montserrat.variable} ${playfair.variable} ${notoDevanagari.variable}`}>
      <head>
      </head>
      <body>
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <Header />
              <main>
                <PageTransition>{children}</PageTransition>
              </main>
              <Footer />
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
