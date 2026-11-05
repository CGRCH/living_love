from apps.shipping.models import Commune, ShippingRate


def quote_shipping(commune_id: int | None, region_id: int | None, method: str):
    if method == "pickup":
        return {"price": 0, "lead_days": 0, "pending_coordination": False, "label": "Retiro en taller"}

    if not commune_id and not region_id:
        return {
            "price": 0,
            "lead_days": 0,
            "pending_coordination": True,
            "label": "A coordinar",
        }

    commune = Commune.objects.filter(id=commune_id).select_related("region").first()
    region = commune.region if commune else None
    if not region and region_id:
        from apps.shipping.models import Region

        region = Region.objects.filter(id=region_id).first()

    rate = None
    if commune:
        rate = (
            ShippingRate.objects.filter(commune=commune, is_active=True)
            .order_by("-id")
            .first()
        )
    if not rate and region:
        rate = (
            ShippingRate.objects.filter(region=region, commune__isnull=True, is_active=True)
            .order_by("-id")
            .first()
        )

    if not rate:
        return {
            "price": 0,
            "lead_days": 0,
            "pending_coordination": True,
            "label": "A coordinar",
        }

    return {
        "price": rate.price,
        "lead_days": rate.lead_days,
        "pending_coordination": False,
        "label": "Despacho" if rate.price else "Gratis",
    }
