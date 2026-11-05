from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.catalog.models import Category, Fabric, OptionGroup, OptionValue, Product
from apps.content.models import HomeContent, Testimonial
from apps.payments.models import PaymentProviderConfig
from apps.shipping.models import Commune, Region, ShippingRate
from apps.store_settings.models import Coupon, StoreSettings
from apps.billing.models import TaxDocumentSettings
from apps.orders.models import Order, OrderEvent, OrderItem

User = get_user_model()

RM_COMMUNES = [
    "Santiago",
    "Providencia",
    "Las Condes",
    "Vitacura",
    "La Reina",
    "Ñuñoa",
    "Peñalolén",
    "Maipú",
    "La Florida",
    "Puente Alto",
    "San Miguel",
    "Macul",
    "Huechuraba",
    "Quilicura",
    "Colina",
]

DEMO_PRODUCTS = [
    ("Sofá Nube Bouclé", "sofa-nube-boucle", "livings", 1290000, 1490000),
    ("Seccional Andes", "seccional-andes", "livings", 1890000, None),
    ("Sofá Valparaíso", "sofa-valparaiso", "livings", 990000, None),
    ("Chesterfield Oliva", "chesterfield-oliva", "livings", 0, None),
    ("Cojín Bouclé Marfil", "cojin-boucle-marfil", "cojines", 39000, None),
    ("Cierre PVC Quincho", "cierre-pvc-quincho", "cortinas-pvc", 2150000, None),
    ("Toldo Retráctil Terraza", "toldo-retractil", "toldos", 890000, None),
    ("Quitasol 3×3 Arena", "quitasol-3x3", "quitasoles", 420000, None),
]


