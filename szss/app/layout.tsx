import type { Metadata } from "next";
import { Archivo_Black, Space_Grotesk } from "next/font/google";
import "./globals.css";

const headingFont = Archivo_Black({
  variable: "--font-heading",
  weight: "400",
  subsets: ["latin"],
});

const bodyFont = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Športna zveza srednjih šol",
  description: "Platforma za organizacijo in prijavo na srednješolske športne turnirje.",
  icons: {
    icon: "/szss-logo.png",
    shortcut: "/szss-logo.png",
    apple: "/szss-logo.png",
  },
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="sl" className={`${headingFont.variable} ${bodyFont.variable}`}>
      <body>
        {children}
        {modal}
      </body>
    </html>
  );
}
