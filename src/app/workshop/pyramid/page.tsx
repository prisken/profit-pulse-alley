import WorkshopWizard from "@/components/workshop/WorkshopWizard";

/** Allow DeepSeek retries + bilingual JSON within Vercel serverless limits. */
export const maxDuration = 60;

export const metadata = {
  title: "Workshop Pyramid Lab | Profit Pulse Ally",
  description: "Private workshop pyramid lab session.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function WorkshopPyramidPage() {
  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900">
      <WorkshopWizard />
    </div>
  );
}
