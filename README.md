# Example web signin application

## Tech Stack

**Frontend**
- Angular 21 (TypeScript)
- Vitest for Unit Testing

**Backend**
- .NET 8 (C#, Minimal APIs, strictly configured for Native AOT)
- Linq2db (Ultra-fast lightweight ORM)
- DbUp (Database migrations via SQL scripts)
- JWT Authentication & BCrypt Password Hashing

**Database & Infrastructure**
- MariaDB 11
- Podman / Podman-Compose (Docker equivalent)
- Ephemeral Zero-Install CLI Wrappers (`dotnet.sh`, `ng.sh`)

---

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd dotnetsignin_example
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your specific secrets if necessary
   ```

3. **Install Dependencies (if you don't have Podman)**
   The project requires Podman Engine and Podman-Compose. The CLI wrappers can auto-install them for you on supported Linux distros (Debian/Ubuntu, Fedora, Arch):
   ```bash
   ./dotnet.sh --info
   # Accept the installation prompts if podman is not found
   ```

4. **Start the Development Environment**
   Brings up the MariaDB database, .NET Backend (auto-restores and watches for changes), and Angular Frontend.
   ```bash
   podman-compose up -d dotnet-dev frontend-dev
   ```

5. **Access the Application**
   - **Frontend:** `http://localhost:4200`
   - **Backend API:** `http://localhost:5000`
   - **phpMyAdmin:** `http://localhost:8080` (Database management)

---

## CLI Wrappers (Zero-Install Host)

This project provides two bash scripts (`dotnet.sh` and `ng.sh`) that act as wrappers for the .NET CLI and Angular/Node CLI respectively. They spin up ephemeral containers to run your commands, keeping your host machine completely clean without needing to install the .NET SDK or Node.js.

### `dotnet.sh` (Backend .NET CLI)

Acts exactly like the standard `dotnet` command.

| Action | Command |
| :--- | :--- |
| **Create new app** | `./dotnet.sh new webapp -n MyApp` |
| **Build app** | `./dotnet.sh build MyApp/` |
| **Add package** | `cd MyApp && ../dotnet.sh add package System.Text.Json` |
| **Clean output** | `./dotnet.sh clean MyApp/` |
| **Run** | *(Use `podman-compose up -d dotnet-dev` instead for hot-reload)* |

### `ng.sh` (Frontend Angular CLI / Node.js)

Acts exactly like the `ng`, `npm`, or `npx` commands.

| Action | Command |
| :--- | :--- |
| **Create frontend** | `./ng.sh new Frontend --routing --style=css --ssr=false --skip-git` |
| **Generate component**| `./ng.sh generate component pages/login` |
| **Install packages** | `./ng.sh npm install @angular/material` |
| **Run npx tools** | `./ng.sh npx some-tool` |
| **Build frontend** | `./ng.sh build` |
| **Serve** | *(Use `podman-compose up -d frontend-dev` instead for HMR)* |

---

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

## Database Management (DbUp + MariaDB)
This environment includes a MariaDB 11 instance ready to go. This project uses **Linq2db** as its lightweight, ultra-fast ORM optimized for Native AOT.

Since Linq2db does not include an automated schema migration tool built-in, database schemas must be managed manually via SQL scripts or by adopting an external migration tool (e.g., DbUp, Flyway) applied directly to the MariaDB instance.

This project uses **[DbUp](https://dbup.readthedocs.io/)** (`dbup-mysql` v6) to manage database schema migrations automatically. DbUp tracks which SQL scripts have already been applied and only runs the ones that are new — similar to how EF Core migrations work, but using plain `.sql` files.

### How it works

Migrations run **automatically on every app startup** (both dev and prod). No manual migration commands are needed.

```
App starts → DbUp scans MyApp/Scripts/*.sql → Applies any unapplied scripts → App serves requests
```

The executed scripts are tracked in a `SchemaVersions` table that DbUp creates automatically in the database.

### Adding a new migration

1. Create a new `.sql` file inside `MyApp/Scripts/` following the naming convention:

   ```
   MyApp/Scripts/
   001_CreateUsersTable.sql   ← already applied
   002_AddProfileColumn.sql   ← new migration (example)
   ```

   > [!IMPORTANT]
   > Scripts are executed **in alphabetical/numeric order**. Always prefix filenames with a zero-padded number (`001_`, `002_`, etc.) to guarantee correct ordering.

2. Write your SQL inside the new file:

   ```sql
   -- MyApp/Scripts/002_AddProfileColumn.sql
   ALTER TABLE Users ADD COLUMN DisplayName VARCHAR(100) NULL;
   ```

3. Restart the dev container — DbUp will detect and apply the new script automatically:

   ```bash
   podman-compose restart dev
   # or bring up from scratch
   podman-compose up -d dev
   ```

4. Check logs to confirm the migration ran:

   ```bash
   podman logs -f dotnetsignin-dev
   # Look for: "DB Upgrade Success" or the script name being executed
   ```

### Rollbacks

DbUp does not support automatic rollbacks. To roll back a change:

- Run a new migration script that undoes the change (e.g., `003_DropProfileColumn.sql`).
- For development, you can also wipe the database volume and restart:

  ```bash
  podman-compose down -v   # destroys all data
  podman-compose up -d dev
  ```

> [!TIP]
> Ensure you have copied `.env.example` to `.env` before bringing up the environment to configure your secure database passwords!
