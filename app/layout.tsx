import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Transformando Conflito em Conversa", description: "Um copiloto para conversas difíceis. Encontre uma forma mais clara, empática e assertiva de conversar.", icons: { icon: "/favicon.svg" } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="pt-BR"><body>{children}</body></html>; }
