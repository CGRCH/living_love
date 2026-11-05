import secrets
from uuid import uuid4

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Avg, Count, Sum
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, status, views
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.api.serializers import (
    CartItemSerializer,
    CartSerializer,
    CategorySerializer,
    CheckoutSerializer,
    CommuneSerializer,
    HomeContentSerializer,
    OrderSerializer,
    PriceCalcSerializer,
    ProductDetailSerializer,
    ProductListSerializer,
    PublicSettingsSerializer,
    QuoteCreateSerializer,
    QuoteSerializer,
    RegisterSerializer,
    TestimonialSerializer,
    UserSerializer,
)
from apps.billing.models import TaxDocumentSettings
from apps.cart.models import Cart, CartItem
from apps.catalog.models import Category, Fabric, Product
from apps.catalog.pricing import calculate_unit_price, compute_deposit_amounts, order_requires_deposit
from apps.common.rut import validate_rut
from apps.content.models import HomeContent, Testimonial
from apps.orders.models import Order, OrderEvent, OrderItem
from apps.orders.services import apply_coupon, finalize_payment, preview_coupon, send_order_email
from apps.payments.models import Payment, PaymentProviderConfig
from apps.payments.providers import get_provider
from apps.payments.webhook_auth import resolve_payment_from_payload, verify_payment_webhook
from apps.quotes.models import Quote
from apps.shipping.models import Commune, Region
from apps.shipping.services import quote_shipping
from apps.store_settings.models import StoreSettings

User = get_user_model()


def get_session_key(request):
    return request.headers.get("X-Cart-Session") or request.data.get("session_key") or ""


def get_or_create_cart(request):
    session_key = get_session_key(request)
    if request.user.is_authenticated:
        cart, _ = Cart.objects.get_or_create(user=request.user, defaults={"session_key": session_key})
        if session_key:
            guest = Cart.objects.filter(session_key=session_key, user__isnull=True).first()
            if guest and guest.id != cart.id:
                for item in guest.items.all():
                    CartItem.objects.create(
                        cart=cart,
                        product=item.product,
                        options=item.options,
                        unit_price=item.unit_price,
                        qty=item.qty,
                    )
                guest.delete()
        return cart
    if not session_key:
        session_key = str(uuid4())
    cart, _ = Cart.objects.get_or_create(session_key=session_key, user=None)
    cart.session_key = session_key
    cart.save(update_fields=["session_key"])
    return cart


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer


class ProductFilter(DjangoFilterBackend):
    pass


class ProductListView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    filterset_fields = ["category__slug", "price_mode", "is_featured"]
    search_fields = ["name", "description"]
    ordering_fields = ["base_price", "created_at", "name"]

    def get_queryset(self):
        qs = Product.objects.filter(is_active=True).select_related("category").prefetch_related("images")
        category = self.request.query_params.get("category")
        if category:
            qs = qs.filter(category__slug=category)
        fabric = self.request.query_params.get("fabric")
        if fabric:
            qs = qs.filter(
                option_groups__values__fabric__family__icontains=fabric
            ).distinct()
        price_min = self.request.query_params.get("price_min")
        price_max = self.request.query_params.get("price_max")
        if price_min:
            qs = qs.filter(base_price__gte=int(price_min))
        if price_max:
            qs = qs.filter(base_price__lte=int(price_max))
        return qs


class ProductDetailView(generics.RetrieveAPIView):
    queryset = Product.objects.filter(is_active=True).prefetch_related(
        "images", "option_groups__values"
    )
    serializer_class = ProductDetailSerializer
    lookup_field = "slug"


class FabricListView(generics.ListAPIView):
    queryset = Fabric.objects.filter(is_active=True)
    serializer_class = __import__(
        "apps.api.serializers", fromlist=["FabricSerializer"]
    ).FabricSerializer


class PriceCalculateView(APIView):
    def post(self, request):
        ser = PriceCalcSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        return Response(
            {
                "unit_price": ser.validated_data["unit_price"],
                "triggers_quote": ser.validated_data["triggers_quote"],
            }
        )


class CartView(APIView):
    def get(self, request):
        cart = get_or_create_cart(request)
        data = CartSerializer(cart).data
        if not request.user.is_authenticated:
            data["session_key"] = cart.session_key
        return Response(data)

    def delete(self, request):
        cart = get_or_create_cart(request)
        cart.items.all().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CartCouponPreviewView(APIView):
    def post(self, request):
        cart = get_or_create_cart(request)
        subtotal = sum(i.line_total for i in cart.items.select_related("product"))
        code = (request.data.get("coupon_code") or "").strip()
        discount, err = preview_coupon(code, subtotal)
        if err:
            return Response({"valid": False, "discount": 0, "message": err})
        return Response(
            {
                "valid": True,
                "discount": discount,
                "message": f"Descuento aplicado: ${discount:,}".replace(",", "."),
            }
        )


