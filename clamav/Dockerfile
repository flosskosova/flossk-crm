FROM debian:bookworm-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        clamav \
        clamav-daemon \
        netcat-openbsd \
        ca-certificates && \
    update-ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Enable TCP socket so other containers can reach clamd on port 3310
RUN sed -i 's|^#*\s*TCPSocket\b.*|TCPSocket 3310|' /etc/clamav/clamd.conf && \
    grep -q '^TCPAddr' /etc/clamav/clamd.conf || echo "TCPAddr 0.0.0.0" >> /etc/clamav/clamd.conf && \
    grep -q '^Foreground' /etc/clamav/clamd.conf \
        && sed -i 's|^Foreground.*|Foreground true|' /etc/clamav/clamd.conf \
        || echo "Foreground true" >> /etc/clamav/clamd.conf

EXPOSE 3310

# freshclam downloads virus definitions on first start, then clamd runs
CMD ["bash", "-c", "freshclam && clamd --foreground"]
