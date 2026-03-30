# ============================================
# Stage 1: Build - Compile Native AOT binary
# Ref: https://learn.microsoft.com/en-us/dotnet/core/deploying/native-aot
# ============================================

# Ref: https://hub.docker.com/_/microsoft-dotnet-sdk
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

# Native AOT requires clang as the native linker and zlib to compress metadata.
# Ref: https://learn.microsoft.com/en-us/dotnet/core/deploying/native-aot#prerequisites
RUN apt-get update && apt-get install -y --no-install-recommends \
    clang zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /src

# Copy the csproj file first to cache the layer for package restoration (similar to caching Cargo.toml).
# Ref: https://docs.docker.com/build/cache/#order-your-layers
COPY MyApp/MyApp.csproj MyApp/
RUN dotnet restore MyApp/MyApp.csproj -r linux-x64

# Copy the entire source code and build the AOT binary.
# Ref: https://learn.microsoft.com/en-us/dotnet/core/tools/dotnet-publish
COPY MyApp/ MyApp/
RUN dotnet publish MyApp/MyApp.csproj \
    -c Release \
    -r linux-x64 \
    -o /out \
    --no-restore

# ============================================
# Stage 2: Runtime - Ultra-lightweight image
# ============================================

# "Chiseled" image: contains only the minimal glibc layer necessary. No shell, no package manager.
# The AOT binary is completely self-contained and does not require the .NET Runtime.
# Ref: https://learn.microsoft.com/en-us/dotnet/core/docker/container-images#ubuntu-chiseled-images
FROM mcr.microsoft.com/dotnet/runtime-deps:8.0-noble-chiseled

WORKDIR /app

COPY --from=build /out .

# Run as a non-root user for security.
# Ref: https://learn.microsoft.com/en-us/dotnet/core/docker/container-images#non-root-user
USER $APP_UID

EXPOSE 8080

ENTRYPOINT ["./MyApp"]
