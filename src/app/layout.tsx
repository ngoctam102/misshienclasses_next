import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/app/ClientLayout";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased flex flex-col min-h-screen`}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
