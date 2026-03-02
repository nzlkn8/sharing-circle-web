import { Lora, Inter } from "next/font/google";
import "./globals.css";

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "SharingCircle — Share your finds with your people",
  description:
    "A warm, personal link sharing platform. Share links and thoughts with your inner circle via WhatsApp.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${lora.variable} ${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
