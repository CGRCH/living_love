import csv
import io
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.http import HttpResponse
from django.db.models import Avg, Count, Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.api.serializers import (
    AdminOptionGroupSerializer,
    AdminOptionValueSerializer,
    AdminProductWriteSerializer,
    AdminUserSerializer,
    OrderDetailSerializer,
    OrderSerializer,
    ProductDetailSerializer,
    QuoteSerializer,
    UserSerializer,
)
from apps.billing.models import TaxDocument, TaxDocumentSettings
from apps.catalog.models import Category, Fabric, OptionGroup, OptionValue, Product, ProductImage
from apps.common.crypto import decrypt_credentials, encrypt_credentials
from apps.content.models import HomeContent, Testimonial
from apps.orders.models import Order, OrderEvent, OrderItem
from apps.orders.services import finalize_payment
from apps.payments.models import Payment, PaymentProviderConfig
from apps.payments.providers import get_provider
from apps.quotes.models import Quote
from apps.shipping.models import Commune, Region, ShippingRate
from apps.store_settings.models import Coupon, StoreSettings
from apps.users.permissions import IsAdminRole

User = get_user_model()


class AdminDashboardView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        orders_month = Order.objects.filter(created_at__gte=month_start).exclude(
            status__in=[Order.Status.CANCELLED, Order.Status.REFUNDED]
        )
        sales = (
            Payment.objects.filter(
                status=Payment.Status.APPROVED,
                created_at__gte=month_start,
            ).aggregate(total=Sum("amount"))["total"]
            or 0
        )
        order_count = orders_month.count()
        open_quotes = Quote.objects.filter(
            status__in=[Quote.Status.NEW, Quote.Status.ANSWERED]
        ).count()
        avg_ticket = orders_month.aggregate(avg=Avg("total"))["avg"] or 0

        monthly = (
            Payment.objects.filter(
                status=Payment.Status.APPROVED,
                created_at__year=now.year,
            )
            .annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(total=Sum("amount"))
            .order_by("month")
        )
        month_totals = {row["month"].month: row["total"] or 0 for row in monthly if row["month"]}
        month_labels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
        chart = [
            {"month": month_labels[i], "total": month_totals.get(i + 1, 0)} for i in range(12)
        ]

        top_products = (
            OrderItem.objects.values("name_snapshot")
            .annotate(units=Sum("qty"))
            .order_by("-units")[:5]
        )

        recent = Order.objects.order_by("-created_at")[:10]
        return Response(
            {
                "sales_month": sales,
                "orders_month": order_count,
                "open_quotes": open_quotes,
                "avg_ticket": int(avg_ticket),
                "sales_chart": chart,
                "top_products": list(top_products),
                "recent_orders": OrderSerializer(recent, many=True).data,
            }
        )


class AdminOrderViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminRole]
    queryset = Order.objects.prefetch_related("items", "events", "payments", "tax_documents").order_by(
        "-created_at"
    )
    serializer_class = OrderSerializer
    filterset_fields = ["status"]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return OrderDetailSerializer
        return OrderSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    @action(detail=True, methods=["post"])
    def status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get("status")
        note = request.data.get("note", "")
        if new_status not in dict(Order.Status.choices):
            return Response({"detail": "Estado inválido"}, status=400)
        order.status = new_status
        order.save(update_fields=["status"])
        OrderEvent.objects.create(
            order=order, status=new_status, note=note, by=request.user
        )
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=["post"], parser_classes=[MultiPartParser, FormParser])
    def upload_document(self, request, pk=None):
        order = self.get_object()
        pdf = request.FILES.get("pdf")
        doc_type = request.data.get("type", order.doc_type)
        folio = request.data.get("folio", "")
        doc = TaxDocument.objects.create(
            order=order, type=doc_type, folio=folio, pdf=pdf, issued_at=timezone.now()
        )
        from apps.orders.services import send_order_email

        send_order_email(order)
        return Response({"id": doc.id, "folio": doc.folio})

    @action(detail=True, methods=["post"])
    def payment_link(self, request, pk=None):
        order = self.get_object()
        amount = int(request.data.get("amount") or order.balance_due or order.total)
        provider_code = request.data.get("provider", "simulated")
        cfg = PaymentProviderConfig.objects.get(code=provider_code, is_enabled=True)
        kind = "balance" if order.balance_due else "full"
        payment = Payment.objects.create(
            order=order,
            provider=cfg.code,
            amount=amount,
            payment_kind=kind,
            status=Payment.Status.PENDING,
        )
        provider = get_provider(cfg)
        from django.conf import settings

        result = provider.create(
            payment,
            order,
            success_url=f"{settings.FRONTEND_URL}/pago/exito?order={order.number}",
            cancel_url=f"{settings.FRONTEND_URL}/pago/cancelado?order={order.number}",
        )
        payment.external_id = result.external_id
        payment.save()
        return Response({"redirect_url": result.redirect_url, "payment_id": payment.id})

    @action(detail=False, methods=["get"])
    def export_csv(self, request):
        response = HttpResponse(content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = 'attachment; filename="pedidos.csv"'
        writer = csv.writer(response)
        writer.writerow(
            [
                "number",
                "email",
                "phone",
                "status",
                "subtotal",
                "discount",
                "shipping_cost",
                "total",
                "deposit_amount",
                "balance_due",
                "created_at",
            ]
        )
        for o in Order.objects.order_by("-created_at")[:5000]:
            writer.writerow(
                [
                    o.number,
                    o.email,
                    o.phone,
                    o.status,
                    o.subtotal,
                    o.discount,
                    o.shipping_cost,
                    o.total,
                    o.deposit_amount,
                    o.balance_due,
                    o.created_at.isoformat(),
                ]
            )
        return response


class AdminQuoteViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminRole]
    queryset = Quote.objects.select_related("product").order_by("-created_at")
    serializer_class = QuoteSerializer

    @action(detail=True, methods=["post"])
    def respond(self, request, pk=None):
        import secrets

        quote = self.get_object()
        amount = int(request.data.get("quoted_amount"))
        days = int(request.data.get("valid_days", 7))
        quote.quoted_amount = amount
        quote.valid_until = timezone.now().date() + timedelta(days=days)
        quote.status = Quote.Status.ANSWERED
        quote.admin_notes = request.data.get("admin_notes", quote.admin_notes)
        quote.payment_token = secrets.token_urlsafe(24)
        quote.save()
        return Response(QuoteSerializer(quote).data)

    @action(detail=True, methods=["post"])
    def convert(self, request, pk=None):
        quote = self.get_object()
        if not quote.payment_token:
            self.respond(request, pk)
            quote.refresh_from_db()
        return Response(
            {
                "payment_url": f"/cotizacion/pagar/{quote.payment_token}",
                "quote": QuoteSerializer(quote).data,
            }
        )


class AdminProductViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminRole]
    queryset = Product.objects.prefetch_related("images", "option_groups__values")
    lookup_field = "slug"

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return AdminProductWriteSerializer
        return ProductDetailSerializer

    @action(detail=True, methods=["post"], parser_classes=[MultiPartParser, FormParser])
    def upload_image(self, request, slug=None):
        product = self.get_object()
        img = ProductImage.objects.create(
            product=product,
            image=request.FILES.get("image"),
            alt=request.data.get("alt", product.name),
            order=int(request.data.get("order", 0)),
        )
        return Response({"id": img.id, "image": img.image.url if img.image else None})

    @action(detail=False, methods=["get"])
    def export_csv(self, request):
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="productos.csv"'
        writer = csv.writer(response)
        writer.writerow(
            [
                "slug",
                "name",
                "category_slug",
                "base_price",
                "compare_at_price",
                "price_mode",
                "is_active",
                "is_featured",
                "requires_deposit",
            ]
        )
        for p in Product.objects.select_related("category"):
            writer.writerow(
                [
                    p.slug,
                    p.name,
                    p.category.slug,
                    p.base_price,
                    p.compare_at_price or "",
                    p.price_mode,
                    int(p.is_active),
                    int(p.is_featured),
                    int(p.requires_deposit),
                ]
            )
        return response

    @action(detail=False, methods=["post"], parser_classes=[MultiPartParser, FormParser])
    def import_csv(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response({"detail": "Archivo requerido"}, status=400)
        reader = csv.DictReader(io.StringIO(file.read().decode("utf-8")))
        count = 0
        for row in reader:
            cat = Category.objects.filter(slug=row.get("category_slug")).first()
            if not cat:
                continue
            Product.objects.update_or_create(
                slug=row["slug"],
                defaults={
                    "name": row.get("name", row["slug"]),
                    "category": cat,
                    "base_price": int(row.get("base_price") or 0),
                    "compare_at_price": int(row["compare_at_price"]) if row.get("compare_at_price") else None,
                    "price_mode": row.get("price_mode", "show_price"),
                    "is_active": bool(int(row.get("is_active", 1))),
                    "is_featured": bool(int(row.get("is_featured", 0))),
                    "requires_deposit": bool(int(row.get("requires_deposit", 0))),
                },
            )
            count += 1
        return Response({"imported": count})


class AdminOptionGroupViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminRole]
    queryset = OptionGroup.objects.prefetch_related("values")
    serializer_class = AdminOptionGroupSerializer
    filterset_fields = ["product"]


class AdminOptionValueViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminRole]
    queryset = OptionValue.objects.select_related("group")
    serializer_class = AdminOptionValueSerializer


class AdminUserViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminRole]
    queryset = User.objects.order_by("-created_at")
    serializer_class = AdminUserSerializer


class AdminCategoryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminRole]
    queryset = Category.objects.all()
    serializer_class = __import__(
        "apps.api.serializers", fromlist=["CategorySerializer"]
    ).CategorySerializer


class AdminFabricViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminRole]
    queryset = Fabric.objects.all()
    serializer_class = __import__(
        "apps.api.serializers", fromlist=["FabricSerializer"]
    ).FabricSerializer


class AdminPaymentProviderView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        configs = PaymentProviderConfig.objects.all()
        data = []
        for c in configs:
            data.append(
                {
                    "id": c.id,
                    "code": c.code,
                    "display_name": c.display_name,
                    "is_enabled": c.is_enabled,
                    "mode": c.mode,
                    "has_credentials": bool(c.credentials_encrypted),
                    "order": c.order,
                }
            )
        return Response(data)

    def patch(self, request):
        code = request.data.get("code")
        cfg = PaymentProviderConfig.objects.get(code=code)
        for field in ("is_enabled", "mode", "display_name", "order"):
            if field in request.data:
                setattr(cfg, field, request.data[field])
        creds = request.data.get("credentials")
        if creds is not None:
            cfg.credentials_encrypted = encrypt_credentials(creds)
        cfg.save()
        return Response({"ok": True})


class AdminPaymentsListView(generics.ListAPIView):
    permission_classes = [IsAdminRole]
    queryset = Payment.objects.select_related("order").order_by("-created_at")[:100]

    def list(self, request, *args, **kwargs):
        data = [
            {
                "id": p.id,
                "order": p.order.number,
                "provider": p.provider,
                "amount": p.amount,
                "status": p.status,
                "created_at": p.created_at,
            }
            for p in self.get_queryset()
        ]
        return Response(data)


