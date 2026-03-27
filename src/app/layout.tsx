import Providers from "./Providers";
import { config } from "@/config";

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
    <html lang="en">
      <body>
        <Providers> {children} </Providers>
      </body>
    </html>
  );
}
