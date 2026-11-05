from rest_framework_simplejwt.views import TokenObtainPairView

from apps.common.throttling import AuthLoginThrottle
from apps.users.serializers_jwt import EmailTokenObtainPairSerializer


class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer
    throttle_classes = [AuthLoginThrottle]
