from rest_framework.pagination import CursorPagination


class CursorSetPagination(CursorPagination):
    """Default pagination for the whole API.

    Cursor-based rather than offset/count-based: an event gallery can hold
    thousands of photos, and COUNT(*) + OFFSET gets slow and inconsistent
    under concurrent uploads at that scale.
    """

    page_size = 24
    max_page_size = 100
    page_size_query_param = "page_size"
    ordering = "-created_at"
