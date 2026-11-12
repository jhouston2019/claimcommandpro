import pathlib

root = pathlib.Path(__file__).resolve().parents[2]
out = root / "_cursor" / "reports" / "ai-backend-diagnostic-bundle.txt"
sep = "=" * 80
parts = []

for label, base in [
    ("NETLIFY FUNCTIONS", root / "netlify" / "functions"),
    ("SUPABASE MIGRATIONS", root / "supabase" / "migrations"),
]:
    parts.append(sep + "\n" + label + "\n" + sep + "\n")
    for p in sorted(base.rglob("*")):
        if not p.is_file():
            continue
        rel = p.relative_to(root).as_posix()
        parts.append("\n\n" + sep + "\nFILE: " + rel + "\n" + sep + "\n")
        try:
            parts.append(p.read_text(encoding="utf-8", errors="replace"))
        except OSError as e:
            parts.append("[READ ERROR: " + str(e) + "]")

out.parent.mkdir(parents=True, exist_ok=True)
out.write_text("".join(parts), encoding="utf-8")
nf = sum(1 for p in (root / "netlify" / "functions").rglob("*") if p.is_file())
mg = sum(1 for p in (root / "supabase" / "migrations").rglob("*") if p.is_file())
print(str(out))
print("netlify_function_files:", nf)
print("migration_files:", mg)
print("bundle_bytes:", out.stat().st_size)
