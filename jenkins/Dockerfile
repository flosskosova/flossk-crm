FROM jenkins/jenkins:lts-jdk21

USER root

# Install runtime tools required by this repository's pipeline.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        git \
        openssh-client \
        sshpass \
        libicu-dev \
    && rm -rf /var/lib/apt/lists/*

# Install .NET SDK 10 once in the image so jobs do not reinstall on every run.
RUN curl -fsSL https://dot.net/v1/dotnet-install.sh -o /tmp/dotnet-install.sh \
    && bash /tmp/dotnet-install.sh --channel 10.0 --install-dir /usr/share/dotnet \
    && ln -s /usr/share/dotnet/dotnet /usr/bin/dotnet \
    && rm -f /tmp/dotnet-install.sh

USER jenkins
