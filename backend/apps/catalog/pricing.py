from django.conf import settings

from apps.catalog.models import OptionValue, Product


def calculate_unit_price(product: Product, options: dict) -> tuple[int, bool]:
    """Return (unit_price, triggers_quote)."""
    total = product.base_price
    triggers_quote = product.price_mode == Product.PriceMode.QUOTE_ONLY

    for group in product.option_groups.prefetch_related("values"):
        selected = options.get(str(group.id)) or options.get(group.name)
        if selected is None:
            continue
        if group.type == "multi" and isinstance(selected, list):
            ids = selected
        else:
            ids = [selected] if not isinstance(selected, list) else selected
        for val_id in ids:
            try:
                val = OptionValue.objects.get(id=val_id, group=group)
            except OptionValue.DoesNotExist:
                continue
            total += val.price_delta
            if val.triggers_quote:
                triggers_quote = True
    return max(total, 0), triggers_quote


def order_requires_deposit(order_items_data) -> bool:
    for item in order_items_data:
        product = item.get("product")
        options = item.get("options", {})
        if product and (product.requires_deposit or _options_trigger_custom(product, options)):
            return True
    return False


def _options_trigger_custom(product: Product, options: dict) -> bool:
    for group in product.option_groups.all():
        selected = options.get(str(group.id)) or options.get(group.name)
        if not selected:
            continue
        ids = selected if isinstance(selected, list) else [selected]
        if OptionValue.objects.filter(group=group, id__in=ids, triggers_quote=True).exists():
            return True
    return False


def summarize_options(product: Product, options: dict) -> list[str]:
    lines: list[str] = []
    if not options:
        return lines
    for group in product.option_groups.prefetch_related("values"):
        selected = options.get(str(group.id)) or options.get(group.name)
        if selected is None:
            continue
        ids = selected if isinstance(selected, list) else [selected]
        labels = []
        for val_id in ids:
            val = group.values.filter(id=val_id).first()
            if val:
                labels.append(val.label)
        if labels:
            lines.append(f"{group.name}: {', '.join(labels)}")
    return lines


def compute_deposit_amounts(total: int, requires_deposit: bool) -> tuple[int, int, int]:
    if not requires_deposit:
        return total, 0, total
    percent = settings.CUSTOM_DEPOSIT_PERCENT
    deposit = int(total * percent / 100)
    balance = total - deposit
    return deposit, balance, deposit
