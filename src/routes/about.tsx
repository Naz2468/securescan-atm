import { createFileRoute } from "@tanstack/react-router";
import { TerminalHeader } from "@/components/TerminalHeader";
import {
  ShieldCheck,
  ScanFace,
  Fingerprint,
  GraduationCap,
  Target,
  HelpCircle,
  BookOpen,
  Cpu,
  Database,
} from "lucide-react";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About · SecurePay ATM 2FA" },
      {
        name: "description",
        content:
          "Secure ATM 2-Factor Authentication using Facial Recognition and Fingerprint — academic project by Aba Peter Owoicho, Bingham University.",
      },
    ],
  }),
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background font-mono text-foreground">
      <TerminalHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 space-y-8">
        {/* Title block */}
        <section className="rounded border border-[color:var(--border)] bg-panel p-6">
          <div className="text-xs tracking-widest text-muted">// PROJECT DOCUMENTATION</div>
          <h1 className="mt-2 text-2xl tracking-widest text-accent sm:text-3xl">
            SECURE ATM 2-FACTOR AUTHENTICATION
          </h1>
          <p className="mt-1 text-sm text-muted">
            Using Facial Recognition and Fingerprint
          </p>

          <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            <Meta label="AUTHOR" value="Aba Peter Owoicho" />
            <Meta label="MATRIC NO" value="BHU/22/04/09/0079" />
            <Meta label="DEPARTMENT" value="Cyber Security" />
            <Meta label="FACULTY" value="Computing" />
            <Meta
              label="INSTITUTION"
              value="Bingham University, Karu, Nasarawa State, Nigeria"
            />
            <Meta label="DEGREE" value="B.Sc. Cyber Security" />
            <Meta label="SUBMISSION" value="January, 2026" />
          </dl>
        </section>

        {/* Background */}
        <Card icon={<BookOpen className="h-4 w-4" />} title="BACKGROUND">
          <p>
            Automated Teller Machines (ATMs) rely heavily on card-and-PIN
            authentication, which is vulnerable to card theft, skimming, PIN
            guessing, and shoulder surfing. Biometric authentication —
            particularly facial recognition and fingerprint verification —
            offers a stronger identity assurance model based on{" "}
            <span className="text-accent">who the user is</span>, not what they
            carry or know.
          </p>
          <p>
            Single-factor biometrics still have limits: fingerprints fail on
            worn skin and faces can be spoofed without liveness checks. A
            Two-Factor Authentication (2FA) approach combining both modalities
            significantly reduces unauthorized access even if one factor is
            compromised.
          </p>
        </Card>

        {/* Problem */}
        <Card icon={<ShieldCheck className="h-4 w-4" />} title="PROBLEM STATEMENT">
          <p>
            ATM fraud through card duplication, skimming and PIN compromise
            continues to rise, particularly in developing countries. Few
            deployed systems combine multiple biometric factors in a
            practical, cost-effective way. This project addresses that gap.
          </p>
        </Card>

        {/* Research Questions */}
        <Card icon={<HelpCircle className="h-4 w-4" />} title="RESEARCH QUESTIONS">
          <ol className="ml-4 list-decimal space-y-1">
            <li>How can facial recognition and fingerprint authentication be integrated into a secure ATM 2FA system?</li>
            <li>What is the performance of the proposed system in terms of accuracy, FAR and FRR?</li>
            <li>How does biometric 2FA compare to traditional card-and-PIN authentication in preventing fraud?</li>
          </ol>
        </Card>

        {/* Objectives */}
        <Card icon={<Target className="h-4 w-4" />} title="OBJECTIVES">
          <ol className="ml-4 list-decimal space-y-1">
            <li>Design a Secure ATM 2FA architecture using facial recognition and fingerprint.</li>
            <li>Implement biometric enrolment and matching with appropriate thresholds.</li>
            <li>Evaluate system performance using accuracy, precision, recall, FAR and FRR.</li>
            <li>Integrate the biometric modules into a simulated ATM workflow.</li>
          </ol>
        </Card>

        {/* Stack */}
        <Card icon={<Cpu className="h-4 w-4" />} title="IMPLEMENTATION STACK">
          <ul className="ml-4 list-disc space-y-1">
            <li><span className="text-accent">Frontend:</span> React + Vite + Tailwind (TanStack Start)</li>
            <li><span className="text-accent">Backend:</span> Lovable Cloud (Postgres, Storage, Server Functions)</li>
            <li><span className="text-accent">Face:</span> face-api.js · 128-D descriptor · Euclidean distance &lt; 0.5</li>
            <li><span className="text-accent">Fingerprint:</span> OpenCV.js · ORB keypoints + BFMatcher (Hamming)</li>
          </ul>
        </Card>

        {/* Roles */}
        <Card icon={<Database className="h-4 w-4" />} title="ACTORS (USE CASE)">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-accent text-xs tracking-widest">ATM USER</div>
              <ul className="mt-1 ml-4 list-disc space-y-1">
                <li>Enter account number</li>
                <li>Verify face (2FA factor 1)</li>
                <li>Verify fingerprint (2FA factor 2)</li>
                <li>Withdraw cash, transfer funds, check balance</li>
              </ul>
            </div>
            <div>
              <div className="text-accent text-xs tracking-widest">SYSTEM ADMINISTRATOR</div>
              <ul className="mt-1 ml-4 list-disc space-y-1">
                <li>Enrol user biometrics</li>
                <li>Monitor authentication logs</li>
                <li>System maintenance</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Significance */}
        <Card icon={<ScanFace className="h-4 w-4" />} title="SIGNIFICANCE">
          <p>
            By requiring both a facial match and a fingerprint match before
            granting access, this prototype demonstrates a practical defence
            against card theft, PIN compromise and identity fraud — improving
            customer trust in electronic banking, especially in regions where
            ATM-related crime remains high.
          </p>
        </Card>

        <p className="pt-4 text-center text-xs text-muted">
          <Fingerprint className="mr-1 inline h-3 w-3" />
          Academic prototype · Bingham University · Department of Cyber Security · 2026
        </p>
      </main>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-[color:var(--border)] bg-background px-3 py-2">
      <div className="text-[10px] tracking-widest text-muted">{label}</div>
      <div className="text-accent">{value}</div>
    </div>
  );
}

function Card({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded border border-[color:var(--border)] bg-panel p-6">
      <div className="flex items-center gap-2 text-accent">
        {icon}
        <h2 className="text-xs tracking-widest">{title}</h2>
      </div>
      <div className="mt-3 space-y-3 text-sm text-foreground/90">{children}</div>
    </section>
  );
}

function GraduationIcon() {
  return <GraduationCap className="h-4 w-4" />;
}
