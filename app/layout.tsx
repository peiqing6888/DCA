import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "pqDCA",
  description: "A Mac OS 8 style DCA AI Strategy application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link 
          href="https://fonts.cdnfonts.com/css/chicago-2" 
          rel="stylesheet"
        />
      </head>
      <body className="font-chicago bg-[#666666]">{children}</body>
    </html>
  );
}