class CartItemView(APIView):
    def post(self, request):
        cart = get_or_create_cart(request)
        product_id = request.data.get("product_id")
        options = request.data.get("options", {})
        try:
            qty = int(request.data.get("qty", 1))
        except (TypeError, ValueError):
            return Response({"detail": "Cantidad inválida"}, status=400)
        if qty < 1:
            return Response({"detail": "Cantidad inválida"}, status=400)
        try:
            product = Product.objects.get(id=product_id, is_active=True)
        except (Product.DoesNotExist, TypeError, ValueError):
            return Response({"detail": "Producto no encontrado"}, status=404)
        if product.price_mode == Product.PriceMode.QUOTE_ONLY:
            return Response({"detail": "Producto solo cotización"}, status=400)
        unit_price, triggers_quote = calculate_unit_price(product, options)
        if triggers_quote:
            return Response({"detail": "Esta configuración requiere cotización"}, status=400)
        item = CartItem.objects.create(
            cart=cart, product=product, options=options, unit_price=unit_price, qty=qty
        )
        resp = CartItemSerializer(item).data
        if not request.user.is_authenticated:
            resp["session_key"] = cart.session_key
        return Response(resp, status=201)

    def patch(self, request, item_id):
        cart = get_or_create_cart(request)
        try:
            item = CartItem.objects.get(id=item_id, cart=cart)
        except CartItem.DoesNotExist:
            return Response({"detail": "Ítem no encontrado"}, status=404)
        qty = request.data.get("qty")
        if qty is not None:
            try:
                qty_int = int(qty)
            except (TypeError, ValueError):
                return Response({"detail": "Cantidad inválida"}, status=400)
            if qty_int < 1:
                return Response({"detail": "Cantidad inválida"}, status=400)
            item.qty = qty_int
            item.save(update_fields=["qty"])
        return Response(CartItemSerializer(item).data)

    def delete(self, request, item_id):
        cart = get_or_create_cart(request)
        CartItem.objects.filter(id=item_id, cart=cart).delete()
        return Response(status=204)


class ShippingQuoteView(APIView):
    def get(self, request):
        commune_id = request.query_params.get("commune")
        region_id = request.query_params.get("region")
        method = request.query_params.get("method", "delivery")
        try:
            commune_int = int(commune_id) if commune_id else None
        except (TypeError, ValueError):
            return Response({"detail": "Comuna inválida"}, status=400)
        try:
            region_int = int(region_id) if region_id else None
        except (TypeError, ValueError):
            return Response({"detail": "Región inválida"}, status=400)
        result = quote_shipping(commune_int, region_int, method)
        return Response(result)


class RegionListView(generics.ListAPIView):
    queryset = Region.objects.all()
    serializer_class = __import__(
        "apps.api.serializers", fromlist=["RegionSerializer"]
    ).RegionSerializer


class CommuneListView(generics.ListAPIView):
    serializer_class = CommuneSerializer

    def get_queryset(self):
        qs = Commune.objects.select_related("region")
        region = self.request.query_params.get("region")
        if region:
            qs = qs.filter(region_id=region)
        return qs


class PublicSettingsView(APIView):
    def get(self, request):
        store = StoreSettings.load()
        tax = TaxDocumentSettings.load()
        providers = PaymentProviderConfig.objects.filter(is_enabled=True).order_by("order")
        payload = {
            "announcement_text": store.announcement_text,
            "whatsapp": store.whatsapp,
            "instagram": store.instagram,
            "free_shipping_text": store.free_shipping_text,
            "return_policy_md": store.return_policy_md,
            "warranty_text": store.warranty_text,
            "trust_return_text": store.trust_return_text,
            "boleta_enabled": tax.boleta_enabled,
            "factura_enabled": tax.factura_enabled,
            "fabrication_notice": store.fabrication_notice,
            "payment_providers": [
                {"code": p.code, "display_name": p.display_name} for p in providers
            ],
        }
        return Response(PublicSettingsSerializer(payload).data)


