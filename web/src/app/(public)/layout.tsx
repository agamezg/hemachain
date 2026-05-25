import "../globals.css";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { Web3Provider } from "@/providers/Web3Provider";
import { PublicHeader } from "@/components/site/PublicHeader";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Resolves the display language for the locale-less public routes from the
 * `NEXT_LOCALE` cookie that next-intl sets on the localized side. Falls back
 * to the default locale for a cold QR visitor with no cookie.
 */
async function resolveLocale(): Promise<Locale> {
  const cookieLocale = (await cookies()).get("NEXT_LOCALE")?.value;
  return routing.locales.includes(cookieLocale as Locale)
    ? (cookieLocale as Locale)
    : routing.defaultLocale;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const t = await getTranslations({ locale, namespace: "verify" });
  return { title: `HemaChain · ${t("brand")}` };
}

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await resolveLocale();
  const messages = (await import(`../../../messages/${locale}.json`)).default;

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrains.variable}`}
    >
      <body className="min-h-screen flex flex-col">
        <ThemeProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <Web3Provider>
              <PublicHeader />
              <main className="flex-1">{children}</main>
            </Web3Provider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
