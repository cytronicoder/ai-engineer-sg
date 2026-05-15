import type {Metadata} from "next";
import "./globals.css";

import {Analytics} from '@vercel/analytics/next';
import {SpeedInsights} from "@vercel/speed-insights/next";

export const metadata: Metadata = {
    title: "AIE Pocket Schedule",
    description: "Curate your AIE Singapore experience.",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body className="font-sans antialiased">
        {children}
        <Analytics/>
        <SpeedInsights/>
        </body>
        </html>
    );
}