class HomeContentView(APIView):
    def get(self, request):
        sections = HomeContent.objects.filter(is_active=True)
        testimonials = Testimonial.objects.filter(is_active=True)
        categories = Category.objects.filter(is_active=True, parent__isnull=True).exclude(
            slug__startswith="demo-"
        )[:5]
        featured = Product.objects.filter(is_active=True, is_featured=True)[:8]
        return Response(
            {
                "sections": HomeContentSerializer(sections, many=True).data,
                "testimonials": TestimonialSerializer(testimonials, many=True).data,
                "categories": CategorySerializer(categories, many=True).data,
                "featured_products": ProductListSerializer(featured, many=True).data,
            }
        )


class QuoteCreateView(generics.CreateAPIView):
    queryset = Quote.objects.all()
    serializer_class = QuoteCreateSerializer

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(user=user, status=Quote.Status.NEW)


class MyQuotesView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = QuoteSerializer

    def get_queryset(self):
        return Quote.objects.filter(user=self.request.user).order_by("-created_at")


class MyOrdersView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = OrderSerializer

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related("items")


class OrderDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = OrderSerializer

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related("items")


class CheckoutView(APIView):
    @transaction.atomic
    def post(self, request):
        ser = CheckoutSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data
        cart = get_or_create_cart(request)
        if not cart.items.exists():
            return Response({"detail": "Carro vacío"}, status=400)

        tax = TaxDocumentSettings.load()
        doc_type = data.get("doc_type") or "boleta"
        if doc_type == "factura" and not tax.factura_enabled:
            return Response({"detail": "Factura no habilitada"}, status=400)
        if doc_type == "boleta" and not tax.boleta_enabled:
            return Response({"detail": "Boleta no habilitada"}, status=400)
        if doc_type == "factura":
            billing = data.get("billing") or {}
            rut = billing.get("rut", "")
            if not validate_rut(rut):
                return Response({"detail": "RUT inválido"}, status=400)
            if not billing.get("razon_social") or not billing.get("giro"):
                return Response({"detail": "Datos de factura incompletos"}, status=400)

        shipping = quote_shipping(
            data.get("commune_id"),
            data.get("region_id"),
            data["shipping_method"],
        )

        subtotal = sum(i.line_total for i in cart.items.select_related("product"))
        discount = 0
        coupon_code = data.get("coupon_code") or ""
        if coupon_code:
            discount = apply_coupon(coupon_code, subtotal)
        shipping_cost = shipping["price"] if data["shipping_method"] == "delivery" else 0
        total = max(subtotal - discount + shipping_cost, 0)

        items_data = [
            {"product": item.product, "options": item.options} for item in cart.items.all()
        ]
        requires_deposit = order_requires_deposit(items_data)
        deposit, balance, due_now = compute_deposit_amounts(total, requires_deposit)

        try:
            provider_cfg = PaymentProviderConfig.objects.get(
                code=data["payment_provider"], is_enabled=True
            )
        except PaymentProviderConfig.DoesNotExist:
            return Response({"detail": "Pasarela no disponible"}, status=400)

        order = Order.objects.create(
            user=request.user if request.user.is_authenticated else None,
            email=data["email"],
            phone=data["phone"],
            shipping_address=data.get("shipping_address") or {},
            shipping_method=data["shipping_method"],
            shipping_cost=shipping_cost,
            shipping_pending_coordination=shipping["pending_coordination"],
            subtotal=subtotal,
            discount=discount,
            total=total,
            deposit_amount=deposit if requires_deposit else 0,
            balance_due=balance if requires_deposit else 0,
            amount_due_now=due_now,
            doc_type=doc_type,
            billing=data.get("billing"),
            coupon_code=coupon_code,
            status=Order.Status.PENDING,
        )
        for item in cart.items.all():
            OrderItem.objects.create(
                order=order,
                product=item.product,
                name_snapshot=item.product.name,
                options=item.options,
                unit_price=item.unit_price,
                qty=item.qty,
            )
        OrderEvent.objects.create(order=order, status=order.status, note="Pedido creado")
        cart.items.all().delete()

        payment = Payment.objects.create(
            order=order,
            provider=provider_cfg.code,
            amount=due_now,
            payment_kind="deposit" if requires_deposit else "full",
            status=Payment.Status.CREATED,
            idempotency_key=str(uuid4()),
        )
        from django.conf import settings as dj_settings

        provider = get_provider(provider_cfg)
        try:
            result = provider.create(
                payment,
                order,
                success_url=f"{dj_settings.FRONTEND_URL}/pago/exito?order={order.number}",
                cancel_url=f"{dj_settings.FRONTEND_URL}/pago/cancelado?order={order.number}",
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=400)
        payment.external_id = result.external_id
        payment.raw = result.raw
        payment.status = Payment.Status.PENDING
        payment.save()
        return Response(
            {
                "order": OrderSerializer(order).data,
                "payment_redirect": result.redirect_url,
                "payment_id": payment.id,
            }
        )


