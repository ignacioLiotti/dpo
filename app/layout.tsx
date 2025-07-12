import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { createClient } from "@/supabase/server";
import { SidebarInset, SidebarProvider } from "@/components/layout/sidebar/sidebar";
import { AppSidebar } from "@/components/layout/sidebar/app-sidebar";
import { Toaster } from "sonner";
import { Providers } from './providers';

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Next.js and Supabase Starter Kit",
  description: "The fastest way to build apps with Next.js and Supabase",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
        }
      ]
    },
    {
      "title": "Organization Files",
      "url": "/files",
      "iconKey": "FolderSearch2",
      "items": []
    },
    {
      "title": "Document Examples",
      "url": "/document-example",
      "iconKey": "LayoutTemplateIcon",
      "items": []
    },
    {
      "title": "OCR Playground",
      "url": "/playground",
      "iconKey": "BrainCogIcon",
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
  ]

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script
          crossOrigin="anonymous"
          src="//unpkg.com/react-scan/dist/auto.global.js"
        />
      </head>
      <body className="text-foreground bg-background">

        <Providers>
          <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
            <filter id="noiseFilter">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="5.47"
                numOctaves="2"
                stitchTiles="stitch" />
            </filter>
          </svg>

          <div className="noise-bg -z-10" />
          <Toaster />
          <SidebarProvider defaultOpen={false}>
            <AppSidebar mappedData={mapped as any} user={session?.user || null} />
            <SidebarInset className="flex flex-col pl-0 w-full pr-4 pb-4 pt-1">
              <main className="min-h-full flex flex-col items-cente max-h-[80vh]">
                <div className="flex-1 w-full h-full flex flex-col items-center">
                  <Navbar session={session} />

                  <div className="flex-1 w-full h-full flex flex-col items-center bg-transparent rounded-none max-h-[92vh] outline outline-outline outline-1 shadow z-10 relative" >
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
        </Providers>
      </body>
    </html>
  );
}