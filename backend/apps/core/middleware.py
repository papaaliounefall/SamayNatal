import uuid

from .logging import current_request_id


class RequestIdMiddleware:
    """Attach a request id to every request for log correlation.

    Accepts an inbound X-Request-ID (e.g. set by a load balancer) so a
    single request can be traced end-to-end, otherwise generates one.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.request_id = request_id
        token = current_request_id.set(request_id)
        try:
            response = self.get_response(request)
        finally:
            current_request_id.reset(token)
        response["X-Request-ID"] = request_id
        return response
