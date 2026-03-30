import Providers from "./Providers";
import { config } from "@/config";
import { Bai_Jamjuree } from 'next/font/google';

const baiJamjuree = Bai_Jamjuree({
  weight: ['200', '300', '400', '500', '600', '700'],
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-bai-jamjuree',
});

export const metadata = {
  title: config.ui.title,
  description: "AI Studio for generating diagrams via Gemini.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={baiJamjuree.variable}>
      <body>
        <Providers> {children} </Providers>
      </body>
    </html>
  );
}