class Command(BaseCommand):
    help = "Carga datos demo Living Love (marcados is_demo=True)"

    def handle(self, *args, **options):
        self.stdout.write("Sembrando Living Love…")
        store = StoreSettings.load()
        store.announcement_text = (
            "DESPACHO GRATIS EN SANTIAGO · ENVÍOS A LA V REGIÓN · "
            "FABRICACIÓN PROPIA — WHATSAPP +56 9 3222 2939"
        )
        store.trust_return_text = "Política de devoluciones configurable desde admin"
        store.return_policy_md = (
            "## Devoluciones\n\nConsulte condiciones vigentes con nuestro equipo."
        )
        store.save()

        tax = TaxDocumentSettings.load()
        tax.boleta_enabled = True
        tax.factura_enabled = True
        tax.save()

        for code, name, enabled in [
            ("simulated", "Modo simulado (desarrollo)", True),
            ("webpay", "Webpay Plus", True),
            ("mercadopago", "Mercado Pago", True),
            ("flow", "Flow", True),
            ("sumup", "SumUp", True),
        ]:
            PaymentProviderConfig.objects.update_or_create(
                code=code,
                defaults={
                    "display_name": name,
                    "is_enabled": enabled,
                    "mode": "simulated" if code != "sumup" else "sandbox",
                    "order": 0 if code == "simulated" else 10,
                },
            )

        rm, _ = Region.objects.get_or_create(code="RM", defaults={"name": "Región Metropolitana", "order": 1})
        valpo, _ = Region.objects.get_or_create(
            code="V", defaults={"name": "Región de Valparaíso", "order": 2}
        )
        for name in RM_COMMUNES:
            commune, _ = Commune.objects.get_or_create(region=rm, name=name)
            ShippingRate.objects.update_or_create(
                region=rm, commune=commune, defaults={"price": 0, "lead_days": 3, "is_active": True}
            )
        ShippingRate.objects.update_or_create(
            region=rm, commune=None, defaults={"price": 0, "lead_days": 5, "is_active": True}
        )

        categories = {}
        for slug, label in [
            ("livings", "Livings"),
            ("cojines", "Cojines"),
            ("cortinas-pvc", "Cortinas PVC"),
            ("toldos", "Toldos"),
            ("quitasoles", "Quitasoles"),
        ]:
            cat, _ = Category.objects.update_or_create(
                slug=slug, defaults={"name": label, "order": len(categories), "is_active": True}
            )
            categories[slug] = cat

        fabrics = {}
        for name, family, hex_code in [
            ("Bouclé Marfil", "bouclé", "#F7F3EC"),
            ("Bouclé Arena", "bouclé", "#D9CFC1"),
            ("Terciopelo Champagne", "terciopelo", "#C9A96E"),
            ("Lino Grafito", "lino", "#1A1A1A"),
            ("Antimanchas Camel", "antimanchas", "#8A8178"),
        ]:
            fab, _ = Fabric.objects.update_or_create(
                name=name, defaults={"family": family, "hex": hex_code, "is_active": True}
            )
            fabrics[name] = fab

        for name, slug, cat_slug, price, compare in DEMO_PRODUCTS:
            quote_only = slug == "chesterfield-oliva"
            product, _ = Product.objects.update_or_create(
                slug=slug,
                defaults={
                    "name": name,
                    "category": categories[cat_slug],
                    "description": f"{name} — producto demo inspirado en @livinglove.cl",
                    "base_price": price,
                    "compare_at_price": compare,
                    "price_mode": "quote_only" if quote_only else "show_price",
                    "is_featured": slug in ("sofa-nube-boucle", "seccional-andes", "cojin-boucle-marfil"),
                    "is_active": True,
                    "is_demo": True,
                    "requires_deposit": cat_slug == "livings" and not quote_only,
                    "lead_time_text": "15–20 días hábiles",
                },
            )
            if slug == "sofa-nube-boucle" and not product.option_groups.exists():
                tela = OptionGroup.objects.create(product=product, name="Tela", order=1)
                for i, (label, fab_name, delta) in enumerate(
                    [
                        ("Bouclé Marfil", "Bouclé Marfil", 0),
                        ("Bouclé Arena", "Bouclé Arena", 0),
                        ("Terciopelo Champagne", "Terciopelo Champagne", 80000),
                    ]
                ):
                    OptionValue.objects.create(
                        group=tela,
                        label=label,
                        fabric=fabrics.get(fab_name),
                        swatch_hex=fabrics[fab_name].hex if fab_name in fabrics else "",
                        price_delta=delta,
                        order=i,
                    )
                medida = OptionGroup.objects.create(product=product, name="Medida", order=2)
                OptionValue.objects.create(group=medida, label="2 cuerpos · 180 cm", price_delta=-100000, order=0)
                OptionValue.objects.create(group=medida, label="3 cuerpos · 220 cm", price_delta=0, order=1)
                OptionValue.objects.create(
                    group=medida, label="A medida", price_delta=0, triggers_quote=True, order=2
                )
                patas = OptionGroup.objects.create(product=product, name="Patas", order=3)
                for i, label in enumerate(["Roble natural", "Negro mate", "Latón"]):
                    OptionValue.objects.create(group=patas, label=label, order=i)
                extras = OptionGroup.objects.create(
                    product=product, name="Extras", type="multi", required=False, order=4
                )
                OptionValue.objects.create(
                    group=extras, label="2 cojines a juego", price_delta=49000, order=0
                )

        HomeContent.objects.get_or_create(
            section="hero",
            order=0,
            defaults={
                "title": "El living que siempre soñaste",
                "subtitle": "Sofás a medida, telas premium y fabricación nacional. Despacho gratis en Santiago.",
                "cta_text": "Comprar ahora",
                "cta_url": "/categoria/livings",
                "is_active": True,
            },
        )

        Testimonial.objects.get_or_create(
            name="Carolina R.",
            defaults={
                "location": "Las Condes",
                "text": "Calidad de tienda de diseño europea, pero hecho aquí y a la medida exacta de mi departamento.",
                "rating": 5,
                "is_active": True,
            },
        )
        Testimonial.objects.get_or_create(
            name="Felipe M.",
            defaults={
                "location": "Providencia",
                "text": "El proceso de cotización fue claro y el sofá llegó exactamente como lo configuramos online.",
                "rating": 5,
                "is_active": True,
            },
        )
        Testimonial.objects.get_or_create(
            name="Valentina S.",
            defaults={
                "location": "Vitacura",
                "text": "Telas hermosas y terminaciones impecables. Recomiendo Living Love sin dudarlo.",
                "rating": 5,
                "is_active": True,
            },
        )

        sofa = Product.objects.filter(slug="sofa-nube-boucle").first()
        seccional = Product.objects.filter(slug="seccional-andes").first()
        if sofa and not Order.objects.filter(number="LL-DEMO-0001").exists():
            o1 = Order.objects.create(
                number="LL-DEMO-0001",
                email="cliente@demo.cl",
                phone="+56912345678",
                status=Order.Status.PAID,
                subtotal=1290000,
                total=1290000,
                deposit_amount=645000,
                balance_due=645000,
                amount_due_now=645000,
                shipping_cost=0,
                shipping_address={"name": "María Demo", "street": "Av. Providencia 1234"},
            )
            OrderItem.objects.create(
                order=o1,
                product=sofa,
                name_snapshot=sofa.name,
                unit_price=1290000,
                qty=1,
                options={"Tela": "Bouclé Marfil"},
            )
            OrderEvent.objects.create(order=o1, status="paid", note="Pago confirmado (demo)")
        if seccional and not Order.objects.filter(number="LL-DEMO-0002").exists():
            o2 = Order.objects.create(
                number="LL-DEMO-0002",
                email="juan@demo.cl",
                phone="+56987654321",
                status=Order.Status.IN_WORKSHOP,
                subtotal=1890000,
                total=1890000,
                deposit_amount=945000,
                balance_due=945000,
                amount_due_now=945000,
                shipping_cost=0,
                shipping_address={"name": "Juan Pérez", "street": "Los Leones 456"},
            )
            OrderItem.objects.create(
                order=o2,
                product=seccional,
                name_snapshot=seccional.name,
                unit_price=1890000,
                qty=1,
                options={},
            )
            OrderEvent.objects.create(order=o2, status="in_workshop", note="En fabricación")

        now = timezone.now()
        Coupon.objects.update_or_create(
            code="BIENVENIDA",
            defaults={
                "type": "fixed",
                "value": 40000,
                "min_total": 200000,
                "valid_from": now - timedelta(days=1),
                "valid_to": now + timedelta(days=365),
                "max_uses": 1000,
                "is_active": True,
            },
        )

        if not User.objects.filter(email="admin@livinglove.cl").exists():
            User.objects.create_superuser(
                email="admin@livinglove.cl",
                password="admin12345",
                first_name="Cesar",
                last_name="Admin",
            )

        self.stdout.write(self.style.SUCCESS("Seed completado (datos demo)."))
