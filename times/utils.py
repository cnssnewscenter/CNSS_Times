import string
import random
import hashlib

def random_text(length=20) -> str:
    return "".join([random.choice(string.ascii_letters) for i in range(length)])

def sha1sum(text) -> str:
    return hashlib.sha1(text if isinstance(text, str) else text.encode("utf8")).hexdigest()