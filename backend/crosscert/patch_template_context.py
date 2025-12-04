"""
Monkeypatch for Django template Context.__copy__ to avoid issues on some
Python/Django combinations (especially Python 3.14+) where copying the built-in 
super copy returns an object that doesn't allow setting attributes.

This fixes the "'super' object has no attribute 'dicts'" error in Django admin.
Required for Django 6.0 on Python 3.14.
"""
try:
    from django.template import context as django_context
except Exception:
    django_context = None

if django_context is not None:
    Context = getattr(django_context, 'Context', None)
    RequestContext = getattr(django_context, 'RequestContext', None)

    if Context is not None:
        def _safe_copy(self):
            # CRITICAL: Check for RequestContext FIRST before doing anything else
            # RequestContext requires 'request' argument and cannot be created with cls()
            if RequestContext is not None and isinstance(self, RequestContext):
                request = getattr(self, 'request', None)
                if request is not None:
                    # Create new RequestContext with the same request
                    new = RequestContext(request)
                    # Copy the dicts list
                    if hasattr(self, 'dicts') and hasattr(new, 'dicts'):
                        new.dicts = list(self.dicts)
                    # Ensure _processors_index is set (RequestContext requires it)
                    if hasattr(self, '_processors_index'):
                        new._processors_index = self._processors_index
                    return new
                else:
                    # Fallback: create a plain Context if no request
                    new = Context()
            else:
                # For regular Context, create a new instance
                cls = self.__class__
                new = cls()
            
            # Copy the dicts list for both Context and RequestContext
            if hasattr(self, 'dicts') and hasattr(new, 'dicts'):
                try:
                    new.dicts = list(self.dicts)
                except Exception:
                    new.dicts = []
            else:
                # Fallback: try to copy via update if dicts doesn't exist
                try:
                    if hasattr(self, '__iter__'):
                        new.update(dict(self))
                except Exception:
                    # If update fails, try items() method
                    try:
                        if hasattr(self, 'items'):
                            for k, v in self.items():
                                new[k] = v
                    except Exception:
                        pass
            
            return new

        try:
            # Replace the problematic __copy__ implementation
            Context.__copy__ = _safe_copy
        except Exception:
            # If we fail to patch, don't raise during import
            pass
