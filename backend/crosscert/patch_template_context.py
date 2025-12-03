"""
Monkeypatch for Django template Context.__copy__ to avoid issues on some
Python/Django combinations where copying the built-in super copy returns an
object that doesn't allow setting attributes (causes admin add user error).

This is a lightweight, defensive fix applied at startup.
"""
try:
    from django.template import context as django_context
except Exception:
    django_context = None

if django_context is not None:
    Context = getattr(django_context, 'Context', None)

    if Context is not None:
        def _safe_copy(self):
            # Create a shallow copy as a plain instance and copy dicts
            cls = self.__class__
            new = cls()
            try:
                # copy mapping entries
                new.update(dict(self))
            except Exception:
                # fallback: copy via items
                for k, v in self.items():
                    new[k] = v
            # preserve the internal dict stack (if present)
            if hasattr(self, 'dicts'):
                try:
                    new.dicts = list(self.dicts)
                except Exception:
                    new.dicts = []
            return new

        try:
            # Replace the problematic __copy__ implementation
            Context.__copy__ = _safe_copy
        except Exception:
            # If we fail to patch, don't raise during import
            pass
