// layout.tsx
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { Separator } from "@radix-ui/react-dropdown-menu";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import ReactScanWrapper from "./reactScanWrapper";
import { Toaster } from "@/components/ui/toaster";
import Providers from "./providers";
import ReactQueryDevtool from "./ReactQueryDevtool";

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
        {
          "title": "Create",
          "url": "/obras/create",
          "iconKey": "FilePlus",
          "items": [
            {
              "title": "Main",
              "url": "/obras/create",
              "iconKey": "House"
            }
          ]
        },
        {
          "title": "[id]",
          "url": "/obras/1",
          "iconKey": "Bot",
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
      "title": "Presupuesto",
      "url": "/presupuesto",
      "iconKey": "Coins",
      "items": [
        {
          "title": "Main",
          "url": "/presupuesto",
          "iconKey": "House"
        },
        {
          "title": "All",
          "url": "/presupuesto/all",
          "iconKey": "Bot",
          "items": [
            {
              "title": "Main",
              "url": "/presupuesto/all",
              "iconKey": "House"
            }
          ]
        },
        {
          "title": "Components",
          "url": "/presupuesto/components",
          "iconKey": "Bot",
          "items": []
        },
        {
          "title": "[id]",
          "url": "/presupuesto/1",
          "iconKey": "Bot",
          "items": [
            {
              "title": "Main",
              "url": "/presupuesto/1",
              "iconKey": "House"
            }
          ]
        }
      ]
    },
    {
      "title": "Home",
      "url": "/",
      "iconKey": "Coins",
      "items": []
    },
  ]

  return (
    <Providers>
      <html lang="en">
        <head>
          {/* rest of your scripts go under */}
        </head>
        <body
          className={`${geistSans.className} ${geistMono.className} antialiased`}
        >
          <ReactScanWrapper>
            <SidebarProvider>
              <AppSidebar mappedData={mapped as any} />
              <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                  <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator className="mr-2 h-4" />
                    <Breadcrumb>
                      <BreadcrumbList>
                        <BreadcrumbItem className="hidden md:block">
                          <BreadcrumbLink href="#">
                            Building Your Application
                          </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="hidden md:block" />
                        <BreadcrumbItem>
                          <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                        </BreadcrumbItem>
                      </BreadcrumbList>
                    </Breadcrumb>
                  </div>
                </header>

                {children}
                <ReactQueryDevtool />
              </SidebarInset>
            </SidebarProvider>
          </ReactScanWrapper>
          <Toaster />
        </body>
      </html>
    </Providers>
  );
}

