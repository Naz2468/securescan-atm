import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/contexts/AuthContext";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 font-mono">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-accent">404</h1>
        <h2 className="mt-4 text-xl text-foreground">SEGMENT NOT FOUND</h2>
        <p className="mt-2 text-sm text-muted">
          The terminal you requested is offline or does not exist.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded border border-accent bg-accent-dim px-4 py-2 text-xs tracking-widest text-accent"
        >
          RETURN TO HOME
        </a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 font-mono">
      <div className="max-w-md text-center">
        <h1 className="text-xl text-danger">SYSTEM FAULT</h1>
        <p className="mt-2 text-sm text-muted">{error.message}</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 rounded border border-accent bg-accent-dim px-4 py-2 text-xs tracking-widest text-accent"
        >
          RETRY
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SecurePay ATM · 2-Factor Biometric Authentication" },
      {
        name: "description",
        content:
          "Academic prototype: Secure ATM 2-Factor Authentication using Facial Recognition and Fingerprint matching.",
      },
      { property: "og:title", content: "SecurePay ATM · 2-Factor Biometric Authentication" },
      { name: "twitter:title", content: "SecurePay ATM · 2-Factor Biometric Authentication" },
      { name: "description", content: "SecureScan ATM is a 2-factor authentication system for ATMs using facial and fingerprint recognition." },
      { property: "og:description", content: "SecureScan ATM is a 2-factor authentication system for ATMs using facial and fingerprint recognition." },
      { name: "twitter:description", content: "SecureScan ATM is a 2-factor authentication system for ATMs using facial and fingerprint recognition." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/3417b9e9-f05e-4b77-b3d5-a40853904a77/id-preview-1e1d7982--0c9a2e12-ca1c-4858-8cdc-1de6d616d741.lovable.app-1780363248452.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/3417b9e9-f05e-4b77-b3d5-a40853904a77/id-preview-1e1d7982--0c9a2e12-ca1c-4858-8cdc-1de6d616d741.lovable.app-1780363248452.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    </QueryClientProvider>
  );
}
