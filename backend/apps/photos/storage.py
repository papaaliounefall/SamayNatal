from functools import cached_property

import boto3
from django.conf import settings
from storages.backends.s3boto3 import S3Boto3Storage
from storages.utils import clean_name


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

    @cached_property
    def _public_endpoint(self) -> str:
        """The host a browser can actually reach.

        In Docker, server-to-server calls (upload, thumbnail generation)
        use the internal service hostname (`minio:9000`), but a signed URL
        handed to the browser must be signed for the address the browser
        will connect to (e.g. `localhost:9010`) — S3's SigV4 signature
        covers the Host header, so a URL signed for one host is rejected
        when fetched via another. Defaults to the same endpoint when only
        one is configured (e.g. real S3/R2 in production).
        """
        return getattr(settings, "AWS_S3_PUBLIC_ENDPOINT_URL", "") or self.endpoint_url

    @cached_property
    def _public_client(self):
        if self._public_endpoint == self.endpoint_url:
            return self.connection.meta.client
        return boto3.client(
            "s3",
            endpoint_url=self._public_endpoint,
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            region_name=self.region_name,
            config=self.config,
        )

    def url(self, name, parameters=None, expire=None, http_method=None):
        if self._public_endpoint == self.endpoint_url:
            return super().url(name, parameters=parameters, expire=expire, http_method=http_method)

        name = self._normalize_name(clean_name(name))
        params = dict(parameters) if parameters else {}
        params["Bucket"] = self.bucket.name
        params["Key"] = name
        if expire is None:
            expire = self.querystring_expire
        return self._public_client.generate_presigned_url(
            "get_object", Params=params, ExpiresIn=expire, HttpMethod=http_method,
        )


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
