import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Sans } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: {
    default: "Claim Web3 Talents Certificate",
    template: "%s | Web3 Talents Certificates",
  },
  description: "Claim a Web3 Talents certificate and submit a TBC NFT destination.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f6f1e8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <div className="shell">
          <header className="topbar">
            <Link href="/">
              <Image
                className="brand-mark"
                src="/web3-talents-logo.png"
                alt="Web3 Talents"
                width={920}
                height={236}
                priority
              />
            </Link>
            <Image
              className="club-mark"
              src="/tbc-wordmark.png"
              alt="Tum Blockchain Club"
              width={600}
              height={156}
              priority
            />
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
