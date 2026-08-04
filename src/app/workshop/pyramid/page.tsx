import WorkshopWizard from "@/components/workshop/WorkshopWizard";

export const metadata = {
  title: "Workshop Pyramid Lab | Profit Pulse Ally",
  description: "Private workshop pyramid lab session.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function WorkshopPyramidPage() {
  return <WorkshopWizard />;
}
