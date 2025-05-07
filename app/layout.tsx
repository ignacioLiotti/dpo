import { Geist } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { createClient } from "@/supabase/server";
import { SidebarInset, SidebarProvider } from "@/components/layout/sidebar/sidebar";
import { AppSidebar } from "@/components/layout/sidebar/app-sidebar";
import { Toaster } from "sonner";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Next.js and Supabase Starter Kit",
  description: "The fastest way to build apps with Next.js and Supabase",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const mapped = [
    {
      "title": "Obras",
      "url": "/obras",
      "iconKey": "HardHatIcon",
      "items": [
        {
          "title": "Main",
          "url": "/obras",
          "iconKey": "House"
        },
        // {
        //   "title": "Create",
        //   "url": "/obras/create",
        //   "iconKey": "FilePlus",
        //   "items": [
        //     {
        //       "title": "Main",
        //       "url": "/obras/create",
        //       "iconKey": "House"
        //     }
        //   ]
        // },
        {
          "title": "Obra de Ejemplo",
          "url": "/obras/1284",
          "iconKey": "HardHatIcon",
          "items": [
            {
              "title": "Main",
              "url": "/obras/1",
              "iconKey": "House"
            }
          ]
        }
      ]
    },
    {
      "title": "Custom Obras",
      "url": "/custom-obras",
      "iconKey": "LayoutListIcon",
      "items": [
        {
          "title": "Main",
          "url": "/custom-obras",
          "iconKey": "House"
        },
        {
          "title": "Create",
          "url": "/custom-obras/create",
          "iconKey": "FilePlus"
        },
        {
          "title": "Obra de Ejemplo",
          "url": "/custom-obras/1284",
          "iconKey": "HardHatIcon",
          "items": [
            {
              "title": "Main",
              "url": "/custom-obras/1284",
              "iconKey": "House"
            }
          ]
        }
      ]
    },
    {
      "title": "Items de Construcción",
      "url": "/",
      "iconKey": "LayoutListIcon",
      "items": []
    },
    {
      "title": "Fin de la Presentación",
      "url": "/fin",
      "iconKey": "QrCodeIcon",
      "items": []
    },
    {
      "title": "Auth",
      "url": "#",
      "iconKey": "UserCog",
      "items": [
        {
          "title": "Sign In",
          "url": "/sign-in",
          "iconKey": "LogIn"
        },
        {
          "title": "Sign Up",
          "url": "/sign-up",
          "iconKey": "UserPlus"
        }
      ]
    },
    {
      "title": "Vista Administrativa",
      "url": "/admin",
      "iconKey": "QrCodeIcon",
      "items": []
    }
  ]

  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-containerHollowBackground text-foreground">
        <Toaster />
        <SidebarProvider>
          <AppSidebar mappedData={mapped as any} user={session?.user || null} />
          <SidebarInset className="flex flex-col pl-0 w-full pr-4 pb-4 pt-1">
            <main className="min-h-full flex flex-col items-cente max-h-[80vh]">
              <div className="flex-1 w-full h-full flex flex-col items-center">
                <Navbar session={session} />

                <div className="flex-1 w-full h-full flex flex-col items-center bg-white rounded-3xl overflow-y-auto max-h-[95vh] outline outline-outline outline-1 shadow mt-[1px]" >
                  {children}
                  <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-4 bg-white max-h-[10vh]">
                    <p>
                      Powered by{" "}
                      <a
                        href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
                        target="_blank"
                        className="font-bold hover:underline"
                        rel="noreferrer"
                      >
                        Supabase
                      </a>
                    </p>
                  </footer>
                </div>

              </div>
            </main>
          </SidebarInset>
        </SidebarProvider>
      </body>
    </html>
  );
}