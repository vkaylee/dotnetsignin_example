# Example web signin application

## Quick Start Guide: `dotnet.sh`


## Running the Application

This project features two strictly separated environments driven by `compose.yml`.

### 1. Development (Live Hot-Reload)
Starts the API with live-reloading enabled. Every time you save a `.cs` file, the server instantly recompiles and updates.

```bash
podman-compose up -d dotnet-dev
```
- **Endpoint:** `http://localhost:5000`
- **View Logs:** `podman logs -f dotnetsignin-dev`

### 2. Production (Native AOT)
Compiles your code directly into static machine code and runs it in an ultra-secure, shell-less "chiseled" container.

```bash
podman-compose up -d --build dotnet-prod
```
- **Endpoint:** `http://localhost:9090` *(Configurable via `.env`)*
- **View Logs:** `podman logs -f dotnetsignin-prod`

---

## Database Management (MariaDB)

This environment includes a MariaDB 11 instance ready to go. This project uses **Linq2db** as its lightweight, ultra-fast ORM optimized for Native AOT.

Since Linq2db does not include an automated schema migration tool built-in, database schemas must be managed manually via SQL scripts or by adopting an external migration tool (e.g., DbUp, Flyway) applied directly to the MariaDB instance.


> [!TIP]
> Ensure you have copied `.env.example` to `.env` before bringing up the environment to configure your secure database passwords!