class AdminShippingRatesView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        rates = ShippingRate.objects.select_related("region", "commune")[:500]
        return Response(
            [
                {
                    "id": r.id,
                    "region": r.region.name,
                    "commune": r.commune.name if r.commune else None,
                    "price": r.price,
                    "lead_days": r.lead_days,
                    "is_active": r.is_active,
                }
                for r in rates
            ]
        )

    def post(self, request):
        region_id = request.data.get("region_id")
        commune_id = request.data.get("commune_id")
        price = int(request.data.get("price", 0))
        rate, _ = ShippingRate.objects.update_or_create(
            region_id=region_id,
            commune_id=commune_id,
            defaults={
                "price": price,
                "lead_days": int(request.data.get("lead_days", 3)),
                "is_active": True,
            },
        )
        return Response({"id": rate.id})


class AdminShippingRatesExportView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="tarifas.csv"'
        writer = csv.writer(response)
        writer.writerow(["region_code", "commune", "price", "lead_days"])
        for r in ShippingRate.objects.select_related("region", "commune"):
            writer.writerow(
                [
                    r.region.code,
                    r.commune.name if r.commune else "",
                    r.price,
                    r.lead_days,
                ]
            )
        return response


class AdminShippingRatesImportView(APIView):
    permission_classes = [IsAdminRole]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response({"detail": "Archivo requerido"}, status=400)
        decoded = file.read().decode("utf-8")
        reader = csv.DictReader(io.StringIO(decoded))
        count = 0
        for row in reader:
            region = Region.objects.filter(code=row.get("region_code")).first()
            if not region:
                continue
            commune = None
            if row.get("commune"):
                commune = Commune.objects.filter(region=region, name=row["commune"]).first()
            ShippingRate.objects.update_or_create(
                region=region,
                commune=commune,
                defaults={
                    "price": int(row.get("price", 0)),
                    "lead_days": int(row.get("lead_days", 3)),
                    "is_active": True,
                },
            )
            count += 1
        return Response({"imported": count})


class AdminSettingsView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        store = StoreSettings.load()
        tax = TaxDocumentSettings.load()
        return Response(
            {
                "store": {
                    "whatsapp": store.whatsapp,
                    "announcement_text": store.announcement_text,
                    "free_shipping_text": store.free_shipping_text,
                    "return_policy_md": store.return_policy_md,
                    "warranty_text": store.warranty_text,
                    "trust_return_text": store.trust_return_text,
                    "contact_email": store.contact_email,
                    "instagram": store.instagram,
                    "fabrication_notice": store.fabrication_notice,
                },
                "tax": {
                    "boleta_enabled": tax.boleta_enabled,
                    "factura_enabled": tax.factura_enabled,
                },
            }
        )

    def patch(self, request):
        store = StoreSettings.load()
        tax = TaxDocumentSettings.load()
        for key, val in (request.data.get("store") or {}).items():
            if hasattr(store, key):
                setattr(store, key, val)
        store.save()
        for key, val in (request.data.get("tax") or {}).items():
            if hasattr(tax, key):
                setattr(tax, key, val)
        tax.save()
        return Response({"ok": True})


class AdminCustomersView(generics.ListAPIView):
    permission_classes = [IsAdminRole]
    serializer_class = UserSerializer

    def get_queryset(self):
        return User.objects.filter(role=User.Role.STORE).order_by("-created_at")


class AdminHomeContentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminRole]
    queryset = HomeContent.objects.all()
    serializer_class = __import__(
        "apps.api.serializers", fromlist=["HomeContentSerializer"]
    ).HomeContentSerializer


class AdminTestimonialViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminRole]
    queryset = Testimonial.objects.all()
    serializer_class = __import__(
        "apps.api.serializers", fromlist=["TestimonialSerializer"]
    ).TestimonialSerializer


class AdminCouponViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminRole]
    queryset = Coupon.objects.all()

    def list(self, request, *args, **kwargs):
        data = list(self.get_queryset().values())
        return Response(data)

    def create(self, request, *args, **kwargs):
        coupon = Coupon.objects.create(**request.data)
        return Response({"id": coupon.id}, status=201)
