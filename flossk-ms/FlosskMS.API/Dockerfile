# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
WORKDIR /src

# Copy solution and project files
COPY FlosskMS.slnx .
COPY FlosskMS.API/FlosskMS.API.csproj FlosskMS.API/
COPY FlosskMS.Business/FlosskMS.Business.csproj FlosskMS.Business/
COPY FlosskMS.Data/FlosskMS.Data.csproj FlosskMS.Data/

# Restore dependencies
RUN dotnet restore FlosskMS.API/FlosskMS.API.csproj

# Copy the rest of the source code
COPY . .

# Build the application
RUN dotnet build FlosskMS.API/FlosskMS.API.csproj -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish FlosskMS.API/FlosskMS.API.csproj -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS final
WORKDIR /app

# Install fonts for SkiaSharp text rendering
RUN apt-get update && apt-get install -y --no-install-recommends \
    fontconfig \
    fonts-dejavu-core \
    && fc-cache -fv \
    && rm -rf /var/lib/apt/lists/*

# Create uploads directory
RUN mkdir -p /app/uploads

# Copy published application
COPY --from=publish /app/publish .

# Expose port
EXPOSE 8080

# Set environment variables
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "FlosskMS.API.dll"]
