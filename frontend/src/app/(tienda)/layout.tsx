import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { WhatsAppFab } from "@/components/layout/WhatsAppFab";
import { fetchPublicSettings } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  let settings;
  try {
    settings = await fetchPublicSettings();
  } catch {
    settings = {
      announcement_text: "DESPACHO GRATIS EN SANTIAGO",
      whatsapp: "+56932222939",
      instagram: "@livinglove.cl",
    };
  }

  return (
    <>
      <AnnouncementBar text={settings.announcement_text} />
      <Header />
      <main>{children}</main>
      <Footer settings={settings} />
      <WhatsAppFab phone={settings.whatsapp} />
    </>
  );
}
