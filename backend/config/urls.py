from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from apps.users.views_auth import EmailTokenObtainPairView
from apps.api.views_admin import (
    AdminCategoryViewSet,
    AdminCouponViewSet,
    AdminCustomersView,
    AdminDashboardView,
    AdminFabricViewSet,
    AdminHomeContentViewSet,
    AdminOrderViewSet,
    AdminOptionGroupViewSet,
    AdminOptionValueViewSet,
    AdminPaymentProviderView,
    AdminPaymentsListView,
    AdminProductViewSet,
    AdminQuoteViewSet,
    AdminSettingsView,
    AdminShippingRatesExportView,
    AdminShippingRatesImportView,
    AdminShippingRatesView,
    AdminTestimonialViewSet,
    AdminUserViewSet,
)
from apps.api.views_account import (
    AddressDetailView,
    AddressListCreateView,
    MeUpdateView,
    MyOrderDetailView,
    MyOrderPayBalanceView,
    TaxDocumentDownloadView,
)
from apps.api.views_store import (
    CartItemView,
    CartView,
    CategoryListView,
    CheckoutView,
    CommuneListView,
    FabricListView,
    HomeContentView,
    MeView,
    MyOrdersView,
    MyQuotesView,
    PaymentCallbackView,
    PaymentSimulatedConfirmView,
    PriceCalculateView,
    ProductDetailView,
    ProductListView,
    PublicSettingsView,
    QuoteCreateView,
    QuotePayView,
    RegionListView,
    RegisterView,
    ShippingQuoteView,
)

router = DefaultRouter()
router.register(r"admin/orders", AdminOrderViewSet, basename="admin-orders")
router.register(r"admin/quotes", AdminQuoteViewSet, basename="admin-quotes")
router.register(r"admin/products", AdminProductViewSet, basename="admin-products")
router.register(r"admin/categories", AdminCategoryViewSet, basename="admin-categories")
router.register(r"admin/fabrics", AdminFabricViewSet, basename="admin-fabrics")
router.register(r"admin/home", AdminHomeContentViewSet, basename="admin-home")
router.register(r"admin/testimonials", AdminTestimonialViewSet, basename="admin-testimonials")
router.register(r"admin/option-groups", AdminOptionGroupViewSet, basename="admin-option-groups")
router.register(r"admin/option-values", AdminOptionValueViewSet, basename="admin-option-values")
router.register(r"admin/users", AdminUserViewSet, basename="admin-users")

urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("api/auth/token/", EmailTokenObtainPairView.as_view()),
    path("api/auth/refresh/", TokenRefreshView.as_view()),
    path("api/auth/register/", RegisterView.as_view()),
    path("api/me/", MeView.as_view()),
    path("api/me/profile/", MeUpdateView.as_view()),
    path("api/me/addresses/", AddressListCreateView.as_view()),
    path("api/me/addresses/<int:pk>/", AddressDetailView.as_view()),
    path("api/me/orders/<int:pk>/", MyOrderDetailView.as_view()),
    path("api/me/orders/<int:pk>/pay-balance/", MyOrderPayBalanceView.as_view()),
    path(
        "api/me/orders/<int:pk>/documents/<int:doc_id>/download/",
        TaxDocumentDownloadView.as_view(),
    ),
    path("api/categories/", CategoryListView.as_view()),
    path("api/products/", ProductListView.as_view()),
    path("api/products/calculate-price/", PriceCalculateView.as_view()),
    path("api/products/<slug:slug>/", ProductDetailView.as_view()),
    path("api/fabrics/", FabricListView.as_view()),
    path("api/cart/", CartView.as_view()),
    path("api/cart/items/", CartItemView.as_view()),
    path("api/cart/items/<int:item_id>/", CartItemView.as_view()),
    path("api/shipping/quote/", ShippingQuoteView.as_view()),
    path("api/regions/", RegionListView.as_view()),
    path("api/communes/", CommuneListView.as_view()),
    path("api/checkout/", CheckoutView.as_view()),
    path("api/quotes/", QuoteCreateView.as_view()),
    path("api/me/orders/", MyOrdersView.as_view()),
    path("api/me/quotes/", MyQuotesView.as_view()),
    path("api/settings/public/", PublicSettingsView.as_view()),
    path("api/home/", HomeContentView.as_view()),
    path(
        "api/payments/simulated/<int:payment_id>/confirm/",
        PaymentSimulatedConfirmView.as_view(),
    ),
    path("api/payments/<str:provider_code>/callback/", PaymentCallbackView.as_view()),
    path("api/payments/<str:provider_code>/webhook/", PaymentCallbackView.as_view()),
    path("api/quotes/pay/<str:token>/", QuotePayView.as_view()),
    path("api/admin/dashboard/", AdminDashboardView.as_view()),
    path("api/admin/payment-providers/", AdminPaymentProviderView.as_view()),
    path("api/admin/payments/", AdminPaymentsListView.as_view()),
    path("api/admin/shipping-rates/", AdminShippingRatesView.as_view()),
    path("api/admin/shipping-rates/export/", AdminShippingRatesExportView.as_view()),
    path("api/admin/shipping-rates/import/", AdminShippingRatesImportView.as_view()),
    path("api/admin/settings/", AdminSettingsView.as_view()),
    path("api/admin/customers/", AdminCustomersView.as_view()),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema")),
    path("api/", include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
