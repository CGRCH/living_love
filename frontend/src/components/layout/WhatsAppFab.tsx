export function WhatsAppFab({ phone }: { phone: string }) {
  const digits = phone.replace(/\D/g, "");
  return (
    <a
      href={`https://wa.me/${digits}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-xl text-blanco shadow-lg"
    >
      WA
    </a>
  );
}
