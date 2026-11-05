from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.billing.models import TaxDocument, TaxDocumentSettings
from apps.cart.models import Cart, CartItem
from apps.catalog.demo_media import DEMO_PRODUCT_IMAGES
from apps.catalog.models import Category, Fabric, OptionGroup, OptionValue, Product, ProductImage
from apps.catalog.pricing import calculate_unit_price, order_requires_deposit
from apps.content.models import HomeContent, Testimonial
from apps.orders.models import Order, OrderEvent, OrderItem
from apps.payments.models import Payment, PaymentProviderConfig
from apps.quotes.models import Quote
from apps.shipping.models import Commune, Region, ShippingRate
from apps.store_settings.models import Coupon, StoreSettings
from apps.users.models import Address

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "first_name", "last_name", "phone", "role")


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ("email", "password", "first_name", "last_name", "phone")

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class RegionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Region
        fields = ("id", "code", "name")


class CommuneSerializer(serializers.ModelSerializer):
    region = RegionSerializer(read_only=True)

    class Meta:
        model = Commune
        fields = ("id", "name", "region")


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ("id", "image", "alt", "order")


class OptionValueSerializer(serializers.ModelSerializer):
    class Meta:
        model = OptionValue
        fields = (
            "id",
            "label",
            "swatch_hex",
            "swatch_image",
            "price_delta",
            "triggers_quote",
            "order",
        )


class OptionGroupSerializer(serializers.ModelSerializer):
    values = OptionValueSerializer(many=True, read_only=True)

    class Meta:
        model = OptionGroup
        fields = ("id", "name", "type", "required", "order", "values")


class ProductListSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    category_slug = serializers.CharField(source="category.slug", read_only=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "base_price",
            "compare_at_price",
            "price_mode",
            "lead_time_text",
            "is_featured",
            "is_demo",
            "requires_deposit",
            "category_slug",
            "images",
        )

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if not data.get("images"):
            url = DEMO_PRODUCT_IMAGES.get(instance.slug)
            if url:
                data["images"] = [{"id": 0, "image": url, "alt": instance.name, "order": 0}]
        return data


class ProductDetailSerializer(ProductListSerializer):
    option_groups = OptionGroupSerializer(many=True, read_only=True)
    description = serializers.CharField()

    class Meta(ProductListSerializer.Meta):
        fields = ProductListSerializer.Meta.fields + (
            "description",
            "requires_deposit",
            "option_groups",
        )


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug", "image", "order")


class FabricSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fabric
        fields = ("id", "name", "family", "hex", "image")


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.filter(is_active=True), source="product", write_only=True
    )

    class Meta:
        model = CartItem
        fields = ("id", "product", "product_id", "options", "unit_price", "qty", "line_total")
        read_only_fields = ("unit_price", "line_total")

    line_total = serializers.IntegerField(read_only=True)


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    subtotal = serializers.SerializerMethodField()
    requires_deposit = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ("id", "items", "subtotal", "requires_deposit", "updated_at")

    def get_subtotal(self, obj):
        return sum(i.line_total for i in obj.items.all())

    def get_requires_deposit(self, obj):
        items_data = [{"product": i.product, "options": i.options} for i in obj.items.select_related("product")]
        return order_requires_deposit(items_data)


class QuoteCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quote
        fields = ("name", "email", "phone", "product", "options", "message")


class QuoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quote
        fields = (
            "id",
            "number",
            "status",
            "quoted_amount",
            "valid_until",
            "product",
            "options",
            "message",
            "created_at",
        )


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ("id", "name_snapshot", "options", "unit_price", "qty")


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = (
            "id",
            "number",
            "status",
            "email",
            "phone",
            "shipping_address",
            "shipping_method",
            "shipping_cost",
            "shipping_pending_coordination",
            "subtotal",
            "discount",
            "total",
            "deposit_amount",
            "balance_due",
            "amount_due_now",
            "doc_type",
            "billing",
            "created_at",
            "items",
        )


class PublicSettingsSerializer(serializers.Serializer):
    announcement_text = serializers.CharField()
    whatsapp = serializers.CharField()
    instagram = serializers.CharField()
    free_shipping_text = serializers.CharField()
    return_policy_md = serializers.CharField()
    warranty_text = serializers.CharField()
    trust_return_text = serializers.CharField()
    boleta_enabled = serializers.BooleanField()
    factura_enabled = serializers.BooleanField()
    payment_providers = serializers.ListField(child=serializers.DictField())
    fabrication_notice = serializers.CharField()


class HomeContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = HomeContent
        fields = ("section", "title", "subtitle", "image", "cta_text", "cta_url", "order")


class TestimonialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Testimonial
        fields = ("id", "name", "location", "text", "rating", "image")


class PriceCalcSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    options = serializers.DictField(child=serializers.JSONField(), default=dict)

    def validate(self, attrs):
        try:
            product = Product.objects.get(id=attrs["product_id"], is_active=True)
        except Product.DoesNotExist as exc:
            raise serializers.ValidationError("Producto no encontrado") from exc
        price, triggers_quote = calculate_unit_price(product, attrs.get("options", {}))
        attrs["unit_price"] = price
        attrs["triggers_quote"] = triggers_quote
        attrs["product"] = product
        return attrs


class CheckoutSerializer(serializers.Serializer):
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=30)
    shipping_method = serializers.ChoiceField(choices=["delivery", "pickup"])
    shipping_address = serializers.DictField(required=False)
    commune_id = serializers.IntegerField(required=False)
    region_id = serializers.IntegerField(required=False)
    doc_type = serializers.ChoiceField(choices=["boleta", "factura"], required=False)
    billing = serializers.DictField(required=False)
    payment_provider = serializers.CharField()
    coupon_code = serializers.CharField(required=False, allow_blank=True)
    session_key = serializers.CharField(required=False, allow_blank=True)


class AddressSerializer(serializers.ModelSerializer):
    region_id = serializers.PrimaryKeyRelatedField(
        queryset=Region.objects.all(), source="region", write_only=True
    )
    commune_id = serializers.PrimaryKeyRelatedField(
        queryset=Commune.objects.all(), source="commune", write_only=True
    )
    region = RegionSerializer(read_only=True)
    commune = CommuneSerializer(read_only=True)

    class Meta:
        model = Address
        fields = (
            "id",
            "name",
            "phone",
            "street",
            "number",
            "apt",
            "region",
            "commune",
            "region_id",
            "commune_id",
            "notes",
            "is_default",
        )


class TaxDocumentSerializer(serializers.ModelSerializer):
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = TaxDocument
        fields = ("id", "type", "folio", "issued_at", "download_url")

    def get_download_url(self, obj):
        request = self.context.get("request")
        if not request or not obj.pdf:
            return None
        return request.build_absolute_uri(
            f"/api/me/orders/{obj.order_id}/documents/{obj.id}/download/"
        )


class OrderEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderEvent
        fields = ("status", "note", "created_at")


class OrderDetailSerializer(OrderSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    events = OrderEventSerializer(many=True, read_only=True)
    tax_documents = TaxDocumentSerializer(many=True, read_only=True)
    payments = serializers.SerializerMethodField()

    class Meta(OrderSerializer.Meta):
        fields = OrderSerializer.Meta.fields + ("events", "tax_documents", "payments")

    def get_payments(self, obj):
        return [
            {
                "id": p.id,
                "provider": p.provider,
                "amount": p.amount,
                "status": p.status,
                "payment_kind": p.payment_kind,
                "created_at": p.created_at,
            }
            for p in obj.payments.all()
        ]


class AdminUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=8)

    class Meta:
        model = User
        fields = ("id", "email", "first_name", "last_name", "phone", "role", "password", "is_active")

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        role = validated_data.get("role", User.Role.STORE)
        user = User.objects.create_user(
            email=validated_data["email"],
            password=password or "changeme123",
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            phone=validated_data.get("phone", ""),
            role=role,
        )
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for k, v in validated_data.items():
            setattr(instance, k, v)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class AdminProductWriteSerializer(serializers.ModelSerializer):
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source="category"
    )

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "category_id",
            "base_price",
            "compare_at_price",
            "price_mode",
            "lead_time_text",
            "stock",
            "is_featured",
            "is_active",
            "is_demo",
            "requires_deposit",
        )


class AdminOptionValueSerializer(serializers.ModelSerializer):
    class Meta:
        model = OptionValue
        fields = (
            "id",
            "group",
            "label",
            "swatch_hex",
            "fabric",
            "price_delta",
            "triggers_quote",
            "order",
        )


class AdminOptionGroupSerializer(serializers.ModelSerializer):
    values = AdminOptionValueSerializer(many=True, read_only=True)

    class Meta:
        model = OptionGroup
        fields = ("id", "product", "name", "type", "required", "order", "values")
