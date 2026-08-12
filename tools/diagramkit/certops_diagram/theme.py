"""Design-Tokens. Einzige Stelle, an der Farben, Schriftgrößen und Abstände stehen.

Wer hier etwas ändert, ändert es für alle 100 Karten. Nach dem Design-Freeze
(Karte 10) kostet jede Änderung hier einen Neulauf über alle fertigen Karten.
"""

FONT = "DejaVu Sans, Arial, Helvetica, sans-serif"

# Flächen
BG = "#FFFFFF"
NODE_FILL = "#FFFFFF"
NODE_BORDER = "#B7BDC6"
NODE_BW = 1.2

# Text
INK = "#232F3E"          # Titel, Knotenüberschriften
INK_SOFT = "#5A6570"      # Untertitel, Beschriftungen
INK_LEGEND = "#3C4552"
INK_MUTED = "#8A94A6"

# Rahmenfarben nach AWS-Konvention
CLOUD = "#232F3E"
REGION = "#00A4A6"
VPC = "#8C4FFF"
SUBNET_PRIVATE = "#3B7D2F"
SUBNET_PUBLIC = "#7AA116"
DATACENTER = "#7D8998"
BAND = "#B7BDC6"

# Semantik
ACCENT = "#146EB4"        # Bahn- und Abschnittsbeschriftungen
OK = "#3B7D2F"
FAIL = "#C7161D"
HINT_BG = "#FFFBF0"
HINT_BORDER = "#D9A441"
HINT_INK = "#8A6413"
HINT_TEXT = "#5A4A2A"

# Hervorhebung des zentralen Dienstes einer Karte
HERO_FILL = "#F0FAF8"
HERO_BORDER = "#01A88D"
HERO_BW = 2.5

# Pfeile
ARROW = "#4A5568"
ARROW_BW = 2.0
LEADER = "#8A94A6"

# Schriftgrößen
FS_TITLE = 26
FS_SUBTITLE = 15
FS_GROUP = 13
FS_NODE_TITLE = 12
FS_NODE_SUB = 11
FS_HERO_TITLE = 16
FS_HERO_SUB = 12
FS_LABEL = 11
FS_LEGEND = 12
FS_FOOTER = 10

# Maße
NODE_RADIUS = 8
GROUP_RADIUS = 6
ICON_DEFAULT = 44
BADGE_R = 11.5
GAP_MIN = 16              # Mindestabstand zwischen Knoten
PAD_GROUP = 20            # Mindestabstand Knoten zu Rahmen

FOOTER = "Icons: AWS Architecture Icons (© Amazon Web Services, Inc.)"
