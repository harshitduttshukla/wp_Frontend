import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata = { title: "PAJASA Dashboard" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div className="fixed inset-x-0 top-0 z-30 flex h-8 items-center justify-between border-b-2 border-brand bg-wpdark px-4 text-[13px] text-[#f0f0f1]">
          <span className="flex items-center gap-2 font-semibold"><span className="grid h-5 w-5 place-items-center rounded bg-brand text-[11px] font-extrabold text-wpdark">P</span>PAJASA Service Apartments</span>
          <span>Howdy, admin</span>
        </div>
        <Sidebar />
        <main className="min-h-screen pl-0 pt-8 md:pl-40">
          <div className="p-5">{children}</div>
        </main>
      </body>
    </html>
  );
}
