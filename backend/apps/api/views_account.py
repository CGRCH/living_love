from django.contrib.auth import get_user_model
from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.api.serializers import (
    AddressSerializer,
    OrderDetailSerializer,
    QuoteSerializer,
    UserSerializer,
)
from apps.billing.models import TaxDocument
from apps.orders.models import Order
from apps.orders.services import finalize_payment
from apps.payments.models import Payment, PaymentProviderConfig
from apps.payments.providers import get_provider
from apps.quotes.models import Quote
from apps.users.models import Address

User = get_user_model()


class MeUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        user = request.user
        for field in ("first_name", "last_name", "phone"):
            if field in request.data:
                setattr(user, field, request.data[field])
        user.save()
        return Response(UserSerializer(user).data)


class AddressListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AddressSerializer

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user).select_related("region", "commune")

    def perform_create(self, serializer):
        if serializer.validated_data.get("is_default"):
            Address.objects.filter(user=self.request.user, is_default=True).update(is_default=False)
        serializer.save(user=self.request.user)


class AddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AddressSerializer

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)


class MyOrderDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = OrderDetailSerializer

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related(
            "items", "events", "payments", "tax_documents"
        )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, context={"request": request})
        return Response(serializer.data)


class MyOrderPayBalanceView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        order = get_object_or_404(Order, pk=pk, user=request.user)
        if order.balance_due <= 0:
            return Response({"detail": "No hay saldo pendiente"}, status=400)
        if order.status not in (Order.Status.DEPOSIT_PAID, Order.Status.PENDING):
            return Response({"detail": "Pedido no elegible para pago de saldo"}, status=400)
        provider_code = request.data.get("payment_provider", "simulated")
        cfg = PaymentProviderConfig.objects.get(code=provider_code, is_enabled=True)
        from uuid import uuid4

        payment = Payment.objects.create(
            order=order,
            provider=cfg.code,
            amount=order.balance_due,
            payment_kind="balance",
            status=Payment.Status.PENDING,
            idempotency_key=str(uuid4()),
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
        return Response({"payment_redirect": result.redirect_url, "payment_id": payment.id})


class TaxDocumentDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, doc_id):
        order = get_object_or_404(Order, pk=pk, user=request.user)
        doc = get_object_or_404(TaxDocument, pk=doc_id, order=order)
        if not doc.pdf:
            raise Http404
        return FileResponse(doc.pdf.open("rb"), as_attachment=True, filename=doc.pdf.name.split("/")[-1])
