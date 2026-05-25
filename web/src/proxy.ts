import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // `verify` is the locale-less, wallet-less public surface — keep it out of
  // next-intl's locale-prefix routing (it lives under app/(public)/).
  matcher: ["/((?!api|verify|_next|_vercel|.*\\..*).*)"],
};
