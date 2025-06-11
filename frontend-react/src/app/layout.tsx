import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { DuelProvider } from "@/contexts/DuelContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Дуэли программистов",
  description: "Соревнуйтесь с другими программистами в режиме реального времени",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      {/* Игнорируем несоответствия при гидратации */}
      <body className={inter.className} suppressHydrationWarning> 
        <AuthProvider>
          <DuelProvider>
            {children}
          </DuelProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
