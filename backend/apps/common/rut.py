import re

RUT_CLEAN = re.compile(r"[^0-9kK]")


def clean_rut(rut: str) -> str:
    return RUT_CLEAN.sub("", rut).upper()


def validate_rut(rut: str) -> bool:
    cleaned = clean_rut(rut)
    if len(cleaned) < 2:
        return False
    body, dv = cleaned[:-1], cleaned[-1]
    if not body.isdigit():
        return False
    factors = [2, 3, 4, 5, 6, 7]
    total = 0
    factor_idx = 0
    for digit in reversed(body):
        total += int(digit) * factors[factor_idx]
        factor_idx = (factor_idx + 1) % len(factors)
    remainder = 11 - (total % 11)
    if remainder == 11:
        expected = "0"
    elif remainder == 10:
        expected = "K"
    else:
        expected = str(remainder)
    return dv == expected


def format_rut(rut: str) -> str:
    cleaned = clean_rut(rut)
    if len(cleaned) < 2:
        return rut
    body, dv = cleaned[:-1], cleaned[-1]
    rev = []
    for i, ch in enumerate(reversed(body)):
        if i and i % 3 == 0:
            rev.append(".")
        rev.append(ch)
    return f"{''.join(reversed(rev))}-{dv}"