class PaymentSimulatedConfirmView(APIView):
    def post(self, request, payment_id):
        from django.conf import settings as dj_settings

        if not dj_settings.DEBUG and not dj_settings.PAYMENTS_ALLOW_SIMULATED_CONFIRM:
            return Response({"detail": "No disponible"}, status=403)
        action = request.data.get("action", "approve")
        try:
            payment = Payment.objects.select_related("order").get(id=payment_id)
        except Payment.DoesNotExist:
            return Response({"detail": "Pago no encontrado"}, status=404)
        if payment.provider != "simulated" and not dj_settings.DEBUG:
            return Response({"detail": "Pasarela no permitida"}, status=403)
        cfg = PaymentProviderConfig.objects.filter(code=payment.provider).first()
        provider = get_provider(cfg) if cfg else get_provider(
            PaymentProviderConfig(code="simulated", display_name="Sim")
        )
        status_result, raw = provider.confirm({"action": action})
        finalize_payment(payment, status_result, raw)
        return Response({"status": status_result, "order": OrderSerializer(payment.order).data})


class PaymentCallbackView(APIView):
    def post(self, request, provider_code):
        try:
            cfg = PaymentProviderConfig.objects.get(code=provider_code)
        except PaymentProviderConfig.DoesNotExist:
            return Response({"detail": "Pasarela desconocida"}, status=404)
        provider = get_provider(cfg)
        if not verify_payment_webhook(request, provider):
            return Response({"detail": "No autorizado"}, status=403)

        payment = resolve_payment_from_payload(provider_code, request.data)
        if not payment:
            return Response({"detail": "Pago no encontrado"}, status=404)

        idempotency = request.headers.get("X-Idempotency-Key") or request.data.get("idempotency_key")
        if idempotency and payment.idempotency_key == idempotency:
            existing = payment.raw.get("webhook_duplicate")
            if existing:
                return Response({"status": payment.status})
        status_result, raw = provider.confirm(request.data)
        finalize_payment(payment, status_result, raw)
        return Response({"status": payment.status})


class QuotePayView(APIView):
    def get(self, request, token):
        quote = Quote.objects.filter(payment_token=token).first()
        if not quote or quote.status not in (Quote.Status.ANSWERED, Quote.Status.ACCEPTED):
            return Response({"detail": "Cotización no disponible"}, status=404)
        return Response(QuoteSerializer(quote).data)

    @transaction.atomic
    def post(self, request, token):
        quote = Quote.objects.select_related("product").filter(payment_token=token).first()
        if not quote or not quote.quoted_amount:
            return Response({"detail": "Cotización inválida"}, status=400)
        provider_code = request.data.get("payment_provider", "simulated")
        cfg = PaymentProviderConfig.objects.get(code=provider_code, is_enabled=True)
        order = Order.objects.create(
            user=quote.user,
            email=quote.email,
            phone=quote.phone,
            subtotal=quote.quoted_amount,
            total=quote.quoted_amount,
            amount_due_now=quote.quoted_amount,
            quote=quote,
            status=Order.Status.PENDING,
        )
        if quote.product:
            OrderItem.objects.create(
                order=order,
                product=quote.product,
                name_snapshot=quote.product.name,
                options=quote.options,
                unit_price=quote.quoted_amount,
                qty=1,
            )
        quote.status = Quote.Status.CONVERTED
        quote.save(update_fields=["status"])
        payment = Payment.objects.create(
            order=order,
            provider=cfg.code,
            amount=quote.quoted_amount,
            status=Payment.Status.PENDING,
            idempotency_key=str(uuid4()),
        )
        provider = get_provider(cfg)
        result = provider.create(
            payment,
            order,
            success_url=f"{__import__('django.conf', fromlist=['settings']).settings.FRONTEND_URL}/pago/exito?order={order.number}",
            cancel_url=f"{__import__('django.conf', fromlist=['settings']).settings.FRONTEND_URL}/pago/cancelado?order={order.number}",
        )
        payment.external_id = result.external_id
        payment.save()
        return Response({"order": OrderSerializer(order).data, "payment_redirect": result.redirect_url})
