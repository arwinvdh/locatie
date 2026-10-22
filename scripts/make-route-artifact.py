#!/usr/bin/env python3
"""Maakt van route.html de versie voor een Claude-artifact.

Een artifact krijgt zijn <html>-omhulling van het platform en kent geen
service worker of installatie. Dit script haalt daarom de omhulling en de
onderdelen tussen de PWA-markeringen weg:

  <!--PWA--> ... <!--/PWA-->      in de kop (manifest, iconen, themakleur)
  /*PWA*/ ... /*END PWA*/         in het script (tip voor het beginscherm, service worker)

Gebruik:  python3 scripts/make-route-artifact.py [uitvoerbestand]
Standaard: route-artifact.html in de huidige map.
"""
import re
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
src = (root / "route.html").read_text(encoding="utf-8")
out = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("route-artifact.html")

frag = re.sub(r"<!--PWA-->.*?<!--/PWA-->", "", src, flags=re.S)
frag = re.sub(r"/\*PWA\*/.*?/\*END PWA\*/", "", frag, flags=re.S)
frag = frag[frag.index("<title>"):]
frag = frag.replace("</head>\n<body>\n", "").replace("</body>\n</html>\n", "")

for pat in (r"<!doctype", r"<html[\s>]", r"<head[\s>]", r"<body[\s>]", r"serviceWorker", r"rel=\"manifest\""):
    if re.search(pat, frag, flags=re.I):
        sys.exit("Fout: '%s' staat nog in het resultaat; controleer de PWA-markeringen in route.html" % pat)

out.write_text(frag, encoding="utf-8")
print("%s geschreven (%d bytes)" % (out, len(frag.encode("utf-8"))))
