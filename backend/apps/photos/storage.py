from storages.backends.s3boto3 import S3Boto3Storage


class PrivateMediaStorage(S3Boto3Storage):
    """The only storage class used anywhere in the app.

    Every object is written private (no public ACL, no public bucket
    policy) — `.url()` always returns a short-lived signed URL rather than
    a permanent public link, satisfying "originals are never exposed with
    a permanent public URL" from the product spec.
    """

    default_acl = "private"
    querystring_auth = True
    file_overwrite = False


def signed_url(field_file, expire_seconds: int | None = None) -> str:
    """`.url()` with a custom expiry where the backend supports it
    (S3-compatible storage); falls back to the plain URL under the local
    FileSystemStorage used in development (see USE_LOCAL_FILE_STORAGE)."""

    if expire_seconds is not None:
        try:
            return field_file.storage.url(field_file.name, expire=expire_seconds)
        except TypeError:
            pass
    return field_file.url
