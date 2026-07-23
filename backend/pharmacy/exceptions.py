from rest_framework.exceptions import ValidationError
from rest_framework.views import exception_handler


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return response

    code = getattr(exc, "default_code", "request_error")
    if isinstance(exc, ValidationError) and isinstance(response.data, dict):
        fields = response.data
        message = "Please correct the highlighted fields."
    else:
        fields = {}
        if isinstance(response.data, dict):
            detail = response.data.get("detail")
            message = str(detail) if detail else "The request could not be completed."
        else:
            message = "The request could not be completed."

    response.data = {"error": {"code": str(code), "message": message, "fields": fields}}
    return response
