'use client';

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ToastContainer } from 'react-toastify';
import { Bounce } from "react-toastify";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const routeWithoutFooter = ['/login', '/signup', '/reading', '/listening'];
  const showFooter = !routeWithoutFooter.some(route => 
    pathname === route || 
    pathname.startsWith(`${route}/start/`)
  );

  return (
    <>
      <Navbar />
      <main className="flex-grow bg-gray-200">{children}</main>
      {showFooter && <Footer />}
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        transition={Bounce}
      />
    </>
  );
} 