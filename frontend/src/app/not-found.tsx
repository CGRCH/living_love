import Link from "next/link";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { NotFoundContent } from "@/components/layout/NotFoundContent";
import { WhatsAppFab } from "@/components/layout/WhatsAppFab";

export default function RootNotFound() {
  const settings = {
    announcement_text: "DESPACHO GRATIS EN SANTIAGO · FABRICACIÓN PROPIA",
    whatsapp: "+56932222939",
    instagram: "@livinglove.cl",
  };

  return (
    <>
      <AnnouncementBar text={settings.announcement_text} />
      <Header />
      <main>
        <NotFoundContent />
        <p className="pb-12 text-center text-sm text-taupe">
          <Link href="/admin" className="underline">
            Panel admin
          </Link>
        </p>
      </main>
      <Footer settings={settings} />
      <WhatsAppFab phone={settings.whatsapp} />
    </>
  );
}
