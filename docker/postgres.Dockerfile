FROM pgvector/pgvector:pg16

# copy initialization script instead of creating it with RUN cat
COPY docker/init-postgres.sh /docker-entrypoint-initdb.d/init-postgres.sh

# normalize line endings (strip CRLF), then set explicit permissions and ownership
RUN sed -i 's/\r$//' /docker-entrypoint-initdb.d/init-postgres.sh \
    && chmod 0755 /docker-entrypoint-initdb.d/init-postgres.sh \
    && chown postgres:postgres /docker-entrypoint-initdb.d/init-postgres.sh

# Add health check to ensure postgres is ready
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD pg_isready -U ${POSTGRES_USER:-postgres}
