// layout.tsx
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { Separator } from "@radix-ui/react-dropdown-menu";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import ReactScanWrapper from "./reactScanWrapper";
import { Toaster } from "@/components/ui/toaster";
import Providers from "./providers";
import ReactQueryDevtool from "./ReactQueryDevtool";
import { OnboardingProvider } from "@/components/Onboarding/OnboardingProvider";

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

const geistMono = Geist_Mono({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

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
    }
  ]

  return (
    <Providers>
      <html lang="en">
        <head>
          {/* rest of your scripts go under */}
        </head>
        <body
          className={` ${geistSans.className} antialiased bg-containerBackground`}
        >
          <ReactScanWrapper>
            <OnboardingProvider>
              <SidebarProvider>
                <AppSidebar mappedData={mapped as any} />
                <SidebarInset className="flex flex-col p-4 pt-0 lg:pr-10">
                  <header className="flex h-14 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2">
                      <SidebarTrigger className="-ml-1" />
                      <Separator className="mr-2 h-4" />
                      <Breadcrumbs />
                    </div>
                  </header>
                  {/* <div className="flex flex-1 flex-col w-full h-full mb-4 bg-white rounded-3xl shadow-[0_0_0px_5px_#bcc5e81c,_0_0_0px_2px_#dfe0e4_] px-8"> */}
                  {children}
                  {/* </div> */}
                </SidebarInset>
                {/* <ReactQueryDevtool /> */}
              </SidebarProvider>
            </OnboardingProvider>
          </ReactScanWrapper>
          <Toaster />
        </body>
      </html>
    </Providers>
  );
}

