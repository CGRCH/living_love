from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.billing.models import TaxDocument, TaxDocumentSettings
from apps.cart.models import Cart, CartItem
from apps.catalog.models import Category, Fabric, OptionGroup, OptionValue, Product, ProductImage
from apps.catalog.pricing import calculate_unit_price
from apps.content.models import HomeContent, Testimonial
from apps.orders.models import Order, OrderEvent, OrderItem
from apps.payments.models import Payment, PaymentProviderConfig
from apps.quotes.models import Quote
from apps.shipping.models import Commune, Region, ShippingRate
from apps.store_settings.models import Coupon, StoreSettings

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
            "category_slug",
            "images",
        )


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

    class Meta:
        model = Cart
        fields = ("id", "items", "updated_at")


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
